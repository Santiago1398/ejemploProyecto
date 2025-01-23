import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { ResponseAlarmaSite } from "@/infrastructure/intercafe/listapi.interface";
import { useAuthStore } from "@/store/authStore";
import { get } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "@/types/navigation";




export default function DeviceList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token, userId } = useAuthStore();
    const [devices, setDevices] = useState<ResponseAlarmaSite[]>([]);
    const [loading, setLoading] = useState(true);

    // Función para obtener los datos desde la API
    const fetchDevices = async () => {
        try {
            setLoading(true);

            // Verifica si el token y el userId están en AsyncStorage
            const storedToken = await AsyncStorage.getItem("token");
            const storedUserId = await AsyncStorage.getItem("userId");

            if (!storedToken || !storedUserId) {
                throw new Error("Token o userId no encontrado en AsyncStorage.");
            }

            console.log("Token en AsyncStorage:", storedToken);
            console.log("UserId guardado en AsyncStorage:", storedUserId);

            // Realiza la solicitud GET
            const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);
            const formattedData = data.map((device) => ({
                ...device,
                mac: Number(device.mac), // Convierte `mac` a número
            }));
            setDevices(formattedData);

            console.log("Dispositivos obtenidos:", data);
            setDevices(data);
        } catch (error) {
            if (error instanceof Error) {
                console.error("Error al cargar los dispositivos:", error.message);
            } else if (typeof error === "object" && error !== null) {
                console.error("Error al cargar los dispositivos:", JSON.stringify(error));
            } else {
                console.error("Error desconocido al cargar los dispositivos:", error);
            }
            Alert.alert("Error", "No se pudieron cargar los dispositivos.");
        } finally {
            setLoading(false);
        }
    };




    useEffect(() => {
        if (token && userId) {
            fetchDevices();
        }
    }, [token, userId]);


    useEffect(() => {
        const checkToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            console.log("Token en AsyncStorage:", storedToken);
            const storedUserId = await AsyncStorage.getItem("userId");
            console.log("UserId guardado en AsyncStorage:", storedUserId);

        };
        checkToken();
    }, []);


    const getBackgroundColor = (alarmType: number) => {
        switch (alarmType) {
            case 0:
                return "#8a9bb9"; // Fuera de línea, gris
            case 1:
                return "#76db36"; // En línea sin alarma, verde
            case 2:
                return "red"; // En línea con alarma, rojo
            case 3:
                return "#9E75C6"; // Contraseña incorrecta, violeta
            case 4:
                return "#F6BC31"; // En línea desarmada, amarilla
            default:
                return "white";
        }
    };

    return (
        <View style={{ flex: 1 }}>
            {loading ? (
                <Text style={styles.loadingText}>No hay dispositivos Conectados</Text>
            ) : (
                <FlatList
                    data={devices}
                    keyExtractor={(item) => item.idSite.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.deviceContainer,
                                { backgroundColor: getBackgroundColor(item.alarmType) },
                            ]}
                            onPress={() => {
                                if (item.mac) {
                                    navigation.navigate("DeviceDetails", { device: { mac: Number(item.mac) } });
                                } else {
                                    Alert.alert("Error", "El dispositivo no tiene una MAC válida.");
                                }
                            }}
                        >
                            <Text style={styles.text}>{item.farmName}</Text>
                            <Text style={styles.text}>{item.siteName}</Text>
                            <Text style={styles.text}>{item.town}</Text>
                            <Text style={styles.text}>{item.province}</Text>
                            <Text style={styles.text}>{item.country}</Text>
                            <Text style={styles.text}>{item.idSite}</Text>
                            <Text style={styles.text}>{item.locLevel}</Text>
                        </TouchableOpacity>

                    )}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 16,
    },
    deviceContainer: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
    },
    text: {
        fontSize: 16,
        color: "#222222",
    },
    loadingText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 20,
    },
});

