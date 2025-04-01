import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { get } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "@/types/navigation";
import { ResponseAlarmaSite } from "@/infrastructure/interface/listapi.interface";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function DeviceList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token, userId } = useAuthStore();
    const [devices, setDevices] = useState<ResponseAlarmaSite[]>([]);
    const [loading, setLoading] = useState(true);
    const { fcmToken } = usePushNotifications();

    // Función para obtener los datos desde la API
    const fetchDevices = async () => {
        try {
            setLoading(true);
            const storedToken = await AsyncStorage.getItem("token");
            const storedUserId = await AsyncStorage.getItem("userId");

            if (!storedToken || !storedUserId) {
                throw new Error("Token o userId no encontrado en AsyncStorage.");
            }

            // Realiza la solicitud GET
            const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);
            const formattedData = data.map((device) => ({
                ...device,
                mac: Number(device.mac), // Convierte `mac` a número
            }));
            setDevices(formattedData);
        } catch (error) {
            console.error("Error al cargar los dispositivos:", error);
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

    // Para verificar token/usuario en consola (opcional)
    useEffect(() => {
        const checkToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            const storedUserId = await AsyncStorage.getItem("userId");
            console.log("Token en AsyncStorage:", storedToken);
            console.log("UserId guardado en AsyncStorage:", storedUserId);
        };
        checkToken();
    }, []);

    // Colores de fondo según estado
    const getBackgroundColor = (alarmType: number) => {
        switch (alarmType) {
            case 0:
                return "#8a9bb9"; // Fuera de línea, gris
            case 1:
                return "#76db36"; // En línea sin alarma, verde brillante
            case 2:
                return "#e94b3c"; // En línea con alarma, rojo
            case 3:
                return "#9E75C6"; // Contraseña incorrecta, violeta
            case 4:
                return "#F6BC31"; // En línea desarmada, amarilla
            default:
                return "#ffffff";
        }
    };

    // Render de cada tarjeta
    const renderDeviceItem = ({ item }: { item: ResponseAlarmaSite }) => {
        const backgroundColor = getBackgroundColor(item.alarmType);
        function capitalize(str: string) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        }

        return (
            <TouchableOpacity
                style={[styles.deviceContainer, { backgroundColor }]}
                onPress={() => {
                    if (item.mac) {
                        navigation.navigate("DeviceDetails", {
                            device: {
                                mac: Number(item.mac),
                                farmName: capitalize(item.farmName),
                                siteName: capitalize(item.siteName),
                                latitude: item.latitude,
                                longitude: item.longitude,
                            },
                        });
                    } else {
                        Alert.alert("Error", "El dispositivo no tiene una MAC válida.");
                    }
                }}
            >
                <View style={styles.row}>
                    <Ionicons name="home-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.deviceTitle}>{capitalize(item.farmName)}</Text>
                </View>
                <Text style={styles.deviceSubtitle}>{capitalize(item.siteName)}</Text>
                <Text style={styles.deviceLocation}>
                    {capitalize(item.town)}, {capitalize(item.province)}, {capitalize(item.country)}
                </Text>
            </TouchableOpacity>
        );
    };


    return (
        <View style={styles.container}>

            {fcmToken && (
                <View style={styles.tokenContainer}>
                    <Text style={styles.tokenLabel}>Token del dispositivo:</Text>
                    <Text style={styles.tokenText} selectable>{fcmToken}</Text>
                </View>
            )}
            {devices.length === 0 ? (
                <Text style={styles.loadingText}>No hay dispositivos disponibles</Text>
            ) : (
                <FlatList
                    data={devices}
                    keyExtractor={(item) => item.idSite.toString()}
                    renderItem={renderDeviceItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f2f2f2", // Fondo suave de la pantalla
    },
    listContainer: {
        padding: 16,
    },
    deviceContainer: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 12,
        // Sombras
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    deviceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff", // Texto blanco para contrastar con el verde o rojo
    },
    deviceSubtitle: {
        fontSize: 16,
        color: "#f0f0f0",
        marginBottom: 4,
    },
    deviceLocation: {
        fontSize: 14,
        color: "#f0f0f0",
    },
    loadingText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 20,
    },
    tokenContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        margin: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    tokenLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    tokenText: {
        fontSize: 12,
        color: '#666',
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#eee',
    }
});
