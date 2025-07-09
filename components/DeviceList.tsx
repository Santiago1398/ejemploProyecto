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
    const [devices, setDevices] = useState<ResponseAlarmaSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const [isError, setIsError] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    //const [resolver, setResolver] = useState<((telefono: string | null) => void) | null>(null);





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
            //Notifications.dismissAllNotificationsAsync();

            setShowAlarmDialog(true); // Muestra el diálogo en el momento
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




    // Cargar dispositivos
    // Actualización periódica cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            if (token && userId) fetchDevices(true); //  true = es auto-refresh
        }, 5000);

        return () => clearInterval(interval);
    }, [token, userId]);
    useEffect(() => {
        fetchDevices(false); // carga inicial
    }, []);
    // Preguntar por teléfono si no existe
    // Solo si no se ha preguntado antes
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
    // Confirmar teléfono
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

            setIsError(false);
            const storedUserId = await AsyncStorage.getItem("userId");
            const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);
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

                // Si el nombre del emplazamiento es el mismo, ordena por nave
                if (siteA < siteB) return -1;
                if (siteA > siteB) return 1;

                return 0;
            });

            setDevices(formattedData);

        } catch (error) {
            console.error("Error al cargar dispositivos:", error);
            setIsError(true);
            Alert.alert(t("deviceList.deviceLoadError"));
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    };


    // Alarmas en tiempo real
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

    useEffect(() => {
        notificationService.connectWebSocket();
        return () => {
            notificationService.disconnect(); // asegúrate de cerrar el socket aquí también si lo implementas
        };
    }, []);



    const getBackgroundColor = (alarmType: number, armed: boolean) => {
        // Si armed es false, siempre amarillo independientemente del alarmType
        if (!armed) {
            return "#facc15"; // amarillo
        }

        // Si armed es true, usar alarmType
        switch (alarmType) {
            case 0: return "#78dd35"; // verde
            case 1: return "#FF0000"; // rojo
            case 2: return "#9E9E9E"; // gris
            case 3: return "#9E75C6"; // violeta
            default: return "#000000"; // negro (fallback)
        }
    };

    // 🔥 ACTUALIZAR EL RENDERIZADO DEL ITEM
    const renderDeviceItem = ({ item }: { item: ResponseAlarmaSite }) => {
        // Usar ambos parámetros
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
                            buildPortalRef: item.buildPortalRef,
                            armed: item.armed
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
                    <Text style={styles.loadingText}>{t("deviceList.serverDisconnected")}</Text>
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
                                    //await playSilentSound(); //  reproducir el silencioso
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
    },
    centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },

});