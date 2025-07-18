import { View, ViewProps, StyleSheet } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocationStore } from '@/store/useLocationStore';
import { LatLng } from '@/infrastructure/intercafe/lat-Ing';
import FAB from './FAB';
import { ResponseAlarmaSite } from '@/infrastructure/intercafe/listapi.interface';

//  NUEVA INTERFAZ QUE INCLUYE ZOOM
interface MapCenter {
    latitude: number;
    longitude: number;
    latitudeDelta?: number;
    longitudeDelta?: number;
}

interface Props extends ViewProps {
    initialLocation: MapCenter; //  CAMBIAR TIPO PARA INCLUIR ZOOM
    showUserLocation?: boolean;
    devices?: ResponseAlarmaSite[];
}

const CustomMaps = ({ initialLocation, showUserLocation = true, devices = [], ...rest }: Props) => {
    const mapRef = useRef<MapView>(null);
    const [isFollowingUser, setIsFollowingUser] = useState(true);

    const { watchLocation, clearWatchLocation, lastKnownLocation, getLocation } = useLocationStore();

    useEffect(() => {
        watchLocation();
        return () => {
            clearWatchLocation();
        }
    }, []);

    useEffect(() => {
        if (lastKnownLocation && isFollowingUser) {
            moveCameraToLocation(lastKnownLocation);
        }
    }, [lastKnownLocation, isFollowingUser]);

    const moveCameraToLocation = (latlng: LatLng) => {
        if (!mapRef.current) return;

        mapRef.current.animateCamera({
            center: latlng,
        })
    }

    useEffect(() => {
        console.log("Dispositivos del backend:", devices.length);
    }, [devices]);

    const moveToCurrentLocation = async () => {
        if (!lastKnownLocation) {
            moveCameraToLocation(initialLocation);
        } else {
            moveCameraToLocation(lastKnownLocation);
        }
        const location = await getLocation();
        if (!location) return;
        moveCameraToLocation(location);
    }

    //  CALCULAR ZOOM INTELIGENTE
    const getInitialRegion = () => {
        // Si se proporciona zoom explícito, usarlo
        if (initialLocation.latitudeDelta && initialLocation.longitudeDelta) {
            console.log(" CustomMaps: Usando zoom proporcionado:", initialLocation.latitudeDelta);
            return {
                latitude: initialLocation.latitude,
                longitude: initialLocation.longitude,
                latitudeDelta: initialLocation.latitudeDelta,
                longitudeDelta: initialLocation.longitudeDelta,
            };
        }

        // Fallback: zoom automático basado en dispositivos (comportamiento anterior)
        const autoZoom = devices.length > 0 ? 0.5 : 10;
        console.log(" CustomMaps: Usando zoom automático:", autoZoom);
        return {
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
            latitudeDelta: autoZoom,
            longitudeDelta: autoZoom,
        };
    };

    return (
        <View {...rest}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={showUserLocation}
                initialRegion={getInitialRegion()} //  USAR FUNCIÓN INTELIGENTE
                onTouchStart={() => setIsFollowingUser(false)}
            >
                {/*  SOLO MARKERS DE DISPOSITIVOS DEL BACKEND */}
                {devices
                    .filter(device => device.latitude !== 0 && device.longitude !== 0)
                    .map((device, index) => (
                        <Marker
                            key={`device-${device.mac}-${device.idSite}-${index}`}
                            coordinate={{
                                latitude: device.latitude,
                                longitude: device.longitude,
                            }}
                            title={device.farmName}
                            description={device.siteName}
                            pinColor="red"
                        />
                    ))
                }
            </MapView>

            {/*  SOLO FABs DE NAVEGACIÓN */}
            <FAB
                iconName={isFollowingUser ? 'walk-outline' : 'accessibility-outline'}
                onPress={() => setIsFollowingUser(!isFollowingUser)}
                style={{
                    bottom: 140,
                    right: 20
                }}
            />

            {/* <FAB
                iconName='compass-outline'
                onPress={moveToCurrentLocation}
                style={{
                    bottom: 80,
                    right: 20
                }}
            /> */}
        </View>
    )
}

export default CustomMaps

const styles = StyleSheet.create({
    map: {
        width: "100%",
        height: "100%"
    }
})