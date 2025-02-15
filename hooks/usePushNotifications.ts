import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/types/navigation";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,  // Sonido en la notificación
        shouldSetBadge: true,
    }),
});

interface SendPushOptions {
    to: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
}

// Función para enviar notificaciones push con Expo
async function sendPushNotification(options: SendPushOptions) {
    const { to, title, body, data } = options;

    const message = {
        to: to,
        sound: "default",
        title: title,
        body: body, // Aquí se mostrará el contenido personalizado
        data: data,
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
    });
}

// Función para registrar el dispositivo y obtener el token de Expo
async function registerForPushNotificationsAsync() {
    if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "red",
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();

        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            alert("Permiso denegado para recibir notificaciones push.");
            return;
        }

        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId) {
            alert("Project ID no encontrado");
            return;
        }

        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            return pushTokenString;
        } catch (e) {
            alert(`Error: ${e}`);
        }
    } else {
        alert("Debes usar un dispositivo físico para recibir notificaciones.");
    }
}

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null); // ✅ Inicializado correctamente
    const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectInterval = useRef<NodeJS.Timeout | null>(null);

    const route = useRoute<RouteProp<RootStackParamList, "DeviceDetails">>();
    const { device } = route.params;
    const { mac } = device;

    useEffect(() => {
        registerForPushNotificationsAsync().then((token) => {
            if (token) setExpoPushToken(token);
        });

        connectWebSocket();

        return () => {
            socketRef.current?.close();
            if (reconnectInterval.current) {
                clearTimeout(reconnectInterval.current);
            }
        };
    }, []);

    // ✅ **Corrección en el WebSocket**
    const connectWebSocket = () => {
        if (socketRef.current) return; // Evita conexiones duplicadas

        socketRef.current = new WebSocket("ws://37.187.180.179:8032");

        socketRef.current.onopen = () => {
            console.log("🔌 Conectado al WebSocket");
            socketRef.current?.send(JSON.stringify({ action: "subscribe", mac: mac }));
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("📡 Alarma recibida:", data);

            if (data.status === 1) {
                if (expoPushToken) { // ✅ Verificamos que expoPushToken exista
                    sendPushNotification({
                        to: [expoPushToken],
                        title: "⚠️ ¡Alarma activada!",
                        body: `📍 Granja: ${data.farmName}\n🏠 Sitio: ${data.siteName}\n🚨 Alarma: ${data.texto}`,
                        data: { action: "STOP_ALARM" },
                    });
                } else {
                    console.warn("⚠️ Token de notificación no disponible, no se envió la notificación.");
                }
            }
        };

        socketRef.current.onclose = () => {
            console.log("❌ WebSocket cerrado. Intentando reconectar...");
            socketRef.current = null;

            if (!reconnectInterval.current) {
                reconnectInterval.current = setTimeout(connectWebSocket, 3000);
            }
        };
    };

    return {
        expoPushToken,
        notifications,
        sendPushNotification,
    };
};


