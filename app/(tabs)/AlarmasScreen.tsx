import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
    RefreshControl,
    SectionList,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { PaperProvider } from "react-native-paper";
import { t } from "@/i18n/i18nConfig";
import { useIsFocused } from "@react-navigation/native";
import { socketService } from "@/services/socketService";
import { MaterialCommunityIcons } from '@expo/vector-icons';
//import { useGeneralSocketListener } from "@/hooks/useSocketListener";



//  NUEVA INTERFAZ BASADA EN LA RESPUESTA DEL ENDPOINT
interface AlarmaDisparada {
    mac: number;
    farmName: string;
    siteName: string;
    town: string;
    province: string;
    country: string;
    idSite: number;
    longitude: number;
    latitude: number;
    buildingPortalRef: number;
    idAlarm: number;
    textAlarm: string;
}

export default function Alarmas() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [alarmasDisparadas, setAlarmasDisparadas] = useState<AlarmaDisparada[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorShown, setErrorShown] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isFocused = useIsFocused();


    const capitalize = (str: string) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

    //  FUNCIÓN SIMPLIFICADA PARA OBTENER ALARMAS
    const fetchAlarmas = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
            }

            const storedUserId = await AsyncStorage.getItem("userId");

            //  UNA SOLA LLAMADA AL ENDPOINT QUE YA DEVUELVE ALARMAS DISPARADAS
            const alarmasData: AlarmaDisparada[] = await get(`alarmtc/sites/user/list/${storedUserId}`);

            console.log(" Alarmas recibidas:", alarmasData);

            //? TODO BIEN - Solo mapear si necesitas transformar algo
            const alarmasFormateadas = alarmasData.map(alarma => ({
                ...alarma,
                textAlarm: capitalize(alarma.textAlarm), // Capitalizar el texto de la alarma
                town: capitalize(alarma.town || ""),
                province: capitalize(alarma.province || ""),
            }));

            setAlarmasDisparadas(alarmasFormateadas);
            setHasError(false);
            setIsLoading(false);
            setIsRefreshing(false);

        } catch (error) {
            console.error(" Error al cargar alarmas:", error);

            //  MOSTRAR ALERT SOLO UNA VEZ EN CARGA INICIAL
            if (!errorShown && !isManualRefresh) {
                setErrorShown(true);
                Alert.alert(
                    t("AlarmasScreen.errorTitle"),
                    t("AlarmasScreen.errorMessage"),
                    [{ text: "OK" }]
                );
            }

            setHasError(true);
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    //!Los Eventos Pruebas ------
    useEffect(() => {
        const handleAlarmEvent = (payload: any) => {
            // El backend puede enviar string, número u objeto
            const eventMac =
                typeof payload === "string" || typeof payload === "number"
                    ? String(payload)
                    : String(
                        payload?.mac ||
                        payload?.device?.mac ||
                        payload?.macAddress ||
                        ""
                    );

            if (eventMac) {
                console.log("📡 Evento alarma en pantalla 2 Tabs Alarmas →", eventMac, "→ fetchAlarmas");
                fetchAlarmas(true);            // true = refresh silencioso
            }
        };

        /* Escucha tanto cambios de MAC como alarma disparada */
        socketService.on("register_macs", handleAlarmEvent);
        //socketService.on("alarm_triggered", handleAlarmEvent);


        return () => {
            socketService.off("register_macs", handleAlarmEvent);
            //socketService.off("alarm_triggered", handleAlarmEvent);
        };
    }, []);           // sin isFocused en la dependencia

    // useGeneralSocketListener(
    //     'register_macs',
    //     (payload) => {
    //         const eventMac = typeof payload === 'string' || typeof payload === 'number'
    //             ? String(payload)
    //             : String(
    //                 payload?.mac ||
    //                 payload?.device?.mac ||
    //                 payload?.macAddress ||
    //                 ''
    //             );

    //         if (eventMac) {
    //             console.log("📡 Evento alarma en pantalla Alarmas →", eventMac);
    //             fetchAlarmas(true);
    //         }
    //     }
    //     // No requiere foco, por eso no se pasan los últimos parámetros
    // );


    //!---------------------------------


    // CARGAR SOLO UNA VEZ AL INICIO
    useEffect(() => {
        fetchAlarmas(false); // Carga inicial
    }, []);

    // INTERVAL CADA 15 SEGUNDOS PARA AUTO-REFRESH SIN LOADING
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAlarmas(true);
        }, 7000);

        return () => clearInterval(interval);
    }, []);

    //  FUNCIÓN PARA REFRESH MANUAL
    // const onRefresh = () => {
    //     setErrorShown(false); // Permitir mostrar errores nuevos
    //     setIsRefreshing(true);
    //     //fetchAlarmas(false); // Refresh manual (puede mostrar loading)
    // };

    /* util pequeño */
    const groupBy = <T, K extends PropertyKey>(arr: T[], key: (i: T) => K) =>
        arr.reduce((acc, cur) => {
            const k = key(cur);
            (acc[k] ||= []).push(cur);
            return acc;
        }, {} as Record<K, T[]>);


    const goToDetails = (a: AlarmaDisparada) => {
        navigation.navigate("DeviceDetails", {
            device: {
                mac: a.mac,
                farmName: a.farmName,
                siteName: a.siteName,
                latitude: a.latitude,
                longitude: a.longitude,
                idSite: a.idSite,
                buildingPortalRef: a.buildingPortalRef,
                alarmType: 1,
                armed: true,
            }
        });
    };


    const secciones = Object.entries(
        groupBy(alarmasDisparadas, a => a.farmName)
    ).map(([farm, data]) => ({ title: farm, data }));


    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
            <View style={styles.sectionHeaderLine} />
        </View>
    );


    const renderItem = ({ item }: { item: AlarmaDisparada }) => (
        <TouchableOpacity
            onPress={() => goToDetails(item)}
            style={styles.card}
        >
            {/* fila superior: icono + site */}
            <View style={styles.topRow}>
                <View style={styles.iconHolder}>
                    <MaterialCommunityIcons
                        name="bell-ring"
                        size={18}
                        color="#F9FAFB"
                    //style={{ marginRight: 6 }}
                    />
                </View>

                <Text numberOfLines={1} style={styles.siteName}>{item.siteName}</Text>
            </View>

            {/* texto alarma */}
            <Text style={styles.alarmText}>{item.textAlarm}</Text>

            {/* ubicación opcional
            {(item.town || item.province) &&
                <Text style={styles.location}>
                    {[item.town, item.province].filter(Boolean).join(", ")}
                </Text>
            } */}
        </TouchableOpacity>
    );


    // // PANTALLA DE CARGA INICIAL
    // if (isLoading) {
    //     return (
    //         <PaperProvider>
    //             <View style={styles.centered}>
    //                 <ActivityIndicator size="large" color="#4ade80" />
    //                 <Text style={styles.loadingText}>
    //                     {t("AlarmasScreen.loadingAlarms")}
    //                 </Text>
    //             </View>
    //         </PaperProvider>
    //     );
    // }

    //  PANTALLA DE ERROR
    if (hasError && alarmasDisparadas.length === 0) {
        return (
            <PaperProvider>
                <View style={styles.centered}>
                    <FontAwesome name="wifi" size={48} color="#ef4444" />
                    <Text style={styles.errorTitle}>
                        {t("AlarmasScreen.errorTitle")}
                    </Text>
                    <Text style={styles.errorMessage}>
                        {t("AlarmasScreen.connectionErrorMessage")}
                    </Text>
                    {/* <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>
                            {t("AlarmasScreen.retry") }
                        </Text>
                    </TouchableOpacity> */}
                </View>
            </PaperProvider>
        );
    }

    //  CONTENIDO NORMAL
    return (
        <PaperProvider>
            {alarmasDisparadas.length === 0 ? (
                <View style={styles.centered}>
                    <FontAwesome name="bell-slash-o" size={48} color="#4ade80" />
                    <Text style={styles.noAlarmText}>
                        {t("AlarmasScreen.noAlarms")}
                    </Text>
                    <Text style={styles.noAlarmSubtext}>
                        {t("AlarmasScreen.noAlarmsMessage")}
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={secciones}
                    keyExtractor={item => `${item.mac}-${item.idAlarm}`}
                    renderSectionHeader={renderSectionHeader}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                />

            )}
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "red", //#dc2626
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 14,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },


    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },

    errorTitle: {
        fontSize: 20,
        color: "#ef4444",
        fontWeight: "bold",
        marginTop: 16,
        textAlign: "center",
    },
    errorMessage: {
        fontSize: 16,
        color: "#666",
        marginTop: 12,
        textAlign: "center",
        lineHeight: 22,
    },

    noAlarmText: {
        fontSize: 20,
        color: "#4ade80",
        fontWeight: "600",
        marginTop: 16,
        textAlign: "center",
    },
    noAlarmSubtext: {
        fontSize: 14,
        color: "#666",
        marginTop: 8,
        textAlign: "center",
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },

    iconHolder: {
        width: 28, height: 28,
        borderRadius: 14,
        // backgroundColor: "#fff",
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    siteName: {
        flex: 1,
        color: "#F9FAFB", // Purbeas de color testo #f7f7f7 - #e3ddd1 - #ffffff - #e9e9e7 -"#f7f7f7 - #F9FAFB
        fontSize: 17,
        fontWeight: "600"
    },

    alarmText: {
        color: "#F9FAFB", // Purbeas de color testo #f7f7f7 - #e3ddd1 - #ffffff - #F9FAFB
        fontSize: 15,
        fontWeight: "500"
    },

    sectionHeaderContainer: {
        marginTop: 24,
        marginBottom: 8,
    },
    sectionHeaderText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#374151",
    },

    sectionHeaderLine: {
        marginTop: 4,
        height: 2,
        backgroundColor: "#000000", // negro puro
        // opacity: 0.3,
        width: '100%',

    },

});