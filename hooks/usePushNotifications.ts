import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, //Muestra una alerta de notificacion
        shouldPlaySound: true, //Reproduce un sonido cuando se recibe una notificacion 
        shouldSetBadge: true,  // Ajusta el badge (contador de notificaciones) en el icono de la aplicacion
    }),
});

interface SendPushOptions {
    to: string[];  //Una lista de tokens de dispositivos que recibiran la notificacion
    title: string;
    body: string;
    data?: Record<string, any>;
}

//Envia notificaciones push usando el servicio de Expo
async function sendPushNotification(options: SendPushOptions) {
    const { to, title, body, data } = options;

    const message = {
        to: to,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    //Usa esta Api para enviar la notificacion con esto el backend envia la notoificacion
    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}

function handleRegistrationError(errorMessage: string) {
    alert(errorMessage);
    throw new Error(errorMessage);
}

//Verifica si el dispositivo tiene permisos para recibir notificaciones y si los tiene solicita permisos al usuario
async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            // IMPORTANTE
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            handleRegistrationError(
                'Permission not granted to get push token for push notification!'
            );
            return;
        }

        //Genera el token unico para el dispositivo utilizando Expo "getExpoPushToeknAsync"
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;
        if (!projectId) {
            handleRegistrationError('Project ID not found');
        }
        try {
            const pushTokenString = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
            console.log({ [Platform.OS]: pushTokenString });
            return pushTokenString;
        } catch (e: unknown) {
            handleRegistrationError(`${e}`);
        }
    } else {
        handleRegistrationError('Must use physical device for push notifications');
    }
}

let areListenersReady = false;

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notifications, setNotifications] = useState<
        Notifications.Notification[]
    >([]);

    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    //Aqui llama para obtener el token del dispositivo con el "register" y luego lo actualiza el estado con "expoPushToekn"
    useEffect(() => {
        if (areListenersReady) return;

        registerForPushNotificationsAsync()
            .then((token) => setExpoPushToken(token ?? ''))
            .catch((error: any) => setExpoPushToken(`${error}`));
    }, []);

    useEffect(() => {
        if (areListenersReady) return;

        areListenersReady = true;

        //Esto se ejecuta cuando se recibe una notificacion 
        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                setNotifications((prevNotifications) => [
                    notification,
                    ...prevNotifications,
                ]);
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener((response) => {
                console.log(JSON.stringify(response, null, 2));

                const { chatId } = response.notification.request.content.data;

                if (chatId) {
                    //router.push(`/chat/${chatId}`);
                }
            });

        return () => {
            notificationListener.current &&
                Notifications.removeNotificationSubscription(
                    notificationListener.current
                );
            responseListener.current &&
                Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return {

        //expoPushToken: Token del dispositivo para enviar notificaciones.
        //notifications: Lista de notificaciones recibidas.
        //sendPushNotification: Función para enviar notificaciones.

        // Properties
        expoPushToken,
        notifications,

        // Methods
        sendPushNotification,
    };
};