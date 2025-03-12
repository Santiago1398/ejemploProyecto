import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from '@/services/api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
    }),
});

export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        console.warn('Debes usar un dispositivo físico para las notificaciones');
        return null;
    }

    // Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Permiso denegado para notificaciones push');
        return null;
    }

    try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Token obtenido:', token);
        // Guarda el token en AsyncStorage
        await AsyncStorage.setItem('pushToken', token);
        await post('users/push-token', { token });
        return token;
    } catch (error) {
        console.error('Error obteniendo el token:', error);
        return null;
    }
}