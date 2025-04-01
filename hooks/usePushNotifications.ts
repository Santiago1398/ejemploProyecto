import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { stopAlarmSound } from '@/utils/sound';
import { notificationService } from './NotificationService';

// Tipo para las notificaciones guardadas
export interface Notification {
    id: string;
    title: string;
    body: string;
    data: any;
    date: Date;
    isAlarm?: boolean;
}

/**
 * Hook para manejar los permisos de notificaciones
 */
export const useNotificationPermission = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const [loading, setLoading] = useState(true);

    // Verificar y solicitar permisos
    const requestPermission = async () => {
        try {
            setLoading(true);

            // Verificar si ya preguntamos antes
            const hasAskedBefore = await AsyncStorage.getItem('hasAskedForNotifications');
            if (hasAskedBefore === 'true') {
                // Verificar si tenemos permiso actual
                const token = await AsyncStorage.getItem('fcmToken');
                setHasPermission(!!token);
                setLoading(false);
                return !!token;
            }

            return new Promise<boolean>((resolve) => {
                Alert.alert(
                    "Notificaciones",
                    "¿Deseas recibir notificaciones de alarmas?",
                    [
                        {
                            text: "No",
                            style: "cancel",
                            onPress: async () => {
                                setHasPermission(false);
                                await AsyncStorage.setItem('hasAskedForNotifications', 'true');
                                setLoading(false);
                                resolve(false);
                            }
                        },
                        {
                            text: "Sí",
                            onPress: async () => {
                                try {
                                    const token = await notificationService.registerDevice();
                                    setHasPermission(!!token);
                                    await AsyncStorage.setItem('hasAskedForNotifications', 'true');
                                    setLoading(false);
                                    resolve(!!token);
                                } catch (error) {
                                    console.error('Error al solicitar permisos:', error);
                                    setHasPermission(false);
                                    setLoading(false);
                                    resolve(false);
                                }
                            }
                        }
                    ]
                );
            });
        } catch (error) {
            console.error('Error al manejar permisos de notificaciones:', error);
            setLoading(false);
            return false;
        }
    };

    // Verificar el estado al cargar
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const token = await AsyncStorage.getItem('fcmToken');
                setHasPermission(!!token);
                setLoading(false);
            } catch (error) {
                console.error('Error verificando permisos:', error);
                setLoading(false);
            }
        };

        checkPermission();
    }, []);

    return { hasPermission, loading, requestPermission };
};

/**
 * Hook para manejar las notificaciones y WebSocket
 */
export const usePushNotifications = () => {
    const { userId } = useAuthStore();
    const [devicePushToken, setDevicePushToken] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Inicializar el servicio de notificaciones
    useEffect(() => {
        if (!userId) return;

        const initializeNotifications = async () => {
            try {
                // Cargar notificaciones guardadas
                const savedNotifications = await AsyncStorage.getItem('savedNotifications');
                if (savedNotifications) {
                    setNotifications(JSON.parse(savedNotifications));
                }

                // Obtener token existente o registrar dispositivo
                const storedToken = await AsyncStorage.getItem('fcmToken');

                if (storedToken) {
                    setDevicePushToken(storedToken);
                    // Registramos igualmente para configurar los listeners
                    await notificationService.registerDevice(userId);
                } else {
                    const newToken = await notificationService.registerDevice(userId);
                    setDevicePushToken(newToken);
                }
            } catch (error) {
                console.error('Error inicializando notificaciones:', error);
            }
        };

        initializeNotifications();

        // Limpieza al desmontar
        return () => {
            stopAlarmSound();
        };
    }, [userId]);

    // Función para agregar una nueva notificación
    const addNotification = (notification: Notification) => {
        setNotifications(prev => {
            const updated = [notification, ...prev].slice(0, 50); // Mantener solo las últimas 50

            // Guardar en AsyncStorage
            AsyncStorage.setItem('savedNotifications', JSON.stringify(updated))
                .catch(error => console.error('Error guardando notificaciones:', error));

            return updated;
        });
    };

    // Función para borrar notificaciones
    const clearNotifications = () => {
        setNotifications([]);
        AsyncStorage.removeItem('savedNotifications')
            .catch(error => console.error('Error eliminando notificaciones guardadas:', error));
    };



    return {
        devicePushToken,
        notifications,
        addNotification,
        clearNotifications,
    };
};