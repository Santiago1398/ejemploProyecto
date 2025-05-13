import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Modal,
    AppState,
    AppStateStatus,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { stopAlarmSound } from "@/utils/sound";
import { notificationService } from "@/hooks/NotificationService";
import { ResponseAlarmaSite } from "@/infrastructure/intercafe/listapi.interface";

export default function DeviceList() {
    useEffect(() => {
        const checkAlarm = async () => {
            const alarm = await AsyncStorage.getItem("alarmPlaying");
            if (alarm === "true") {
                console.log("✅ Alarma activa detectada al abrir la app o volver");
                setShowAlarmDialog(true);
            }
        };

        // 1️⃣ Verificación al montar (incluso en cold start)
        setTimeout(checkAlarm, 300);

        // 2️⃣ Verificación cada vez que la app entra en foreground
        const appStateListener = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                setTimeout(checkAlarm, 500);
            }
        });

        return () => {
            appStateListener.remove();
        };
    }, []);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token, userId } = useAuthStore();
    const [devices, setDevices] = useState<ResponseAlarmaSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAlarmDialog, setShowAlarmDialog] = useState(false);

    // Al montar: revisa si había una alarma activa
    // useEffect(() => {
    //     const checkAlarm = async () => {
    //         const alarm = await AsyncStorage.getItem("alarmPlaying");
    //         if (alarm === "true") {
    //             console.log("✅ Alarma detectada al abrir app");
    //             setShowAlarmDialog(true);
    //         }
    //     };
    //     checkAlarm();
    // }, []);

    // // Al volver del background
    // useEffect(() => {
    //     const handleAppStateChange = async (state: AppStateStatus) => {
    //         if (state === "active") {
    //             const alarm = await AsyncStorage.getItem("alarmPlaying");
    //             if (alarm === "true") {
    //                 console.log("🔁 App reactivada con alarma activa");
    //                 setShowAlarmDialog(true);
    //             }
    //         }
    //     };

    //     const subscription = AppState.addEventListener("change", handleAppStateChange);
    //     return () => subscription.remove();
    // }, []);
    useEffect(() => {
        const checkAlarmState = async () => {
            const alarm = await AsyncStorage.getItem("alarmPlaying");
            if (alarm === "true") {
                console.log("✅ Alarma activa detectada");
                setShowAlarmDialog(true);
            }
        };

        // Chequeo inicial con retardo por seguridad
        const initialTimeout = setTimeout(checkAlarmState, 300);

        // App entra en foreground
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                setTimeout(checkAlarmState, 500);
            }
        });

        return () => {
            clearTimeout(initialTimeout);
            subscription.remove();
        };
    }, []);


    // Carga los dispositivos
    useEffect(() => {
        if (token && userId) fetchDevices();
    }, [token, userId]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const storedUserId = await AsyncStorage.getItem("userId");
            const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);
            const formattedData = data.map((device) => ({
                ...device,
                mac: Number(device.mac),
                alarmType: device.alarmType ?? 1,
            }));
            setDevices(formattedData);
        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar los dispositivos.");
        } finally {
            setLoading(false);
        }
    };

    // Detecta alarmas en tiempo real
    useEffect(() => {
        notificationService.setOnSiteAlarmDetected((macStr) => {
            const mac = Number(macStr);
            setDevices((prev) =>
                prev.map((device) =>
                    device.mac === mac ? { ...device, alarmType: 2 } : device
                )
            );
        });

        return () => {
            notificationService.setOnSiteAlarmDetected(() => { });
        };
    }, []);

    ////////
    useEffect(() => {
        const interval = setInterval(async () => {
            const alarm = await AsyncStorage.getItem("alarmPlaying");
            if (alarm === "true") {
                setShowAlarmDialog(true);
            }
        }, 5000); // cada 5 segundos

        return () => clearInterval(interval);
    }, []);

    ///////



    const getBackgroundColor = (alarmType: number) => {
        switch (alarmType) {
            case 0: return "#8a9bb9";
            case 1: return "#76db36";
            case 2: return "#e94b3c";
            case 3: return "#9E75C6";
            case 4: return "#F6BC31";
            default: return "#ffffff";
        }
    };

    const renderDeviceItem = ({ item }: { item: ResponseAlarmaSite }) => {
        const backgroundColor = getBackgroundColor(item.alarmType);
        const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

        return (
            <TouchableOpacity
                style={[styles.deviceContainer, { backgroundColor }]}
                onPress={() => {
                    navigation.navigate("DeviceDetails", {
                        device: {
                            mac: Number(item.mac),
                            farmName: capitalize(item.farmName),
                            siteName: capitalize(item.siteName),
                            latitude: item.latitude,
                            longitude: item.longitude,
                        },
                    });
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

            {showAlarmDialog && (
                <Modal transparent animationType="fade" visible={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>🚨 Alarma activa</Text>
                            <TouchableOpacity
                                onPress={async () => {
                                    await stopAlarmSound();
                                    await AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
                                    setShowAlarmDialog(false);
                                }}
                                style={styles.modalButton}
                            >
                                <Text style={styles.modalButtonText}>OK, detener sonido</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f2f2" },
    listContainer: { padding: 16 },
    deviceContainer: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 12,
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
        color: "#fff",
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
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#00000080",
    },
    modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 10,
    },
    modalButton: {
        backgroundColor: "#FF3B30",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    modalButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
});
