import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from '@/services/api';
import { playAlarmSound, stopAlarmSound } from '@/utils/sound';
import { EventSubscription } from 'expo-modules-core';
//import messaging from '@react-native-firebase/messaging';



// Configuración global del manejador de notificaciones
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.MAX
    }),
});




class NotificationService {

    private webSocket: WebSocket | null = null;
    private reconnectInterval: NodeJS.Timeout | null = null;
    //private notificationSubscription: EventSubscription | null = null;
    private receivedNotifications: Notifications.Notification[] = [];
    private foregroundSubscription: EventSubscription | null = null;
    private responseSubscription: EventSubscription | null = null;

    private onAlarmDetectedCallback?: (idAlarm: number) => void;

    public setOnAlarmDetected(callback: (idAlarm: number) => void) {
        this.onAlarmDetectedCallback = callback;
    }

    private notifyAlarm(idAlarm: number) {
        if (this.onAlarmDetectedCallback) {
            this.onAlarmDetectedCallback(idAlarm);
        }
    }

    private onSiteAlarmDetectedCallback?: (mac: number) => void;

    public setOnSiteAlarmDetected(callback: (mac: number) => void) {
        this.onSiteAlarmDetectedCallback = callback;
    }

    private notifySiteAlarm(mac: string) {
        if (this.onSiteAlarmDetectedCallback) {
            this.onSiteAlarmDetectedCallback(Number(mac));
        }
    }


    public get notifications() {
        return this.receivedNotifications;
    }


    constructor() {
        this.setupNotificationResponse();
        this.setupForegroundListener();

    }

    private setupForegroundListener() {
        console.log(' Configurando listener de notificaciones en primer plano...');
        this.foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
            //Alert.alert("Notificación", "Recibida en primer plano: " + notification.request.content.title);
            this.receivedNotifications.push(notification);

            const data = notification.request.content.data;
            if (data?.isAlarm) {
                if (data.idAlarm) this.notifyAlarm(Number(data.idAlarm));
                if (data.mac) this.notifySiteAlarm(data.mac); // 👈 nuevo
                playAlarmSound();
            }
        });
    }


    // Maneja respuesta cuando se toca una notificación
    private setupNotificationResponse() {
        this.responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log(' Notificación tocada:', data);
            console.log(' Respuesta de notificación:', response);

            if (data?.isAlarm && data?.idAlarm) {
                this.notifyAlarm(Number(data.idAlarm));
                console.log(" Deteniendo sonido de alarma desde notificación");
                setTimeout(() => {
                    stopAlarmSound();
                }, 100);
            }

        });
    }


    // Registro del dispositivo y obtención del token push
    async registerDevice(userId?: number): Promise<string | null> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log(' Permisos de notificación denegados');
                return null;
            }

            const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
            console.log(' FCM Token:', fcmToken);

            if (fcmToken) {
                await AsyncStorage.setItem('deviceToken', fcmToken);
                if (userId) {
                    await this.sendTokenToServer(fcmToken, userId);
                }
                return fcmToken;
            }

            return null;
        } catch (error) {
            console.error(' Error registrando dispositivo:', error);
            return null;
        }
    }

    public async getFCMToken(userId?: number): Promise<string | null> {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log(' Permisos de notificaciones denegados');
                return null;
            }

            const { data: fcmToken } = await Notifications.getDevicePushTokenAsync();
            if (!fcmToken) {
                console.log('❌ No se pudo obtener el token FCM');
                return null;
            }

            console.log('✅ FCM Token:', fcmToken);
            await AsyncStorage.setItem('deviceToken', fcmToken);

            if (userId) {
                await this.sendTokenToServer(fcmToken, userId);
            }

            return fcmToken;
        } catch (error) {
            console.error('❌ Error obteniendo FCM token:', error);
            return null;
        }
    }

    // public async getExpoPushToken(): Promise<string | null> {
    //     try {
    //         const { status } = await Notifications.requestPermissionsAsync();
    //         if (status !== 'granted') {
    //             Alert.alert('Permiso de notificaciones denegado');
    //             return null;
    //         }

    //         const token = (await Notifications.getExpoPushTokenAsync()).data;
    //         console.log('Expo Push Token:', token);
    //         await AsyncStorage.setItem('expoPushToken', token);
    //         return token;
    //     } catch (error) {
    //         console.error('Error obteniendo Expo push token:', error);
    //         return null;
    //     }
    // }




    private async sendTokenToServer(token: string, userId: number) {
        try {
            await post('alarmtc/users/push-token', {
                token,
                userId,
                deviceType: Platform.OS,
            });
            console.log(' Token enviado al servidor');
        } catch (error) {
            console.error(' Error enviando token al servidor:', error);
        }
    }

    // 🔧 WebSocket para recibir alarmas en tiempo real
    public setupWebSocket(token: string) {
        console.log(" setupWebSocket fue llamado con token:", token);

        if (!token) {
            console.warn(" Token vacío, cancelando conexión WebSocket.");
            return;
        }

        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            console.log(" WebSocket ya estaba conectado.");
            return;
        }

        try {
            console.log(" Intentando conectar al WebSocket...");
            // this.webSocket = new WebSocket("wss://37.187.180.179:8032");
            this.webSocket = new WebSocket("wss://portaltest.cticontrol.com/ws-test");


            this.webSocket.onopen = () => {
                console.log(" WebSocket conectado correctamente.");
                const message = { action: "subscribe", token };
                this.webSocket?.send(JSON.stringify(message));
            };

            this.webSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.status === 1 && data.idAlarm) {
                        this.notifyAlarm(data.idAlarm);
                        if (data.mac) this.notifySiteAlarm(data.mac); // 👈 nuevo
                        // 👈 Notifica UI
                        playAlarmSound();
                        this.showLocalNotification({
                            title: "¡Alarma activada!",
                            data: {
                                farmName: data.farmName,
                                siteName: data.siteName,
                                alarmText: data.texto,
                                idAlarm: data.idAlarm,
                                mac: data.mac, // Importante incluir esto
                                type: 'alarm'
                            },
                            isAlarm: true
                        });
                    }
                } catch (error) {
                    console.error('Error procesando mensaje WebSocket:', error);
                }
            };

            this.webSocket.onerror = (error) => {
                console.error(" Error en WebSocket:", error);
            };

            this.webSocket.onclose = (event) => {
                console.warn(" WebSocket cerrado:", event.code, event.reason);
                this.webSocket = null;

                if (event.code !== 1000) {
                    if (this.reconnectInterval) clearTimeout(this.reconnectInterval);
                    this.reconnectInterval = setTimeout(() => {
                        this.reconnectWebSocket();
                    }, 3000);
                }
            };
        } catch (error) {
            console.error(' Error iniciando WebSocket:', error);
            if (this.reconnectInterval) clearTimeout(this.reconnectInterval);
            this.reconnectInterval = setTimeout(() => {
                this.reconnectWebSocket();
            }, 5000);
        }
    }

    private async reconnectWebSocket() {
        const token = await AsyncStorage.getItem('deviceToken');
        if (token) {
            console.log(" Reintentando conexión WebSocket...");
            this.setupWebSocket(token);
        }
    }

    public async showLocalNotification(notification: {
        title: string;
        data: any;
        isAlarm?: boolean;
    }) {
        try {
            let body = '';
            console.log(' Mostrando notificación local...');
            console.log(' Notificación:', notification);
            const { farmName, siteName, alarmText, body: messageBody } = notification.data;
            console.log(' Notificación local:', notification);
            console.log(' Datos de la notificación:', notification.data);

            if (messageBody) {
                body = messageBody;
            } else {
                if (farmName) body += `Granja: ${farmName}\n`;
                if (siteName) body += `Sitio: ${siteName}\n`;
                if (alarmText) body += `${notification.isAlarm ? 'Alarma' : 'Mensaje'}: ${alarmText}`;
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
                playAlarmSound();
            }
        } catch (error) {
            console.error(' Error mostrando notificación local:', error);
        }
    }



    disconnect() {
        stopAlarmSound();

        if (this.foregroundSubscription) {
            this.foregroundSubscription.remove();
            this.foregroundSubscription = null;
        }

        if (this.responseSubscription) {
            this.responseSubscription.remove();
            this.responseSubscription = null;
        }

        if (this.webSocket) {
            this.webSocket.close(1000, "Desconexión intencional");
            this.webSocket = null;
        }

        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

}

export const notificationService = new NotificationService();

