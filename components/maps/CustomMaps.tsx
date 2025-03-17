import { View, ViewProps, StyleSheet } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LatLng } from '@/infrastructure/interface/lat-lng';
import MapView from 'react-native-maps';
import { useLocationStore } from '@/store/useLocationStore';
import FAB from 'components/maps/FAB'

interface Props extends ViewProps {
    initialLocation: LatLng;
    showUserLocation?: boolean

}

const CustomMaps = ({ initialLocation, showUserLocation = true, ...rest }: Props) => {
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
    return (
        <View {...rest}>
            <MapView ref={mapRef}
                onTouchStart={() => setIsFollowingUser(false)}
                style={styles.map}
                //Esto es para desabilitar en el maps puntos intereses como los resturantes sitios etc
                //showsPointsOfInterest={false} 
                showsUserLocation={showUserLocation}
                initialRegion={{
                    latitude: initialLocation.latitude,
                    longitude: initialLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            />

            <FAB
                iconName={isFollowingUser ? 'walk-outline' : 'accessibility-outline'}
                onPress={() => setIsFollowingUser(!isFollowingUser)}
                style={{
                    bottom: 80,
                    right: 20
                }}
            />
            <FAB
                iconName='compass-outline'
                onPress={moveToCurrentLocation}
                style={{
                    bottom: 20,
                    right: 20
                }}
            />


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