import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";
import HomeScreen from "./(tabs)/HomeScreen";
const Stack = createNativeStackNavigator<RootStackParamList>();


export type RootStackParamList = {
    HomeScreen: undefined; // HomeScreen no necesita parámetros
    DeviceDetails: { mac: number, farmName: string, siteName: string }; // DeviceDetailsScreen espera  parámetro 
    BottonMaster: { mac: number }; // Bottton Master  espera un parámetro `mac`
    Map: undefined;          // Si la pantalla "Map" no recibe params
    permissions: undefined;  // Si la pantalla "permissions" no recibe params
    // Agrega más pantallas si quieres
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

