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
    SectionList,
    ScrollView,
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
    const { mac, farmName, siteName, alarmType } = device;

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
    const scrollRef = useRef<ScrollView>(null);
    const [tc5Disconnected, setTc5Disconnected] = useState<boolean>(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isSimulated, setIsSimulated] = useState<boolean>(false);
    ;
    const isDeviceDisconnected = alarmType == 2;
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const isMasterDisabled = tc5Disconnected || isDeviceDisconnected || !isConnected;

    // 🔥 NUEVA LÓGICA: forzar Master a OFF cuando está desconectado
    //const effectiveMasterState = isMasterDisabled ? false : masterAlarmState;

    useEffect(() => {
        if (isDeviceDisconnected) {
            setAlarms([]);
            setMasterAlarmState(false);
            setIsConnected(false); // 🔥 AGREGADO: También marcar como desconectado
            // 🔥 Usar updateHeaderStatus para controlar el header
            updateHeaderStatus([], false);
        }
    }, [isDeviceDisconnected])


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

    const fetchAlarms = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setLoading(true);
            }
            if (isDeviceDisconnected) {
                setAlarms([]);
                updateHeaderStatus([], false);
                setMasterAlarmState(false);
                setIsConnected(false); // 🔥 AGREGADO
                return;
            }

            const scrollY = scrollOffset.current;
            const data = await get(`alarmtc/status?mac=${mac}`);

            // 🔥 NUEVO: Verificar si hay datos y si están vacíos
            if (!data || data.length === 0) {
                console.log("❌ Datos vacíos del servidor - Sin conexión");
                setIsConnected(false);
                setAlarms([]);
                setHeaderText("Sin conexión");
                setHeaderColor("#8a9bb9");
                return;
            }

            // const alarm2000 = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 2000);
            // if (alarm2000 && alarm2000.disparado) {
            //     setTc5Disconnected(true);
            //     setAlarms([]);
            //     setHeaderText(t("DeviceDetailsScreen.tc5Disconnected"));
            //     setHeaderColor("#8a9bb9");
            //     return;
            // } else {
            //     setTc5Disconnected(false);
            // }

            const masterAlarm = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 1000);
            if (masterAlarm) {
                setMasterAlarmState(masterAlarm.armado);
                // 🔥 NUEVO: Capturar estado de simulación
                setIsSimulated(masterAlarm.simulado || false);

                // 🔥 NUEVO: Capturar estado de conexión
                const connected = masterAlarm.conectado !== undefined ? masterAlarm.conectado : true;
                setIsConnected(connected);
                console.log("🔌 Estado de conexión:", connected);
                console.log("🎭 Estado simulado:", masterAlarm.simulado);

                // 🔥 NUEVO: Si no está conectado, mostrar mensaje y salir
                if (!connected) {
                    console.log("❌ Equipo desconectado según alarma 1000");
                    setAlarms([]);
                    setHeaderText("Sin conexión");
                    setHeaderColor("#8a9bb9");
                    return;
                }
            } else {
                // 🔥 NUEVO: Si no existe la alarma 1000, considerar desconectado
                console.log("❌ Alarma 1000 no encontrada - Sin conexión");
                setIsConnected(false);
                setAlarms([]);
                setHeaderText("Sin conexión");
                setHeaderColor("#8a9bb9");
                return;
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
                scrollRef.current?.scrollTo({ y: scrollY, animated: false });
            }, 50);
        } catch (error) {
            console.error("Error en la solicitud GET:", error);
            // 🔥 NUEVO: En caso de error, considerar desconectado
            setIsConnected(false);
            setAlarms([]);
            setHeaderText("Sin conexión");
            setHeaderColor("#8a9bb9");
            Alert.alert(t("DeviceDetailsScreen.errorTitle"), t("AlarmsScreen.errorLoadingAlarms"));
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    };
    // Agregar estas funciones después de fetchAlarms y antes de useEffect

    // 🔥 NUEVA FUNCIÓN: Obtener rango de ID (1-99, 100-199, 200-299, etc.)
    const getIdRange = (idAlarm: number): number => {
        if (idAlarm < 100) return 0; // Rango 1-99 (sin título)
        return Math.floor(idAlarm / 100) * 100; // 100, 200, 300, etc.
    };

    // 🔥 NUEVA FUNCIÓN: Detectar título del grupo basado en las alarmas del rango
    const detectGroupTitle = (alarms: ParamTC[]): string => {
        // Buscar el patrón común más frecuente en el grupo
        const patterns: { [key: string]: number } = {};

        alarms.forEach(alarm => {
            const match = alarm.texto.match(/^(EXP[A-Z]\/\d+)/);
            if (match) {
                const pattern = match[1];
                patterns[pattern] = (patterns[pattern] || 0) + 1;
            }
        });

        // Retornar el patrón más frecuente
        const mostFrequent = Object.keys(patterns).reduce((a, b) =>
            patterns[a] > patterns[b] ? a : b, Object.keys(patterns)[0]
        );

        return mostFrequent || `Rango ${alarms[0]?.idAlarm ? Math.floor(alarms[0].idAlarm / 100) * 100 : ''}`;
    };

    // 🔥 NUEVA FUNCIÓN: Separar alarmas por rangos de ID
    const separateAlarmsByIdRange = (alarms: ParamTC[]) => {
        // Primero ordenar por ID
        const sortedAlarms = [...alarms].sort((a, b) => a.idAlarm - b.idAlarm);

        const otherAlarms: ParamTC[] = []; // IDs 1-99
        const rangeGroups: { [key: number]: ParamTC[] } = {}; // IDs 100+

        sortedAlarms.forEach(alarm => {
            const range = getIdRange(alarm.idAlarm);

            if (range === 0) {
                otherAlarms.push(alarm); // IDs 1-99 sin título
            } else {
                if (!rangeGroups[range]) {
                    rangeGroups[range] = [];
                }
                rangeGroups[range].push(alarm);
            }
        });

        return { otherAlarms, rangeGroups };
    };

    // 🔥 NUEVA FUNCIÓN: Convertir grupos de rango a secciones con títulos
    const createRangeSections = (rangeGroups: { [key: number]: ParamTC[] }) => {
        return Object.keys(rangeGroups)
            .map(range => parseInt(range))
            .sort((a, b) => a - b) // Ordenar por rango: 100, 200, 300, etc.
            .map(range => ({
                title: detectGroupTitle(rangeGroups[range]),
                data: rangeGroups[range],
                range: range
            }));
    };

    // 🔥 NUEVA FUNCIÓN: Renderizar header de sección
    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionLine} />
        </View>
    );

    const renderContent = () => {
        if (loading) {
            return <Text style={styles.loadingText}>{t("DeviceDetailsScreen.loadingAlarms")}</Text>;
        }

        // 🔥 NUEVO: Verificar conexión primero
        if (!isConnected) {
            return (
                <View style={styles.centeredContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color="#8a9bb9" />
                    <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.connection.noConnection")}</Text>
                    <Text style={styles.connectionSubtext}>
                        {t("DeviceDetailsScreen.connection.deviceDisconnected")}
                    </Text>
                </View>
            );
        }

        if (tc5Disconnected) {
            return (
                <View style={styles.centeredContainer}>
                    <Ionicons name="alert-circle" size={64} color="#8a9bb9" />
                    <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.tc5Disconnected")}</Text>
                </View>
            );
        }

        if (alarms.length === 0) {
            return (
                <View style={styles.centeredContainer}>
                    <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.noEnabledAlarms")}</Text>
                </View>
            );
        }

        // 🔥 NUEVO: Separar alarmas por rangos de ID
        const { otherAlarms, rangeGroups } = separateAlarmsByIdRange(alarms);
        const rangeSections = createRangeSections(rangeGroups);

        return (
            <ScrollView
                ref={scrollRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* 🔥 PRIMERO: Renderizar alarmas ID 1-99 sin título */}
                {otherAlarms.map((alarm) => (
                    <View key={`other-${alarm.idAlarm}`}>
                        {renderAlarmItem({ item: alarm })}
                    </View>
                ))}

                {/* 🔥 SEGUNDO: Renderizar rangos 100+, 200+, etc. con títulos automáticos */}
                {rangeSections.map((section) => (
                    <View key={`range-${section.range}`}>
                        {renderSectionHeader({ section })}
                        {section.data.map((alarm) => (
                            <View key={`range-${section.range}-${alarm.idAlarm}`}>
                                {renderAlarmItem({ item: alarm })}
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>
        );
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
            {/* Header personalizado - sin cambios */}
            <View style={[styles.customHeader, { backgroundColor: headerColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerSubtitle}>
                        {farmName} - {siteName}
                    </Text>
                    <Text style={styles.headerMainTitle}>
                        {headerText}
                    </Text>
                </View>

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

            {/* 🔥 NUEVO: Usar la función renderContent */}
            {renderContent()}

            {/* ButtonMaster - sin cambios */}
            <ButtonMaster
                mac={mac}
                fetchAlarms={fetchAlarms}
                masterAlarmState={masterAlarmState}
                onToggleMaster={handleToggleMaster}
                disabled={isMasterDisabled}
            />

            {/* Modal - sin cambios */}
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

            {/* Menu3Puntos - sin cambios */}
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
                    buildingPortalRef: device.buildingPortalRef,
                    simulado: isSimulated
                }}
            />
        </View>
    );
}

/** Estilos mejorados */
const styles = StyleSheet.create({
    // ... estilos existentes ...

    // 🔥 NUEVOS ESTILOS para headers de sección
    sectionHeader: {
        backgroundColor: '#f4f4f4',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 8,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    sectionLine: {
        height: 1,
        backgroundColor: '#ddd',
        marginTop: 4,
    },

    // 🔥 MODIFICAR: Reducir marginTop de alarmContainer para mejor espaciado con headers
    alarmContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginVertical: 4, // 🔥 Reducido de 6 a 4
        marginTop: 2, // 🔥 NUEVO: Menos espacio arriba
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
    },

    // ... resto de estilos existentes sin cambios ...
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
        paddingTop: Platform.OS === 'ios' ? 50 : 25,
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
    connectionSubtext: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
        marginTop: 8,
        fontStyle: "italic",
    },
});

