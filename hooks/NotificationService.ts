import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from '@/services/api';
import { playAlarmSound, stopAlarmSound } from '@/utils/sound';
import { messaging } from '@/config/firebaseConfig';

// Configurar manejador global de notificaciones
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
    private notificationSubscription: Notifications.Subscription | null = null;

    constructor() {
        // Configurar respuesta a las notificaciones
        this.setupNotificationResponse();
    }

    //Configura el manejador para cuando el usuario toca una notificación
    private setupNotificationResponse() {
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            console.log('Notificación tocada:', data);

            // Si es una alarma, detener el sonido
            if (data?.isAlarm) {
                stopAlarmSound();
            }

            // Aquí podrías agregar lógica para navegar a una pantalla específica
        });

        // Guardar una referencia para poder limpiarla después
        this.notificationSubscription = responseListener;
    }

    async registerDevice(userId?: number): Promise<string | null> {
        try {
            // Solicitar permisos de FCM
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (!enabled) {
                console.log('Permisos de notificación denegados');
                return null;
            }

            // Registrar el dispositivo para notificaciones remotas (solo para iOS)
            if (Platform.OS === 'ios') {
                await messaging().registerDeviceForRemoteMessages();
            }

            // Obtener token FCM
            const fcmToken = await messaging().getToken();
            if (fcmToken) {
                // Guardar localmente
                await AsyncStorage.setItem('fcmToken', fcmToken);

                // Enviar al servidor si hay userId
                if (userId) {
                    await this.sendTokenToServer(fcmToken, userId);
                }

                // Configurar listeners y WebSocket
                this.setupNotificationListeners();
                this.setupWebSocket(fcmToken);

                return fcmToken;
            }
            return null;
        } catch (error) {
            console.error('Error registrando dispositivo:', error);
            return null;
        }
    }

    private async sendTokenToServer(token: string, userId: number) {
        try {
            await post('alarmtc/users/push-token', {
                token,
                userId,
                deviceType: Platform.OS //PARA SABER SI ES ANDORID O IOS
            });
            console.log('Token FCM enviado al servidor');
        } catch (error) {
            console.error('Error enviando token al servidor:', error);
        }
    }

    /**
     * Configura los listeners para las notificaciones FCM
     */
    private setupNotificationListeners() {
        // 1. Cuando la app está en primer plano
        messaging().onMessage(async remoteMessage => {
            console.log('Mensaje en primer plano:', remoteMessage);

            const { notification, data } = remoteMessage;

            if (notification) {
                const isAlarm = data?.isAlarm === 'true' || data?.type === 'alarm';

                // Mostrar notificación local cuando la app está en primer plano
                this.showLocalNotification({
                    title: notification.title || 'Nueva notificación',
                    body: notification.body || '',
                    data: data || {},
                    isAlarm
                });

                // Si es alarma, reproducir sonido
                if (isAlarm) {
                    playAlarmSound();
                }
            }
        });

        // 2. Cuando el usuario toca una notificación mientras la app está en segundo plano
        messaging().onNotificationOpenedApp(remoteMessage => {
            console.log('Notificación abrió la app desde segundo plano:', remoteMessage);

            // Detener sonido de alarma si corresponde
            const data = remoteMessage.data || {};
            if (data.isAlarm === 'true' || data.type === 'alarm') {
                stopAlarmSound();
            }
        });

        // 3. Cuando se actualiza el token FCM
        messaging().onTokenRefresh(async newToken => {
            console.log('Token FCM actualizado:', newToken);

            // Guardar el nuevo token
            await AsyncStorage.setItem('fcmToken', newToken);

            // Actualizar en el servidor si hay userId guardado
            const userIdStr = await AsyncStorage.getItem('userId');
            if (userIdStr) {
                const userId = parseInt(userIdStr);
                await this.sendTokenToServer(newToken, userId);
            }
        });

        // 4. Verificar si la app fue abierta desde una notificación
        messaging()
            .getInitialNotification()
            .then(remoteMessage => {
                if (remoteMessage) {
                    console.log('App abierta por notificación:', remoteMessage);

                    // Detener sonido de alarma si corresponde
                    const data = remoteMessage.data || {};
                    if (data.isAlarm === 'true' || data.type === 'alarm') {
                        stopAlarmSound();
                    }
                }
            });

        // 5. Configurar manejador para mensajes en segundo plano
        messaging().setBackgroundMessageHandler(async remoteMessage => {
            console.log('Mensaje en segundo plano:', remoteMessage);
            // Los mensajes en segundo plano son manejados automáticamente por FCM
        });
    }

    private setupWebSocket(token: string) {
        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
            return; // Ya está conectado
        }

        try {
            this.webSocket = new WebSocket("ws://37.187.180.179:8032");

            this.webSocket.onopen = () => {
                console.log("WebSocket conectado");
                // Enviar token FCM para identificar la conexión
                const message = { action: "subscribe", token };
                this.webSocket?.send(JSON.stringify(message));
            };

            this.webSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("Mensaje WebSocket recibido:", data);

                    if (data.status === 1) {
                        // Es una alarma
                        playAlarmSound();

                        // Mostrar notificación local
                        this.showLocalNotification({
                            title: "¡Alarma activada!",
                            body: `Granja: ${data.farmName}\nSitio: ${data.siteName}\nAlarma: ${data.texto}`,
                            data: { ...data, isAlarm: true },
                            isAlarm: true
                        });
                    }
                } catch (error) {
                    console.error('Error procesando mensaje WebSocket:', error);
                }
            };

            this.webSocket.onerror = (error) => {
                console.error("Error en WebSocket:", error);
            };

            this.webSocket.onclose = (event) => {
                console.log(`WebSocket cerrado: Código ${event.code}, Razón: ${event.reason}`);
                this.webSocket = null;

                // Reconectar solo si no fue cerrado intencionalmente
                if (event.code !== 1000) {
                    if (this.reconnectInterval) {
                        clearTimeout(this.reconnectInterval);
                    }
                    this.reconnectInterval = setTimeout(() => {
                        this.reconnectWebSocket();
                    }, 3000);
                }
            };
        } catch (error) {
            console.error('Error iniciando WebSocket:', error);
            if (this.reconnectInterval) {
                clearTimeout(this.reconnectInterval);
            }
            this.reconnectInterval = setTimeout(() => {
                this.reconnectWebSocket();
            }, 5000);
        }
    }

    private async reconnectWebSocket() {
        const token = await AsyncStorage.getItem('fcmToken');
        if (token) {
            this.setupWebSocket(token);
        }
    }

    private async showLocalNotification({
        title,
        body,
        data,
        isAlarm = false
    }: {
        title: string;
        body: string;
        data: any;
        isAlarm?: boolean;
    }) {
        try {
            const notificationContent: Notifications.NotificationContentInput = {
                title,
                body,
                data: { ...data, isAlarm },
                sound: isAlarm ? true : 'default',
                priority: isAlarm
                    ? Notifications.AndroidNotificationPriority.MAX
                    : Notifications.AndroidNotificationPriority.HIGH,
                vibrate: isAlarm ? [0, 250, 250, 250] : undefined,
                color: isAlarm ? '#FF3B30' : '#007AFF',
            };

            await Notifications.scheduleNotificationAsync({
                content: notificationContent,
                trigger: null, // Mostrar inmediatamente
            });
        } catch (error) {
            console.error('Error mostrando notificación local:', error);
        }
    }


    async subscribeToTopic(topic: string): Promise<boolean> {
        try {
            await messaging().subscribeToTopic(topic);
            console.log(`Suscrito al tema: ${topic}`);
            return true;
        } catch (error) {
            console.error(`Error al suscribirse al tema ${topic}:`, error);
            return false;
        }
    }


    async unsubscribeFromTopic(topic: string): Promise<boolean> {
        try {
            await messaging().unsubscribeFromTopic(topic);
            console.log(`Desuscrito del tema: ${topic}`);
            return true;
        } catch (error) {
            console.error(`Error al desuscribirse del tema ${topic}:`, error);
            return false;
        }
    }

    disconnect() {
        // Detener sonido si está sonando
        stopAlarmSound();

        // Eliminar suscripción a notificaciones
        if (this.notificationSubscription) {
            this.notificationSubscription.remove();
            this.notificationSubscription = null;
        }

        // Cerrar WebSocket
        if (this.webSocket) {
            this.webSocket.close(1000, "Desconexión intencional");
            this.webSocket = null;
        }

        // Limpiar intervalo de reconexión
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }
}

// Exportar una instancia única del servicio
export const notificationService = new NotificationService();