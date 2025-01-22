import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./(tabs)/HomeScreen";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();


export type RootStackParamList = {
    HomeScreen: undefined; // HomeScreen no necesita parámetros
    DeviceDetails: { mac: number }; // DeviceDetails espera un parámetro `mac`
};

export default function HomeStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="DeviceDetails"
                component={DeviceDetailsScreen}
                options={{ headerTitle: "Detalles del Dispositivo" }}
            />
        </Stack.Navigator>
    );
}

