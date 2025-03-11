import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Audio } from "expo-av";
import { globalAlarmSound } from "@/utils/globalSound";
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { post } from "@/services/api";

// Función para reproducir sonido
const playAlarmSound = async () => {
    try {
        if (globalAlarmSound.sound) return;
        console.log("Reproduciendo sonido de alarma...");
        const { sound } = await Audio.Sound.createAsync(
            require("../assets/images/alarm-car-or-home-62554.mp3"),
            { shouldPlay: true, isLooping: true }
        );
        globalAlarmSound.sound = sound;
        await sound.playAsync();
    } catch (error) {
        console.error("Error al reproducir el sonido:", error);
    }
};

// Función para detener el sonido
const stopAlarmSound = async () => {
    if (globalAlarmSound.sound) {
        console.log("Deteniendo sonido de alarma...");
        await globalAlarmSound.sound.stopAsync();
        await globalAlarmSound.sound.unloadAsync();
        globalAlarmSound.sound = null;
    }
};

// Configurar notificaciones locales de Expo
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Registrar el dispositivo y enviar token al backend
async function registerForPushNotificationsAsync(userId: number) {
    if (!Device.isDevice) {
        // alert("Debes usar un dispositivo físico.");
        return null;
    }

    // Verifica y solicita permisos de notificación
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        alert("Permiso denegado para recibir notificaciones push.");
        return null;
    }

    try {

        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();

        if (!expoPushToken) {
            throw new Error("No se pudo obtener el token de Expo.");
        }

        console.log("Token obtenido:", expoPushToken);

        await AsyncStorage.setItem("expoPushToken", expoPushToken);

        // Envía el token al backend para que pueda enviar notificaciones
        await post(`alarmtc/token?userId=${userId}&token=${expoPushToken}`, {});

        return expoPushToken;
    } catch (e) {
        console.error("Error obteniendo el token:", e);
        return null;
    }
}

// Hook para manejar WebSocket y Notificaciones
export const usePushNotifications = () => {
    const { userId } = useAuthStore();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectInterval = useRef<NodeJS.Timeout | null>(null);
    const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);

    useEffect(() => {
        if (userId) {
            registerForPushNotificationsAsync(userId).then((token) => {
                if (token) {
                    setExpoPushToken(token);
                    console.log("Token de notificación actualizado:", token);
                }
            });

            connectWebSocket();
        }

        return () => {
            socketRef.current?.close();
            if (reconnectInterval.current) {
                clearTimeout(reconnectInterval.current);
            }
        };
    }, [userId]);

    useEffect(() => {

        const subscription = Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notificación recibida:", notification);


            setNotifications((prev) => [...prev, notification]);

            const data = notification.request.content.data || {};

            if (data.action === "STOP_ALARM") {
                stopAlarmSound();
            } else {
                playAlarmSound();
            }
        });

        return () => {

            subscription.remove();
        };
    }, []);

    // Conectar WebSocket
    const connectWebSocket = () => {
        if (socketRef.current) return;

        socketRef.current = new WebSocket("ws://37.187.180.179:8032");

        socketRef.current.onopen = () => {
            console.log("🔌 Conectado al WebSocket");
            socketRef.current?.send(JSON.stringify({ action: "subscribe" }));
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Alarma recibida:", data);

            if (data.status === 1) {
                playAlarmSound();
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: "¡Alarma activada!",
                        body: `Granja: ${data.farmName}\nSitio: ${data.siteName}\nAlarma: ${data.texto}`,
                        data: { action: "STOP_ALARM" },
                    },
                    trigger: null,
                });
            }
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket cerrado. Intentando reconectar...");
            socketRef.current = null;
            if (!reconnectInterval.current) {
                reconnectInterval.current = setTimeout(connectWebSocket, 3000);
            }
        };
    };

    return {
        expoPushToken,
        notifications,
    };
};
