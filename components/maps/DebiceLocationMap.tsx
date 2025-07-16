import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { ResponseAlarmaSite, ParamTC } from "@/infrastructure/intercafe/listapi.interface";
import { PaperProvider } from "react-native-paper";
import { t } from "@/i18n/i18nConfig";


interface AlarmaDisparada {
    mac: number;
    farmName: string;
    siteName: string;
    latitude: number;
    longitude: number;
    texto: string;
}

export default function Alarmas() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [alarmasDisparadas, setAlarmasDisparadas] = useState<AlarmaDisparada[]>([]);

    const capitalize = (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

    // useEffect(() => {
    //     let isMounted = true;

    //     const fetchDisparadas = async () => {
    //         try {
    //             const storedUserId = await AsyncStorage.getItem("userId");
    //             const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);
    //             const resultados: AlarmaDisparada[] = [];

    //             for (const device of data) {
    //                 const alarmas: ParamTC[] = await get(`alarmtc/status?mac=${device.mac}`);
    //                 const activas = alarmas.filter(a => a.habilitado && a.disparado);

    //                 for (const alarma of activas) {
    //                     resultados.push({
    //                         mac: Number(device.mac),
    //                         farmName: device.farmName,
    //                         siteName: device.siteName,
    //                         latitude: device.latitude,
    //                         longitude: device.longitude,
    //                         texto: capitalize(alarma.texto),
    //                     });
    //                 }
    //             }

    //             if (isMounted) {
    //                 setAlarmasDisparadas(resultados);
    //             }
    //         } catch (error) {
    //             if (isMounted) {
    //                 Alert.alert(t("AlarmasScreen.errorLoadingAlarms"));
    //             }
    //         }
    //     };

    //     fetchDisparadas();
    //     const interval = setInterval(fetchDisparadas, 5000);

    //     return () => {
    //         isMounted = false;
    //         clearInterval(interval);
    //     };
    // }, []);

    const renderItem = ({ item }: { item: AlarmaDisparada }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("DeviceDetails", {
                device: {
                    mac: item.mac,
                    farmName: item.farmName,
                    siteName: item.siteName,
                    latitude: item.latitude,
                    longitude: item.longitude,
                }
            })}
        >
            <View style={styles.row}>
                <Ionicons name="alert-circle-outline" size={20} color="#000" style={{ marginRight: 6 }} />
                <View style={styles.titleRow}>
                    <Text style={styles.leftText}>{capitalize(item.farmName)}</Text>
                    <Text style={styles.rightText}>{capitalize(item.siteName)}</Text>
                </View>
            </View>
            <Text style={styles.alarmas}>🚨 {item.texto}</Text>
        </TouchableOpacity>
    );

    return (
        <PaperProvider>
            {alarmasDisparadas.length === 0 ? (
                <View style={styles.centered}>
                    <   FontAwesome name="bell-slash-o" size={48} color="#4ade80" />
                    <Text style={styles.noAlarmText}>{t("AlarmasScreen.noAlarms")}</Text>
                </View>
            ) : (
                <FlatList
                    data={alarmasDisparadas}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "red",
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
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    noAlarmText: {
        fontSize: 18,
        color: "#666",
        marginTop: 10,
    },
});