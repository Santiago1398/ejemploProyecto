import { View, Text, ViewProps, StyleSheet } from 'react-native'
import React from 'react'
import { LatLng } from '@/infrastructure/interface/lat-lng';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

interface Props extends ViewProps {
    initialLocation: LatLng;
    showUserLocation?: boolean

}

const CustomMaps = ({ initialLocation, showUserLocation = true, ...rest }: Props) => {
    return (
        <View {...rest}>
            <MapView style={styles.map}
                //Esto es para desabilitar en el maps puntos intereses como los resturantes sitios etc
                //showsPointsOfInterest={false} 
                showsUserLocation={showUserLocation}
                initialRegion={{
                    latitude: initialLocation.latitude,
                    longitude: initialLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >

            </MapView>
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