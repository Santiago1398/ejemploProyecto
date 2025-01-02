import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./(tabs)/HomeScreen";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";

const Stack = createNativeStackNavigator();

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
