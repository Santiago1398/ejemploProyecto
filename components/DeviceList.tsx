import React, { useEffect, useState, useRef } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Modal,
    AppState,
    SectionList,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import { useDeviceStore } from "@/store/useDeviceStore";
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { stopAlarmSound } from "@/utils/sound";
import { notificationService } from "@/hooks/NotificationService";
import { ResponseAlarmaSite } from "@/infrastructure/intercafe/listapi.interface";
import * as Notifications from "expo-notifications";
import PhoneNumberDialog from "./PhoneNumberDialog";
import { t } from "@/i18n/i18nConfig";
import { socketService } from "@/services/socketService";
import { EmptyState } from "@/utils/EmptyState";
import { LinearGradient } from "expo-linear-gradient";


// ===== Paleta de gradientes =====
const PALETTE = {

    green1: '#059669', // emerald-600
    green2: '#065F46', // emerald-900

    red1: "#FF0000",
    red2: "#dc2626",

    blue1: "#3b99cf",
    blue2: "#2f7fad",

    gray1: "#6C7B8F",
    gray2: "#546173",

    purple1: "#9E75C6",
    purple2: "#7b5aa2",

    black1: "#111827",
    black2: "#000000",

    yellow1: "#facc15",
    yellow2: "#eab308",
} as const;

const TEXT = {
    onCardPrimary: '#E5E7EB', // gray-200
    onCardSecondary: '#CBD5E1', // slate-300
    onCardMuted: '#94A3B8', // slate-400
} as const;

type GradientTuple = readonly [string, string];

const getGradientColors = (alarmType: number, armed: boolean): GradientTuple => {
    if (alarmType === 2) return [PALETTE.gray1, PALETTE.gray2] as const;
    if (!armed) return [PALETTE.blue1, PALETTE.blue2] as const;

    switch (alarmType) {
        case 0: return [PALETTE.green1, PALETTE.green2] as const;
        case 1: return [PALETTE.red1, PALETTE.red2] as const;
        case 3: return [PALETTE.purple1, PALETTE.purple2] as const;
        default: return [PALETTE.black1, PALETTE.black2] as const;
    }
};


// Devuelve colores del gradiente según estado
// const getGradientColors = (alarmType: number, armed: boolean) => {
//     // 1) alarmType = 2 → gris siempre (mute)
//     if (alarmType === 2) return [PALETTE.gray1, PALETTE.gray2];

//     // 2) Si no está armado → amarillo (indicativo)
//     if (!armed) return [PALETTE.blue1, PALETTE.blue2];

//     // 3) Armado → por tipo de alarma
//     switch (alarmType) {
//         case 0:
//             return [PALETTE.green1, PALETTE.green2]; // OK → verde gradiente (emerald→teal vibe)
//         case 1:
//             return [PALETTE.red1, PALETTE.red2]; // Alarma → rojo
//         case 3:
//             return [PALETTE.purple1, PALETTE.purple2]; // Otro estado → morado
//         default:
//             return [PALETTE.black1, PALETTE.black2]; // Fallback
//     }
// };

export default function DeviceList() {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token, userId } = useAuthStore();
    const isFocused = useIsFocused();

    const {
        devices,
        loading,
        error: isError,
        setDevices,
        setLoading,
        setError,
        updateDevice,
    } = useDeviceStore();

    const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [errorAlertShown, setErrorAlertShown] = useState(false);
    const previousMacsRef = useRef<string[]>([]);

    // Secciones (Alarmas + Todas)
    const prepareSectionData = (deviceList: ResponseAlarmaSite[]) => {
        const sections: {
            title: string;
            data: ResponseAlarmaSite[];
            type: "alarms" | "all";
        }[] = [];

        const devicesWithAlarms = deviceList.filter((d) => d.alarmType === 1);

        if (deviceList.length > 5 && devicesWithAlarms.length > 0) {
            sections.push({
                title: t("deviceList.Alarmas"),
                data: devicesWithAlarms,
                type: "alarms",
            });
        }

        sections.push({
            title: t("deviceList.TODAS_LAS_UBICACIONES"),
            data: deviceList,
            type: "all",
        });

        return sections;
    };
    // Para imprimir MAC en formato 
    const formatMac = (mac: string | number) => {
        const s = String(mac).replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
        return s.length === 12 ? s.match(/.{1,2}/g)!.join(':') : String(mac);
    };


    // Inicializar socket
    useEffect(() => {
        console.log("🚀 DeviceList montado, inicializando SocketService...");
        socketService.initialize();
        return () => {
            // socketService.disconnect();
        };
    }, []);

    // Limpiar notificaciones al volver
    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (state) => {
            if (state === "active") {
                await Notifications.dismissAllNotificationsAsync();
            }
        });
        return () => subscription.remove();
    }, []);

    // Callback alarma (push/ws)
    useEffect(() => {
        notificationService.setOnAlarmDetected((_idAlarm) => {
            setShowAlarmDialog(true);
        });
        return () => {
            notificationService.setOnAlarmDetected(() => { });
        };
    }, []);

    // Comprobar alarma pendiente
    useEffect(() => {
        const checkAlarm = async () => {
            const pendiente = await AsyncStorage.getItem("alarma_activa_pendiente");
            if (pendiente === "true") setShowAlarmDialog(true);
        };
        checkAlarm();
    }, []);

    // Evento socket: register_macs
    useEffect(() => {
        const handleRegisterMacsEvent = (payload: any) => {
            if (!isFocused) return;

            const eventMac =
                typeof payload === "string" || typeof payload === "number"
                    ? String(payload)
                    : String(payload?.mac || payload?.device?.mac || payload?.macAddress || "");

            if (eventMac) {
                console.log(
                    `🔄 MAC ${eventMac} ha cambiado, refrescando lista en DeviceList`
                );
                fetchDevices(true);
            } else {
                console.log(" register_macs sin MAC, ignorado");
            }
        };

        socketService.on("register_macs", handleRegisterMacsEvent);
        return () => socketService.off("register_macs", handleRegisterMacsEvent);
    }, [isFocused]);

    // Auto refresh
    useEffect(() => {
        const interval = setInterval(() => {
            if (token && userId) fetchDevices(true);
        }, 7000);
        return () => clearInterval(interval);
    }, [token, userId]);

    // Primera carga
    useEffect(() => {
        fetchDevices(false);
    }, []);

    // Diálogo teléfono inicial
    useEffect(() => {
        const checkTelefono = async () => {
            const telefono = await AsyncStorage.getItem("telefono");
            const preguntado = await AsyncStorage.getItem("telefonoPreguntado");
            if (!telefono && !preguntado) setDialogVisible(true);
        };
        checkTelefono();
    }, []);

    const handleConfirmTelefono = async (telefono: string) => {
        console.log(" Guardando teléfono desde DeviceList:", telefono);
        setDialogVisible(false);
        await AsyncStorage.setItem("telefono", telefono);
        await AsyncStorage.setItem("telefonoPreguntado", "true");

        const uId = await AsyncStorage.getItem("userId");
        if (uId) {
            await notificationService.registerDevice(Number(uId));
        }
    };

    const handleCancelTelefono = async () => {
        setDialogVisible(false);
        await AsyncStorage.setItem("telefonoPreguntado", "true");
    };

    // Cargar dispositivos
    const fetchDevices = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) setLoading(true);
            if (isError && !errorAlertShown) setErrorAlertShown(false);
            setError(false);

            const storedUserId = await AsyncStorage.getItem("userId");
            const data: ResponseAlarmaSite[] = await get(
                `alarmtc/sites/usershared2/${storedUserId}`
            );

            const formattedData = data.map((device) => ({
                ...device,
                mac: Number(device.mac),
                alarmType: device.alarmType ?? 1,
                armed: device.armed ?? true,
            }));

            setDevices(formattedData);
            setErrorAlertShown(false);

            // Enviar MACs al socket
            const macAddresses = formattedData.map((d) => String(d.mac));
            console.log(
                "------- Enviando MACs al socket desde DeviceList:---------",
                macAddresses
            );
            socketService.setMacAddresses(macAddresses);
        } catch (error) {
            console.error("Error al cargar dispositivos:", error);
            setError(true);

            if (!isAutoRefresh && !errorAlertShown) {
                setErrorAlertShown(true);
                Alert.alert("Error de conexión", t("deviceList.deviceLoadError"), [
                    { text: "OK", onPress: () => { } },
                ]);
            }
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    };

    // Alarma site detectada → pasa a alarmType 2 (mute/gris)
    useEffect(() => {
        notificationService.setOnSiteAlarmDetected((macStr) => {
            const mac = Number(macStr);
            updateDevice(mac, { alarmType: 2 });
        });
        return () => {
            notificationService.setOnSiteAlarmDetected(() => { });
        };
    }, [updateDevice]);

    // Header de sección
    // Header de sección mejorado
    const renderSectionHeader = ({ section }: { section: any }) => {
        const isAll = section.type === "all";
        const count = section.data?.length ?? 0;

        return (
            <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleWrap}>
                        <Ionicons name={isAll ? "albums-outline" : "alert-circle-outline"} size={18} color="#111827" style={{ marginRight: 6 }} />
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        {/* Badge de cantidad */}
                        {isAll && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{count}</Text>
                            </View>
                        )}
                    </View>

                    {/* Acción opcional (ordenar / filtrar)
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => Alert.alert("Ordenar", "Aquí puedes abrir tu modal de orden/filtrado")}
                        style={styles.actionBtn}
                    >
                        <Ionicons name="funnel-outline" size={18} color="#111827" />
                    </TouchableOpacity> */}
                </View>

                {/* Separador con gradiente */}
                <LinearGradient
                    colors={["#111827", "#6B7280"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sectionLineGradient}
                />
            </View>
        );
    };

    // Render item con gradiente
    const renderDeviceItem = ({ item }: { item: ResponseAlarmaSite }) => {
        const colors = getGradientColors(item.alarmType, item.armed);
        const capitalize = (str: string) =>
            str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

        return (
            <TouchableOpacity
                activeOpacity={0.9}
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
                            alarmType: item.alarmType,
                        },
                    });
                }}
            >
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.deviceContainer}
                >
                    <View style={styles.row}>
                        <Ionicons name="home-outline" size={24} color="#F8F9FA" style={{ marginRight: 8 }} />
                        <Text style={styles.deviceTitle}>{capitalize(item.farmName)}</Text>
                    </View>

                    <Text style={styles.deviceSubtitle}>{capitalize(item.siteName)}</Text>
                    <Text style={styles.deviceLocation}>{/* … */}</Text>

                    {/* 👉 Chip con la MAC en la esquina inferior derecha */}
                    <View style={styles.macBadge}>
                        <Ionicons name="hardware-chip-outline" size={14} color="#E5E7EB" style={{ marginRight: 4 }} />
                        <Text style={styles.macText}>{formatMac(item.mac)}</Text>
                    </View>
                </LinearGradient>

            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {initialLoad ? (
                <Text style={styles.loadingText}>{t("deviceList.loadingDevices")}</Text>
            ) : isError ? (
                <View className="centeredContainer" style={styles.centeredContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color="#FF6B6B" />
                    <Text style={styles.errorTitle}>{t("deviceList.error.noConnection")}</Text>
                    <Text style={styles.errorMessage}>
                        {t("deviceList.error.cannotLoadLocations")}
                    </Text>
                </View>
            ) : devices.length === 0 ? (
                <EmptyState
                    icon="map-marker-off"
                    lib="mc"
                    title={t("deviceList.noLocationsAvailable")}
                    color="#2563EB"
                    size={88}
                />
            ) : (
                <SectionList
                    sections={prepareSectionData(devices)}
                    keyExtractor={(item, index) => `${item.idSite}-${item.mac}-${index}`}
                    renderItem={renderDeviceItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContainer}
                    stickySectionHeadersEnabled={true}
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
                                    await AsyncStorage.multiRemove([
                                        "alarmPlaying",
                                        "alarma_activa_pendiente",
                                    ]);
                                    setShowAlarmDialog(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>
                                    {t("deviceList.acceptAndStopAlarm")}
                                </Text>
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

    sectionLine: {
        height: 2,
        backgroundColor: "#333",
        width: "100%",
    },

    // Tarjeta de dispositivo (sin backgroundColor: lo pinta el LinearGradient)
    // deviceContainer: {
    //     padding: 16,
    //     marginVertical: 4,
    //     borderRadius: 12,
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.15,
    //     shadowRadius: 3.84,
    //     elevation: 4,
    // },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    deviceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: TEXT.onCardPrimary,
    },
    deviceSubtitle: {
        fontSize: 16,
        color: TEXT.onCardPrimary,
        marginBottom: 4,
    },
    deviceLocation: {
        fontSize: 14,
        color: TEXT.onCardMuted,
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
    sectionHeader: {
        backgroundColor: "#f2f2f2",
        paddingTop: 6,
        paddingBottom: 10,
        paddingHorizontal: 0,
        marginTop: 8,
    },

    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    sectionTitleWrap: {
        flexDirection: "row",
        alignItems: "center",
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },

    countBadge: {
        marginLeft: 8,
        backgroundColor: "#E5E7EB",
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignItems: "center",
        justifyContent: "center",
    },

    countBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#111827",
    },

    actionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    // Sustituye la antigua línea por esta con gradiente
    sectionLineGradient: {
        height: 2,
        width: "100%",
        borderRadius: 2,
        marginTop: 8,
    },
    deviceContainer: {
        padding: 16,
        paddingBottom: 26,       // un poco más para que el chip no pise el texto
        marginVertical: 4,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
        position: 'relative',    // ← necesario para posicionar el chip
    },

    macBadge: {
        position: 'absolute',
        right: 12,
        bottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },

    macText: {
        color: TEXT.onCardPrimary, //'#E5E7EB',        // gris claro sobre verde oscuro
        fontSize: 12.5,          // se ve bien sin ser enorme
        fontWeight: '700',
        letterSpacing: 0.5,
        // fontFamily opcional si quieres monospace:
        // fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },


});