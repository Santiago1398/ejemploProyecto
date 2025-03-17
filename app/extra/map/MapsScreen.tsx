import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/HomeStack';

import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import CustomMaps from '@/components/maps/CustomMaps';


//type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

//export default function MapsScreen() {
//const navigation = useNavigation<MapScreenNavigationProp>();
const MapsScreen = () => {
    return (
        <View >
            <CustomMaps
                initialLocation={{
                    latitude: 37.78825,
                    longitude: -122.4324
                }}

            />
            {/* <MapView style={styles.map}
                //Esto es para desabilitar en el maps puntos intereses como los resturantes sitios etc
                //showsPointsOfInterest={false} 
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >

            </MapView>*/}
            {  /* <Button
                title="Ir a Permisos"
                onPress={() => navigation.navigate('permissions')}
            /> */}
        </View>
    );
}

export default MapsScreen







