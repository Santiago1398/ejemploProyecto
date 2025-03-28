import { useState } from 'react';
import { Alert } from 'react-native';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

export const useNotificationPermission = () => {
    const [hasPermission, setHasPermission] = useState(false);

    const requestPermission = () => {
        return new Promise((resolve) => {
            Alert.alert(
                "Notificaciones",
                "¿Deseas recibir notificaciones de alarmas?",
                [
                    {
                        text: "No",
                        style: "cancel",
                        onPress: () => {
                            setHasPermission(false);
                            resolve(false);
                        }
                    },
                    {
                        text: "Sí",
                        onPress: async () => {
                            const token = await registerForPushNotificationsAsync();
                            setHasPermission(!!token);
                            resolve(!!token);
                        }
                    }
                ]
            );
        });
    };

    return { hasPermission, requestPermission };
};