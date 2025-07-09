import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/HomeStack';
import CustomMaps from '@/components/maps/CustomMaps';
import { useLocationStore } from '@/store/useLocationStore';
import * as Location from 'expo-location';
import { t } from "@/i18n/i18nConfig";
import { ResponseAlarmaSite } from '@/infrastructure/intercafe/listapi.interface';

type MapsScreenRouteProp = RouteProp<RootStackParamList, 'MapsScreen'>;
type MapScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const MapsScreen = () => {
    const navigation = useNavigation<MapScreenNavigationProp>();
    const route = useRoute<MapsScreenRouteProp>();

    // 🔥 VALIDAR QUE EXISTAN LOS PARÁMETROS
    const devices = route.params?.devices || []; // ✅ Fallback a array vacío

    const { lastKnownLocation, getLocation } = useLocationStore();
    const [loading, setLoading] = useState(true);

    // 🔥 DEBUG: Ver qué datos llegan
    useEffect(() => {
        console.log("🔥 DEBUG MapsScreen:");
        console.log("- route.params:", route.params);
        console.log("- devices length:", devices.length);
        console.log("- devices:", devices);
    }, [route.params, devices]);

    // 🔥 VALIDAR SI HAY DISPOSITIVOS AL CARGAR
    useEffect(() => {
        if (devices.length === 0) {
            console.warn("⚠️ No hay dispositivos para mostrar en el mapa");
            Alert.alert(
                t("MapsScreen.noDevices.title"),    // ✅ "Sin dispositivos" traducido
                t("MapsScreen.noDevices.message")   // ✅ "No hay dispositivos..." traducido
            );
            return;
        }
    }, [devices]);

    useEffect(() => {
        const checkPermissionsAndLocation = async () => {
            try {
                const { status } = await Location.getForegroundPermissionsAsync();

                if (status !== 'granted') {
                    Alert.alert(
                        t("MapsScreen.permission.title"),
                        t("MapsScreen.permission.message"),
                        [
                            {
                                text: t("MapsScreen.permission.accept"),
                                onPress: async () => {
                                    const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                                    if (newStatus === 'granted') {
                                        await getLocation();
                                        setLoading(false);
                                    } else {
                                        Alert.alert(
                                            t("MapsScreen.permission.deniedTitle"),
                                            t("MapsScreen.permission.deniedMessage")
                                        );
                                        navigation.goBack();
                                    }
                                }
                            }
                        ]
                    );
                } else {
                    await getLocation();
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error al verificar permisos:", error);
                Alert.alert(
                    t("MapsScreen.errorTitle"),
                    t("MapsScreen.errorMessage")
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
                devices={devices}
            />
        </View>
    );
};

export default MapsScreen;