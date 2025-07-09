import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";
import AlarmasScreen from "./(tabs)/AlarmasScreen";
import { PaperProvider } from "react-native-paper";
import DeviceMaps from "./extra/map/DeviceMaps";
import Explotacion from "@/components/Explotacion";
import ConfiguracionTC5 from "@/components/ConfiguracionTC5";

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootStackParamList = {
    HomeScreen: undefined;
    DeviceDetails: {
        mac: number;
        farmName: string;
        siteName: string;
        latitude: number;
        longitude: number;
        idSite: number;
        buildPortalRef: number;
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
    Explotacion: {
        mac: number;
        token: string;
        idioma: string;
        siteName: string;
        farmName: string;
        buildPortalRef: number;
    };
    ConfiguracionTC5: {
        mac: number;
        token: string;
        idioma: string;
        farmName: string;
    };
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
                    options={{
                        title: "Detalles del Dispositivo",
                        headerShown: false,
                    }}
                />

                <Stack.Screen
                    name="DeviceMaps"
                    component={DeviceMaps}
                    options={{ headerTitle: "Ubicación del Dispositivo" }}
                />

                <Stack.Screen
                    name="Explotacion"
                    component={Explotacion}
                    options={({ route }) => ({
                        headerShown: true,
                        title: route.params.farmName,
                    })}
                />

                <Stack.Screen
                    name="ConfiguracionTC5"
                    component={ConfiguracionTC5}
                    options={({ route }) => ({
                        headerShown: true,
                        title: route.params.farmName,
                    })}
                />
            </Stack.Navigator>
        </PaperProvider>
    );
}