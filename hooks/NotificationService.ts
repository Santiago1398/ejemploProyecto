import { AppState, Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import { post } from "@/services/api";
import { playAlarmSound, stopAlarmSound } from "@/utils/sound";
import { useEffect } from "react";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";



export const marcarAlarmaActiva = async () => {
  await AsyncStorage.multiSet([
    ["alarmPlaying", "true"],
    ["alarma_activa_pendiente", "true"],
  ]);
};

class NotificationService {
  private onAlarmDetectedCallback?: (idAlarm: number) => void;
  private onSiteAlarmDetectedCallback?: (mac: number) => void;
  private lastAlarmKey: string | null = null;
  private ws: WebSocket | null = null;

  constructor() {
    this.setupFirebaseListeners(); 
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

  private setupFirebaseListeners() {
    console.log(" Configurando Firebase listeners...");
    
    // Firebase para foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log("Firebase mensaje en foreground:", remoteMessage);
      const data = remoteMessage.data;
      const mac = Number(data?.mac);
      const idAlarm = Number(data?.idAlarm);

      if (data?.isAlarm && this._shouldTriggerAlarm(mac, idAlarm)) {
        this.onAlarmDetectedCallback?.(idAlarm);
        this.onSiteAlarmDetectedCallback?.(mac);
        await this.startAlarmPlayback();
      }
    });

    // Firebase para background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      const data = remoteMessage?.data;
      console.log(" Firebase notificación tocada (background):", data);
      if (data?.isAlarm && data?.idAlarm) {
        this.onAlarmDetectedCallback?.(Number(data.idAlarm));
        stopAlarmSound();
        AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
      }
    });

    // Firebase para app cerrada
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        const data = remoteMessage?.data;
        if (data?.isAlarm && data?.idAlarm) {
          console.log(" Firebase app abierta desde notificación:", data);
          this.onAlarmDetectedCallback?.(Number(data.idAlarm));
          stopAlarmSound();
          AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
        }
      });


  }

  public connectWebSocket() {
    if (this.ws) return;

    this.ws = new WebSocket("wss://portaltest.cticontrol.com/ws-test");
      //{"mac":20600001,"idAlarm":1,"isAlarm":true}
    this.ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const mac = data.mac;
        const idAlarm = data.idAlarm;

        if (data.isAlarm && this._shouldTriggerAlarm(mac, idAlarm)) {
          console.log(" WebSocket: alarma recibida", mac, idAlarm);
          this.onAlarmDetectedCallback?.(idAlarm);
          this.onSiteAlarmDetectedCallback?.(mac);
        }
      } catch (e) {
        console.error("Error procesando mensaje WebSocket:", e);
      }
    };

    this.ws.onclose = () => {
      console.log(" WebSocket cerrado");
      this.ws = null;
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  public disconnectWebSocket() {
    this.ws?.close();
    this.ws = null;
  }

  public async registerDevice(userId: number): Promise<void> {
    try {
      const token = await this.getFCMToken();
      const telefono = await AsyncStorage.getItem("telefono");
      if (!token) {
        console.warn(" No se pudo obtener token");
        return;
      }

    /*   await post("alarmtc/users/push-token", {
        token,
        userId,
        deviceType: Platform.OS,
        telefono
      }); */

      const LOCAL_API = await get
      await fetch(`${LOCAL_API}/push-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, userId, deviceType: Platform.OS, telefono }),
            });
            console.log("✅ Token registrado en el backend");

      console.log("Dispositivo registrado exitosamente");
    } catch (error) {
      console.error(" Error registrando dispositivo:", error);
    }
  }

public async getFCMToken(): Promise<string | null> {
  try {
    const savedToken = await AsyncStorage.getItem("deviceToken");
    if (savedToken) {
      console.log("Token FCM recuperado desde AsyncStorage:", savedToken);
      return savedToken;
    }

    const authStatus = await messaging().requestPermission({
      alert: true,
      badge: true,
      sound: true,
    });

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Alert.alert("Error", "Permisos de notificaciones denegados");
      return null;
    }

    await messaging().registerDeviceForRemoteMessages();
    const fcmToken = await messaging().getToken();

    if (!fcmToken) {
      Alert.alert("Error", "Token FCM es null después del registro");
      return null;
    }

    console.log(" Nuevo token FCM obtenido:", fcmToken);
    await AsyncStorage.setItem("deviceToken", fcmToken);
    return fcmToken;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
   /*  Alert.alert(
      "ERROR CRÍTICO",
      `Error general:\n${errorMessage}\n\nVerifica:\n1. Bundle ID correcto\n2. Certificados APNs en Firebase\n3. GoogleService-Info.plist`
    ); */
    return null;
  }
}


  public setOnAlarmDetected(callback: (idAlarm: number) => void) {
    this.onAlarmDetectedCallback = callback;
  }

  public setOnSiteAlarmDetected(callback: (mac: number) => void) {
    this.onSiteAlarmDetectedCallback = callback;
  }

  public disconnect() {
    console.log(" Desconectando NotificationService");
    stopAlarmSound();

    this.disconnectWebSocket();
  }
}

export const notificationService = new NotificationService();