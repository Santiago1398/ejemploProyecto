import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { post } from "@/services/api";
import { playAlarmSound, stopAlarmSound } from "@/utils/sound";
import { EventSubscription } from "expo-modules-core";

//  Muy importante para notificaciones locales
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
    }),
});

export const marcarAlarmaActiva = async () => {
    await AsyncStorage.multiSet([
        ["alarmPlaying", "true"],
        ["alarma_activa_pendiente", "true"],
    ]);
};

class NotificationService {
    private foregroundSubscription: EventSubscription | null = null;
    private responseSubscription: EventSubscription | null = null;
    private onAlarmDetectedCallback?: (idAlarm: number) => void;
    private onSiteAlarmDetectedCallback?: (mac: number) => void;

    constructor() {
        this.setupForegroundListener();
        this.setupNotificationResponseListener();
    }

    // Reproduce sonido y marca persistencia
    private async startAlarmPlayback() {
        console.log("🚨 Reproduciendo sonido y marcando flags");
        await marcarAlarmaActiva();
        await playAlarmSound();
    }

    //  Se activa cuando se recibe notificación en primer plano
    private setupForegroundListener() {
        this.foregroundSubscription = Notifications.addNotificationReceivedListener(
            async (notification) => {
                const data = notification.request.content.data;
                if (data?.isAlarm) {
                    console.log(" Notificación en foreground con isAlarm");
                    if (data?.idAlarm) this.onAlarmDetectedCallback?.(Number(data.idAlarm));
                    if (data?.mac) this.onSiteAlarmDetectedCallback?.(Number(data.mac));
                    await this.startAlarmPlayback();
                }
            }
        );
    }

    //  Se activa cuando tocas una notificación
    private setupNotificationResponseListener() {
        this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
            async (response) => {
                const data = response.notification.request.content.data;
                console.log("📲 Notificación tocada:", data);
                if (data?.isAlarm && data?.idAlarm) {
                    this.onAlarmDetectedCallback?.(Number(data.idAlarm));
                    await stopAlarmSound();
                    await AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
                }
            }
        );
    }
    // Dentro de la clase NotificationService
    public async registerDevice(userId: number): Promise<void> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== "granted") {
                console.warn("Permisos de notificaciones denegados");
                return;
            }

            const { data: token } = await Notifications.getDevicePushTokenAsync();

            console.log(" Token FCM obtenido:", token);
            await AsyncStorage.setItem("deviceToken", token);

            // Lógica opcional: enviar token al backend
            await post("alarmtc/users/push-token", {
                token,
                userId,
                deviceType: Platform.OS,
            });
        } catch (error) {
            console.error("Error registrando dispositivo:", error);
        }
    }


    // 💡 Listeners externos
    public setOnAlarmDetected(callback: (idAlarm: number) => void) {
        this.onAlarmDetectedCallback = callback;
    }

    public setOnSiteAlarmDetected(callback: (mac: number) => void) {
        this.onSiteAlarmDetectedCallback = callback;
    }

    //  Mostrar notificación local
    public async showLocalNotification(notification: {
        title: string;
        data: any;
        isAlarm?: boolean;
    }) {
        try {
            let body = "";
            const { farmName, siteName, alarmText, body: messageBody } = notification.data;

            if (messageBody) {
                body = messageBody;
            } else {
                if (farmName) body += `Granja: ${farmName}\n`;
                if (siteName) body += `Sitio: ${siteName}\n`;
                if (alarmText) body += `${notification.isAlarm ? "Alarma" : "Mensaje"}: ${alarmText}`;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.title,
                    body: body.trim(),
                    data: { ...notification.data, isAlarm: notification.isAlarm },
                    sound: true,
                    priority: notification.isAlarm
                        ? Notifications.AndroidNotificationPriority.MAX
                        : Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
            });

            if (notification.isAlarm) {
                await this.startAlarmPlayback();
            }
        } catch (error) {
            console.error(" Error mostrando notificación local:", error);
        }
    }

    //  Cleanup (opcional)
    public disconnect() {
        stopAlarmSound();
        this.foregroundSubscription?.remove();
        this.responseSubscription?.remove();
        this.foregroundSubscription = null;
        this.responseSubscription = null;
    }
}

export const notificationService = new NotificationService();
