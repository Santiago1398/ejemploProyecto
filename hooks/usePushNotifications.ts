import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { getMessaging, onMessage } from "firebase/messaging";
import { Audio } from "expo-av";
import { app } from "@/config/firebaseConfig";
import { globalAlarmSound } from "@/utils/globalSound";
import { useAuthStore } from "@/store/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { post } from "@/services/api";
import { getToken } from "firebase/messaging";

const messaging = getMessaging(app);

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
        console.log(" Deteniendo sonido de alarma...");
        await globalAlarmSound.sound.stopAsync();
        await globalAlarmSound.sound.unloadAsync();
        globalAlarmSound.sound = null;
    }
};

// Configurar notificaciones
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
        alert("Debes usar un dispositivo físico para recibir notificaciones.");
        return null;
    }

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
        // Obtener token de FCM (Firebase Cloud Messaging)
        const pushTokenString = await getToken(messaging, { vapidKey: "BI_sg_fVIgI6cq5pA3N8qY-UVlVOnPpklMOH-BJYxz4w9HmKoUAYs0OWzUPSCkNZi3hu8GfT-AAr-JzR7cc7Psw" });

        console.log("Token de notificación obtenido:", pushTokenString);
        await AsyncStorage.setItem("expoPushToken", pushTokenString);

        //  Enviar token al backend
        await post(`alarmtc/token?userId=${userId}&token=${pushTokenString}`, {});

        return pushTokenString;
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
                if (token) setExpoPushToken(token);
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

    // Manejar notificaciones en segundo plano
    useEffect(() => {
        if (messaging) {
            onMessage(messaging, (payload) => {
                console.log("Notificación recibida:", payload);

                const newNotification = {
                    request: {
                        identifier: payload.messageId || Math.random().toString(),
                        content: {
                            title: payload.notification?.title ?? "Alarma",
                            body: payload.notification?.body ?? "Se activó una alarma.",
                            data: payload.data || {},
                        },
                    },
                };

                setNotifications((prev) => [...prev, newNotification as Notifications.Notification]);

                if (payload.data?.action === "STOP_ALARM") {
                    stopAlarmSound();
                } else {
                    playAlarmSound();
                }

                Notifications.scheduleNotificationAsync({
                    content: {
                        title: payload.notification?.title ?? "Alarma",
                        body: payload.notification?.body ?? "Se activó una alarma.",
                        data: payload.data,
                    },
                    trigger: null,
                });
            });
        }
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
                        body: ` Granja: ${data.farmName}\n Sitio: ${data.siteName}\n Alarma: ${data.texto}`,
                        data: { action: "STOP_ALARM" },
                    },
                    trigger: null,
                });
            }
        };

        socketRef.current.onclose = () => {
            console.log(" WebSocket cerrado. Intentando reconectar...");
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
