import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
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
    ActivityIndicator,
    Dimensions,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { get, post } from "@/services/api";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/navigation";
import ButtonMaster from "./BottonMaster";
import { ParamTC, SensorData } from "@/infrastructure/intercafe/listapi.interface";
import Menu3Puntos from "@/components/Menu3Puntos";

import { notificationService } from '@/hooks/NotificationService';
import EstadoAlarmaCircle from "./EstadoAlarmaCircle";
import { t } from "@/i18n/i18nConfig";
import { Feather } from "@expo/vector-icons";
import { socketService } from "@/services/socketService";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { getUnitString, UnitEnum } from "@/utils/units";
import { SensorSymbol } from "@/utils/SensorSymbol";




//  INTERFAZ PARA SENSORES
// export interface SensorData {
//     id: number;
//     value: number;
//     minAlarm: number;
//     maxAlarm: number;
//     type: number;  //sensor type
//     eventType: number;
//     unit: number;
//     minValueToday: number;
//     maxValueToday: number;
//     minValueYesterday: number;
//     maxValueYesterday: number;
// }




type DeviceDetailsRouteProp = RouteProp<RootStackParamList, "DeviceDetails">;

export default function AlarmList() {
    const route = useRoute<DeviceDetailsRouteProp>();

    const { device } = route.params;
    const { mac, farmName, siteName, alarmType, swVersion } = device;

    const [alarms, setAlarms] = useState<ParamTC[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterAlarmState, setMasterAlarmState] = useState<boolean>(true);
    const [initialLoad, setInitialLoad] = useState(true);

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
    const [isLoading, setIsLoading] = useState(false);
    const [triggeredCount, setTriggeredCount] = useState(0);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [toggleWsReceived, setToggleWsReceived] = useState(true);

    const [, bump] = useState(0);
    const forceRerender = () => bump(v => v + 1);

    const MIN_VISIBLE_MS = 600;
    const lastId = useRef(0);
    //? Para evitar múltiples peticiones simultáneas
    const busyIds = useRef<Set<number>>(new Set());

    const { userId } = useAuthStore();
    // Forzar actualizacion
    const sw = parseInt(swVersion ?? '-1', 10);
    const needsUpdate = sw >= 0 && sw < 135;







    //! Alarmas analogicas y las filtro las que tengan valor
    const ANALOG_SENSOR_IDS = [
        8, 9, 10, 11,
        401, 402, 403, 404, 405, 406, 407, 408, // EXPA Alarmas
        501, 502, 503, 504, 505, 506, 507, 508
    ] as const;


    const analogIdsWithValue = useMemo(
        () =>
            sensorsData
                .filter(s => s.eventType === 1)  // mostrar solo sensores válidos
                .map(s => s.id),
        [sensorsData]
    );

    //--------------------------------------------------------------
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
            console.log(mac, "Evento en deviceScreen 1.1")
            setToggleWsReceived(!toggleWsReceived)

        };

        socketService.on('register_macs', handleMacEvent);
        return () => socketService.off('register_macs', handleMacEvent);
    }, [toggleWsReceived]); //TODO: quite la mac [mac,toggleWsReceived]

    //!-------------------------------------------------------------

    useEffect(() => {
        if (isDeviceDisconnected) {
            setAlarms([]);
            setMasterAlarmState(false);
            setIsConnected(false);
            updateHeaderStatus([], false);
        }
    }, [isDeviceDisconnected])




    const scrollOffset = useRef(0);

    // const handleScroll = (event: any) => {
    //     scrollOffset.current = event.nativeEvent.contentOffset.y;
    // };

    //!Contador de alarmas disparadas
    const updateHeaderStatus = (alarms: ParamTC[], masterState: boolean) => {
        const isTriggered = (a: ParamTC) => a.armado && a.raised;

        const nuevasDisparadas = alarms.filter(isTriggered).length;
        setTriggeredCount(nuevasDisparadas);

        if (!masterState) {
            setHeaderText(t('DeviceDetailsScreen.alarmsDisabled'));
            setHeaderColor('#4B5563');
            return;
        }

        if (nuevasDisparadas > 0) {
            setHeaderText(t('DeviceDetailsScreen.alarmTriggered')); // “Hay Alarma”
            setHeaderColor('#FF3B30');
        } else {
            setHeaderText(t('DeviceDetailsScreen.alarmsEnabled'));
            setHeaderColor('#179002');
        }
    };
    //!-------------------------------------------------------------

    //!Prueba para contar los eventos de petición
    const handleToggleMaster = async () => {
        if (isMasterDisabled) return;
        //const next = masterAlarmState ? 0 : 1;

        try {
            await runWithLoader(async () => {
                const next = masterAlarmState ? 0 : 1;

                await post(
                    `alarmtc/armMaster?mac=${mac}&status=${next}&userid=${userId}`,
                    {}
                );
                // await fetchAlarms(true);

            });
        } catch (e) {
            Alert.alert(
                t('DeviceDetailsScreen.errorTitle'),
                t('DeviceDetailsScreen.changeStatusError')
            );
        }
    };
    //!-------------------------------------------------------------
    // en AlarmList
    // const handleToggleMaster = async () => {
    //     if (isMasterDisabled) return;

    //     const next = masterAlarmState ? 0 : 1;
    //     setIsLoading(true);                // ⏳ empieza spinner

    //     try {
    //         await post(`alarmtc/armMaster?mac=${mac}&status=${next}`, {});

    //         // 💡 ESPERA a volver a leer las alarmas; eso actualiza masterAlarmState
    //         await fetchAlarms(/*isAutoRefresh=*/true);
    //     } catch (e) {
    //         Alert.alert(t('DeviceDetailsScreen.errorTitle'),
    //             t('DeviceDetailsScreen.changeStatusError'));
    //     } finally {
    //         /**
    //          *  Para evitar el “flash” muy rápido deja mínimo 400 ms de spinner
    //          *  (tiempo suficiente para que fetchAlarms devuelva y pintar de nuevo).
    //          */
    //         setTimeout(() => setIsLoading(false), 800);
    //     }
    // };


    const hasDisconnectedAlarmsInExpansion = (expansionAlarms: ParamTC[]): boolean => {
        return expansionAlarms.some(alarm =>
            alarm.hasOwnProperty('conectado') && alarm.conectado === false
        );
    };

    //! FUNCIÓN PARA OBTENER SENSORES
    const ANALOG_SET = new Set<number>(ANALOG_SENSOR_IDS);

    const fetchSensors = async () => {
        try {
            setSensorsLoading(true);

            /* ↓ pides TODOS los analógicos de golpe */
            const idsParam = JSON.stringify(ANALOG_SENSOR_IDS);
            const raw = await get(`alarmtc/sensors/?mac=${mac}&ids=${idsParam}`);
            // console.log('---------------------Sensores obtenidos:-----------', raw);
            /* ↓ te quedas solo con los válidos */
            const filtrados: SensorData[] = Array.isArray(raw)
                ? raw
                    .filter(
                        s =>
                            ANALOG_SET.has(s.id) &&                // id que te interesa
                            // s.eventType === 1 &&                   // está configurado
                            typeof s.value === 'number' &&
                            !Number.isNaN(s.value)
                    )
                    .map((s): SensorData => ({
                        ...s,
                        // aseguras que los optional queden a null y no a 0 si prefieres:

                        id: s.id,
                        value: s.value,

                        maxValueYesterday: s.maxValueYesterday,
                        minValueYesterday: s.minValueYesterday,
                        maxValueToday: s.maxValueToday,
                        minValueToday: s.minValueToday,
                        minAlarm: s.minAlarm,
                        maxAlarm: s.maxAlarm,
                        eventType: s.eventType,

                        type: s.type,
                        unit: s.unit,
                    }))
                : [];


            setSensorsData(filtrados);
        } catch (e) {
            console.error('❌ Error obteniendo sensores:', e);
            setSensorsData([]);
        } finally {
            setSensorsLoading(false);
        }
    };

    //!-------------------------------------------------------------


    //! FUNCIÓN PARA OBTENER ICONO SEGÚN TIPO DE SENSOR
    // const getSensorIcon = (
    //     type: number,
    //     unitNumber: number
    // ): keyof typeof Ionicons.glyphMap => {
    //     const unitString = getUnitString(unitNumber);

    //     /* 1️⃣  PPM → elegimos icono según el tipo de gas */
    //     if (unitString === 'ppm') {
    //         switch (type) {
    //             case 3:          // NH₃
    //                 return 'flask-outline';       // químico / laboratorio
    //             case 2:          // CO₂
    //                 return 'analytics-outline';   // gráfica / sensor ambiental
    //             default:         // otros gases en ppm
    //                 return 'speedometer-outline'; // genérico
    //         }
    //     }

    //     /* 2️⃣ Temperaturas °C / °F */
    //     if (unitString === '°C' || unitString === '°F') {
    //         return 'thermometer-outline';
    //     }

    //     /* 3️⃣  Resto de sensores */
    //     switch (type) {
    //         case 0: return 'thermometer-outline'; // temperatura
    //         case 1: return 'water-outline';       // humedad
    //         case 2: return 'speedometer-outline'; // presión
    //         default: return 'hardware-chip-outline';
    //     }
    // };



    // const getSensorIcon = (
    //     type: number,
    //     unit: number
    // ): keyof typeof Ionicons.glyphMap => {
    //     const unitString = getUnitString(unit);

    //     /* Temperaturas en °C / °F */
    //     if (unitString === '°C' || unitString === '°F') return 'thermometer-outline';

    //     /* Gases en ppm */
    //     if (unitString === 'ppm') {
    //         if (type === 3) return 'flask-outline';      // NH₃
    //         if (type === 2) return 'analytics-outline';  // CO₂
    //         return 'speedometer-outline';                // otros gases
    //     }

    //     /* Resto de sensores */
    //     switch (type) {
    //         case 0: return 'thermometer-outline'; // temperatura
    //         case 1: return 'water-outline';       // humedad
    //         case 2: return 'speedometer-outline'; // presión
    //         default: return 'hardware-chip-outline';
    //     }
    // };


    //!-------------------------------------------------------------

    //  FUNCIÓN PARA OBTENER COLOR DEL SENSOR SEGÚN SU ESTADO
    // const getSensorColor = (sensor: SensorData): string => {
    //     const { value, minAlarm, maxAlarm } = sensor;

    //     // Verificar si está en rango de alarma
    //     if (value <= minAlarm || value >= maxAlarm) {
    //         return "#FF6B6B"; // Rojo - Valor en alarma
    //     } else {
    //         return "#4CAF50"; // Verde - Valor normal
    //     }
    // };



    //! COMPONENTE PARA MOSTRAR INFO DEL SENSOR
    /* ─────  COMPONENTE SensorInfo  ───── */
    const SensorInfo = ({ alarmId, reason }: { alarmId: number, reason: number; }) => {

        const s = sensorsData.find(x => x.id === alarmId);

        if (!s) return null;

        const isPpm = s.unit === UnitEnum.EN_GT_UNID_PPM;
        //const COL_W = COMPACT ? 60 : 80;   // ⬅︎ juega con estos números

        const u = getUnitString(s.unit);
        const renderMainValue = () => {
            if (reason === 3) {
                return <Text style={styles.errorText}>{t('DeviceDetailsScreen.errorTitle')}</Text>;
            }
            return (
                <Text style={styles.valueText}>
                    {(s.value ?? 0)} {u}
                </Text>
            );
        };
        const isTemp = s.unit === UnitEnum.EN_GT_UNID_GRADO_CENTIGRADO || s.unit === UnitEnum.EN_GT_UNID_GRADO_Fahrenheit;
        const isHum = s.unit === UnitEnum.EN_GT_UNID_PORCENTAJE;
        const showUnitInTable = isTemp || isHum;
        const isPas = s.unit === UnitEnum.EN_GT_UNID_PASCALES; // Pa
        const oneSided = isPpm || isPas;


        const renderValue = (n?: number | null) => {
            if (n === 99999 || n === -99999) return <Text style={styles.dataCell}>—</Text>;
            const formatted = isTemp
                ? (n ?? 0).toFixed(1)          // 26.3 °C
                : Math.round(n ?? 0).toString(); // 3250 ppm
            return (
                <Text
                    style={styles.dataCell}
                    numberOfLines={1}            //  ⬅︎ no deja que baje a 2 líneas
                    adjustsFontSizeToFit         //  ⬅︎ reduce la fuente si hace falta
                    minimumFontScale={0.75}      //  ⬅︎ hasta un 75 % de su tamaño
                >
                    {formatted}
                    {showUnitInTable && <Text style={styles.unit}>{u}</Text>}
                </Text>
            );
        };

        return (
            <View style={styles.sensorRowWrapper}>
                {/* ─── fila principal (icono + valor + tabla) ─── */}
                <View style={styles.topRow}>
                    {/* valor actual */}
                    {/*  ───── valor actual + rango ───── */}
                    <View style={styles.valueBox}>
                        {/* icono */}
                        {/* <Ionicons
                            name={getSensorIcon(s.type, s.unit)}
                            size={20}
                            color="#fff"
                            style={{ marginRight: 8 }}
                        /> */}

                        <SensorSymbol type={s.type} unit={s.unit} />


                        {/* contenedor vertical (valor  +  rango) */}
                        <View style={styles.valueCol}>
                            {renderMainValue()}

                            {oneSided ? (
                                /* solo máx para ppm */
                                s.maxAlarm != null && s.maxAlarm !== 99999 && (
                                    <Text style={styles.alarmRangeText}>
                                        Max: {s.maxAlarm} {u}
                                    </Text>
                                )
                            ) : (
                                /* min – max para el resto */
                                s.minAlarm != null &&
                                s.maxAlarm != null &&
                                s.minAlarm !== -99999 &&
                                s.maxAlarm !== 99999 && (
                                    <Text style={styles.alarmRangeText}>
                                        {s.minAlarm} – {s.maxAlarm} {u}
                                    </Text>
                                )
                            )}
                        </View>
                    </View>
                    {/* tabla máx / min */}
                    <View style={styles.table}>
                        <View style={styles.headerRow}>
                            <Text style={styles.cornerCell} />
                            <View style={styles.headerUnderline}>
                                <Text style={styles.headerCell}>{t('DeviceDetailsScreen.Ayer')}</Text>
                                <Text style={styles.headerCell}>{t('DeviceDetailsScreen.Hoy')}</Text>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowTitle}>{t('DeviceDetailsScreen.Max')}</Text>
                            <View style={styles.dataCol}>{renderValue(s.maxValueYesterday)}</View>
                            <View style={styles.dataCol}>{renderValue(s.maxValueToday)}</View>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.rowTitle}>{t('DeviceDetailsScreen.Min')}</Text>
                            <View style={styles.dataCol}>{renderValue(s.minValueYesterday)}</View>
                            <View style={styles.dataCol}>{renderValue(s.minValueToday)}</View>
                        </View>

                    </View>
                </View>


            </View>
        );
    };



    //!-------------------------------------------------------------


    // !FUNCIÓN PARA OBTENER ALARMAS
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

            // !OBTENER ALARMAS Y SENSORES EN PARALELO
            const [alarmsData] = await Promise.all([
                get(`alarmtc/status?mac=${mac}`),
                fetchSensors() // Esta función ya maneja sus propios errores
            ]);
            //   console.log("--------------", alarmsData, "------------")

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
                    alarm.habilitado && ![1000].includes(alarm.idAlarm)
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
    //!-------------------------------------------------------------

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

        return hasDisconnected
            ? `${baseTitle} - ${t('DeviceDetailsScreen.No_conectado')}`
            : baseTitle;
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
    //! Renderiza cada alarma 
    const renderContent = () => {
        if (needsUpdate) {
            return (
                <View style={styles.centeredContainer}>
                    <MaterialCommunityIcons
                        name="update"
                        size={72}
                        color="#8a9bb9"
                        style={{ marginBottom: 16 }}
                    />
                    <Text style={styles.updateTitle}>
                        {t('DeviceDetailsScreen.needUpdateTitle')}
                    </Text>
                    <Text style={styles.updateSubtitle}>
                        {t('DeviceDetailsScreen.needUpdateSubtitle')}
                    </Text>
                </View>
            );
        }
        if (loading) return <Text style={styles.loadingText}>{t("DeviceDetailsScreen.loadingAlarms")}</Text>;
        if (!isConnected) return (
            <View style={styles.centeredContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color="#4B5563" />
                <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.connection.noConnection")}</Text>
            </View>
        );
        if (tc5Disconnected) return (
            <View style={styles.centeredContainer}>
                <Ionicons name="cloud-offline-outline" size={48} color="#4B5563" />
                <Text style={styles.noAlarmsText}>{t("DeviceDetailsScreen.tc5Disconnected")}</Text>
            </View>
        );

        if (alarms.length === 0) return (
            <View style={styles.centeredContainer}>
                <Ionicons name="notifications-off-outline" size={48} color="#4B5563" />
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

    //!-------------------------------------------------------------

    //! Pedir alarmas cada 15 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAlarms(true);
        }, 15000);

        return () => clearInterval(interval);
    }, [mac]);

    useEffect(() => {
        fetchAlarms(false);
    }, []);
    //!-------------------------------------------------------------

    const hideTimer = useRef<NodeJS.Timeout>();
    function keepSpinnerVisible() {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
            setPendingRequests(0);
        }, MIN_VISIBLE_MS);
    }

    function runWithLoader<T>(fn: () => Promise<T>): Promise<T> {
        const myId = ++lastId.current;
        setPendingRequests(1);

        const started = Date.now();
        return fn().finally(() => {
            const elapsed = Date.now() - started;
            const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
            setTimeout(() => {
                if (myId === lastId.current) {
                    keepSpinnerVisible();
                }
            }, wait);
        });
    }



    //! FUNCIÓN MEJORADA: Sin optimistic update, leer estado real primero
    const handleAlarmToggle = async (alarm: ParamTC) => {
        const id = alarm.idAlarm;
        const nextStatus = alarm.armado ? 0 : 1;

        if (busyIds.current.has(id)) return;
        busyIds.current.add(id);
        forceRerender();                 // muestra opacity/spinner en la fila

        try {
            await runWithLoader(async () => {
                // 1️⃣ POST al backend
                // console.log(mac)
                await post(
                    `alarmtc/arm?mac=${mac}&alarm=${id}&status=${nextStatus}&userid=${userId}`,
                    {}
                );
                //console.log("-----------------envia esto", "mac", mac, "idalarm", id, "estado", nextStatus, "user", userId, "-----------------")

                // 2️⃣ esperamos la lista confirmada
                // await fetchAlarms(true);     // <— sin setAlarms local
            });
        } catch (e) {
            Alert.alert(
                t('DeviceDetailsScreen.errorTitle'),
                t('DeviceDetailsScreen.errorChangeAlarmState')
            );
        } finally {
            busyIds.current.delete(id);
            forceRerender();               // quita el efecto “busy” de la fila
        }
    };

    //!-------------------------------------------------------------



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

    // const getIconNameForAlarm = (texto: string): keyof typeof Ionicons.glyphMap => {
    //     const lowerText = texto.toLowerCase();
    //     if (lowerText.includes("electrico")) return "flash-outline";
    //     if (lowerText.includes("temperatura")) return "thermometer-outline";
    //     if (lowerText.includes("humedad")) return "water-outline";
    //     return "alert-circle-outline";
    // };

    const isAlarmDisconnected = (alarm: ParamTC): boolean => {
        return alarm.hasOwnProperty('conectado') && alarm.conectado === false;
    };



    //  LÓGICA DE COLORES BASADA EN ESTADO REAL (raised)
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
                <SensorInfo alarmId={item.idAlarm}
                    reason={item.reason}      //  ← NUEVO


                />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[
            styles.container,
            // 🟡 FONDO AMARILLO/NARANJA cuando master desarmado
            !masterAlarmState && { backgroundColor: "#0269fa" } // "#FFEB3B" #faf202 FFF7A1 #028bfa #0269fa
        ]}>
            <View style={[styles.customHeader, { backgroundColor: headerColor }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerSubtitle}>{farmName} - {siteName}</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                        {/* texto + contador + campana */}
                        <Text style={styles.headerMainTitle}>
                            {headerText}
                            {triggeredCount > 0 && ` (${triggeredCount})`}
                        </Text>

                        {triggeredCount > 0 && (
                            <MaterialCommunityIcons
                                name="bell-ring"
                                size={18}
                                color="#fff"
                                style={{ marginLeft: 6, transform: [{ translateY: 1 }] }}
                            />
                        )}

                        {pendingRequests > 0 && (
                            <ActivityIndicator
                                size="small"
                                color="#fff"
                                style={{
                                    position: 'absolute',
                                    right: -28,
                                    top: '50%',
                                    marginTop: -8,
                                }}
                            />
                        )}
                    </View>

                </View>


                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => setMenuVisible(true)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                    <Feather name="more-vertical" size={24} color="#fff" />
                </TouchableOpacity>

            </View>

            {renderContent()}

            <ButtonMaster
                //mac={mac}
                //fetchAlarms={fetchAlarms}
                masterAlarmState={masterAlarmState}
                onToggleMaster={handleToggleMaster}
                disabled={isMasterDisabled || needsUpdate}
                isLoading={isLoading}
                swVersion={String(swVersion)} // o simplemente swVersion si ya es string
                passwordCorrection={true}

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
                    simulado: isSimulated,
                }}
                analogIds={analogIdsWithValue}

            />
        </View>
    );
}

const { width: SCREEN_W } = Dimensions.get('window');
const COMPACT = SCREEN_W < 360;

// 👉 AÑADE AQUÍ:
const COL_W = COMPACT ? 60 : 80;   // ancho de cada columna Ayer/Hoy


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
        marginHorizontal: COMPACT ? 8 : 16,
        padding: COMPACT ? 12 : 16,
        flexDirection: "column",
        // marginHorizontal: 16, // Mismo margen que alarmContainer
        marginVertical: 4,    // Mismo margen que alarmContainer
        marginTop: 2,         // Mismo margen que alarmContainer
        //padding: 16,          // Mismo padding que alarmContainer
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
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        backgroundColor: 'transparent',
        marginRight: 6,
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
        backgroundColor: "#0269fa", // "#FFEB3B"
    },
    sectionTitleDisconnected: {
        color: '#d63031',
        fontWeight: '700',
    },
    sectionLineDisconnected: {
        backgroundColor: '#ff6b6b',
        height: 2,
    },
    // ESTILOS PARA SENSORES

    alarmContent: {
        flex: 1,
    },
    row: {
        flexDirection: 'row'
    },
    cornerCell: {
        width: 46
    },
    headerCell: {
        flex: 1,
        //minWidth: COL_W,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
    rowTitle: {
        width: 46,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    dataCell: {
        //  minWidth: 46,
        textAlign: 'center',
        fontSize: COMPACT ? 12 : 14,   // número algo menor en pantallas estrechas
        color: '#FFFFFF',
        flexShrink: 1,
    },
    sensorRowWrapper: {
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        marginTop: 4,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    /* valor actual */

    table: {
        flex: 1,
        alignSelf: 'flex-start',
        borderWidth: 0,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 0,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    headerUnderline: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1.2,
        borderBottomColor: '#FFFFFF',
        paddingBottom: 2,
    },

    valueBox: {
        maxWidth: '52%',
        flexShrink: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginRight: 8,
    },
    valueCol: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        //justifyContent: 'center',
        // minHeight: 0,
        marginTop: -8


    },
    valueTextContainer: {
        fontSize: COMPACT ? 22 : 26,
        fontWeight: 'bold',
        color: '#fff',
    },

    valueText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'left',
    },
    iconInValue: {
        marginRight: 8,
        marginTop: 1,
    },

    alarmRangeText: {
        fontSize: 14,
        color: '#fff',
        marginTop: 2,               // espacio bajo el valor
        textAlign: 'left',

    },
    valueRow: {
        flexDirection: 'row',         // icono y valor en la misma línea
        alignItems: 'center',         // alineados en vertical
    },
    errorText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'left',
        lineHeight: 32,              // ↔ misma caja que el número

    },
    updateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 4,
    },
    updateSubtitle: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    dataCol: {
        flex: 1,
        //minWidth: COL_W,          // la misma anchura
        alignItems: 'center',
        //marginRight: 4,           // pequeño separador a la derecha
    },
    unit: {
        fontSize: COMPACT ? 10 : 12,   // unidad bastante más pequeña
        marginLeft: 2,
    },
});