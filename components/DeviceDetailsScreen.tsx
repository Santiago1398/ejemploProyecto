import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    FlatList,
    TouchableOpacity,
    Alert,
    Platform,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { get, post } from "@/services/api";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/navigation";
import ButtonMaster from "./BottonMaster";
import { ParamTC } from "@/infrastructure/intercafe/listapi.interface";
import Menu3Puntos from "@/components/Menu3Puntos";

import { notificationService } from '@/hooks/NotificationService';
import EstadoAlarmaCircle from "./EstadoAlarmaCircle";
import { t } from "@/i18n/i18nConfig";
import { Feather } from "@expo/vector-icons";




type DeviceDetailsRouteProp = RouteProp<RootStackParamList, "DeviceDetails">;

export default function AlarmList() {
    const route = useRoute<DeviceDetailsRouteProp>();

    const { device } = route.params;
    const { mac, farmName, siteName } = device;

    const [selectedAlarm, setSelectedAlarm] = useState<ParamTC | null>(null);
    const [isOptionModalVisible, setOptionModalVisible] = useState(false);
    const [alarms, setAlarms] = useState<ParamTC[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterAlarmState, setMasterAlarmState] = useState<boolean>(true); // Estado de la alarma 1000
    //const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    const navigation = useNavigation<any>();
    const [headerText, setHeaderText] = useState<string>("Alarmas Activas"); // Texto del header para controlarlo
    const [headerColor, setHeaderColor] = useState<string>("#76db36"); // Color del header para controlarloconst flatListRef = useRef<FlatList>(null);
    const flatListRef = useRef<FlatList>(null);
    const [tc5Disconnected, setTc5Disconnected] = useState<boolean>(false);
    const [menuVisible, setMenuVisible] = useState(false);


    // const COLORS = {
    //     yellowBackground: "#fef9c3",
    //     yellowText: "#ca8a04",
    //     greenBackground: "#dcfe7f",
    //     greenText: "#16a34a",
    //     redBackground: "#FFCDD2",
    //     redText: "#C62828",
    //     greyBackground: "#CFD8DC",
    //     greyText: "#37474F",
    // };


    const scrollOffset = useRef(0); // valor persistente

    const handleScroll = (event: any) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
    };

    //const [pushToken, setPushToken] = useState<string | null>(null);
    //const [fcmToken, setFcmToken] = useState<string | null>(null);

    const updateHeaderStatus = (alarms: ParamTC[], masterState: boolean) => {
        const alarmaDisparada = alarms.some(alarm => alarm.disparado);
        if (alarmaDisparada) {
            setHeaderText(t("DeviceDetailsScreen.alarmTriggered"));
            setHeaderColor("#FF3B30");
        } else if (masterState) {
            setHeaderText(t("DeviceDetailsScreen.alarmsEnabled"));
            setHeaderColor("#76db36");
        } else {
            setHeaderText(t("DeviceDetailsScreen.alarmsDisabled"));
            setHeaderColor("#8a9bb9");
        }
    };

    const handleToggleMaster = async () => {
        const status = masterAlarmState ? 0 : 1;
        try {
            const response = await post(`alarmtc/armMaster?mac=${mac}&status=${status}`, {});
            if (response.status === "Master Button Alarm Armed" || response.status === "Master Button Alarm Disarmed") {
                // Alert.alert(
                //     t("DeviceDetailsScreen.successTitle"),
                //     t(status === 1 ? "DeviceDetailsScreen.alarmsActivated" : "DeviceDetailsScreen.alarmsDeactivated")
                // );
                const nuevoEstado = !masterAlarmState;
                setMasterAlarmState(nuevoEstado);
                updateHeaderStatus(alarms, nuevoEstado);
                if (status === 1) {
                    fetchAlarms();
                }
            }
        } catch (error) {
            console.error("Error:", error);
            Alert.alert(
                t("DeviceDetailsScreen.errorTitle"),
                t("DeviceDetailsScreen.changeStatusError")
            );
        }
    }

    // 1. Obtener las alarmas (GET)
    // const fetchAlarms = async () => {
    //     try {
    //         setLoading(true);
    //         const scrollY = scrollOffset.current; // guarda antes

    //         console.log("Petición GET:", `alarmtc/status?mac=${mac}`);
    //         const data = await get(`alarmtc/status?mac=${mac}`);
    //         console.table("Datos obtenidos:", data);

    //         // Guardamos el estado de la alarma del Botón Master
    //         const masterAlarm = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 1000);
    //         if (masterAlarm) {
    //             setMasterAlarmState(masterAlarm.armado);
    //         }

    //         // Filtramos las alarmas habilitadas y distintas de 1000
    //         const enabledAlarms = data
    //             .filter((alarm: { habilitado: boolean; idAlarm: number }) => alarm.habilitado && alarm.idAlarm !== 1000)
    //             .map((alarm: ParamTC) => ({
    //                 ...alarm,
    //                 activada: false,
    //             }));

    //         console.table("Alarmas habilitadas:", enabledAlarms);

    //         setAlarms(enabledAlarms);
    //         updateHeaderStatus(enabledAlarms, masterAlarm?.armado ?? false);
    //         // Actualiza el estado del header
    //         setTimeout(() => {
    //             flatListRef.current?.scrollToOffset({ offset: scrollY, animated: false });
    //         }, 50);
    //     } catch (error) {
    //         console.error("Error en la solicitud GET:", error);
    //         Alert.alert("Error", "No se pudieron cargar las alarmas.");
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchAlarms = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setLoading(true);
            }

            const scrollY = scrollOffset.current;

            const data = await get(`alarmtc/status?mac=${mac}`);

            const alarm2000 = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 2000);
            if (alarm2000 && alarm2000.disparado) {
                setTc5Disconnected(true);
                setAlarms([]);
                setHeaderText(t("DeviceDetailsScreen.tc5Disconnected"));
                setHeaderColor("#8a9bb9");
                return;
            } else {
                setTc5Disconnected(false);
            }

            const masterAlarm = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 1000);
            if (masterAlarm) {
                setMasterAlarmState(masterAlarm.armado);
            }

            const enabledAlarms = data
                .filter((alarm: { habilitado: boolean; idAlarm: number }) =>
                    alarm.habilitado && ![1000, 2000].includes(alarm.idAlarm)
                )
                .map((alarm: ParamTC) => ({
                    ...alarm,
                    activada: false,
                }));

            setAlarms(enabledAlarms);
            updateHeaderStatus(enabledAlarms, masterAlarm?.armado ?? false);

            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: scrollY, animated: false });
            }, 50);
        } catch (error) {
            console.error("Error en la solicitud GET:", error);
            Alert.alert(t("DeviceDetailsScreen.errorTitle"), t("AlarmsScreen.errorLoadingAlarms"));
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    };



    // 2. useEffect para cargar las alarmas al montar
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAlarms(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [mac]);
    useEffect(() => {
        fetchAlarms(false);
    }, []);


    // 3. useLayoutEffect para configurar el header con Menu3Puntos
    // En tu useLayoutEffect, reemplaza la parte del headerRight:

    // En tu AlarmList, reemplaza el useLayoutEffect con esto:

    // Reemplaza tu useLayoutEffect completo con esto:
    // Reemplaza tu useLayoutEffect con esta versión ULTRA-compatible:

    // Reemplaza tu useLayoutEffect con esta versión que corrige el área de toque:

    // useLayoutEffect(() => {


    //     navigation.setOptions({
    //         headerTitle: () => (
    //             <View style={{ paddingTop: 4 }}>
    //                 <Text style={{
    //                     fontSize: 16,
    //                     color: "#fff",
    //                     textAlign: "center",
    //                     fontWeight: "500"
    //                 }}>
    //                     {farmName} - {siteName}
    //                 </Text>
    //                 <Text style={{
    //                     fontSize: 20,
    //                     fontWeight: "bold",
    //                     color: "#fff",
    //                     textAlign: "center"
    //                 }}>
    //                     {headerText}
    //                 </Text>
    //             </View>
    //         ),
    //         headerRight: () => (
    //             <View style={{
    //                 marginRight: 15,
    //                 width: 44,
    //                 height: 44,
    //                 justifyContent: 'center',
    //                 alignItems: 'center',
    //             }}>
    //                 <TouchableOpacity
    //                     onPress={() => {
    //                         console.log("🔥 BOTÓN PRESIONADO CORRECTAMENTE");
    //                         setMenuVisible(true);
    //                     }}
    //                     style={{
    //                         width: 44,
    //                         height: 44,
    //                         justifyContent: 'center',
    //                         alignItems: 'center',
    //                         borderRadius: 22,
    //                         backgroundColor: 'rgba(255,255,255,0.1)',
    //                     }}
    //                     activeOpacity={0.7}
    //                 // SIN hitSlop para área exacta
    //                 >
    //                     <Feather name="more-horizontal" size={24} color="#fff" />
    //                 </TouchableOpacity>
    //             </View>
    //         ),
    //         headerStyle: {
    //             backgroundColor: headerColor,
    //             height: 100,
    //             elevation: 0,
    //             shadowOpacity: 0,
    //         },
    //         headerTitleAlign: "center",
    //         headerTintColor: "#fff",
    //     });
    // }, [navigation, headerText, headerColor, farmName, siteName]);


    {/* Y la función handleOptionSelect vuelve a ser: */ }
    const handleOptionSelect = async (option: string) => {
        if (selectedAlarm) {
            // ✅ Compara con valores fijos
            const status = option === "Armada" ? 1 : 0;
            const idAlarm = selectedAlarm.idAlarm;

            try {
                const response = await post(`alarmtc/arm?mac=${mac}&alarm=${idAlarm}&status=${status}`, {});
                console.log("Respuesta del servidor:", response);

                setSelectedAlarm((prev) => (prev ? { ...prev, armado: status === 1 } : prev));

                setTimeout(() => {
                    setOptionModalVisible(false);
                    fetchAlarms();
                }, 250);
            } catch (error) {
                console.error("Error al cambiar el estado de la alarma:", error);
                Alert.alert(
                    t("DeviceDetailsScreen.errorTitle"),
                    t("DeviceDetailsScreen.errorChangeAlarmState")
                );
            }
        }
    };
    // const handleAlarmDetected = (idAlarm: number) => {
    //     console.log(" Alarma detectada con id:", idAlarm);
    //     setAlarms(prev =>
    //         prev.map(alarm =>
    //             alarm.idAlarm === idAlarm? { ...alarm, disparado: true } : alarm
    //         )
    //     );
    // };

    const handleAlarmDetected = (idAlarm: number) => {
        console.log(" Alarma detectada con id:", idAlarm);
        setAlarms(prev => {
            const nuevas = prev.map(alarm =>
                alarm.idAlarm === idAlarm
                    ? { ...alarm, disparado: true }
                    : alarm
            );
            updateHeaderStatus(nuevas, masterAlarmState);
            return nuevas;
        });
    };


    useEffect(() => {
        notificationService.setOnAlarmDetected(handleAlarmDetected);
        return () => {
            notificationService.setOnAlarmDetected(() => { });
        };
    }, []);


    // 5. Abre el modal para la alarma seleccionada
    const openOptionModal = (alarm: ParamTC) => {
        setSelectedAlarm(alarm);
        setOptionModalVisible(true);
    };

    const getIconNameForAlarm = (texto: string): keyof typeof Ionicons.glyphMap => {
        const lowerText = texto.toLowerCase();
        if (lowerText.includes("electrico")) return "flash-outline";
        if (lowerText.includes("temperatura")) return "thermometer-outline";
        if (lowerText.includes("humedad")) return "water-outline";
        return "alert-circle-outline"; // genérico
    };


    // const getDeviceToken = async () => {
    //     try {
    //         const token = await notificationService.getFCMToken();
    //         console.log(" Token obtenido:", token);

    //         if (token) {
    //             setFcmToken(token);
    //             await Clipboard.setStringAsync(token);
    //             Alert.alert("FCM Token obtenido", "Copiado al portapapeles:\n\n" + token);
    //         } else {
    //             console.warn(" Token devuelto vacío o nulo");
    //             Alert.alert("Error", "No se pudo obtener el token (vacío o nulo)");
    //         }
    //     } catch (error) {
    //         console.error(" Error al obtener FCM token:", error);
    //         if (error instanceof Error) {
    //             Alert.alert("FCM Token Error", error.message);
    //         } else {
    //             Alert.alert("FCM Token Error", JSON.stringify(error));
    //         }
    //     }
    // };


    // 6. Render de cada alarma (con mejoras visuales)
    const renderAlarmItem = ({ item }: { item: ParamTC }) => {
        let backgroundColor = "#8a9bb9"; // gris 
        let textColor = "#000000"; // negro 

        if (item.disparado) {
            backgroundColor = "#FF0000"; // rojo fuerte
            textColor = "#000000";
        } else if (!masterAlarmState && item.armado) {
            backgroundColor = "#fde047"; // amarillo fuerte
            textColor = "#000000";
        } else if (item.armado) {
            backgroundColor = "#77dc36"; // mismo verde que el header
            textColor = "#000000";
        }





        return (

            <TouchableOpacity
                style={[styles.alarmContainer, { backgroundColor }]}
                onPress={() => openOptionModal(item)}
            >
                <View style={styles.alarmRow}>
                    <EstadoAlarmaCircle armado={item.armado} disparado={item.disparado} raised={item.raised} />

                    <View style={styles.iconAndText}>
                        {item.disparado && (
                            <Ionicons
                                name={getIconNameForAlarm(item.texto)}
                                size={24}
                                color="#000"
                                style={styles.alarmIcon}
                            />
                        )}
                        <Text style={[styles.alarmText, { color: textColor }]}>{item.texto}</Text>
                    </View>
                </View>
                <Entypo name="chevron-thin-right" size={20} color="#000" />
            </TouchableOpacity>

        );
    };


    return (
        <View style={styles.container}>
            {/* 🔥 HEADER PERSONALIZADO - SIN MODAL AQUÍ */}
            <View style={[styles.customHeader, { backgroundColor: headerColor }]}>
                {/* Botón de retroceso */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Título del header */}
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerSubtitle}>
                        {farmName} - {siteName}
                    </Text>
                    <Text style={styles.headerMainTitle}>
                        {headerText}
                    </Text>
                </View>

                {/* Botón de 3 puntos */}
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => {
                        console.log("🔥 BOTÓN CUSTOM HEADER PRESIONADO");
                        setMenuVisible(true);
                    }}
                >
                    <Feather name="more-horizontal" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Tu contenido normal */}
            {loading ? (
                <Text style={styles.loadingText}>{t("DeviceDetailsScreen.loadingAlarms")}</Text>
            ) : tc5Disconnected ? (
                <View style={styles.centeredContainer}>
                    <Ionicons name="alert-circle" size={64} color="#8a9bb9" />
                    <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.tc5Disconnected")}</Text>
                </View>
            ) : alarms.length === 0 ? (
                <View style={styles.centeredContainer}>
                    <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.noEnabledAlarms")}</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={alarms}
                    keyExtractor={(item) => `${item.idAlarm}`}
                    renderItem={renderAlarmItem}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            {/* ButtonMaster */}
            <ButtonMaster
                mac={mac}
                fetchAlarms={fetchAlarms}
                masterAlarmState={masterAlarmState}
                onToggleMaster={handleToggleMaster}
                disabled={tc5Disconnected}
            />

            {/* ✅ MODAL EN LA POSICIÓN CORRECTA - UNA SOLA VEZ */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isOptionModalVisible}
                onRequestClose={() => setOptionModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setOptionModalVisible(false)}>
                    <Pressable style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setOptionModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>{selectedAlarm?.texto}</Text>

                        <TouchableOpacity style={styles.optionRow} onPress={() => handleOptionSelect("Armada")}>
                            <View style={[styles.circle, selectedAlarm?.armado ? { backgroundColor: "#76db36" } : {}]} />
                            <Text style={styles.optionText}>{t("DeviceDetailsScreen.armed")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionRow} onPress={() => handleOptionSelect("Desarmada")}>
                            <View style={[styles.circle, !selectedAlarm?.armado ? { backgroundColor: "#8a9bb9" } : {}]} />
                            <Text style={styles.optionText}>{t("DeviceDetailsScreen.disarmed")}</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Menu3Puntos */}
            <Menu3Puntos
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                device={{
                    latitude: device.latitude,
                    longitude: device.longitude,
                    farmName: device.farmName,
                    siteName: device.siteName,
                    mac: device.mac,
                    idSite: device.idSite,
                    buildPortalRef: device.buildPortalRef
                }}
            />
        </View>
    );
}

/** Estilos mejorados */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f4",
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
    },
    noAlarmsText: {
        fontSize: 20,
        color: "#666",
        fontWeight: "bold",
        textAlign: "center",
    },
    alarmContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
    },
    alarmRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingVertical: 2,
    },

    iconAndText: {
        flexDirection: "row",
        alignItems: "center",
    },

    alarmIcon: {
        marginRight: 8,
    },
    alarmText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        width: "100%",
    },
    optionText: {
        marginLeft: 10,
        fontSize: 16,
        color: "#333",
        fontWeight: "bold",
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#999",
        marginRight: 10,
        backgroundColor: "transparent",
    },

    testAlarmButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF3B30",
        marginHorizontal: 16,
        marginVertical: 10,
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    testAlarmButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    buttonIcon: {
        marginRight: 8,
    },
    statusCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    closeButton: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1,
    },

    customHeader: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 50 : 25, // Safe area
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },

    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },

    headerSubtitle: {
        fontSize: 16,
        color: "#fff",
        textAlign: "center",
        fontWeight: "500",
    },

    headerMainTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginTop: 2,
    },

    menuButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    // ... resto de tus estilos
})