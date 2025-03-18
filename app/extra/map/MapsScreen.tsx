import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
//import { useNavigation } from '@react-navigation/native';
//import { StackNavigationProp } from '@react-navigation/stack';
//import { RootStackParamList } from '@/app/HomeStack';

import CustomMaps from '@/components/maps/CustomMaps';
import { useLocationStore } from '@/store/useLocationStore';


//type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

//export default function MapsScreen() {
//const navigation = useNavigation<MapScreenNavigationProp>();
const MapsScreen = () => {

    const { lastKnownLocation, getLocation } = useLocationStore();

    useEffect(() => {
        if (lastKnownLocation === null) {
            getLocation();
        }

    }, []);

    if (lastKnownLocation === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator
                />

            </View>
        )
    }

    return (
        <View >
            <CustomMaps
                initialLocation={lastKnownLocation}
            />

            {  /* <Button
                title="Ir a Permisos"
                onPress={() => navigation.navigate('permissions')}
            /> */}
        </View>
    );
}

export default MapsScreen







