// 1. notificationService.ts - Agrega WebSocket y lógica integrada

import { Alert, AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { post } from "@/services/api";
import { playAlarmSound, stopAlarmSound } from "@/utils/sound";
import { EventSubscription } from "expo-modules-core";

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
    private lastAlarmKey: string | null = null;
    private ws: WebSocket | null = null;

    constructor() {
        this.setupForegroundListener();
        this.setupNotificationResponseListener();
    }

    private async startAlarmPlayback() {
        console.log(" Reproduciendo sonido y marcando flags");
        await marcarAlarmaActiva();
        await playAlarmSound();
    }

    private _shouldTriggerAlarm(mac: number, idAlarm: number): boolean {
        const key = `${mac}_${idAlarm}`;
        if (this.lastAlarmKey === key) return false;
        this.lastAlarmKey = key;
        return true;
    }

    private setupForegroundListener() {
        this.foregroundSubscription = Notifications.addNotificationReceivedListener(
            async (notification) => {
                const data = notification.request.content.data;

                if (AppState.currentState === "active" && data?.isAlarm) {
                    console.log(" Ignorando notificación de sistema en foreground");
                    return;
                }

                if (data?.isAlarm && data?.mac && data?.idAlarm) {
                    const mac = Number(data.mac);
                    const idAlarm = Number(data.idAlarm);

                    if (this._shouldTriggerAlarm(mac, idAlarm)) {
                        console.log(" Foreground alarm:", mac, idAlarm);
                        this.onAlarmDetectedCallback?.(idAlarm);
                        this.onSiteAlarmDetectedCallback?.(mac);
                        await this.startAlarmPlayback();
                    }
                }
            }
        );
    }

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

    public shouldTriggerAlarm(mac: number, idAlarm: number): boolean {
        return this._shouldTriggerAlarm(mac, idAlarm);
    }

    public connectWebSocket() {
        if (this.ws) return;

        this.ws = new WebSocket("wss://portaltest.cticontrol.com/ws-test");
        //{"mac":20600001,"idAlarm":12,"isAlarm":true}


        this.ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                const mac = data.mac;
                const idAlarm = data.idAlarm;

                if (data.isAlarm && this._shouldTriggerAlarm(mac, idAlarm)) {
                    console.log(" WebSocket: alarma recibida", mac, idAlarm);
                    this.onAlarmDetectedCallback?.(idAlarm);
                    this.onSiteAlarmDetectedCallback?.(mac);
                    //await this.startAlarmPlayback();
                    //await AsyncStorage.setItem("alarma_activa_pendiente", "true");

                }
            } catch (e) {
                console.error(" Error procesando mensaje WebSocket:", e);
            }
        };

        this.ws.onclose = () => {
            console.log("🔌 WebSocket cerrado");
            this.ws = null;
        };

        this.ws.onerror = (err) => {
            console.error(" WebSocket error:", err);
        };
    }

    public disconnectWebSocket() {
        this.ws?.close();
        this.ws = null;
    }

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

            await post("alarmtc/users/push-token", {
                token,
                userId,
                deviceType: Platform.OS,
            });
        } catch (error) {
            console.error("Error registrando dispositivo:", error);
        }
    }

    public setOnAlarmDetected(callback: (idAlarm: number) => void) {
        this.onAlarmDetectedCallback = callback;
    }

    public setOnSiteAlarmDetected(callback: (mac: number) => void) {
        this.onSiteAlarmDetectedCallback = callback;
    }

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

    public disconnect() {
        stopAlarmSound();
        this.foregroundSubscription?.remove();
        this.responseSubscription?.remove();
        this.disconnectWebSocket();
        this.foregroundSubscription = null;
        this.responseSubscription = null;
    }
}

export const notificationService = new NotificationService();
