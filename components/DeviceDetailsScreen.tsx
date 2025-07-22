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
import { socketService } from "@/services/socketService";


type DeviceDetailsRouteProp = RouteProp<RootStackParamList, "DeviceDetails">;

export default function AlarmList() {
    const route = useRoute<DeviceDetailsRouteProp>();

    const { device } = route.params;
    const { mac, farmName, siteName, alarmType } = device;

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
    const [isProcessing, setIsProcessing] = useState(false);

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
        if (!masterState) {
            setHeaderText(t("DeviceDetailsScreen.alarmsDisabled"));
            setHeaderColor("#4B5563");
            return;
        }

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
            Alert.alert(
                t("DeviceDetailsScreen.errorTitle"),
                t("DeviceDetailsScreen.changeStatusError")
            );
        }
    }

    const hasDisconnectedAlarmsInExpansion = (expansionAlarms: ParamTC[]): boolean => {
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

                if (!connected) {
                    setAlarms([]);
                    setHeaderText("Sin conexión");
                    setHeaderColor("#8a9bb9");
                    return;
                }
            } else {
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
            setIsConnected(false);
            setAlarms([]);
            setHeaderText("Sin conexión");
            setHeaderColor("#8a9bb9");
            Alert.alert(t("DeviceDetailsScreen.errorTitle"), t("DeviceDetailsScreen.errorLoadingAlarms"));
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
        const patterns: { [key: string]: number } = {};

        alarms.forEach(alarm => {
            const match = alarm.texto.match(/^(EXP[A-Z]\/\d+)/);
            if (match) {
                const pattern = match[1];
                patterns[pattern] = (patterns[pattern] || 0) + 1;
            }
        });

        const mostFrequent = Object.keys(patterns).reduce((a, b) =>
            patterns[a] > patterns[b] ? a : b, Object.keys(patterns)[0]
        );

        const baseTitle = mostFrequent || `Rango ${alarms[0]?.idAlarm ? Math.floor(alarms[0].idAlarm / 100) * 100 : ''}`;
        const hasDisconnected = hasDisconnectedAlarmsInExpansion(alarms);

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
        const isDisconnected = section.title.includes('No conectado');

        return (
            <View style={[
                styles.sectionHeader,
                isDisconnected && styles.sectionHeaderDisconnected
            ]}>
                <Text style={[
                    styles.sectionTitle,
                    isDisconnected && styles.sectionTitleDisconnected
                ]}>
                    {section.title}
                </Text>
                <View style={[
                    styles.sectionLine,
                    isDisconnected && styles.sectionLineDisconnected
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
        }, 15000);

        return () => clearInterval(interval);
    }, [mac]);

    useEffect(() => {
        fetchAlarms(false);
    }, []);

    // 🔧 FUNCIÓN MEJORADA: Sin optimistic update, leer estado real primero
    const handleAlarmToggle = async (alarm: ParamTC) => {
        if (isProcessing) {
            return;
        }

        const newStatus = alarm.armado ? 0 : 1;
        const idAlarm = alarm.idAlarm;

        try {
            setIsProcessing(true);

            // 📡 Enviar al servidor SIN cambiar UI inmediatamente
            const response = await post(`alarmtc/arm?mac=${mac}&alarm=${idAlarm}&status=${newStatus}`, {});

            // 🔄 Leer estado real inmediatamente después de la respuesta
            await fetchAlarms(true);

        } catch (error) {
            console.error("Error al cambiar estado de alarma:", error);
            Alert.alert(
                t("DeviceDetailsScreen.errorTitle"),
                t("DeviceDetailsScreen.errorChangeAlarmState")
            );
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (isProcessing) {
            const timeout = setTimeout(() => {
                setIsProcessing(false);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [isProcessing]);

    const handleAlarmDetected = (idAlarm: number) => {
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

    const isAlarmDisconnected = (alarm: ParamTC): boolean => {
        return alarm.hasOwnProperty('conectado') && alarm.conectado === false;
    };

    useEffect(() => {
        const handleMacEvent = (payload: any) => {
            const eventMac = typeof payload === 'string' || typeof payload === 'number'
                ? String(payload)
                : String(
                    payload?.mac ||
                    payload?.device?.mac ||
                    payload?.macAddress ||
                    ''
                );

            if (eventMac === String(mac)) {
                fetchAlarms(true);
            }
        };

        socketService.on('register_macs', handleMacEvent);
        return () => socketService.off('register_macs', handleMacEvent);
    }, [mac]);

    // 🎨 LÓGICA DE COLORES BASADA EN ESTADO REAL (raised)
    const renderAlarmItem = ({ item }: { item: ParamTC }) => {
        let backgroundColor = "#8a9bb9";
        let textColor = "#000000";

        const isDisconnected = isAlarmDisconnected(item);

        // Lógica basada en el estado REAL (raised) no en disparado
        if (!item.armado) {
            // DESARMADA → Gris
            backgroundColor = "#8a9bb9";
        } else {
            // ARMADA → Color basado en RAISED (estado real)
            if (item.raised) {
                // ARMADA + RAISED → Rojo (alarma real activa)
                backgroundColor = "#FF0000";
            } else {
                // ARMADA + NO RAISED → Verde (estado normal)
                backgroundColor = "#77dc36";
            }
        }

        return (
            <TouchableOpacity
                style={[
                    styles.alarmContainer,
                    { backgroundColor },
                    isProcessing && { opacity: 0.7 }
                ]}
                onPress={() => handleAlarmToggle(item)}
                disabled={isProcessing}
            >
                <View style={styles.alarmRow}>
                    <EstadoAlarmaCircle
                        armado={item.armado}
                        disparado={item.disparado}
                        raised={item.raised}
                    />

                    <View style={styles.iconAndText}>
                        {/* {item.raised && (
                            <Ionicons
                                name={getIconNameForAlarm(item.texto)}
                                size={24}
                                color="#000"
                                style={styles.alarmIcon}
                            />
                        )} */}
                        <Text style={[styles.alarmText, { color: textColor }]}>
                            {item.texto}
                        </Text>
                    </View>
                </View>

                <View style={styles.rightContainer}>
                    {isDisconnected && (
                        <Ionicons
                            name="cloud-offline-outline"
                            size={24}
                            color="#666666"
                            style={styles.disconnectedIcon}
                        />
                    )}
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
                        setMenuVisible(true);
                    }}
                >
                    <Feather name="more-vertical" size={24} color="#fff" />
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
        backgroundColor: '#fff5f5',
        borderLeftWidth: 4,
        borderLeftColor: '#ff6b6b',
    },
    sectionTitleDisconnected: {
        color: '#d63031',
        fontWeight: '700',
    },
    sectionLineDisconnected: {
        backgroundColor: '#ff6b6b',
        height: 2,
    },
});