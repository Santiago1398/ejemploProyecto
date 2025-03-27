import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { get, post } from "@/services/api";
import { useLocationStore } from "@/store/useLocationStore";
import FAB from "@/components/maps/FAB";
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "app/HomeStack"








type DeviceMapRouteProp = RouteProp<RootStackParamList, 'DeviceMaps'>;
type DeviceMapNavigationProp = NativeStackNavigationProp<RootStackParamList>;


export default function DeviceMap() {
    const route = useRoute<DeviceMapRouteProp>();
    const navigation = useNavigation<DeviceMapNavigationProp>();
    const { deviceLocation, farmName, siteName, mac } = route.params;
    const { lastKnownLocation, getLocation } = useLocationStore();
    const [marketLocation, setMarketLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [locationSaved, setLocationSaved] = useState(false);

    //Entonces 
    const fetchSavedLocation = async () => {
        try {
            const response = await get(`alarmtc/getLocation?mac=${mac}`);
            if (response && response.latitude && response.longitude) {
                setMarketLocation({
                    latitude: response.latitude,
                    longitude: response.longitude
                });
                setLocationSaved(true);
            } else {
                // Si no hay ubicación guardada, usar la ubicación actual
                const location = await getLocation();
                if (location) {
                    setMarketLocation(location);
                } else {
                    Alert.alert("Error", "No se pudo obtener tu ubicación.");
                }
            }
            setLoading(false);
        } catch (error) {
            console.error("Error al obtener ubicación guardada:", error);
            setLoading(false);
        }
    };
    useEffect(() => {
        // Primero intentamos obtener la ubicación guardada del backend
        fetchSavedLocation();
    }, [mac]);

    useEffect(() => {
        // Si deviceLocation es distinto de 0,0 (ya se ha guardado una ubicación)
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
                        Alert.alert("Error", "No se pudo obtener tu ubicación.");
                    }
                    setLoading(false);
                });
            }
        }
    }, [deviceLocation, lastKnownLocation, getLocation]);

    const handleSaveLocation = () => {
        Alert.alert("Guardar Ubicacion", "¿Desea guardar la ubicacion actual?", [
            {
                text: "Cancelar",
                style: "cancel"
            },
            {
                text: "Guardar",
                onPress: async () => {
                    if (!marketLocation) {
                        Alert.alert("Error", "No se pudo obtener tu ubicación.");
                        return;
                    }
                    try {
                        // Enviamos todos los datos en el body al backend
                        await post("alarmtc/saveLocation?", {
                            mac,
                            latitude: marketLocation.latitude,
                            longitude: marketLocation.longitude,
                        });
                        setLocationSaved(true);
                        Alert.alert("Ubicación Guardada", "La ubicación del dispositivo ha sido guardada correctamente.");
                        navigation.goBack(); // Regresa a la pantalla anterior
                    } catch (error) {
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
                    // Si no hay permisos, navegar a Settings
                    Alert.alert(
                        "Permisos necesarios",
                        "Necesitas habilitar los permisos de ubicación para usar esta función",
                        [
                            {
                                text: "Ir a Configuración",
                                onPress: () => {
                                    navigation.goBack();
                                    navigation.navigate('SettingsScreen')
                                }
                            },
                            {
                                text: "Cancelar",
                                style: "cancel",
                                onPress: () => navigation.goBack()
                            }
                        ]
                    );
                    return;
                }
                // Si hay permisos, obtener ubicación
                fetchSavedLocation();
            } catch (error) {
                console.error("Error checking permissions:", error);
                setLoading(false);
            }
        };

        checkPermissionsAndLocation();
    }, []);

    // Modificar el loading screen para mostrar un mensaje más informativo
    if (loading || !marketLocation) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>
                    {!marketLocation ? "Verificando permisos..." : "Cargando ubicación..."}
                </Text>
            </View>
        );
    }
    // Supongamos que tienes:
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
                showsUserLocation={!locationSaved}
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
            <FAB
                iconName='pin-outline'
                onPress={handleSaveLocation}
                style={{
                    bottom: 80,
                    right: 20
                }}
            />
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
    }

});
