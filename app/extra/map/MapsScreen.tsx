import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/HomeStack';
import CustomMaps from '@/components/maps/CustomMaps';
import { useLocationStore } from '@/store/useLocationStore';
import * as Location from 'expo-location';
import { get } from '@/services/api';



interface DeviceLocation {
    mac: number;
    farmName: string;
    siteName: string;
    latitude: number;
    longitude: number;
}

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const MapsScreen = () => {
    const navigation = useNavigation<MapScreenNavigationProp>();
    const { lastKnownLocation, getLocation } = useLocationStore();
    const [loading, setLoading] = useState(true);
    const [deviceLocations, setDeviceLocations] = useState<DeviceLocation[]>([]);

    const fetchDeviceLocations = async () => {
        try {
            const response = await get('alarmtc/sites/saved/${mac}'); //Inventada 
            const data = await response.json();
            setDeviceLocations(data);
        } catch (error) {
            console.error('Error fetching device locations:', error);
        }
    };


    useEffect(() => {
        const checkPermissionsAndLocation = async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();

                if (status !== 'granted') {
                    // Mostrar alerta personalizada
                    Alert.alert(
                        "Permisos necesarios",
                        "Habilite la geolocalización para posicionar su TC5 en el mapa",
                        [
                            {
                                text: "Aceptar",
                                onPress: async () => {
                                    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                                    if (newStatus === 'granted') {
                                        await getLocation();
                                        await fetchDeviceLocations();
                                        setLoading(false);
                                    } else {
                                        Alert.alert(
                                            "Permisos denegados",
                                            "Debe permitir los permisos de ubicación para mostrar el mapa."
                                        );
                                        navigation.goBack();
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    // Ya tenía permisos
                    await getLocation();
                    await fetchDeviceLocations();
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error al verificar permisos:", error);
                Alert.alert(
                    "Error",
                    "Ocurrió un error al verificar los permisos de ubicación."
                );
                navigation.goBack();
            }
        };

        checkPermissionsAndLocation();
    }, []);


    if (loading || lastKnownLocation === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <CustomMaps
                initialLocation={lastKnownLocation}
                showUserLocation={true}
            />
        </View>
    );
};

export default MapsScreen;