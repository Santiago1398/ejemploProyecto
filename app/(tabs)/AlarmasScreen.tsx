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
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { PaperProvider } from "react-native-paper";
import { t } from "@/i18n/i18nConfig";

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

            console.log("📡 Alarmas recibidas:", alarmasData);

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

    // CARGAR SOLO UNA VEZ AL INICIO
    useEffect(() => {
        fetchAlarmas(false); // Carga inicial
    }, []);

    //  NUEVO: INTERVAL CADA 5 SEGUNDOS PARA AUTO-REFRESH SIN LOADING
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAlarmas(true); // Auto-refresh silencioso
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    //  FUNCIÓN PARA REFRESH MANUAL
    const onRefresh = () => {
        setErrorShown(false); // Permitir mostrar errores nuevos
        setIsRefreshing(true);
        fetchAlarmas(false); // Refresh manual (puede mostrar loading)
    };

    const renderItem = ({ item }: { item: AlarmaDisparada }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                navigation.navigate("DeviceDetails", {
                    device: {
                        mac: item.mac,
                        farmName: item.farmName,
                        siteName: item.siteName,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        idSite: item.idSite,
                        buildingPortalRef: item.buildingPortalRef,
                        armed: true,
                        alarmType: 1,
                    }
                });
            }}
        >
            <View style={styles.row}>
                <Ionicons
                    name="alert-circle"
                    size={24}
                    color="#000"
                    style={{ marginRight: 8 }}
                />
                <View style={styles.titleRow}>
                    <Text style={styles.leftText}>{item.farmName}</Text>
                    <Text style={styles.rightText}>{item.siteName}</Text>
                </View>
            </View>

            {/*  USAR EL NUEVO CAMPO textAlarm */}
            <Text style={styles.alarmas}>{item.textAlarm}</Text>

            {/*  MOSTRAR UBICACIÓN SOLO SI EXISTE */}
            {(item.town || item.province) && (
                <Text style={styles.location}>
                    {[item.town, item.province].filter(Boolean).join(", ")}
                </Text>
            )}
        </TouchableOpacity>
    );

    // PANTALLA DE CARGA INICIAL
    if (isLoading) {
        return (
            <PaperProvider>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#4ade80" />
                    <Text style={styles.loadingText}>
                        {t("AlarmasScreen.loadingAlarms")}
                    </Text>
                </View>
            </PaperProvider>
        );
    }

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
                <FlatList
                    data={alarmasDisparadas}
                    keyExtractor={(item, index) => `${item.mac}-${item.idAlarm}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={["#4ade80"]}
                            tintColor="#4ade80"
                        />
                    }
                />
            )}
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#dc2626", //  Rojo más moderno (#dc2626 en lugar de "red")
        borderRadius: 16, //  Bordes más redondeados (16 en lugar de 12)
        padding: 20, // Más padding para respirar
        marginBottom: 16, //  Más espacio entre tarjetas
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 }, //  Sombra más pronunciada
        shadowOpacity: 0.3, //  Sombra más visible
        shadowRadius: 8, //  Sombra más suave
        elevation: 6, //  Elevación mayor en Android
        // NUEVO: Gradiente sutil con border
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)", // Borde sutil blanco
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8, //  Más espacio
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        flex: 1,
    },
    leftText: {
        fontWeight: "bold",
        fontSize: 17, // 🔥 Ligeramente más grande
        color: "#ffffff", //  BLANCO
        letterSpacing: 0.3, //  Espaciado de letras moderno
    },
    rightText: {
        fontWeight: "bold",
        fontSize: 17, // 🔥 Ligeramente más grande
        color: "#ffffff", //  BLANCO
        letterSpacing: 0.3, //  Espaciado de letras moderno
    },
    alarmas: {
        fontSize: 15, // 🔥 Ligeramente más grande
        color: "#f3f4f6", //  BLANCO ligeramente gris para contraste
        marginBottom: 6, //  Más espacio
        fontWeight: "500", //  Peso medio
        lineHeight: 20, //  Altura de línea mejorada
    },
    location: {
        fontSize: 13, // 🔥 Un poco más grande
        color: "rgba(255, 255, 255, 0.8)", //  BLANCO con transparencia
        fontStyle: "italic",
        marginTop: 4, //  Espacio superior
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
        marginTop: 16,
        textAlign: "center",
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
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#4ade80",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
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
});