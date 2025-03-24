import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";
import { Provider as PaperProvider } from "react-native-paper";
import HomeScreen from "./(tabs)/HomeScreen";
import Menu3Puntos from "@/components/Menu3Puntos";
import DeviceMaps from "./extra/map/DeviceMaps";
const Stack = createNativeStackNavigator<RootStackParamList>();


export type RootStackParamList = {
    HomeScreen: undefined;
    DeviceDetails: { mac: number, farmName: string, siteName: string, latitude: number; longitude: number; }; // DeviceDetailsScreen espera  parámetro 
    BottonMaster: { mac: number };
    Map: undefined;
    DeviceMaps: {
        deviceLocation: { latitude: number; longitude: number };
        farmName: string;
        siteName: string;
        mac: number;
    };
    permissions: undefined;
    // Agrega más pantallas si quieres
};

export default function HomeStack() {
    return (
        <PaperProvider>
            <Stack.Navigator>
                <Stack.Screen
                    name="HomeScreen"
                    component={HomeScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="DeviceDetails"
                    component={DeviceDetailsScreen}
                    options={({ route }) => ({
                        headerTitle: "Detalles del Dispositivo", headerRight: () => <Menu3Puntos device={route.params} />
                    })}

                />
                <Stack.Screen
                    name="DeviceMaps"
                    component={DeviceMaps}
                    options={{ headerTitle: "Ubicación del Dispositivo" }}
                />
            </Stack.Navigator>
        </PaperProvider>
    );


}

