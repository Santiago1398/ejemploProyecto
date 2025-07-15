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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import { useDeviceStore } from "@/store/useDeviceStore"; // 🏪 NUEVO STORE
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { stopAlarmSound } from "@/utils/sound";
import { notificationService } from "@/hooks/NotificationService";
import { ResponseAlarmaSite } from "@/infrastructure/intercafe/listapi.interface";
import * as Notifications from "expo-notifications";
import PhoneNumberDialog from "./PhoneNumberDialog";
import { t } from "@/i18n/i18nConfig";

export default function DeviceList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token, userId } = useAuthStore();

    // 🏪 USAR EL STORE GLOBAL en lugar del estado local
    const {
        devices,
        loading,
        error: isError,
        setDevices,
        setLoading,
        setError,
        updateDevice
    } = useDeviceStore();

    const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [errorAlertShown, setErrorAlertShown] = useState(false);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (state) => {
            if (state === "active") {
                console.log(" App volvió del background, matando notificaciones...");
                await Notifications.dismissAllNotificationsAsync();
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        notificationService.setOnAlarmDetected((idAlarm) => {
            console.log(" WebSocket callback ejecutado con idAlarm:", idAlarm);
            setShowAlarmDialog(true);
        });

        return () => {
            notificationService.setOnAlarmDetected(() => { });
        };
    }, []);

    useEffect(() => {
        const checkAlarm = async () => {
            const pendiente = await AsyncStorage.getItem("alarma_activa_pendiente");
            if (pendiente === "true") {
                setShowAlarmDialog(true);
            }
        };

        checkAlarm();
    }, []);

    // Actualización periódica cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            if (token && userId) fetchDevices(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [token, userId]);

    useEffect(() => {
        fetchDevices(false); // carga inicial
    }, []);

    useEffect(() => {
        const checkTelefono = async () => {
            const telefono = await AsyncStorage.getItem("telefono");
            const preguntado = await AsyncStorage.getItem("telefonoPreguntado");

            if (!telefono && !preguntado) {
                setDialogVisible(true);
            }
        };

        checkTelefono();
    }, []);

    const handleConfirmTelefono = async (telefono: string) => {
        console.log(" Guardando teléfono desde DeviceList:", telefono);
        setDialogVisible(false);
        await AsyncStorage.setItem("telefono", telefono);
        await AsyncStorage.setItem("telefonoPreguntado", "true");

        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
            await notificationService.registerDevice(Number(userId));
        }
    };

    const handleCancelTelefono = async () => {
        setDialogVisible(false);
        await AsyncStorage.setItem("telefonoPreguntado", "true");
    };

    const fetchDevices = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) setLoading(true);

            if (isError && !errorAlertShown) {
                setErrorAlertShown(false);
            }

            setError(false);
            const storedUserId = await AsyncStorage.getItem("userId");
            const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);

            console.log("📍 Dispositivos del backend:", data.length);

            const formattedData = data.map((device) => ({
                ...device,
                mac: Number(device.mac),
                alarmType: device.alarmType ?? 1,
                armed: device.armed ?? true
            }));

            // Ordena primero por farmName, luego por siteName (nave)
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

            // 🏪 GUARDAR EN EL STORE GLOBAL
            setDevices(formattedData);
            setErrorAlertShown(false);

        } catch (error) {
            console.error("Error al cargar dispositivos:", error);
            setError(true);

            if (!isAutoRefresh && !errorAlertShown) {
                setErrorAlertShown(true);
                Alert.alert(
                    "Error de conexión",
                    t("deviceList.deviceLoadError"),
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                console.log("Usuario cerró el alert de error");
                            }
                        }
                    ]
                );
            }
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    };

    // Alarmas en tiempo real - 🏪 ACTUALIZAR EL STORE
    useEffect(() => {
        notificationService.setOnSiteAlarmDetected((macStr) => {
            const mac = Number(macStr);
            updateDevice(mac, { alarmType: 2 });
        });
        return () => {
            notificationService.setOnSiteAlarmDetected(() => { });
        };
    }, [updateDevice]);

    useEffect(() => {
        notificationService.connectWebSocket();
        return () => {
            notificationService.disconnect();
        };
    }, []);

    const getBackgroundColor = (alarmType: number, armed: boolean) => {
        if (!armed) {
            return "#facc15";
        }

        switch (alarmType) {
            case 0: return "#78dd35";
            case 1: return "#FF0000";
            case 2: return "#9E9E9E";
            case 3: return "#9E75C6";
            default: return "#000000";
        }
    };

    const renderDeviceItem = ({ item }: { item: ResponseAlarmaSite }) => {
        const backgroundColor = getBackgroundColor(item.alarmType, item.armed);
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
                            idSite: item.idSite,
                            buildingPortalRef: item.buildingPortalRef,
                            armed: item.armed,
                            alarmType: item.alarmType
                        }
                    });
                }}
            >
                <View style={styles.row}>
                    <Ionicons name="home-outline" size={24} color="#000" style={{ marginRight: 8 }} />
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
            {initialLoad ? (
                <Text style={styles.loadingText}>{t("deviceList.loadingDevices")}</Text>
            ) : isError ? (
                <View style={styles.centeredContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color="#FF6B6B" />
                    <Text style={styles.errorTitle}>{t("deviceList.error.noConnection")}</Text>
                    <Text style={styles.errorMessage}>
                        {t("deviceList.error.cannotLoadLocations")}
                    </Text>
                </View>
            ) : devices.length === 0 ? (
                <Text style={styles.loadingText}>{t("deviceList.noLocationsAvailable")}</Text>
            ) : (
                <FlatList
                    data={devices}
                    keyExtractor={(item, index) => `${item.idSite}-${item.mac}-${index}`}
                    renderItem={renderDeviceItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {dialogVisible && (
                <PhoneNumberDialog
                    visible={dialogVisible}
                    onClose={handleCancelTelefono}
                    onConfirm={handleConfirmTelefono}
                />
            )}

            {showAlarmDialog && (
                <Modal transparent animationType="fade" visible={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>🚨{t("deviceList.alarmActive")}</Text>
                            <TouchableOpacity
                                onPress={async () => {
                                    await stopAlarmSound();
                                    await AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
                                    setShowAlarmDialog(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>{t("deviceList.acceptAndStopAlarm")}</Text>
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
        color: "#000",
    },
    deviceSubtitle: {
        fontSize: 16,
        color: "#000",
        marginBottom: 4,
    },
    deviceLocation: {
        fontSize: 14,
        color: "#000",
    },
    loadingText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FF6B6B",
        marginTop: 16,
        marginBottom: 8,
        textAlign: "center",
    },
    errorMessage: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 30,
        borderRadius: 20,
        width: "80%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#FF3B30",
        textAlign: "center",
    },
    modalButtonText: {
        backgroundColor: "#FF3B30",
        color: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        overflow: "hidden",
        marginTop: 10,
        borderRadius: 8,
    },
});