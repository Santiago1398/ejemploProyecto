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
import { useRoute, RouteProp, useNavigation, useFocusEffect } from "@react-navigation/native";
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
//import { useMacSocketListener } from "@/hooks/useSocketListener";
import { LinearGradient } from 'expo-linear-gradient';
import { useTopLinkedTc5Alarm } from "@/hooks/useTopLinkedTc5Alarm";








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
    const confirmandoId = useRef<number | null>(null);
    const criticalAlertShownRef = useRef(false);
    const postingCriticalRef = useRef(false);
    const [criticalVisible, setCriticalVisible] = useState(false);
    const token = useAuthStore((s) => s.token);

    const [stopVisible, setStopVisible] = useState(false);
    const [stopping, setStopping] = useState(false);

    const openStopModal = () => setStopVisible(true);
    const [pendingStopOpen, setPendingStopOpen] = useState(false);

const requestStopSharing = () => {
  // 1) marcamos que queremos abrir el modal
  setPendingStopOpen(true);
  // 2) cerramos el menú
  setMenuVisible(false);
};

useEffect(() => {
  // Solo cuando el menú ya NO está visible y teníamos la acción pendiente
  if (!menuVisible && pendingStopOpen) {
    const delay = Platform.OS === "ios" ? 450 : 0; // iOS necesita esperar la animación del Modal
    const id = setTimeout(() => {
      setStopVisible(true);
      setPendingStopOpen(false);
    }, delay);

    return () => clearTimeout(id);
  }
}, [menuVisible, pendingStopOpen]);




    //!--------CARD DE LAS ALARAS------------
    //  DEMO (por ahora simulada)
    // const SHOW_TOP_ALARM_DEMO = true;

    // //  Alarmas activas reales (si luego quieres quitar demo)
    // const triggeredAlarms = useMemo(() => {
    //     return alarms.filter(a => a.armado && a.raised);
    // }, [alarms]);

    // //  top alarm a mostrar (solo 1)
    // const demoTopAlarm = useMemo(() => {
    //     return {
    //         idAlarm: 1,
    //         texto: "Temperatura alta",
    //         armado: true,
    //         raised: true,
    //     } as any; // <- para no pelearte con el tipo ParamTC ahora
    // }, []);

    // const topAlarm = SHOW_TOP_ALARM_DEMO ? demoTopAlarm : triggeredAlarms[0];
    // const totalTriggered = SHOW_TOP_ALARM_DEMO ? 3 : triggeredAlarms.length;

    // //  Mostrar card solo si hay alarma (demo o real)
    // const showTopAlarmCard = SHOW_TOP_ALARM_DEMO ? true : totalTriggered > 0;

    // // Para fecha/hora (simple)
    // const now = useMemo(() => new Date(), [totalTriggered]);

    // const handleGoToExplotacion = () => {
    //     if (!token) {
    //         console.log("❌ No hay token disponible");
    //         return;
    //     }

    //     navigation.navigate("Explotacion", {
    //         mac: device.mac,
    //         token,
    //         idioma: "es",
    //         siteName: device.siteName,
    //         farmName: device.farmName,
    //         idSite: device.idSite,
    //         buildingPortalRef: device.buildingPortalRef,
    //         simulado: isSimulated,
    //     });
    // };

    const {
        topAlarmCard,
        totalLinkedAlarms,
        loadingTopAlarm,
        refetchTopAlarm,
    } = useTopLinkedTc5Alarm(mac, t);

    const showTopAlarmCard = !!topAlarmCard;

    const handleGoToExplotacion = () => {
        if (!token) {
            console.log("❌ No hay token disponible");
            return;
        }

        navigation.navigate("Explotacion", {
            mac: device.mac,
            token,
            idioma: "es",
            siteName: device.siteName,
            farmName: device.farmName,
            idSite: device.idSite,
            buildingPortalRef: device.buildingPortalRef,
            simulado: isSimulated,
        });

    };
    const irAlPortal = handleGoToExplotacion;

    const irAListaAlarmasPortal = () => {
        navigation.navigate("AlarmasActivasScreen", {
            device,
            analogIds: analogIdsWithValue,
        });
    };


    //!-----------Fin CARD ALARMAS-----------


    const confirmandoMaster = useRef(false);
    const parseBool = (v: any) =>
        v === true || v === "true" || v === 1 || v === "1";


    //  Confirm Modal (reemplaza Alert.alert para confirmaciones)
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmMensaje, setConfirmMensaje] = useState("");
    const resolverConfirmacion = useRef<((v: boolean) => void) | null>(null);

    const cerrarConfirmacion = (respuesta: boolean) => {
        setConfirmVisible(false);
        // esperamos un tick para que cierre suave (opcional)
        const resolver = resolverConfirmacion.current;
        resolverConfirmacion.current = null;
        resolver?.(respuesta);
    };




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

    //  Paleta para las tarjetas
    const PALETTE = {
        green1: '#63C723', green2: '#34d399', // OK (armada y sin alarma)
        red1: '#FF0000', red2: '#c81e1e', // dc2626
        // gray1: '#8a9bb9', gray2: '#6f83a5', // desarmada / “gris” de tu UI
        gray1: '#9AA6BF',  // más claro que el tuyo
        gray2: '#364152',  // más oscuro que el tuyo
    } as const;

    type GradientTuple = readonly [string, string];

    const getCardGradient = (alarm: ParamTC): GradientTuple => {
        // DESARMADA → gris
        if (!alarm.armado) return [PALETTE.gray1, PALETTE.gray2] as const;
        // ARMADA + RAISED → rojo
        if (alarm.raised) return [PALETTE.red1, PALETTE.red2] as const;
        // ARMADA + sin alarma → verde
        return [PALETTE.green1, PALETTE.green2] as const;
    };

    //  Paleta para las header

    const PALETTEHEADER = {
        green1: '#22C55E', // green-500
        green2: '#166534', // green-800
        red1: '#FF0000', red2: '#c81e1e', // dc2626
        // gray1: '#8a9bb9', gray2: '#6f83a5', // desarmada / “gris” de tu UI
        gray1: '#9AA6BF',  // más claro que el tuyo
        gray2: '#364152',  // más oscuro que el tuyo
    } as const;
    type HeaderStops = readonly [string, string];

    const getHeaderGradient = (): HeaderStops => {
        // Desconectado (o TC5 desconectado) → gris
        if (!isConnected || tc5Disconnected) return [PALETTEHEADER.gray1, PALETTEHEADER.gray2] as const;

        // Master desarmado → gris
        if (!masterAlarmState) return [PALETTEHEADER.gray1, PALETTEHEADER.gray2] as const;

        // Hay alarmas activas → rojo
        if (triggeredCount > 0) return [PALETTEHEADER.red1, PALETTEHEADER.red2] as const;

        // Todo OK → verde
        return [PALETTEHEADER.green1, PALETTEHEADER.green2] as const;
    };

    const confirmarCambioAlarma = (mensaje: string) => {
        return new Promise<boolean>((resolve) => {
            resolverConfirmacion.current = resolve;
            setConfirmMensaje(mensaje);
            setConfirmVisible(true);
        });
    };





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

    //!--------------------------------------------------------------

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


    // useMacSocketListener(
    //     'register_macs',
    //     mac, // La MAC específica del dispositivo
    //     () => {
    //         fetchAlarms(true);
    //         console.log(mac, "-------ºEvento en deviceScreen ---------------LLega el Evento");
    //     }
    // );

    //!-------------------------------------------------------------

    const debugDisconnectOnceRef = useRef(false);

    useEffect(() => {
        if (!isDeviceDisconnected) {
            debugDisconnectOnceRef.current = false; // si vuelve a conectarse, permites debug de nuevo
            return;
        }

        // ✅ tu lógica actual
        setAlarms([]);
        setMasterAlarmState(false);
        setIsConnected(false);
        setHeaderText(t("deviceList.error.noConnection"));
        setHeaderColor("#8a9bb9");
        updateHeaderStatus([], false);
        void checkCriticalAlarmDemo(false, true);

        // ✅ DEBUG: ver qué devuelve el endpoint SIN cambiar la UI
        if (__DEV__ && !debugDisconnectOnceRef.current) {
            debugDisconnectOnceRef.current = true;

            (async () => {
                try {
                    console.log("🧪 [DEBUG] isDeviceDisconnected=true, probando alarmtc/status...", { mac, alarmType });
                    const raw = await get(`alarmtc/status?mac=${mac}`);

                    console.log("🧪 [DEBUG] alarmtc/status raw:", raw);
                    console.log("🧪 [DEBUG] length:", Array.isArray(raw) ? raw.length : "no-array");

                    // si quieres ver solo master y 2-3 primeras:
                    if (Array.isArray(raw)) {
                        const master = raw.find((a: any) => a?.idAlarm === 1000);
                        console.log("🧪 [DEBUG] master(1000):", master);
                        console.log("🧪 [DEBUG] sample(0..2):", raw.slice(0, 3));
                    }
                } catch (e) {
                    console.log("❌ [DEBUG] alarmtc/status falló:", e);
                }
            })();
        }
    }, [isDeviceDisconnected, mac, alarmType]);




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

    const handleToggleMaster = async () => {
        if (isMasterDisabled) return;
        if (confirmandoMaster.current) return;

        const vaADeshabilitar = masterAlarmState; // si está armado -> vas a desarmar
        const mensaje = masterAlarmState
            ? t('DeviceDetailsScreen.confirmDisableAll')
            : t('DeviceDetailsScreen.confirmEnableAll');


        confirmandoMaster.current = true;
        const confirmar = await confirmarCambioAlarma(mensaje);
        confirmandoMaster.current = false;

        if (!confirmar) return;

        try {
            await runWithLoader(async () => {
                const next = vaADeshabilitar ? 0 : 1;

                await post(
                    `alarmtc/armMaster?mac=${mac}&status=${next}&userid=${userId}`,
                    {}
                );

                // (Opcional) para actualizar al instante en vez de esperar al intervalo:
                await fetchAlarms(true);
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
            console.log('---------------------Sensores obtenidos:-----------', raw);
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

            console.log("🟩 SENSORS FILTRADOS:", filtrados);

            setSensorsData(filtrados);
        } catch (e) {
            console.error('❌ Error obteniendo sensores:', e);
            setSensorsData([]);
        } finally {
            setSensorsLoading(false);
        }
    };

    //!-------------------------------------------------------------

    //!--------------------DEMO Alert Notificacion------------------
    const checkCriticalAlarmDemo = async (masterConnected: boolean, alarmsEmpty: boolean) => {
        // ✅ Solo nos interesa comprobar si:
        // - el master NO está conectado, o
        // - NO hay alarmas en el listado (array vacío)
        const shouldCheck = !masterConnected || alarmsEmpty;
        if (!shouldCheck) return;

        // Evita repetir modal o lanzar mientras está posteando
        if (criticalAlertShownRef.current || postingCriticalRef.current) return;

        try {
            const res = await get(`alarmtc/criticalalarmdemo`);
            console.log("estado varibale get--------------", res)

            const status =
                parseBool(res) ||
                parseBool(res?.data) ||
                parseBool(res?.status) ||
                parseBool(res?.data?.status);

            if (!status) return;

            criticalAlertShownRef.current = true;
            setCriticalVisible(true);
        } catch (e) {
            console.log("❌ Error en GET criticalalarmdemo:", e);
        }
    };



    // useFocusEffect(
    //     React.useCallback(() => {
    //         // reset opcional si quieres que se muestre cada vez que entras:
    //         // criticalAlertShownRef.current = false;

    //         checkCriticalAlarmDemo();
    //     }, [])
    // );



    //!--------------------FIN DEMO ALERT NOTIFICACION--------------


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
            if (!isAutoRefresh) setLoading(true);

            if (isDeviceDisconnected) {
                setAlarms([]);
                updateHeaderStatus([], false);
                setMasterAlarmState(false);
                setIsConnected(false);

                // setHeaderText("Sin conexión");
                setHeaderText(t("deviceList.error.noConnection"));

                setHeaderColor("#8a9bb9");

                // para que también salte el demo aquí
                void checkCriticalAlarmDemo(false, true);

                return;
            }


            const scrollY = scrollOffset.current;

            console.log("Peticon alarmas");

            //  alarmas + sensores en paralelo
            const [alarmsData] = await Promise.all([
                get(`alarmtc/status?mac=${mac}`),
                fetchSensors(), // ya maneja errores internamente
                refetchTopAlarm(),
            ]);

            console.log(
                "alarmtc/status response:Debugg-----------------------------------------------------",
                JSON.stringify(alarmsData)
            );

            //  si no hay respuesta válida => sin conexión
            if (!alarmsData || alarmsData.length === 0) {
                setIsConnected(false);
                setAlarms([]);
                // setHeaderText("Sin conexión");
                setHeaderText(t("deviceList.error.noConnection"));

                setHeaderColor("#8a9bb9");
                void checkCriticalAlarmDemo(false, true);
                return;
            }

            //  IMPORTANTE: declarar connected fuera para usarlo luego
            let connected = true;

            const masterAlarm = alarmsData.find(
                (alarm: { idAlarm: number }) => alarm.idAlarm === 1000
            );

            if (!masterAlarm) {
                setIsConnected(false);
                setAlarms([]);
                // setHeaderText("Sin conexión");
                setHeaderText(t("deviceList.error.noConnection"));

                setHeaderColor("#8a9bb9");
                void checkCriticalAlarmDemo(false, true);
                return;
            }

            setMasterAlarmState(masterAlarm.armado);
            setIsSimulated(masterAlarm.simulado || false);

            connected =
                masterAlarm.conectado !== undefined ? masterAlarm.conectado : true;

            setIsConnected(connected);

            //  si está desconectado, no seguimos
            if (!connected) {
                setAlarms([]);
                // setHeaderText("Sin conexión");
                setHeaderText(t("deviceList.error.noConnection"));

                setHeaderColor("#8a9bb9");
                void checkCriticalAlarmDemo(false, true);
                return;
            }

            //  alarmas habilitadas (excluyendo master 1000)
            const enabledAlarms: ParamTC[] = alarmsData
                .filter(
                    (alarm: { habilitado: boolean; idAlarm: number }) =>
                        alarm.habilitado && ![1000].includes(alarm.idAlarm)
                )
                .map((alarm: ParamTC) => ({
                    ...alarm,
                    activada: false,
                }));

            //  tu nueva condición: si NO hay alarmas (array vacío) y el endpoint devuelve true => mostrar modal
            void checkCriticalAlarmDemo(connected, enabledAlarms.length === 0);

            setAlarms(enabledAlarms);
            updateHeaderStatus(enabledAlarms, masterAlarm.armado ?? false);

            setTimeout(() => {
                scrollRef.current?.scrollTo({ y: scrollY, animated: false });
            }, 50);
        } catch (error) {
            setIsConnected(false);
            setAlarms([]);
            // setHeaderText("Sin conexión");
            setHeaderText(t("deviceList.error.noConnection"));

            setHeaderColor("#8a9bb9");
            void checkCriticalAlarmDemo(false, true);

            Alert.alert(
                t("DeviceDetailsScreen.errorTitle"),
                t("DeviceDetailsScreen.errorLoadingAlarms")
            );
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
        }, 7000);

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
        const vaADeshabilitar = alarm.armado;

        const nextStatus = vaADeshabilitar ? 0 : 1;  // 0=desarmar, 1=armar

        // evita doble tap y evita múltiples alerts
        if (busyIds.current.has(id) || confirmandoId.current === id) return;

        confirmandoId.current = id;

        const textoAccion = vaADeshabilitar
            ? t("DeviceDetailsScreen.disable")
            : t("DeviceDetailsScreen.enable");

        // const mensaje = `¿Desea ${textoAccion} la alarma "${alarm.texto}"?`;
        const mensaje = t("DeviceDetailsScreen.confirmQuestion", {
            accion: textoAccion,
            alarma: alarm.texto,
        });


        const confirmar = await confirmarCambioAlarma(mensaje);
        confirmandoId.current = null;

        if (!confirmar) return;


        busyIds.current.add(id);
        forceRerender();

        try {
            await runWithLoader(async () => {
                await post(
                    `alarmtc/arm?mac=${mac}&alarm=${id}&status=${nextStatus}&userid=${userId}`,
                    {}
                );
            });
        } catch (e) {
            Alert.alert(
                t('DeviceDetailsScreen.errorTitle'),
                t('DeviceDetailsScreen.errorChangeAlarmState')
            );
        } finally {
            busyIds.current.delete(id);
            forceRerender();
        }
    };

    // const confirmAlarmToggle = (alarm: ParamTC) => {
    //     const accion = alarm.armado
    //         ? t('DeviceDetailsScreen.deshabilitar')   // "deshabilitar"
    //         : t('DeviceDetailsScreen.habilitar');    // "habilitar"

    //     Alert.alert(
    //         '', // 👈 sin título
    //         `¿Desea ${accion} la alarma "${alarm.texto}"?`,
    //         [
    //             { text: t('common.cancel'), style: 'cancel' },
    //             { text: t('common.ok'), onPress: () => handleAlarmToggle(alarm) },
    //         ],
    //         { cancelable: true }
    //     );
    // };

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
        const isDisconnected = isAlarmDisconnected(item);
        const hasSensor = sensorsData.some(s => s.id === item.idAlarm);
        const colors = getCardGradient(item);

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleAlarmToggle(item)}
                disabled={isProcessing}
            >
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}          // ← “to-r”
                    style={[
                        hasSensor ? styles.alarmContainerWithSensor : styles.alarmContainer,
                        isProcessing && { opacity: 0.7 },
                    ]}
                >
                    <View style={styles.alarmRow}>
                        <EstadoAlarmaCircle
                            armado={item.armado}
                            disparado={item.disparado}
                            raised={item.raised}
                        />

                        <View style={styles.iconAndText}>
                            <Text style={[styles.alarmText, { color: '#F4F5F7' }]}>
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

                    {/* Info del sensor (si aplica) */}
                    <SensorInfo alarmId={item.idAlarm} reason={item.reason} />
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    //!--------CARD DE LAS ALARAS------------
    const TopAlarmCard = ({
        title,
        locationText,
        detailText,
        chipText,
        dateText,
        timeText,
        count,
        onPressAll,
        onPressCard,
    }: {
        title: string;
        locationText?: string;
        detailText: string;
        chipText: string;
        dateText: string;
        timeText: string;
        count: number;
        onPressAll: () => void;
        onPressCard: () => void;
    }) => {
        const hayMasDeUna = (count ?? 0) > 1;

        const onPressCardFinal = hayMasDeUna ? onPressAll : onPressCard;

        return (
            <View style={styles.topAlarmWrap}>
                <Pressable
                    onPress={onPressCardFinal}
                    android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    style={({ pressed }) => [styles.topAlarmCard, pressed && { opacity: 0.92 }]}
                >
                    {/*  Título dentro de la card */}
                    <View style={styles.portalTitleInsideWrap}>
                        <Text style={styles.portalTitleInsideText}>Alarma Portal</Text>
                        {/* <View style={styles.portalTitleInsideDivider} /> */}
                    </View>

                    {/*  Barra roja más abajo */}
                    <LinearGradient
                        colors={["#dc2626", "#ef4444"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.topAlarmBarInside}
                    >
                        <View style={styles.topAlarmBarLeft}>
                            <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
                            <Text style={styles.topAlarmBarTitle}>{title}</Text>
                        </View>
                        <View style={styles.topAlarmBarMac}>
                            <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
                            <Text style={styles.topAlarmBarMacText} numberOfLines={1}>{chipText}</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.topAlarmBody}>
                        {/* fila 1: ubicación + fecha/hora */}
                        <View style={styles.topAlarmBodyRow}>
                            {!!locationText && (
                                <Text style={styles.topAlarmLocation} numberOfLines={1}>
                                    {locationText}
                                </Text>
                            )}

                            <View style={styles.topAlarmDateTimeRow}>
                                <Text style={styles.topAlarmDateTime}>{dateText}</Text>
                                <Text style={styles.topAlarmDateTime}> • </Text>
                                <Text style={styles.topAlarmDateTime}>{timeText}</Text>
                            </View>
                        </View>

                        {/* fila 2: alarmText (detalle) */}
                        <Text style={styles.topAlarmStatus} numberOfLines={1}>
                            {detailText}
                        </Text>
                    </View>
                    {/* <View style={styles.topAlarmChipRow}>
                        <View style={styles.topAlarmChip}>
                            <Ionicons name="hardware-chip-outline" size={14} color="#111827" />
                            <Text style={styles.topAlarmChipText}>{chipText}</Text>
                        </View>
                    </View> */}

                    <View style={styles.topAlarmDivider} />

                    {/* ✅ Link plano (sin caja) */}
                    {hayMasDeUna && (
                        <Pressable
                            onPress={onPressAll} // (puede ser el mismo que la card, no pasa nada)
                            hitSlop={10}
                            style={({ pressed }) => [styles.topAlarmLinkPlainRow, pressed && { opacity: 0.65 }]}
                        >
                            <View style={styles.plusCircle}>
                                <MaterialCommunityIcons name="plus" size={16} color="#DC2626" />
                            </View>

                            <Text style={styles.topAlarmLinkPlainText} numberOfLines={1}>
                                Más Alarmas Portal
                            </Text>

                            <Ionicons
                                name="chevron-forward"
                                size={16}
                                color="#DC2626"
                                style={{ marginLeft: "auto" }}
                            />
                        </Pressable>
                    )}
                </Pressable>
            </View>
        );
    };
    //6B7280 gris 



    //!-----------ELIMINAR ACESO A TC5-----------
    const confirmarStop = async () => {
        try {
            setStopping(true);
            await post("infrastructure/stopsharingtc5", {
                userId: Number(userId),
                mac: String(device.mac),
            });
            setStopVisible(false);
            //navigation.navigate("DeviceList")
            navigation.popToTop();
            // Alert.alert("Error", "No se pudo eliminar el acceso al TC5.");
        } finally {
            setStopping(false);
        }
    };
    //!-----------Fin CARD ALARMAS-----------

    return (
        <View style={[
            styles.container,
            //  FONDO azul cuando master desarmado
            !masterAlarmState && { backgroundColor: "#3b99cf" } // "#FFEB3B" #faf202 FFF7A1 #028bfa #0269fa // ESTE ME GUSTA "#0a6da6" "#1d6caa" "#1165a6"
        ]}>
            <LinearGradient
                colors={getHeaderGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.customHeader}
            >
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

            </LinearGradient>

            {showTopAlarmCard && topAlarmCard && (

                <>

                    <TopAlarmCard
                        title={topAlarmCard.nombreEquipo}
                        locationText={topAlarmCard.ubicacion}
                        detailText={topAlarmCard.detalle}
                        chipText={topAlarmCard.mac}
                        dateText={topAlarmCard.fecha}
                        timeText={topAlarmCard.hora}
                        count={totalLinkedAlarms}
                        onPressCard={irAlPortal}
                        onPressAll={irAListaAlarmasPortal}
                    />

                </>
            )}
            {showTopAlarmCard && <View style={styles.separatorLine} />}

            <View style={{ flex: 1 }}>
                {renderContent()}
            </View>
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
                    id: device.id, // <-- Add this line to include the required 'id' property
                    userid: device.userid,
                    mac: device.mac,
                    latitude: device.latitude,
                    longitude: device.longitude,
                    farmName: device.farmName,
                    siteName: device.siteName,
                    idSite: device.idSite,
                    buildingPortalRef: device.buildingPortalRef,
                    simulado: isSimulated,
                }}
                analogIds={analogIdsWithValue}
                onStopSharingTc5={requestStopSharing}

            />
            <Modal
                visible={confirmVisible}
                transparent
                animationType="fade"
                onRequestClose={() => cerrarConfirmacion(false)} // Android back
            >
                <Pressable
                    style={styles.confirmOverlay}
                    onPress={() => cerrarConfirmacion(false)} // tocar fuera = cancelar
                >
                    {/* Caja */}
                    <Pressable
                        style={styles.confirmCard}
                        onPress={() => { }} // evita que el tap "atraviese" el card
                    >
                        <Text style={styles.confirmMessage}>{confirmMensaje}</Text>

                        <View style={styles.confirmActions}>
                            <Pressable
                                style={[styles.confirmBtn, styles.confirmBtnGhost]}
                                onPress={() => cerrarConfirmacion(false)}
                            >
                                <Text style={styles.confirmBtnGhostText}>{t("DeviceDetailsScreen.common.cancel")}</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.confirmBtn, styles.confirmBtnPrimary]}
                                onPress={() => cerrarConfirmacion(true)}
                            >
                                <Text style={styles.confirmBtnPrimaryText}>{t("DeviceDetailsScreen.common.ok")}</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <Modal
                visible={criticalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => { }}
            >
                <Pressable style={styles.criticalOverlay2} onPress={() => { }}>
                    <Pressable style={styles.criticalCard2} onPress={() => { }}>
                        {/* Icono arriba */}
                        <View style={styles.criticalIconWrap2}>
                            <MaterialCommunityIcons name="alert" size={30} color="#DC2626" />
                        </View>

                        {/* Título centrado */}
                        <Text style={styles.criticalTitle2}>
                            {t("DeviceDetailsScreen.alerta_titutlo")}
                        </Text>

                        {/* Separador */}
                        <View style={styles.criticalDivider2} />

                        {/* Mensaje */}
                        <Text style={styles.criticalMessage2}>
                            {t("DeviceDetailsScreen.alerta_subtitulo")}
                        </Text>

                        {/* Botón */}
                        <Pressable
                            style={styles.criticalBtn2}
                            onPress={async () => {
                                if (postingCriticalRef.current) return;
                                postingCriticalRef.current = true;

                                try {
                                    await runWithLoader(() =>
                                        post(
                                            `alarmtc/confirmcriticalalarm?mac=${encodeURIComponent(String(mac))}`,
                                            {}
                                        )
                                    );
                                    setCriticalVisible(false);
                                } catch (e) {
                                    criticalAlertShownRef.current = false;
                                    Alert.alert(
                                        t("DeviceDetailsScreen.errorDialog"),
                                        "No se pudo confirmar el aviso"
                                    );
                                } finally {
                                    postingCriticalRef.current = false;
                                }
                            }}
                        >
                            <Text style={styles.criticalBtnText2}>
                                {t("DeviceDetailsScreen.alert_aceptar")}
                            </Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>


            <Modal
                visible={stopVisible}
                transparent
                animationType="fade"
                onRequestClose={() => !stopping && setStopVisible(false)}
            >
                <Pressable
                    style={styles.confirmOverlay}
                    onPress={() => !stopping && setStopVisible(false)}
                >
                    <Pressable style={styles.confirmCard} onPress={() => { }}>
                        <Text style={styles.confirmMessage}>
                            ¿Desea eliminar el acceso a la nave y a las notificaciones del TC5?
                        </Text>

                        <View style={styles.confirmActions}>
                            <Pressable
                                style={[styles.confirmBtn, styles.confirmBtnGhost]}
                                onPress={() => setStopVisible(false)}
                                disabled={stopping}
                            >
                                <Text style={styles.confirmBtnGhostText}>Cancelar</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.confirmBtn, styles.confirmBtnPrimary]}
                                onPress={confirmarStop}
                                disabled={stopping}
                            >
                                {stopping ? (
                                    <ActivityIndicator />
                                ) : (
                                    <Text style={styles.confirmBtnPrimaryText}>Aceptar</Text>
                                )}
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>


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
        shadowColor: "#000", //
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
        backgroundColor: "#3b99cf", // "#FFEB3B" //SECSION RANGOS 
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
        color: '#F9FAFB', // #F9FAFB
        textAlign: 'left',
    },
    iconInValue: {
        marginRight: 8,
        marginTop: 1,
    },

    alarmRangeText: {
        fontSize: 14,
        color: '#F9FAFB', // #F9FAFB
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

    confirmOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 18,
    },
    confirmCard: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#fff",
        borderRadius: 12,     //  MÁS REDONDO
        overflow: "hidden",   //  importante para recortar
        padding: 18,

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 8,
    },
    confirmMessage: {
        fontSize: 16,
        color: "#111827",
        fontWeight: "600",
        lineHeight: 22,
    },
    confirmActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 16,
    },
    confirmBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14, //  botones también más redondos
    },
    confirmBtnGhost: {
        backgroundColor: "#F3F4F6",
    },
    confirmBtnGhostText: {
        color: "#111827",
        fontWeight: "800",
    },
    confirmBtnPrimary: {
        backgroundColor: "#2563EB",
    },
    confirmBtnPrimaryText: {
        color: "#fff",
        fontWeight: "900",
    },

    criticalOverlay2: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 18,
        backgroundColor: "rgba(220, 38, 38, 0.22)", // overlay con rojo
    },

    criticalCard2: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1.5,
        borderColor: "rgba(220,38,38,0.35)", // borde rojo suave
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 10,
    },

    criticalIconWrap2: {
        alignSelf: "center",
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "rgba(220,38,38,0.10)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },

    criticalTitle2: {
        fontSize: 18,
        fontWeight: "900",
        color: "#111827",
        textAlign: "center",
    },

    criticalDivider2: {
        height: 1,
        backgroundColor: "rgba(220,38,38,0.22)",
        marginTop: 12,
        marginBottom: 12,
    },

    criticalMessage2: {
        fontSize: 15,
        fontWeight: "700",
        color: "#374151",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 14,
    },

    criticalBtn2: {
        backgroundColor: "#DC2626",
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
    },

    criticalBtnText2: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 16,
    },

    topAlarmWrap: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 2,
    },
    topAlarmCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,

        borderWidth: 2,
        borderColor: "rgba(239,68,68,0.65)",
    },

    topAlarmBar: {
        height: 42,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    topAlarmBarLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
        marginRight: 10,
    },
    topAlarmBarTitle: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 16,
    },
    topAlarmBarDate: {
        color: "rgba(255,255,255,0.95)",
        fontWeight: "700",
        fontSize: 12,
    },
    topAlarmBody: {
        // flexDirection: "row",
        // alignItems: "center",
        //  justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 6,
    },
    topAlarmStatus: {
        // flex: 1,
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
        marginRight: 10,
    },
    topAlarmTime: {
        fontSize: 12,
        fontWeight: "700",
        color: "#374151",
    },
    topAlarmChipRow: {
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    topAlarmChip: {
        alignSelf: "flex-end",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
    },
    topAlarmChipText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#111827",
    },
    topAlarmLinkRow: {
        alignSelf: "flex-end",        // ✅ lo pega a la derecha
        flexDirection: "row",
        alignItems: "center",
        gap: 8,

        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,

        borderWidth: 1.6,
        borderColor: "#DC2626",
        borderRadius: 12,
        backgroundColor: "#FFFFFF",

        maxWidth: "92%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,

    },

    topAlarmLinkText: {
        fontSize: 13,
        fontWeight: "900",
        color: "#DC2626",
    },

    //!-------------------------------
    // topAlarmLinkRow: {
    //     alignSelf: "flex-end",
    //     flexDirection: "row",
    //     alignItems: "center",
    //     gap: 8,
    //     marginTop: 10,
    //     paddingHorizontal: 16,
    //     paddingVertical: 12,
    //     borderRadius: 18,
    //     backgroundColor: "#DC2626",
    //     maxWidth: "92%",
    //     shadowColor: "#DC2626",
    //     shadowOffset: { width: 0, height: 6 },
    //     shadowOpacity: 0.3,
    //     shadowRadius: 10,
    //     elevation: 5,
    // },
    // topAlarmLinkText: {
    //     fontSize: 13,
    //     fontWeight: "700",
    //     color: "#FFFFFF",
    // },
    // topAlarmLinkRowPressed: {
    //     backgroundColor: "#FEF2F2",
    //     borderColor: "#B91C1C",
    //     transform: [{ scale: 0.98 }],
    //     shadowOpacity: 0.25,
    // },
    //!-----------------------------------


    topAlarmDateTimeRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    topAlarmDateTime: {
        fontSize: 13,        // sube a 14 si lo quieres más grande
        fontWeight: "800",
        color: "#374151",
    },

    verTodasBtn: {
        alignSelf: "flex-end",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,

        paddingVertical: 8,
        paddingHorizontal: 6,
        borderBottomWidth: 2,
        borderBottomColor: "rgba(220,38,38,0.45)",
    },
    verTodasBtnPressed: {
        borderBottomColor: "rgba(220,38,38,0.9)",
        opacity: 0.9,
    },
    verTodasText: {
        fontSize: 13,
        fontWeight: "900",
        color: "#DC2626",
    },

    topAlarmLocation: {
        flex: 1,
        marginRight: 10,
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },
    topAlarmDivider: {
        height: 1,
        backgroundColor: "rgba(17,24,39,0.08)", // gris suave
    },

    topAlarmLinkPlainRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        alignSelf: "flex-start", // ✅ a la izquierda
    },

    topAlarmLinkPlainText: {
        fontSize: 13,
        fontWeight: "900",
        color: "#DC2626", // rojo
    },

    portalHeaderWrap: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 6,
    },

    portalHeaderTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#111827",
    },

    portalHeaderDivider: {
        marginTop: 8,
        height: 1,
        backgroundColor: "rgba(17,24,39,0.12)",
    },
    plusCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#DC2626",
        alignItems: "center",
        justifyContent: "center",
    },
    portalTitleInsideWrap: {
        paddingHorizontal: 12,
        paddingTop: 6,
        paddingBottom: 6,
        backgroundColor: "#fff",
    },

    portalTitleInsideText: {
        fontSize: 16,
        fontWeight: "900",
        color: "#111827",
    },
    portalTitleInsideDivider: {
        marginTop: 10,
        height: 1,
        backgroundColor: "rgba(17,24,39,0.10)",
    },
    topAlarmBarInside: {
        height: 36,
        marginTop: 0,     // ✅ esto “baja” la barra roja
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    topAlarmBarRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },

    topAlarmBarMac: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        // paddingHorizontal: 10,
        // paddingVertical: 5,
        // borderRadius: 999,
        // backgroundColor: "rgba(255,255,255,0.18)", // pill suave
        // maxWidth: "38%", // para que no empuje demasiado el título
    },

    topAlarmBarMacText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 12,
    },
    topAlarmBodyRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    separatorLine: {
        height: 1.5, // prueba 2 o 3
        backgroundColor: "rgba(0,0,0,1)",
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 1,
    },

});
