import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { get, post } from "@/services/api";
import { useLocationStore } from "@/store/useLocationStore";
import FAB from "@/components/maps/FAB";
export type RootStackParamList = {
    DeviceMaps: {
        deviceLocation: {
            latitude: number;
            longitude: number;
        };
        farmName: string;
        siteName: string;
        mac: number;
    };
};

type DeviceMapRouteProp = RouteProp<RootStackParamList>;

export default function DeviceMap() {
    const route = useRoute<DeviceMapRouteProp>();
    const navigation = useNavigation();
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


    if (loading || !marketLocation) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // Supongamos que tienes:
    const initialRegion = {
        latitude:
            deviceLocation.latitude === 0 && lastKnownLocation
                ? lastKnownLocation.latitude
                : deviceLocation.latitude,
        longitude:
            deviceLocation.longitude === 0 && lastKnownLocation
                ? lastKnownLocation.longitude
                : deviceLocation.longitude,
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
                    bottom: 100,
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
    },
});
