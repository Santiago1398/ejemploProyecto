import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";
import Menu3Puntos from "@/components/Menu3Puntos";
import AlarmasScreen from "./(tabs)/AlarmasScreen";
import { PaperProvider } from "react-native-paper";
import DeviceMaps from "./extra/map/DeviceMaps";

const Stack = createNativeStackNavigator<RootStackParamList>();
export type RootStackParamList = {
    HomeScreen: undefined;
    DeviceDetails: {
        mac: number;
        farmName: string;
        siteName: string;
        latitude: number;
        longitude: number;
    };
    DeviceMaps: {
        deviceLocation: {
            latitude: number;
            longitude: number;
        };
        farmName: string;
        siteName: string;
        mac: number;
    };
    AlarmasScreen: undefined;
};

export default function AlarmasStack() {
    return (
        <PaperProvider>

            <Stack.Navigator>
                <Stack.Screen
                    name="AlarmasScreen"
                    component={AlarmasScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="DeviceDetails"
                    component={DeviceDetailsScreen}
                    options={({ route }) => ({
                        title: "Detalles del Dispositivo",
                        headerRight: () => <Menu3Puntos device={route.params} />
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
