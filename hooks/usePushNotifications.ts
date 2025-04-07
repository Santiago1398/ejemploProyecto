import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { stopAlarmSound } from '@/utils/sound';
import { notificationService } from './NotificationService';

export interface Notification {
    title: string;
    data: {
        farmName?: string;
        siteName?: string;
        alarmText?: string;
        type?: string;
    };
    isAlarm?: boolean;
}

export const usePushNotifications = () => {
    const { userId } = useAuthStore();
    const [devicePushToken, setDevicePushToken] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Paso 1: Inicializa notificaciones y registra dispositivo
    useEffect(() => {
        if (!userId) return;

        const initializeNotifications = async () => {
            try {
                // Recuperar notificaciones guardadas
                const savedNotifications = await AsyncStorage.getItem('savedNotifications');
                if (savedNotifications) {
                    setNotifications(JSON.parse(savedNotifications));
                }

                // Verificar token existente
                const storedToken = await AsyncStorage.getItem('deviceToken');
                if (storedToken) {
                    console.log('💾 Token recuperado de AsyncStorage:', storedToken);
                    setDevicePushToken(storedToken);
                    await notificationService.registerDevice(userId); // Por si el token cambió
                } else {
                    const newToken = await notificationService.registerDevice(userId);
                    console.log('🔑 Token registrado desde registerDevice:', newToken);
                    if (newToken) setDevicePushToken(newToken);
                }
            } catch (error) {
                console.error('Error inicializando notificaciones:', error);
            }
        };

        initializeNotifications();

        return () => {
            stopAlarmSound();
        };
    }, [userId]);

    // Paso 2: conectar WebSocket cuando el token esté disponible
    useEffect(() => {
        console.log('📡 Token actual en efecto de WebSocket:', devicePushToken);
        if (devicePushToken) {
            console.log('🧪 Conectando WebSocket desde usePushNotifications');
            notificationService.setupWebSocket(devicePushToken);
        }
    }, [devicePushToken]);

    // Paso 3: prueba forzada con AsyncStorage (solo para diagnóstico)
    useEffect(() => {
        const prueba = async () => {
            const token = await AsyncStorage.getItem('deviceToken');
            console.log('🔧 Token forzado manualmente desde AsyncStorage:', token);
            if (token) {
                notificationService.setupWebSocket(token);
            }
        };

        prueba();
    }, []);

    // Agrega nueva notificación al estado y guarda
    const addNotification = (notification: Notification) => {
        setNotifications((prev) => {
            const updated = [notification, ...prev].slice(0, 50);
            AsyncStorage.setItem('savedNotifications', JSON.stringify(updated)).catch((error) =>
                console.error('Error guardando notificaciones:', error)
            );
            return updated;
        });
    };

    const clearNotifications = () => {
        setNotifications([]);
        AsyncStorage.removeItem('savedNotifications').catch((error) =>
            console.error('Error eliminando notificaciones guardadas:', error)
        );
    };
    useEffect(() => {
        const conectar = async () => {
            const token = await AsyncStorage.getItem('deviceToken');
            console.log('🔧 Forzando conexión WebSocket desde AsyncStorage:', token);
            if (token) {
                notificationService.setupWebSocket(token);
            } else {
                console.warn('❗ No se encontró token para WebSocket');
            }
        };

        conectar();
    }, []);


    return {
        devicePushToken,
        notifications,
        addNotification,
        clearNotifications,
    };
};
