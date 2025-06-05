import React, { PropsWithChildren, useEffect } from 'react'
import { usePermissionsStore } from '@/store/usePermissions'
import { PermissionStatus } from '@/infrastructure/intercafe/location'
import { router } from 'expo-router'
//import App from '@/app/App'
import { AppState } from 'react-native'

const PermissionsCkeckProvider = ({ children }: PropsWithChildren) => {

    const { locationStatus, checkLocationPermission } = usePermissionsStore()

    useEffect(() => {
        console.log("llega hasta aqui")
        if (locationStatus === PermissionStatus.GRANTED) {
            router.replace("/extra/map/MapsScreen")
        } else if (locationStatus !== PermissionStatus.CHECKING) {

            //router.replace("/extra/permissions/PermissionScreen")
            router.replace("./extra/permissions/PermissionScreen")
        }
    }, [locationStatus])
    console.log("llega  ooo  hasta aqui")

    useEffect(() => {
        checkLocationPermission()
    }, [])

    // Estar pendiente cuando el estado de la aplicacion cambie

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                checkLocationPermission();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);


    return <>{children}</>
}

export default PermissionsCkeckProvider