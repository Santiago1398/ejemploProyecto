import React, { PropsWithChildren, useEffect } from 'react'
import { usePermissionsStore } from '@/store/usePermissions'
import { PermissionStatus } from '@/infrastructure/interface/location'
import { router } from 'expo-router'

const PermissionsCkeckProvider = ({ children }: PropsWithChildren) => {

    const { locationStatus, checkLocationPermission } = usePermissionsStore()

    useEffect(() => {

        if (locationStatus === PermissionStatus.GRANTED) {
            router.replace("./map")
        } else if (locationStatus !== PermissionStatus.CHECKING) {
            router.replace("./permissions")

        }
    }, [locationStatus])

    useEffect(() => {
        checkLocationPermission()
    }, [])

    // Estar pendiente cuando el estado de la aplicacion cambie


    return <>{children}</>
}

export default PermissionsCkeckProvider
