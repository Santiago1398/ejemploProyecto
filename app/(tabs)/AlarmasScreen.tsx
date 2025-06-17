import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { ResponseAlarmaSite, ParamTC } from "@/infrastructure/intercafe/listapi.interface";
import { PaperProvider } from "react-native-paper";

export default function Alarmas() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [devices, setDevices] = useState<ResponseAlarmaSite[]>([]);
    const [alarmasPorMac, setAlarmasPorMac] = useState<Record<string, string[]>>({});

    // Capitaliza la primera letra
    const capitalize = (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

    useEffect(() => {
        let isMounted = true;

        const fetchAll = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem("userId");
                const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);

                const formattedData = data.map((device) => ({
                    ...device,
                    mac: Number(device.mac),
                    alarmType: device.alarmType ?? 1,
                }));

                // Ordenamos por farmName y luego por siteName
                formattedData.sort((a, b) => {
                    const nameA = a.farmName.toLowerCase();
                    const nameB = b.farmName.toLowerCase();
                    const siteA = a.siteName?.toLowerCase() ?? "";
                    const siteB = b.siteName?.toLowerCase() ?? "";

                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    if (siteA < siteB) return -1;
                    if (siteA > siteB) return 1;
                    return 0;
                });

                if (isMounted) setDevices(formattedData);

                // Carga alarmas por cada MAC
                const newAlarmas: Record<string, string[]> = {};
                for (const device of formattedData) {
                    const alarmas: ParamTC[] = await get(`alarmtc/status?mac=${device.mac}`);
                    const textos = alarmas
                        .filter(a => a.habilitado && a.idAlarm !== 1000)
                        .map(a => capitalize(a.texto));
                    newAlarmas[device.mac] = textos;
                }

                if (isMounted) setAlarmasPorMac(newAlarmas);
            } catch (error) {
                if (isMounted) {
                    Alert.alert("Error", "No se pudieron cargar los dispositivos o alarmas.");
                }
            }
        };

        fetchAll(); // primera carga

        const interval = setInterval(fetchAll, 5000); // refrescar cada 5 segundos

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const fetchDevices = async () => {
        try {
            const storedUserId = await AsyncStorage.getItem("userId");
            const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);
            const formattedData = data.map((device) => ({
                ...device,
                mac: Number(device.mac),
                alarmType: device.alarmType ?? 1,
            }));
            setDevices(formattedData);

            for (const device of formattedData) {
                const alarmas: ParamTC[] = await get(`alarmtc/status?mac=${device.mac}`);
                const textos = alarmas
                    .filter(a => a.habilitado && a.idAlarm !== 1000)
                    .map(a => capitalize(a.texto));
                setAlarmasPorMac(prev => ({ ...prev, [device.mac]: textos }));
            }
        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar los dispositivos o alarmas.");
        }
    };
    //const nombre = `${capitalize(item.farmName)} ${capitalize(item.siteName)}`;

    const renderItem = ({ item }: { item: ResponseAlarmaSite }) => {

        const alarmas = alarmasPorMac[item.mac] || [];

        const alarmasTexto = alarmas.length > 0
            ? `${alarmas.slice(0, 3).join(", ")}${alarmas.length > 3 ? ", ..." : ""}`
            : "No tiene alarmas asignadas.";

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate("DeviceDetails", {
                    device: {
                        mac: Number(item.mac),
                        farmName: item.farmName,
                        siteName: item.siteName,
                        latitude: item.latitude,
                        longitude: item.longitude,
                    }
                })}
            >
                <View style={styles.row}>
                    <Ionicons name="home-outline" size={20} color="#000" style={{ marginRight: 6 }} />
                    <View style={styles.titleRow}>
                        <Text style={styles.leftText}>{capitalize(item.farmName)}</Text>
                        <Text style={styles.rightText}>{capitalize(item.siteName)}</Text>
                    </View>
                </View>
                <Text style={styles.alarmas}>{alarmasTexto}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <PaperProvider>
            <FlatList
                data={devices}
                keyExtractor={(item, index) => `${item.mac}_${index}`}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16 }}
            />
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#facc15",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        flex: 1,
    },
    leftText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#000",
    },
    rightText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#000",
    },

    alarmas: {
        fontSize: 14,
        color: "#000",
    },
});