import * as Location from 'expo-location';
import { PermissionStatus } from '@/infrastructure/interface/location';


export const requestLocationPermission = async (): Promise<PermissionStatus> => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
        manualPermissionRequest();
        return PermissionStatus.GRANTED;
    }
    return PermissionStatus.DENIED;
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
    };
};


export const manualPermissionRequest = async () => {
    //Laznzar los ajutes de la aplicacion

};
