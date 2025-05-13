import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Layout from "./_layout";
import { stopAlarmSound } from "@/utils/sound";
import { Text, View, Button, Modal } from 'react-native';

export default function App() {
    const [ready, setReady] = useState(false);
    // const [showAlarmDialog, setShowAlarmDialog] = useState(false);

    // useEffect(() => {
    //     const checkAlarm = async () => {
    //         const alarm = await AsyncStorage.getItem("alarmPlaying");
    //         if (alarm === "true") {
    //             console.log("🔔 Mostrando diálogo porque hay alarma activa");
    //             setShowAlarmDialog(true);
    //         }
    //         setReady(true);
    //     };s

    //     checkAlarm();
    // }, []);


    useEffect(() => {
        const prepare = async () => {
            // 🟢 Nuevo: detectar si ya hay una alarma activa al abrir app
            const alarm = await AsyncStorage.getItem("alarmPlaying");
            if (alarm === "true") {
                console.log("🔊 App iniciada con alarma activa");
                await AsyncStorage.setItem("alarma_activa_pendiente", "true");
            }

            // 🔥 Si se abrió desde una notificación tocada
            const last = await Notifications.getLastNotificationResponseAsync();
            const data = last?.notification?.request?.content?.data;

            if (data?.isAlarm) {
                console.log("🔥 App abierta desde notificación con isAlarm");
                await AsyncStorage.setItem("alarmPlaying", "true");
            }

            setReady(true); // Siempre al final
        };

        prepare();

        // 🔔 Listener permanente por si tocan la notificación estando ya abierta
        const subscription = Notifications.addNotificationResponseReceivedListener(async response => {
            const data = response.notification.request.content.data;
            if (data?.isAlarm) {
                console.log("📲 Notificación tocada con app viva o background");
                await stopAlarmSound();
                await AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
            }
        });

        return () => subscription.remove();
    }, []);


    if (!ready) return null;

    return (
        <NavigationContainer>
            <Layout />
        </NavigationContainer>
    );
}
