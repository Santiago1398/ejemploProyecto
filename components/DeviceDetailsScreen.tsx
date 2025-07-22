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
    const [masterAlarmState, setMasterAlarmState] = useState<boolean>(true);
    const [initialLoad, setInitialLoad] = useState(true);

    const navigation = useNavigation<any>();
    const [headerText, setHeaderText] = useState<string>("Alarmas Activas");
    const [headerColor, setHeaderColor] = useState<string>("#76db36");
    const scrollRef = useRef<ScrollView>(null);
    const [tc5Disconnected, setTc5Disconnected] = useState<boolean>(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [isSimulated, setIsSimulated] = useState<boolean>(false);

    const isDeviceDisconnected = alarmType == 2;
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const isMasterDisabled = tc5Disconnected || isDeviceDisconnected || !isConnected;
    const [isProcessing, setIsProcessing] = useState(false); // 🔥 NUEVO: Estado de procesamiento
    const [lastSelectedAlarmId, setLastSelectedAlarmId] = useState<number | null>(null);

    useEffect(() => {
        if (isDeviceDisconnected) {
            setAlarms([]);
            setMasterAlarmState(false);
            setIsConnected(false);
            updateHeaderStatus([], false);
        }
    }, [isDeviceDisconnected])

    const scrollOffset = useRef(0);

    const handleScroll = (event: any) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
    };

    const updateHeaderStatus = (alarms: ParamTC[], masterState: boolean) => {
        // 🔥 CAMBIO: Si el master está desarmado, siempre gris sin importar las alarmas
        if (!masterState) {
            setHeaderText(t("DeviceDetailsScreen.alarmsDisabled"));
            setHeaderColor("#4B5563");
            return;
        }

        // Solo verificar alarmas disparadas si el master está armado
        const alarmaDisparada = alarms.some(alarm => alarm.disparado);
        if (alarmaDisparada) {
            setHeaderText(t("DeviceDetailsScreen.alarmTriggered"));
            setHeaderColor("#FF3B30");
        } else {
            setHeaderText(t("DeviceDetailsScreen.alarmsEnabled"));
            setHeaderColor("#76db36");
        }
    };

    const handleToggleMaster = async () => {
        const status = masterAlarmState ? 0 : 1;
        try {
            const response = await post(`alarmtc/armMaster?mac=${mac}&status=${status}`, {});
            if (response.status === "Master Button Alarm Armed" || response.status === "Master Button Alarm Disarmed") {
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

    const hasDisconnectedAlarmsInExpansion = (expansionAlarms: ParamTC[]): boolean => {
        // Verificar si alguna alarma de la expansión tiene conectado: false
        return expansionAlarms.some(alarm =>
            alarm.hasOwnProperty('conectado') && alarm.conectado === false
        );
    };

    const fetchAlarms = async (isAutoRefresh = false) => {
        try {
            if (!isAutoRefresh) {
                setLoading(true);
            }
            if (isDeviceDisconnected) {
                setAlarms([]);
                updateHeaderStatus([], false);
                setMasterAlarmState(false);
                setIsConnected(false);
                return;
            }

            const scrollY = scrollOffset.current;
            const data = await get(`alarmtc/status?mac=${mac}`);

            if (!data || data.length === 0) {
                console.log("❌ Datos vacíos del servidor - Sin conexión");
                setIsConnected(false);
                setAlarms([]);
                setHeaderText("Sin conexión");
                setHeaderColor("#8a9bb9");
                return;
            }

            const masterAlarm = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 1000);
            if (masterAlarm) {
                setMasterAlarmState(masterAlarm.armado);
                setIsSimulated(masterAlarm.simulado || false);

                const connected = masterAlarm.conectado !== undefined ? masterAlarm.conectado : true;
                setIsConnected(connected);
                console.log("🔌 Estado de conexión:", connected);
                console.log("🎭 Estado simulado:", masterAlarm.simulado);

                if (!connected) {
                    console.log("❌ Equipo desconectado según alarma 1000");
                    setAlarms([]);
                    setHeaderText("Sin conexión");
                    setHeaderColor("#8a9bb9");
                    return;
                }
            } else {
                console.log("❌ Alarma 1000 no encontrada - Sin conexión");
                setIsConnected(false);
                setAlarms([]);
                setHeaderText("Sin conexión");
                setHeaderColor("#8a9bb9");
                return;
            }

            // 🔥 CAMBIO: No añadir valor por defecto, mantener el valor original del backend
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

    // Funciones para organizar alarmas por rangos
    const getIdRange = (idAlarm: number): number => {
        if (idAlarm < 100) return 0;
        return Math.floor(idAlarm / 100) * 100;
    };

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

        const baseTitle = mostFrequent || `Rango ${alarms[0]?.idAlarm ? Math.floor(alarms[0].idAlarm / 100) * 100 : ''}`;

        // 🔥 NUEVO: Verificar si la expansión tiene alarmas desconectadas
        const hasDisconnected = hasDisconnectedAlarmsInExpansion(alarms);

        // 🔥 NUEVO: Añadir "No conectado" si hay alarmas desconectadas
        return hasDisconnected ? `${baseTitle} - No conectado` : baseTitle;
    };

    const separateAlarmsByIdRange = (alarms: ParamTC[]) => {
        const sortedAlarms = [...alarms].sort((a, b) => a.idAlarm - b.idAlarm);

        const otherAlarms: ParamTC[] = [];
        const rangeGroups: { [key: number]: ParamTC[] } = {};

        sortedAlarms.forEach(alarm => {
            const range = getIdRange(alarm.idAlarm);

            if (range === 0) {
                otherAlarms.push(alarm);
            } else {
                if (!rangeGroups[range]) {
                    rangeGroups[range] = [];
                }
                rangeGroups[range].push(alarm);
            }
        });

        return { otherAlarms, rangeGroups };
    };

    const createRangeSections = (rangeGroups: { [key: number]: ParamTC[] }) => {
        return Object.keys(rangeGroups)
            .map(range => parseInt(range))
            .sort((a, b) => a - b)
            .map(range => ({
                title: detectGroupTitle(rangeGroups[range]),
                data: rangeGroups[range],
                range: range
            }));
    };

    const renderSectionHeader = ({ section }: { section: { title: string } }) => {
        // 🔥 NUEVO: Detectar si el título contiene "No conectado"
        const isDisconnected = section.title.includes('No conectado');

        return (
            <View style={[
                styles.sectionHeader,
                isDisconnected && styles.sectionHeaderDisconnected // 🔥 NUEVO: Estilo para desconectadas
            ]}>
                <Text style={[
                    styles.sectionTitle,
                    isDisconnected && styles.sectionTitleDisconnected // 🔥 NUEVO: Estilo de texto para desconectadas
                ]}>
                    {section.title}
                </Text>
                <View style={[
                    styles.sectionLine,
                    isDisconnected && styles.sectionLineDisconnected // 🔥 NUEVO: Línea para desconectadas
                ]} />
            </View>
        );
    };

    const renderContent = () => {
        if (loading) {
            return <Text style={styles.loadingText}>{t("DeviceDetailsScreen.loadingAlarms")}</Text>;
        }

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

        const { otherAlarms, rangeGroups } = separateAlarmsByIdRange(alarms);
        const rangeSections = createRangeSections(rangeGroups);

        return (
            <ScrollView
                ref={scrollRef}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {otherAlarms.map((alarm) => (
                    <View key={`other-${alarm.idAlarm}`}>
                        {renderAlarmItem({ item: alarm })}
                    </View>
                ))}

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

    useEffect(() => {
        const interval = setInterval(() => {
            fetchAlarms(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [mac]);

    useEffect(() => {
        fetchAlarms(false);
    }, []);

    const handleOptionSelect = async (option: string) => {
        if (!selectedAlarm || isProcessing) {
            console.log("🔒 Operación bloqueada: no hay alarma o ya procesando");
            return;
        }

        const status = option === "Armada" ? 1 : 0;
        const idAlarm = selectedAlarm.idAlarm;

        console.log("🔄 Iniciando cambio de estado:", { idAlarm, status, option });

        try {
            // 🔥 BLOQUEAR inmediatamente para evitar dobles clicks
            setIsProcessing(true);

            const response = await post(`alarmtc/arm?mac=${mac}&alarm=${idAlarm}&status=${status}`, {});
            console.log("✅ Respuesta del servidor:", response);

            // 🔥 Actualizar estado local inmediatamente
            setSelectedAlarm((prev) => (prev ? { ...prev, armado: status === 1 } : prev));

            // 🔥 Cerrar modal inmediatamente
            closeModal();

            // 🔥 Fetch para sincronizar con servidor (sin bloquear UI)
            setTimeout(() => {
                fetchAlarms();
            }, 100);

        } catch (error) {
            console.error("❌ Error al cambiar el estado de la alarma:", error);
            setIsProcessing(false); // Desbloquear en caso de error
            Alert.alert(
                t("DeviceDetailsScreen.errorTitle"),
                t("DeviceDetailsScreen.errorChangeAlarmState")
            );
        }
    };

    useEffect(() => {
        // 🔥 SAFETY: Resetear estados si el modal está cerrado pero hay inconsistencias
        if (!isOptionModalVisible && isProcessing) {
            console.log("🔧 SAFETY: Reseteando estado inconsistente");
            setIsProcessing(false);
            setSelectedAlarm(null);
            setLastSelectedAlarmId(null);
        }
    }, [isOptionModalVisible, isProcessing]);

    // 6. Timeout de seguridad para evitar bloqueos permanentes
    useEffect(() => {
        if (isProcessing) {
            const timeout = setTimeout(() => {
                console.log("⏰ TIMEOUT: Desbloqueando modal automáticamente");
                setIsProcessing(false);
            }, 5000); // 5 segundos máximo

            return () => clearTimeout(timeout);
        }
    }, [isProcessing]);

    let lastModalOpenTime = 0;

    const openOptionModal = (alarm: ParamTC) => {
        // 🔥 PREVENIR: No abrir si ya se está procesando algo
        if (isProcessing) {
            console.log("🔒 Modal bloqueado: procesando operación");
            return;
        }

        // 🔥 PREVENIR: No abrir el mismo modal dos veces seguidas muy rápido
        const now = Date.now();
        if (lastModalOpenTime && now - lastModalOpenTime < 500) { // Aumentado a 500ms
            console.log("🔒 Modal bloqueado: demasiado rápido");
            return;
        }

        // 🔥 PREVENIR: No abrir el mismo modal de la misma alarma
        if (lastSelectedAlarmId === alarm.idAlarm && isOptionModalVisible) {
            console.log("🔒 Modal bloqueado: ya está abierto para esta alarma");
            return;
        }

        console.log("✅ Abriendo modal para alarma:", alarm.idAlarm);
        lastModalOpenTime = now;
        setLastSelectedAlarmId(alarm.idAlarm);
        setSelectedAlarm(alarm);
        setIsProcessing(false); // Asegurar que no está procesando
        setOptionModalVisible(true);
    };

    const closeModal = () => {
        console.log("🔄 Cerrando modal");
        setOptionModalVisible(false);
        setSelectedAlarm(null);
        setLastSelectedAlarmId(null);
        setIsProcessing(false);
    };

    const handleAlarmDetected = (idAlarm: number) => {
        console.log("🚨 Alarma detectada con id:", idAlarm);
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

    const getIconNameForAlarm = (texto: string): keyof typeof Ionicons.glyphMap => {
        const lowerText = texto.toLowerCase();
        if (lowerText.includes("electrico")) return "flash-outline";
        if (lowerText.includes("temperatura")) return "thermometer-outline";
        if (lowerText.includes("humedad")) return "water-outline";
        return "alert-circle-outline";
    };

    // 🔥 NUEVA FUNCIÓN: Verificar si UNA alarma específica está desconectada
    const isAlarmDisconnected = (alarm: ParamTC): boolean => {
        return alarm.hasOwnProperty('conectado') && alarm.conectado === false;
    };



    // 🔥 NUEVA FUNCIÓN renderAlarmItem con lógica individual
    const renderAlarmItem = ({ item }: { item: ParamTC }) => {
        let backgroundColor = "#8a9bb9"; // gris por defecto
        let textColor = "#000000"; // negro 

        // 🔥 NUEVO: Verificar si ESTA alarma específica está desconectada
        const isDisconnected = isAlarmDisconnected(item);

        // 🔥 NUEVA LÓGICA: Los colores NO cambian por desconexión
        if (item.disparado) {
            // 🔥 ALARMA DISPARADA = siempre rojo (incluso si desconectada)
            backgroundColor = "#FF0000";
            textColor = "#000000";
        } else if (item.armado) {
            // 🔥 ALARMA ARMADA = siempre verde (incluso si desconectada)
            backgroundColor = "#77dc36";
            textColor = "#000000";
        } else {
            // 🔥 ALARMA DESARMADA = siempre gris (incluso si desconectada)
            backgroundColor = "#8a9bb9";
            textColor = "#000000";
        }

        return (
            <TouchableOpacity
                style={[
                    styles.alarmContainer,
                    { backgroundColor }
                    // 🔥 ELIMINADO: No más estilos especiales para desconectadas
                ]}
                onPress={() => {
                    // 🔥 CAMBIO: Permitir abrir modal incluso si está desconectada
                    openOptionModal(item);
                }}
            // 🔥 ELIMINADO: disabled={isDisconnected}
            >
                <View style={styles.alarmRow}>
                    <EstadoAlarmaCircle
                        armado={item.armado}
                        disparado={item.disparado}
                        raised={item.raised}
                    />

                    <View style={styles.iconAndText}>
                        {item.disparado && (
                            <Ionicons
                                name={getIconNameForAlarm(item.texto)}
                                size={24}
                                color="#000"
                                style={styles.alarmIcon}
                            />
                        )}
                        <Text style={[styles.alarmText, { color: textColor }]}>
                            {item.texto}
                        </Text>
                    </View>
                </View>

                <View style={styles.rightContainer}>
                    {/* 🔥 NUEVO: Mostrar icono de nube SOLO si esta alarma específica está desconectada */}
                    {isDisconnected && (
                        <Ionicons
                            name="cloud-offline-outline"
                            size={24}
                            color="#666666"
                            style={styles.disconnectedIcon}
                        />
                    )}

                    {/* 🔥 SIEMPRE mostrar chevron (incluso si desconectada) */}
                    <Entypo name="chevron-thin-right" size={20} color="#000" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
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

            {renderContent()}

            <ButtonMaster
                mac={mac}
                fetchAlarms={fetchAlarms}
                masterAlarmState={masterAlarmState}
                onToggleMaster={handleToggleMaster}
                disabled={isMasterDisabled}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={isOptionModalVisible}
                onRequestClose={() => {
                    if (!isProcessing) closeModal();
                }}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => {
                        if (!isProcessing) closeModal();
                    }}
                >
                    <Pressable style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                if (!isProcessing) closeModal();
                            }}
                            disabled={isProcessing} // 🔥 NUEVO: Deshabilitar si está procesando
                        >
                            <Ionicons name="close" size={24} color={isProcessing ? "#ccc" : "#333"} />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>{selectedAlarm?.texto}</Text>

                        <TouchableOpacity
                            style={[
                                styles.optionRow,
                                isProcessing && styles.optionRowDisabled // 🔥 NUEVO: Estilo deshabilitado
                            ]}
                            onPress={() => handleOptionSelect("Armada")}
                            disabled={isProcessing} // 🔥 NUEVO: Deshabilitar si está procesando
                        >
                            <View style={[
                                styles.circle,
                                selectedAlarm?.armado ? { backgroundColor: "#76db36" } : {}
                            ]} />
                            <Text style={[
                                styles.optionText,
                                isProcessing && styles.optionTextDisabled // 🔥 NUEVO: Texto deshabilitado
                            ]}>
                                {t("DeviceDetailsScreen.armed")}
                            </Text>
                            {isProcessing && <Text style={styles.processingText}>...</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.optionRow,
                                isProcessing && styles.optionRowDisabled
                            ]}
                            onPress={() => handleOptionSelect("Desarmada")}
                            disabled={isProcessing}
                        >
                            <View style={[
                                styles.circle,
                                !selectedAlarm?.armado ? { backgroundColor: "#8a9bb9" } : {}
                            ]} />
                            <Text style={[
                                styles.optionText,
                                isProcessing && styles.optionTextDisabled
                            ]}>
                                {t("DeviceDetailsScreen.disarmed")}
                            </Text>
                            {isProcessing && <Text style={styles.processingText}>...</Text>}
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>

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

const styles = StyleSheet.create({
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
    alarmContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginVertical: 4,
        marginTop: 2,
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
    },
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
    rightContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    disconnectedIcon: {
        marginLeft: 8,
    },
    sectionHeaderDisconnected: {
        backgroundColor: '#fff5f5', // Fondo ligeramente rojizo
        borderLeftWidth: 4,
        borderLeftColor: '#ff6b6b', // Línea roja a la izquierda
    },

    sectionTitleDisconnected: {
        color: '#d63031', // Texto rojizo
        fontWeight: '700', // Más negrita
    },

    sectionLineDisconnected: {
        backgroundColor: '#ff6b6b', // Línea rojiza
        height: 2, // Más gruesa
    },
    optionRowDisabled: {
        opacity: 0.6,
    },
    optionTextDisabled: {
        color: "#999",
    },
    processingText: {
        marginLeft: 'auto',
        color: "#007AFF",
        fontSize: 14,
    },
});