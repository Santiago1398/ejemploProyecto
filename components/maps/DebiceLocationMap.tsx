import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "app/HomeStack";
import { t } from "@/i18n/i18nConfig";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get } from "@/services/api";

type DeviceLocationMapRouteProp = RouteProp<RootStackParamList, 'DeviceLocationMap'>;
type DeviceLocationMapNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// 🔥 INTERFAZ PARA LA RESPUESTA DEL ENDPOINT
interface DeviceLocationData {
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
}

export default function DeviceLocationMap() {
    const route = useRoute<DeviceLocationMapRouteProp>();
    const navigation = useNavigation<DeviceLocationMapNavigationProp>();
    const insets = useSafeAreaInsets();

    const { deviceLocation, farmName, siteName, mac, idSite } = route.params;
    const [markerLocation, setMarkerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [deviceData, setDeviceData] = useState<DeviceLocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // 🔥 FUNCIÓN PARA OBTENER DATOS DEL DISPOSITIVO ESPECÍFICO
    const fetchDeviceData = async (isAutoRefresh = false) => {
        try {
            // 🔥 SOLO MOSTRAR LOADING EN CARGA MANUAL, NO EN AUTO-REFRESH
            if (!isAutoRefresh) {
                setLoading(true);
            }

            setError(false);

            const storedUserId = await AsyncStorage.getItem("userId");

            console.log("🔍 Obteniendo datos del dispositivo:");
            console.log("- User ID:", storedUserId);
            console.log("- Site ID:", idSite);
            console.log("- Auto-refresh:", isAutoRefresh);
            console.log("- Endpoint:", `alarmtc/sites/user/${storedUserId}/${idSite}`);

            // 🔥 LLAMADA AL ENDPOINT ESPECÍFICO
            const response = await get(`alarmtc/sites/user/${storedUserId}/${idSite}`);

            console.log("📡 Respuesta del endpoint completa:", response);

            // 🔥 VERIFICAR SI ES UN ARRAY Y TOMAR EL PRIMER ELEMENTO
            let deviceInfo: DeviceLocationData;
            if (Array.isArray(response) && response.length > 0) {
                deviceInfo = response[0];
                console.log("✅ Datos extraídos del array:", deviceInfo);
            } else if (response && !Array.isArray(response)) {
                deviceInfo = response;
                console.log("✅ Datos del objeto directo:", deviceInfo);
            } else {
                throw new Error("Respuesta del servidor vacía o inválida");
            }

            console.log("📡 Datos finales del dispositivo:");
            console.log("- Latitude:", deviceInfo.latitude);
            console.log("- Longitude:", deviceInfo.longitude);
            console.log("- Farm:", deviceInfo.farmName);
            console.log("- Site:", deviceInfo.siteName);

            setDeviceData(deviceInfo);

            // Verificar si las coordenadas son válidas
            if (deviceInfo.latitude !== 0 && deviceInfo.longitude !== 0) {
                setMarkerLocation({
                    latitude: deviceInfo.latitude,
                    longitude: deviceInfo.longitude
                });
            } else {
                console.warn("⚠️ Coordenadas inválidas (0,0) - El dispositivo no tiene ubicación guardada");
                setMarkerLocation(null);

                // 🔥 MOSTRAR ALERT SOLO EN CARGA INICIAL (NO EN AUTO-REFRESH)
                if (!isAutoRefresh) {
                    Alert.alert(
                        t("DeviceLocationMap.noLocation.title"),
                        t("DeviceLocationMap.noLocation.message"),
                        [{ text: "OK" }]
                    );
                }
            }

        } catch (error) {
            console.error("❌ Error al obtener datos del dispositivo:", error);
            setError(true);
            setMarkerLocation(null);

            // 🔥 MOSTRAR ALERT SOLO EN CARGA INICIAL (NO EN AUTO-REFRESH)
            if (!isAutoRefresh) {
                //Alert.alert(
                // t("DeviceLocationMap.error.title") || "Error",
                // t("DeviceLocationMap.error.message") || "No se pudo obtener la información del dispositivo.",
                // [{ text: "OK" }]
                //);
            }
        } finally {
            // 🔥 SOLO CAMBIAR LOADING STATE EN CARGA MANUAL
            if (!isAutoRefresh) {
                setLoading(false);
            }
        }
    };

    // ✅ CARGAR DATOS AL INICIO
    useEffect(() => {
        fetchDeviceData(false); // Carga inicial
    }, [idSite]);

    // 🔥 NUEVO: INTERVAL CADA 5 SEGUNDOS PARA AUTO-REFRESH SIN LOADING
    useEffect(() => {
        const interval = setInterval(() => {
            fetchDeviceData(true); // Auto-refresh silencioso
        }, 5000);

        return () => clearInterval(interval);
    }, [idSite]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                    {t("DeviceLocationMap.loading")}
                </Text>
            </View>
        );
    }

    // Si hay error, mostrar pantalla de error
    if (error) {
        return (
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {farmName} - {siteName}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color="#ef4444" />
                    <Text style={styles.errorTitle}>
                        {t("DeviceLocationMap.error.title")}
                    </Text>
                    <Text style={styles.errorMessage}>
                        {t("DeviceLocationMap.error.message")}
                    </Text>
                    {/* <TouchableOpacity style={styles.retryButton} onPress={() => fetchDeviceData(false)}>
                        <Feather name="refresh-cw" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>
                            {t("DeviceLocationMap.retry")}
                        </Text>
                    </TouchableOpacity> */}
                </View>
            </View>
        );
    }

    // Si no hay coordenadas válidas, mostrar mapa vacío
    if (!markerLocation) {
        const emptyMapRegion = {
            latitude: 40.0,
            longitude: 0.0,
            latitudeDelta: 50.0,
            longitudeDelta: 50.0,
        };

        return (
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {deviceData?.farmName || farmName} - {deviceData?.siteName || siteName}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Mapa vacío */}
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={emptyMapRegion}
                    showsUserLocation={false}
                    scrollEnabled={true}
                    zoomEnabled={true}
                    rotateEnabled={false}
                    pitchEnabled={false}
                >
                    {/* Sin marcadores */}
                </MapView>

                {/* Mensaje superpuesto */}

            </View>
        );
    }

    const initialRegion = {
        latitude: markerLocation.latitude,
        longitude: markerLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    return (
        <View style={styles.container}>
            {/* Header con datos actualizados */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Feather name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {deviceData?.farmName || farmName} - {deviceData?.siteName || siteName}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Mapa con marcador */}
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation={false}
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                <Marker
                    coordinate={markerLocation}
                    title={deviceData?.farmName || farmName || "Granja"}
                    description={deviceData?.siteName || siteName || "Nave"}
                    pinColor="red"
                />
            </MapView>

            {/* Información adicional en la parte inferior */}
            {deviceData && (deviceData.town || deviceData.province || deviceData.country) && (
                <View style={styles.infoContainer}>
                    <Feather name="map-pin" size={16} color="#666" />
                    <Text style={styles.infoText}>
                        {[deviceData.town, deviceData.province, deviceData.country]
                            .filter(Boolean)
                            .join(", ")}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        backgroundColor: "#f8f9fa",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#e9ecef",
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 22,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "600",
        color: "#000",
        textAlign: "center",
        marginHorizontal: 10,
    },
    headerSpacer: {
        width: 44,
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        backgroundColor: "#fff",
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#ef4444",
        marginTop: 16,
        textAlign: "center",
    },
    errorMessage: {
        fontSize: 16,
        color: "#666",
        marginTop: 8,
        textAlign: "center",
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#007AFF",
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
    noLocationOverlay: {
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        padding: 20,
        marginHorizontal: 40,
        borderRadius: 12,
        transform: [{ translateY: -50 }],
    },
    noLocationTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#666",
        marginTop: 12,
        marginBottom: 8,
    },
    noLocationMessage: {
        fontSize: 14,
        color: "#999",
        textAlign: "center",
        lineHeight: 20,
    },
    infoContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#e9ecef",
    },
    infoText: {
        fontSize: 14,
        color: "#666",
        marginLeft: 8,
    },
});