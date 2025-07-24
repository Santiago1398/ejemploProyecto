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

// 🌡️ INTERFAZ PARA SENSORES
interface SensorData {
    id: number;
    value: number;
    minAlarm: number;
    maxAlarm: number;
    type: number;
    unit: number; // Cambiado de string a number
}

// 📊 ENUM DE UNIDADES
const UnitEnum = {
    EN_GT_UNID_NO_UNIDAD: 0,
    EN_GT_UNID_GRADO_CENTIGRADO: 1,
    EN_GT_UNID_GRADO_Fahrenheit: 2,
    EN_GT_UNID_LITROS: 3,
    EN_GT_UNID_GALONES: 4,
    EN_GT_UNID_KILOS: 5,
    EN_GT_UNID_LIBRA: 6,
    EN_GT_UNID_M3H: 7,
    EN_GT_UNID_CFM: 8,
    EN_GT_UNID_VATIO: 9,
    EN_GT_UNID_PORCENTAJE: 10,
    EN_GT_UNID_PASCALES: 11,
    EN_GT_UNID_PPM: 12,
    EN_GT_UNID_METRO: 13,
    EN_GT_UNID_PULGADA: 14,
    EN_GT_UNID_PIE: 15,
};

// 🔄 FUNCIÓN PARA CONVERTIR NÚMERO DE UNIDAD A STRING
const getUnitString = (unitNumber: number): string => {
    switch (unitNumber) {
        case UnitEnum.EN_GT_UNID_NO_UNIDAD:
            return "";
        case UnitEnum.EN_GT_UNID_GRADO_CENTIGRADO:
            return "°C";
        case UnitEnum.EN_GT_UNID_GRADO_Fahrenheit:
            return "°F";
        case UnitEnum.EN_GT_UNID_LITROS:
            return "L";
        case UnitEnum.EN_GT_UNID_GALONES:
            return "gal";
        case UnitEnum.EN_GT_UNID_KILOS:
            return "kg";
        case UnitEnum.EN_GT_UNID_LIBRA:
            return "lb";
        case UnitEnum.EN_GT_UNID_M3H:
            return "m³/h";
        case UnitEnum.EN_GT_UNID_CFM:
            return "CFM";
        case UnitEnum.EN_GT_UNID_VATIO:
            return "W";
        case UnitEnum.EN_GT_UNID_PORCENTAJE:
            return "%";
        case UnitEnum.EN_GT_UNID_PASCALES:
            return "Pa";
        case UnitEnum.EN_GT_UNID_PPM:
            return "ppm";
        case UnitEnum.EN_GT_UNID_METRO:
            return "m";
        case UnitEnum.EN_GT_UNID_PULGADA:
            return '"';
        case UnitEnum.EN_GT_UNID_PIE:
            return "ft";
        default:
            return "";
    }
};


type DeviceDetailsRouteProp = RouteProp<RootStackParamList, "DeviceDetails">;

export default function AlarmList() {
    const route = useRoute<DeviceDetailsRouteProp>();

    const { device } = route.params;
    const { mac, farmName, siteName, alarmType } = device;

    const [alarms, setAlarms] = useState<ParamTC[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterAlarmState, setMasterAlarmState] = useState<boolean>(true);
    const [initialLoad, setInitialLoad] = useState(true);

    // 🌡️ ESTADOS PARA SENSORES
    const [sensorsData, setSensorsData] = useState<SensorData[]>([]);
    const [sensorsLoading, setSensorsLoading] = useState(false);

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
            setHeaderColor("#179002");
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
                // if (status === 1) {
                // fetchAlarms();
                // }
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

    // 🌡️ FUNCIÓN PARA OBTENER SENSORES
    const fetchSensors = async () => {
        try {
            setSensorsLoading(true);

            // IDs de sensores que quieres obtener
            const sensorIds = [8, 9, 10, 11];
            const idsParam = JSON.stringify(sensorIds);

            const response = await get(`alarmtc/sensors/?mac=${mac}&ids=${idsParam}`);

            if (response && Array.isArray(response)) {
                setSensorsData(response);
                console.log("📊 Sensores obtenidos:", response);
            } else {
                setSensorsData([]);
            }
        } catch (error) {
            console.error("❌ Error obteniendo sensores:", error);
            setSensorsData([]);
        } finally {
            setSensorsLoading(false);
        }
    };

    // 🎨 FUNCIÓN PARA OBTENER ICONO SEGÚN TIPO DE SENSOR
    const getSensorIcon = (type: number, unitNumber: number): keyof typeof Ionicons.glyphMap => {
        const unitString = getUnitString(unitNumber);

        switch (type) {
            case 0: // Temperatura
                return "thermometer-outline";
            case 1: // Humedad  
                return "water-outline";
            case 2: // Presión o PPM
                return unitString === "ppm" ? "analytics-outline" : "speedometer-outline";
            default:
                return "hardware-chip-outline";
        }
    };

    // 🎨 FUNCIÓN PARA OBTENER COLOR DEL SENSOR SEGÚN SU ESTADO
    const getSensorColor = (sensor: SensorData): string => {
        const { value, minAlarm, maxAlarm } = sensor;

        // Verificar si está en rango de alarma
        if (value <= minAlarm || value >= maxAlarm) {
            return "#FF6B6B"; // Rojo - Valor en alarma
        } else {
            return "#4CAF50"; // Verde - Valor normal
        }
    };

    // 🎨 COMPONENTE PARA MOSTRAR INFO DEL SENSOR
    const SensorInfo = ({ alarmId }: { alarmId: number }) => {
        const sensor = sensorsData.find(s => s.id === alarmId);
        if (!sensor) return null;

        const icon = getSensorIcon(sensor.type, sensor.unit);
        const unitString = getUnitString(sensor.unit);

        return (
            <View style={styles.sensorRow}>
                {/* Columna izquierda: Icono + valor */}
                <View style={styles.leftColumn}>
                    <Ionicons name={icon} size={24} color="#FFFFFF" style={styles.sensorIcon} />
                    <Text style={styles.sensorMainValue}>
                        {sensor.value} {unitString}
                    </Text>
                </View>

                {/* Columna derecha: Max arriba, Min abajo */}
                <View style={styles.rightColumn}>
                    <Text style={styles.sensorLimitLabel}>
                        {t("DeviceDetailsScreen.Max")}:
                        <Text style={styles.sensorLimitValue}> {sensor.maxAlarm} {unitString}</Text>
                    </Text>
                    <Text style={styles.sensorLimitLabel}>
                        {t("DeviceDetailsScreen.Min")}:
                        <Text style={styles.sensorLimitValue}> {sensor.minAlarm} {unitString}</Text>
                    </Text>
                </View>
            </View>
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

            // 🌡️ OBTENER ALARMAS Y SENSORES EN PARALELO
            const [alarmsData] = await Promise.all([
                get(`alarmtc/status?mac=${mac}`),
                fetchSensors() // Esta función ya maneja sus propios errores
            ]);

            if (!alarmsData || alarmsData.length === 0) {
                setIsConnected(false);
                setAlarms([]);
                setHeaderText("Sin conexión");
                setHeaderColor("#8a9bb9");
                return;
            }

            const masterAlarm = alarmsData.find((alarm: { idAlarm: number }) => alarm.idAlarm === 1000);
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

            const enabledAlarms = alarmsData
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

    const renderSectionHeader = ({ section }: { section: any }) => {
        if (section.hideHeader) return null;

        const isDisconnected = section.title.includes('No conectado');
        const bgColor = masterAlarmState
            ? styles.sectionHeaderArmed.backgroundColor
            : styles.sectionHeaderDisarmed.backgroundColor;

        return (
            <View style={[
                styles.sectionHeader,
                { backgroundColor: bgColor },
                // isDisconnected && styles.sectionHeaderDisconnected
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
        if (loading) return <Text style={styles.loadingText}>{t("DeviceDetailsScreen.loadingAlarms")}</Text>;
        if (!isConnected) return (
            <View style={styles.centeredContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color="#8a9bb9" />
                <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.noConnection")}</Text>
            </View>
        );
        if (tc5Disconnected) return (
            <View style={styles.centeredContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color="#8a9bb9" />
                <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.tc5Disconnected")}</Text>
            </View>
        );

        if (alarms.length === 0) return (
            <View style={styles.centeredContainer}>
                <Ionicons name="notifications-off-outline" size={48} color="#8a9bb9" />
                <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.noEnabledAlarms")}</Text>
            </View>
        );

        const { otherAlarms, rangeGroups } = separateAlarmsByIdRange(alarms);
        const rangeSections = createRangeSections(rangeGroups);

        const sections = [
            otherAlarms.length && { data: otherAlarms, hideHeader: true },
            ...rangeSections
        ].filter(Boolean) as Array<
            { data: ParamTC[]; hideHeader?: boolean } |
            { title: string; data: ParamTC[]; range: number }
        >;


        return (
            <SectionList
                sections={sections}
                keyExtractor={item => String(item.idAlarm)}
                renderItem={({ item }) => renderAlarmItem({ item })}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                extraData={alarms}
            />

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

        // Verificar si esta alarma tiene sensor asociado
        const hasSensor = sensorsData.some(s => s.id === item.idAlarm);

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
                    hasSensor ? styles.alarmContainerWithSensor : styles.alarmContainer,
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
                        <Text style={[styles.alarmText, { color: textColor }]}>
                            {item.texto}
                        </Text>
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
                </View>
                <SensorInfo alarmId={item.idAlarm} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[
            styles.container,
            // 🟡 FONDO AMARILLO/NARANJA cuando master desarmado
            !masterAlarmState && { backgroundColor: "#FFEB3B" }
        ]}>
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
    alarmContainerWithSensor: {
        flexDirection: "column",
        marginHorizontal: 16, // Mismo margen que alarmContainer
        marginVertical: 4,    // Mismo margen que alarmContainer
        marginTop: 2,         // Mismo margen que alarmContainer
        padding: 16,          // Mismo padding que alarmContainer
        borderRadius: 12,     // Mismo radio que alarmContainer
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
        minHeight: 40, // Altura mínima razonable
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
        justifyContent: "space-between",
        paddingVertical: 2,
    },
    iconAndText: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
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
    sectionHeaderArmed: {
        backgroundColor: '#FFFFFF',
    },
    sectionHeaderDisarmed: {
        backgroundColor: '#FFEB3B',
    },
    sectionTitleDisconnected: {
        color: '#d63031',
        fontWeight: '700',
    },
    sectionLineDisconnected: {
        backgroundColor: '#ff6b6b',
        height: 2,
    },
    // 🌡️ ESTILOS PARA SENSORES
    sensorContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.3)',
    },
    sensorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 0, // Sin padding extra
        paddingVertical: 4,
    },
    leftColumn: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sensorIcon: {
        marginRight: 8,
    },
    sensorMainValue: {
        color: '#FFFFFF',
        fontSize: 20, // Más grande para el valor principal
        fontWeight: 'bold',
    },
    rightColumn: {
        alignItems: 'flex-end',
    },
    sensorLimitLabel: {
        color: '#FFFFFF',
        fontSize: 14, // Más grande para mejor legibilidad
        opacity: 0.9,
    },
    sensorLimitValue: {
        color: '#FFFFFF',
        fontSize: 14, // Tamaño consistente con label
        fontWeight: '600',
    },
    alarmContent: {
        flex: 1,
    },
    // Estilos no usados que podrías eliminar
    sensorValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    sensorLimitsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        alignItems: 'flex-end',
    },
    sensorLimitRow: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginBottom: 2,
    },
});