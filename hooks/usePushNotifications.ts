import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

interface sendPushOptions {
    to: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
}

async function sendPushNotification(options: sendPushOptions) {
    const { to, title, body, data } = options;

    const message = {
        to,
        sound: "default",
        title,
        body,
        data,
    };

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
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            alert("Permission not granted for notifications!");
            return;
        }

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
    const [expoPushToken, setExpoPushToken] = useState("");
    const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);

    useEffect(() => {
        registerForPushNotificationsAsync()
            .then((token) => setExpoPushToken(token || ""))
            .catch((error) => console.error(error));

        const notificationListener = Notifications.addNotificationReceivedListener((notification) =>
            setNotifications((prev) => [notification, ...prev])
        );

        const responseListener = Notifications.addNotificationResponseReceivedListener((response) =>
            console.log(response)
        );

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    return { expoPushToken, notifications, sendPushNotification };
};



