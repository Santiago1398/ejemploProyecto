import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import CustomMaps from '@/components/maps/CustomMaps';
import { useDeviceStore } from '@/store/useDeviceStore';
import { useLocationStore } from '@/store/useLocationStore';
import * as Location from 'expo-location';
import { t } from "@/i18n/i18nConfig";
import { FontAwesome } from "@expo/vector-icons"; // 🔥 IMPORT NECESARIO

// 🔥 INTERFAZ PARA EL CENTRO DEL MAPA (CON ZOOM)
interface MapCenter {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
}

// 🔥 CENTRO POR DEFECTO (EUROPA) CON ZOOM AMPLIO
const DEFAULT_CENTER: MapCenter = {
    latitude: 40.0,
    longitude: 0.0,
    latitudeDelta: 15.0,    // Zoom muy amplio
    longitudeDelta: 15.0,
};

const MapsScreen = () => {
    // 🏪 OBTENER DATOS DEL STORE GLOBAL
    const {
        devices,
        loading: devicesLoading,
        error: devicesError,
        getDevicesWithValidCoordinates,
        getDeviceCount,
        getValidCoordinatesCount
    } = useDeviceStore();

    const { lastKnownLocation, getLocation } = useLocationStore();
    const [mapCenter, setMapCenter] = useState<MapCenter>(DEFAULT_CENTER);
    const [locationLoading, setLocationLoading] = useState(true);

    // 🏪 OBTENER DISPOSITIVOS CON COORDENADAS VÁLIDAS
    const devicesWithValidCoords = getDevicesWithValidCoordinates();

    // 🌍 OBTENER UBICACIÓN DEL USUARIO Y CENTRAR MAPA CON ZOOM AMPLIO
    useEffect(() => {
        const determineMapCenter = async () => {
            try {
                console.log('🗺️ Determinando centro del mapa...');
                setLocationLoading(true);

                // Verificar permisos
                const { status } = await Location.getForegroundPermissionsAsync();

                if (status !== 'granted') {
                    // Pedir permisos
                    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                    if (newStatus !== 'granted') {
                        console.log('🌍 Permisos denegados, usando centro por defecto');
                        setMapCenter(DEFAULT_CENTER);
                        setLocationLoading(false);
                        return;
                    }
                }

                // Obtener ubicación del usuario
                console.log('📍 Obteniendo ubicación del usuario...');
                const location = await getLocation();

                if (location) {
                    // 🔥 USAR DIRECTAMENTE LA UBICACIÓN DEL USUARIO CON ZOOM MÁS AMPLIO
                    const userCenter: MapCenter = {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 4.0,    // 🔥 Zoom MÁS amplio (~400km de radio)
                        longitudeDelta: 4.0,
                    };

                    console.log('✅ Centrando mapa en ubicación del usuario:');
                    console.log(`- Latitud: ${userCenter.latitude}`);
                    console.log(`- Longitud: ${userCenter.longitude}`);
                    console.log(`- Zoom: ${userCenter.latitudeDelta}° (aprox. 400km de radio)`);
                    console.log('🔍 DATOS COMPLETOS PARA CUSTOMMAPS:', JSON.stringify(userCenter, null, 2));

                    setMapCenter(userCenter);
                } else {
                    console.log('⚠️ No se pudo obtener ubicación, usando centro por defecto');
                    setMapCenter(DEFAULT_CENTER);
                }
            } catch (error) {
                console.error('❌ Error al obtener ubicación:', error);
                setMapCenter(DEFAULT_CENTER);
            } finally {
                setLocationLoading(false);
            }
        };

        determineMapCenter();
    }, []);

    //  DEBUG: Ver qué datos llegan del store
    useEffect(() => {
        console.log("🗺️ DEBUG MapsScreen (desde store):");
        console.log("- Total devices from store:", getDeviceCount());
        console.log("- Devices with valid coords:", getValidCoordinatesCount());
        console.log("- Devices loading:", devicesLoading);
        console.log("- Devices error:", devicesError);
        console.log("- Map center:", mapCenter);

        if (devicesWithValidCoords.length > 0) {
            console.log("- Valid devices:");
            devicesWithValidCoords.forEach(device => {
                console.log(`  * ${device.siteName} (${device.farmName}): ${device.latitude}, ${device.longitude}`);
            });
        }
    }, [devices, devicesWithValidCoords, devicesLoading, devicesError, mapCenter]);

    // 🔥 VALIDAR ESTADO SIN ALERTS QUE BLOQUEEN
    useEffect(() => {
        console.log("🗺️ Estado de dispositivos:", {
            loading: devicesLoading,
            error: devicesError,
            totalDevices: devices.length,
            validDevices: devicesWithValidCoords.length
        });
    }, [devices, devicesWithValidCoords, devicesLoading, devicesError]);

    // 🔄 MOSTRAR LOADING MIENTRAS SE CARGAN LOS DISPOSITIVOS O LA UBICACIÓN
    if (devicesLoading || locationLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
                    {devicesLoading
                        ? (t("MapsScreen.loading.devices") || "Cargando dispositivos...")
                        : (t("MapsScreen.loading.location") || "Obteniendo ubicación...")
                    }
                </Text>
            </View>
        );
    }

    // 🔥 SI HAY ERROR EN LA CARGA DE DISPOSITIVOS, MOSTRAR PANTALLA DE ERROR
    if (devicesError) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
                <FontAwesome name="wifi" size={48} color="#ef4444" />
                <Text style={{
                    fontSize: 20,
                    color: "#ef4444",
                    fontWeight: "bold",
                    marginTop: 16,
                    textAlign: "center"
                }}>
                    {t("MapsScreen.errors.title") || "Error de conexión"}
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: "#666",
                    marginTop: 12,
                    textAlign: "center",
                    lineHeight: 22
                }}>
                    {t("MapsScreen.errors.loadDevicesError") || "No se pudieron cargar los dispositivos. Verifica tu conexión a internet."}
                </Text>
            </View>
        );
    }

    // 🔥 SI NO HAY DISPOSITIVOS (PERO SIN ERROR), MOSTRAR MENSAJE INFORMATIVO
    if (!devicesLoading && devices.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
                <FontAwesome name="map-o" size={48} color="#666" />
                <Text style={{
                    fontSize: 20,
                    color: "#666",
                    fontWeight: "600",
                    marginTop: 16,
                    textAlign: "center"
                }}>
                    {t("MapsScreen.errors.noDevicesTitle") || "Sin dispositivos"}
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: "#999",
                    marginTop: 8,
                    textAlign: "center",
                    lineHeight: 22
                }}>
                    {t("MapsScreen.errors.noDevicesMessage") || "No hay dispositivos disponibles. Ve a la pestaña Home para cargar los datos."}
                </Text>
            </View>
        );
    }

    // 🔥 SI NO HAY DISPOSITIVOS VÁLIDOS CON COORDENADAS, MOSTRAR MENSAJE ESPECÍFICO
    if (devicesWithValidCoords.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
                <FontAwesome name="map-pin" size={48} color="#ffa500" />
                <Text style={{
                    fontSize: 20,
                    color: "#ffa500",
                    fontWeight: "600",
                    marginTop: 16,
                    textAlign: "center"
                }}>
                    {t("MapsScreen.noValidCoords.title") || "Sin ubicaciones"}
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: "#999",
                    marginTop: 8,
                    textAlign: "center",
                    lineHeight: 22
                }}>
                    {t("MapsScreen.noValidCoords.message") || `${devices.length} dispositivos encontrados, pero ninguno tiene coordenadas válidas.`}
                </Text>
            </View>
        );
    }

    // ✅ TODO OK - MOSTRAR MAPA
    return (
        <View style={{ flex: 1 }}>
            <CustomMaps
                initialLocation={mapCenter}
                showUserLocation={false}
                devices={devicesWithValidCoords}
            />
        </View>
    );
};

export default MapsScreen;