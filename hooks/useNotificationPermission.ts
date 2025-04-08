import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

export const useNotificationPermission = () => {
    const [hasPermission, setHasPermission] = useState(false);

    const requestPermission = async () => {
        try {
            // Verificar si ya preguntamos antes
            const hasAskedBefore = await AsyncStorage.getItem('hasAskedForNotifications');
            if (hasAskedBefore === 'true') {
                // Si ya preguntamos antes, no volver a preguntar
                return;
            }

            return new Promise((resolve) => {
                Alert.alert(
                    "Notificaciones",
                    "¿Deseas recibir notificaciones de alarmas?",
                    [
                        {
                            text: "No",
                            style: "cancel",
                            onPress: async () => {
                                setHasPermission(false);
                                // Guardar que ya preguntamos
                                await AsyncStorage.setItem('hasAskedForNotifications', 'true');
                                resolve(false);
                            }
                        },
                        {
                            text: "Sí",
                            onPress: async () => {
                                const token = await registerForPushNotificationsAsync();
                                setHasPermission(!!token);
                                // Guardar que ya preguntamos
                                await AsyncStorage.setItem('hasAskedForNotifications', 'true');
                                resolve(!!token);
                            }
                        }
                    ]
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