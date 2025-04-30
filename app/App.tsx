import { NavigationContainer } from "@react-navigation/native";
import Layout from "./_layout";
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from 'expo-notifications';
import { stopAlarmSound } from '@/utils/sound';
console.log("App.tsx");
export default function App() {

    // const configureNotificationChannel = async () => {
    //     try {
    //         if (Platform.OS === 'android') {
    //             console.log("Configurando para android");
    //             await Notifications.setNotificationChannelAsync('alarm-channel', {
    //                 name: 'Notificaciones por defecto',
    //                 importance: Notifications.AndroidImportance.MAX,
    //                 sound: 'alarmcar',
    //                 vibrationPattern: [0, 250, 250, 250],
    //                 lightColor: '#FF231F7C',
    //             });
    //         } else {
    //             console.log("Configurando para ios");
    //         }
    //     } catch (err) {
    //         console.error("Error configurando canal:", err);
    //     }
    // };


    // useEffect(() => {
    //     // Ejecutar canal + revisar si la notificación fue la que abrió la app
    //     console.log("Configurando useEffect canal de notificaciones");
    //     configureNotificationChannel();


    //     const checkInitialNotification = async () => {
    //         const response = await Notifications.getLastNotificationResponseAsync();
    //         const data = response?.notification?.request?.content?.data;

    //         if (data?.isAlarm) {
    //             console.log("App abierta desde notificación de alarma");
    //             stopAlarmSound();
    //         }
    //     };

    //     checkInitialNotification();
    // }, []);

    return (
        <NavigationContainer>
            <Layout />
        </NavigationContainer>
    );
}
