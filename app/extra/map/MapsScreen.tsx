import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/HomeStack';
import CustomMaps from '@/components/maps/CustomMaps';
import { useLocationStore } from '@/store/useLocationStore';
import * as Location from 'expo-location';

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const MapsScreen = () => {
    const navigation = useNavigation<MapScreenNavigationProp>();
    const { lastKnownLocation, getLocation } = useLocationStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkPermissionsAndLocation = async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        "Permisos necesarios",
                        "Necesitas habilitar los permisos de ubicación para usar esta función",
                        [
                            {
                                text: "Ir a Configuración",
                                onPress: () => {
                                    navigation.goBack();
                                    navigation.navigate('Settings');
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
                await getLocation();
                setLoading(false);
            } catch (error) {
                console.error("Error checking permissions:", error);
                setLoading(false);
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