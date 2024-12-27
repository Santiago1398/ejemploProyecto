import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DeviceDetailsScreen from '@/components/DeviceDetailsScreen';
import { RootStackParamList } from '@/types/navigation';
import HomeScreen from './(tabs)/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();


export default function HomeStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="DeviceList" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DeviceDetails" component={DeviceDetailsScreen} options={{ headerTitle: "Detalles del Dispositivo" }} />
        </Stack.Navigator>
    );
}
