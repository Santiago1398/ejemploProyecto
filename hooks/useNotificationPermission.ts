import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

export const useNotificationPermission = () => {
    const [hasPermission, setHasPermission] = useState(false);

    const requestPermission = async () => {
        try {
            const hasAskedBefore = await AsyncStorage.getItem('hasAskedForNotifications');
            if (hasAskedBefore === 'true') {
                return false;
            }

            return new Promise((resolve) => {
                Alert.alert(
                    "Notificaciones",
                    "Habilite las notificaciones para las alarmas TC5",
                    [
                        {
                            text: "Aceptar",
                            onPress: async () => {
                                const token = await registerForPushNotificationsAsync();
                                setHasPermission(!!token);
                                await AsyncStorage.setItem('hasAskedForNotifications', 'true');
                                resolve(!!token);
                            }
                        }
                    ],
                    { cancelable: false } // 👈 Importante para que no pueda cerrarse tocando fuera
                );
            });
        } catch (error) {
            console.error('Error al manejar permisos de notificaciones:', error);
        }
    };


    // Verificar el estado de los permisos al montar el componente
    useEffect(() => {
        const checkPermissionStatus = async () => {
            try {
                const hasAskedBefore = await AsyncStorage.getItem('hasAskedForNotifications');
                if (hasAskedBefore === 'true') {
                    const token = await AsyncStorage.getItem('pushToken');
                    setHasPermission(!!token);
                }
            } catch (error) {
                console.error('Error al verificar estado de permisos:', error);
            }
        };

        checkPermissionStatus();
    }, []);

    return { hasPermission, requestPermission };
};