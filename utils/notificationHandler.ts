// utils/notificationHandler.ts
import * as Notifications from 'expo-notifications';
import { stopAlarmSound } from './sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function handleInitialNotification() {
    try {
        const response = await Notifications.getLastNotificationResponseAsync();
        const data = response?.notification?.request?.content?.data;

        if (data?.isAlarm) {
            console.log("📲 App abierta desde notificación de alarma");
            await stopAlarmSound();
            await AsyncStorage.removeItem("alarmPlaying");
        }
    } catch (error) {
        console.log("❌ Error verificando notificación inicial", error);
    }
}
