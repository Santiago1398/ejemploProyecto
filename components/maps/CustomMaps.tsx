import { View, ViewProps, StyleSheet, Alert } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LatLng } from '@/infrastructure/interface/lat-lng';
import MapView, { Marker } from 'react-native-maps';
import { useLocationStore } from '@/store/useLocationStore';
import FAB from 'components/maps/FAB'

interface Props extends ViewProps {
    initialLocation: LatLng;
    showUserLocation?: boolean

}

const CustomMaps = ({ initialLocation, showUserLocation = true, ...rest }: Props) => {
    const mapRef = useRef<MapView>(null);
    const [isFollowingUser, setIsFollowingUser] = useState(true);


    const { watchLocation, clearWatchLocation, lastKnownLocation, getLocation, saveLocations, saveLocation } = useLocationStore();

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
        console.log("Ubicaciones guardadas:", saveLocations);
    }, [saveLocations]);

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

    const onSaveLocationPress = async () => {
        Alert.alert("Guardar Ubicacion", "¿Desea guardar la ubicacion actual?", [

            {
                text: "Cancelar",
                style: "cancel"
            },
            {
                text: "Guardar",
                onPress: async () => {
                    await saveLocation();
                }
            }
        ])
    };

    return (
        <View {...rest}>
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation={showUserLocation}
                initialRegion={{
                    latitude: initialLocation.latitude,
                    longitude: initialLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                onTouchStart={() => setIsFollowingUser(false)}
            >
                {/* MARCADORES DE UBICACIONES GUARDADAS */}

                {saveLocations.map((location, index) => (
                    <Marker
                        key={index}
                        coordinate={location}
                        title={`Ubicacion ${index + 1}`}
                    />
                ))}
            </MapView>

            <FAB
                iconName='pin-outline'
                onPress={onSaveLocationPress}
                style={{
                    bottom: 140,
                    right: 20
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