import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { get, post } from "@/services/api";
import { useLocationStore } from "@/store/useLocationStore";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "app/HomeStack"
import { t } from "@/i18n/i18nConfig";

type DeviceMapRouteProp = RouteProp<RootStackParamList, 'DeviceMaps'>;
type DeviceMapNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DeviceMap() {
    const route = useRoute<DeviceMapRouteProp>();
    const navigation = useNavigation<DeviceMapNavigationProp>();
    const { deviceLocation, farmName, siteName, mac, idSite } = route.params;
    const { lastKnownLocation, getLocation } = useLocationStore();
    const [marketLocation, setMarketLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [locationSaved, setLocationSaved] = useState(false);

    // const fetchSavedLocation = async () => {
    //     try {
    //         const response = await get(`alarmtc/getLocation?mac=${mac}`);
    //         if (response && response.latitude && response.longitude) {
    //             setMarketLocation({
    //                 latitude: response.latitude,
    //                 longitude: response.longitude
    //             });
    //             setLocationSaved(true);
    //         } else {
    //             const location = await getLocation();
    //             if (location) {
    //                 setMarketLocation(location);
    //             } else {
    //                 t("DeviceMaps.errorTitle"),
    //                     t("DeviceMaps.error.mensaje")
    //             }
    //         }
    //         setLoading(false);
    //     } catch (error) {
    //         console.error("Error al obtener ubicación guardada:", error);
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     fetchSavedLocation();
    // }, [mac]);

    useEffect(() => {
        if (deviceLocation.latitude !== 0 && deviceLocation.longitude !== 0) {
            setLocationSaved(true);
            setMarketLocation(lastKnownLocation);
            setLoading(false);
        } else {
            if (lastKnownLocation) {
                setMarketLocation(lastKnownLocation);
                setLoading(false);
            } else {
                getLocation().then((location) => {
                    if (location) {
                        setMarketLocation(location);
                    } else {
                        Alert.alert(t("DeviceMaps.errorTitle"), t("DeviceMaps.error.obtener"));
                    }
                    setLoading(false);
                });
            }
        }
    }, [deviceLocation, lastKnownLocation, getLocation]);

    const handleSaveLocation = () => {
        Alert.alert(t("DeviceMaps.titulo.guardar"), t("DeviceMaps.mensaje.guardar"), [
            {
                text: t("DeviceMaps.cancelar"),
                style: "cancel"
            },
            {
                text: t("DeviceMaps.guardar"),
                onPress: async () => {
                    if (!marketLocation) {
                        Alert.alert(t("DeviceMaps.errorTitle"), t("DeviceMaps.error.obtener"));
                        return;
                    }
                    try {
                        const dataToSend = {
                            mac,
                            latitude: marketLocation.latitude,
                            longitude: marketLocation.longitude,
                            idSite
                        };

                        console.log("=== DATOS A ENVIAR AL BACKEND ===");
                        console.log("URL:", "alarmtc/saveLocation");
                        console.log("MAC:", mac);
                        console.log("Latitude:", marketLocation.latitude);
                        console.log("Longitude:", marketLocation.longitude);
                        console.log("ID Site:", idSite);
                        console.log("Datos completos:", JSON.stringify(dataToSend, null, 2));
                        console.log("================================");

                        const response = await post("alarmtc/saveLocation", dataToSend);

                        console.log("=== RESPUESTA DEL BACKEND ===");
                        console.log("Response:", JSON.stringify(response, null, 2));
                        console.log("============================");

                        setLocationSaved(true);
                        //Alert.alert(t("DeviceMaps.ubicacion.guardada.titulo"), t("DeviceMaps.ubicacion.guardada.mensaje"));
                        navigation.goBack();
                    } catch (error) {
                        console.error("=== ERROR AL GUARDAR ===");
                        console.error("Error completo:", error);
                        console.error("========================");
                        Alert.alert("Error", "No se pudo guardar la ubicación del dispositivo.");
                    }
                }
            }
        ]);
    };

    useEffect(() => {
        const checkPermissionsAndLocation = async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        t("DeviceMaps.permiso.necesario.titulo"),
                        t("DeviceMaps.permiso.necesario.mensaje"),
                        [
                            {
                                text: t("DeviceMaps.permiso.boton.ir"),
                                onPress: () => {
                                    navigation.goBack();
                                    navigation.navigate('SettingsScreen')
                                }
                            },
                            {
                                text: t("DeviceMaps.permiso.boton.cancelar"),
                                style: "cancel",
                                onPress: () => navigation.goBack()
                            }
                        ]
                    );
                    return;
                }
                //  fetchSavedLocation();
            } catch (error) {
                console.error("Error checking permissions:", error);
                setLoading(false);
            }
        };

        checkPermissionsAndLocation();
    }, []);

    if (loading || !marketLocation) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                    {!marketLocation
                        ? t("DeviceMaps.loading.verificando")
                        : t("DeviceMaps.loading.cargando")}
                </Text>
            </View>
        );
    }

    const initialRegion = {
        latitude: marketLocation?.latitude || 0,
        longitude: marketLocation?.longitude || 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation={true}
                onPress={(e) => setMarketLocation(e.nativeEvent.coordinate)}
            >
                <Marker
                    coordinate={marketLocation}
                    title={farmName || "Granja"}
                    description={siteName || "Nave"}
                    draggable={true}
                    onDragEnd={(e) => {
                        setMarketLocation(e.nativeEvent.coordinate);
                    }}
                />
            </MapView>

            {/* 🎨 BOTÓN CIRCULAR A LA DERECHA CON ÍCONO Y TEXTO */}
            <TouchableOpacity
                style={styles.circularRightButton}
                onPress={handleSaveLocation}
                activeOpacity={0.8}
            >
                <Ionicons
                    name="save-outline"
                    size={28}
                    color="#ffffff"
                    style={styles.saveIcon}
                />
                <Text style={styles.saveButtonText}>SAVE</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        width: "100%",
        height: "100%",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#fff'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666'
    },

    // 🎨 BOTÓN CIRCULAR MEJORADO CON ÍCONO MÁS GRANDE
    circularRightButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3498db', // Verde-turquesa
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2980b9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        // Más espacio para el contenido
        paddingVertical: 8,
    },

    // 🎨 ÍCONO MÁS GRANDE Y MODERNO
    saveIcon: {
        marginBottom: 4, // Más espacio entre ícono y texto
    },

    // 🎨 TEXTO DEL BOTÓN MÁS COMPACTO
    saveButtonText: {
        color: '#ffffff',
        fontSize: 10, // Más pequeño para dar más espacio al ícono
        fontWeight: 'bold',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
});