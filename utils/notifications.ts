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

export async function registerForPushNotificationsAsync(userId?: number) {
    if (!Device.isDevice) {
        console.warn('Las notificaciones solo funcionan en dispositivos físicos');
        return null;
    }

    try {
        // Verificar permisos existentes
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

        // Verificar token existente
        const tokenGuardado = await AsyncStorage.getItem('pushToken');
        if (tokenGuardado && userId) {
            await post('users/push-token', {
                token: tokenGuardado,
                userId
            });
            return tokenGuardado;
        }

        // Generar nuevo token
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Nuevo token generado:', token);

        await AsyncStorage.setItem('pushToken', token);

        if (userId) {
            await post('users/push-token', { token, userId });
            console.log('Token enviado al servidor para usuario:', userId);
        }

        return token;
    } catch (error) {
        console.error('Error en el proceso de notificaciones:', error);
        return null;
    }
}