import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, //Muestra una alerta de notificacion 
        shouldPlaySound: true, //Reproduce un sonido cuando se recibe una notificacion 
        shouldSetBadge: true, // Ajusta el badge (contador de notificaciones) en el icono de la aplicacion
    }),
});

interface sendPushOptions {
    to: string[];  //Una lista de tokens de dispositivos que recibiran la notificacion
    title: string;
    body: string;
    data?: Record<string, any>;
}


//Envia notificaciones push usando el servicio de Expo
async function sendPushNotification(options: sendPushOptions) {
    const { to, title, body, data } = options;

    const message = {
        to,
        sound: "default",
        title,
        body,
        data,
    };
    //Usa esta Api para enviar la notificacion con esto el backend envia la notoificacion
    await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
    });
}

//Verifica si el dispositivo tiene permisos para recibir notificaciones y si los tiene
// solicita permisos al usuario
async function registerForPushNotificationsAsync() {
    if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        //Importante , aqui pregunta una vez si quiere recibir notificaciones 
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            alert("Permission not granted for notifications!");
            return;
        }
        //Genera el token unico para el dispositivo utilizando Expo "getExpoPushToeknAsync"
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log({ [Platform.OS]: pushToken });
        return pushToken;
    } else {
        alert("Must use physical device for push notifications");
    }
}

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState(""); //Almacerna el token
    const [notifications, setNotifications] = useState<Notifications.Notification[]>([]); //Guarda las notificaciones recibidas

    //Aqui llama para obtener el token del dispositivo con el "register" y luego lo actualiza el estado con "expoPushToekn"
    useEffect(() => {
        registerForPushNotificationsAsync()
            .then((token) => setExpoPushToken(token || ""))
            .catch((error) => console.error(error));

        //Esto se ejecuta cuando se recibe una notificacion 
        const notificationListener = Notifications.addNotificationReceivedListener((notification) =>
            setNotifications((prev) => [notification, ...prev])
        );
        //Esto se ejecita cuando el usuario interactua con una notificacion al tocarla por ejemeplo
        const responseListener = Notifications.addNotificationResponseReceivedListener((response) =>
            console.log(response)
        );

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    //expoPushToken: Token del dispositivo para enviar notificaciones.
    //notifications: Lista de notificaciones recibidas.
    //sendPushNotification: Función para enviar notificaciones.
    return { expoPushToken, notifications, sendPushNotification };
};



