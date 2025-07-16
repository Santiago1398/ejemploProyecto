import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Text } from 'react-native';
import CustomMaps from '@/components/maps/CustomMaps';
import { useLocationStore } from '@/store/useLocationStore';
import * as Location from 'expo-location';
import { t } from 'i18n-js';
import { useDeviceStore } from '@/store/useDeviceStore';

// 🌍 CENTROS DE PAÍSES PRINCIPALES
const countryCenters: Record<string, { latitude: number; longitude: number; name: string }> = {
    // Europa
    'ES': { latitude: 40.0, longitude: -4.0, name: 'España' },
    'FR': { latitude: 46.0, longitude: 2.0, name: 'Francia' },
    'IT': { latitude: 42.0, longitude: 12.5, name: 'Italia' },
    'DE': { latitude: 51.0, longitude: 9.0, name: 'Alemania' },
    'UK': { latitude: 54.0, longitude: -2.0, name: 'Reino Unido' },
    'PT': { latitude: 39.5, longitude: -8.0, name: 'Portugal' },

    // América
    'US': { latitude: 39.0, longitude: -98.0, name: 'Estados Unidos' },
    'MX': { latitude: 23.0, longitude: -102.0, name: 'México' },
    'AR': { latitude: -34.0, longitude: -64.0, name: 'Argentina' },
    'BR': { latitude: -10.0, longitude: -55.0, name: 'Brasil' },
    'CA': { latitude: 60.0, longitude: -95.0, name: 'Canadá' },

    // Asia
    'CN': { latitude: 35.0, longitude: 105.0, name: 'China' },
    'JP': { latitude: 36.0, longitude: 138.0, name: 'Japón' },
    'KR': { latitude: 36.0, longitude: 128.0, name: 'Corea del Sur' },
    'IN': { latitude: 20.0, longitude: 77.0, name: 'India' },

    // Fallback
    'DEFAULT': { latitude: 40.0, longitude: 0.0, name: 'Europa' }
};

// 🌍 FUNCIÓN PARA OBTENER EL PAÍS DESDE COORDENADAS
const getCountryFromCoordinates = async (latitude: number, longitude: number) => {
    try {
        console.log(`🌍 Obteniendo país para: ${latitude}, ${longitude}`);
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geocode && geocode.length > 0) {
            const countryCode = geocode[0].isoCountryCode;
            const country = geocode[0].country;
            console.log(`🌍 País detectado: ${country} (${countryCode})`);
            return { code: countryCode, name: country };
        }
    } catch (error) {
        console.error('🌍 Error al obtener país:', error);
    }
    return null;
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
    const [mapCenter, setMapCenter] = useState(countryCenters.DEFAULT);
    const [locationLoading, setLocationLoading] = useState(true);

    // OBTENER DISPOSITIVOS CON COORDENADAS VÁLIDAS
    const devicesWithValidCoords = getDevicesWithValidCoordinates();

    // OBTENER UBICACIÓN DEL USUARIO PARA DETERMINAR EL PAÍS
    useEffect(() => {
        const determineMapCenter = async () => {
            try {
                // Verificar permisos
                const { status } = await Location.getForegroundPermissionsAsync();

                if (status !== 'granted') {
                    // Pedir permisos
                    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                    if (newStatus !== 'granted') {
                        console.log('🌍 Permisos denegados, usando centro por defecto');
                        setMapCenter(countryCenters.DEFAULT);
                        setLocationLoading(false);
                        return;
                    }
                }

                // Obtener ubicación del usuario
                await getLocation();

                if (lastKnownLocation) {
                    // Determinar país del usuario
                    const countryInfo = await getCountryFromCoordinates(
                        lastKnownLocation.latitude,
                        lastKnownLocation.longitude
                    );

                    if (countryInfo && countryInfo.code) {
                        const center = countryCenters[countryInfo.code] || countryCenters.DEFAULT;
                        console.log(`🌍 Centrando mapa en: ${center.name}`);
                        setMapCenter(center);
                    } else {
                        setMapCenter(countryCenters.DEFAULT);
                    }
                } else {
                    setMapCenter(countryCenters.DEFAULT);
                }
            } catch (error) {
                console.error('🌍 Error al determinar centro del mapa:', error);
                setMapCenter(countryCenters.DEFAULT);
            } finally {
                setLocationLoading(false);
            }
        };

        determineMapCenter();
    }, [lastKnownLocation, getLocation]);

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

    // VALIDAR SI HAY DISPOSITIVOS CON COORDENADAS VÁLIDAS
    useEffect(() => {
        // Si hay error en la carga de dispositivos
        if (devicesError) {
            Alert.alert(
                t("MapsScreen.errors.title"),
                t("MapsScreen.errors.loadDevicesError"),
                [
                    {
                        text: "OK",
                        onPress: () => {
                            //console.log("Usuario cerró el alert de error de datos");
                        }
                    }
                ]
            );
            return;
        }

        // Si no hay dispositivos
        if (!devicesLoading && devices.length === 0) {
            Alert.alert(
                t("MapsScreen.errors.noDevicesTitle"),
                t("MapsScreen.errors.noDevicesMessage"),
                [
                    {
                        text: "OK",
                        onPress: () => {
                            //console.log("Usuario cerró el alert de sin dispositivos");
                        }
                    }
                ]
            );
            return;
        }

    }, [devices, devicesWithValidCoords, devicesLoading, devicesError]);

    // Mostrar loading mientras se cargan los dispositivos o la ubicación
    if (devicesLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
                    {t("MapsScreen.loading.devices")}
                </Text>
            </View>
        );
    }

    // Si no hay dispositivos válidos, mostrar mensaje
    if (devicesWithValidCoords.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                {/* <Text style={{ fontSize: 18, color: '#666', textAlign: 'center' }}>
                    {devices.length === 0
                        ? "No hay dispositivos disponibles.\nVe a la pestaña Home para cargar los datos."
                        : `${devices.length} dispositivos encontrados, pero ninguno tiene coordenadas válidas.`
                    }
                </Text> */}
            </View>
        );
    }

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