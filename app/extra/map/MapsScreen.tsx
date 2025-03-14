import React from 'react';
import { View, Text, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/app/HomeStack';

type MapScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Map'>;

export default function MapsScreen() {
    const navigation = useNavigation<MapScreenNavigationProp>();
    //const MapsScreen = () => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Pantalla de Mapa</Text>
            /*<Button
                title="Ir a Permisos"
                onPress={() => navigation.navigate('permissions')}
            />*/
        </View>
    );
}

//export default MapsScreen

//}

