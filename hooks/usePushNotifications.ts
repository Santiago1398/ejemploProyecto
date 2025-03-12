// src/hooks/usePushNotifications.ts
import { useState, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { playAlarmSound, stopAlarmSound } from "@/utils/sound";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { useAuthStore } from "@/store/authStore";

export const usePushNotifications = () => {
    const { userId } = useAuthStore();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

    // Registrar token y conectar WebSocket cuando se loguea el usuario
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

    // Escuchar notificaciones en primer plano
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
        return () => subscription.remove();
    }, []);

    // Función para conectar a WebSocket
    const connectWebSocket = () => {
        if (socketRef.current) return;
        socketRef.current = new WebSocket("ws://37.187.180.179:8032");
        socketRef.current.onopen = () => {
            console.log("Conectado al WebSocket");
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

    return { expoPushToken, notifications };
};
