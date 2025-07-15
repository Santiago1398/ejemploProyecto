import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform, Alert } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "app/HomeStack";
import { t } from "@/i18n/i18nConfig";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DeviceLocationMapRouteProp = RouteProp<RootStackParamList, 'DeviceLocationMap'>;
type DeviceLocationMapNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DeviceLocationMap() {
    const route = useRoute<DeviceLocationMapRouteProp>();
    const navigation = useNavigation<DeviceLocationMapNavigationProp>();
    const insets = useSafeAreaInsets();

    const { deviceLocation, farmName, siteName, mac, idSite } = route.params;
    const [markerLocation, setMarkerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔥 SIMPLIFICADO: Solo usar las coordenadas que vienen del device
    useEffect(() => {
        console.log("🗺️ DeviceLocationMap - Coordenadas recibidas:");
        console.log("- Latitude:", deviceLocation.latitude);
        console.log("- Longitude:", deviceLocation.longitude);
        console.log("- Farm:", farmName);
        console.log("- Site:", siteName);

        // Verificar si las coordenadas son válidas
        if (deviceLocation.latitude !== 0 && deviceLocation.longitude !== 0) {
            setMarkerLocation({
                latitude: deviceLocation.latitude,
                longitude: deviceLocation.longitude
            });
        } else {
            console.warn("⚠️ Coordenadas inválidas (0,0) - El dispositivo no tiene ubicación guardada");
            // 🔥 MOSTRAR ALERT y luego mapa vacío
            Alert.alert(
                "Sin ubicación",
                "Este dispositivo no tiene una ubicación guardada.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // No establecer ninguna ubicación - mapa vacío
                            setMarkerLocation(null);
                        }
                    }
                ]
            );
        }

        setLoading(false);
    }, [deviceLocation]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                    {t("DeviceMaps.loading.cargando")}
                </Text>
            </View>
        );
    }

    // Si no hay coordenadas válidas, mostrar mensaje
    if (!markerLocation) {
        // 🔥 MOSTRAR MAPA VACÍO (sin marcadores)
        const emptyMapRegion = {
            latitude: 40.0, // Centro genérico para mostrar algo
            longitude: 0.0,
            latitudeDelta: 50.0, // Zoom muy amplio
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
                        {farmName} - {siteName}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* 🔥 MAPA VACÍO SIN MARCADORES */}
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
                    {/* Sin marcadores - mapa completamente vacío */}
                </MapView>
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
            {/* 🔥 HEADER PERSONALIZADO CON FARMNAME Y SITENAME */}
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

            {/* 🔥 MAPA SOLO PARA VISUALIZACIÓN */}
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation={false} //  NO mostrar punto azul del usuario
                scrollEnabled={true}      //  Permitir navegar el mapa
                zoomEnabled={true}        //  Permitir zoom
                rotateEnabled={false}     //  No rotar (más estable)
                pitchEnabled={false}      //  No inclinación 3D
            >
                {/* ✅ SOLO MARCADOR DE LA GRANJA - SI TIENE COORDENADAS */}
                <Marker
                    coordinate={markerLocation}
                    title={farmName || "Granja"}
                    description={siteName || "Nave"}
                    pinColor="red"
                />
            </MapView>
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

    // 🔥 NUEVOS ESTILOS para cuando no hay ubicación
    noLocationContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        backgroundColor: "#fff",
    },
    noLocationTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#666",
        marginTop: 20,
        marginBottom: 10,
    },
    noLocationMessage: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
        lineHeight: 24,
    },
});