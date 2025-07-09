import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { PermissionStatus } from '@/infrastructure/intercafe/location';
import { t } from "@/i18n/i18nConfig";


export const requestLocationPermission =
    async (): Promise<PermissionStatus> => {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            if (status === 'denied') {
                manualPermissionRequest();
            }

            return PermissionStatus.DENIED;
        }

        return PermissionStatus.GRANTED;
    };

export const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();

    switch (status) {
        case 'granted':
            return PermissionStatus.GRANTED;
        case 'denied':
            return PermissionStatus.DENIED;
        default:
            return PermissionStatus.UNDETERMINED;
    }
};

const manualPermissionRequest = async () => {
    Alert.alert(
        t("locations.alerta.titulo"),
        t("locations.alerta.mensaje"),
        [
            {
                text: t("locations.alerta.abrirAjustes"),
                onPress: () => {
                    Linking.openSettings();
                },
            },
            {
                text: t("locations.alerta.cancelar"),
                style: 'destructive',
            },
        ]
    );
};