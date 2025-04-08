import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";
import { Provider as PaperProvider } from "react-native-paper";
import HomeScreen from "./(tabs)/HomeScreen";
import Menu3Puntos from "@/components/Menu3Puntos";
import SettingsScreen from "./(tabs)/SettingsScreen";
import DeviceMaps from "./extra/map/DeviceMaps";
import MapsScreen from "./extra/map/MapsScreen";
import PermissionsScreen from "./extra/permissions/PermissionScreen";
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
    BottonMaster: {
        mac: number
    };
    MapsScreen: undefined;
    DeviceMaps: {
        deviceLocation: {
            latitude: number;
            longitude: number;
        };
        farmName: string;
        siteName: string;
        mac: number;
    };
    permissions: undefined;
    SettingsScreen: undefined;
    Settings: undefined;

};

export default function HomeStack() {
    return (
        <PaperProvider>
            <Stack.Navigator >
                <Stack.Screen
                    name="HomeScreen"
                    component={HomeScreen}
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

                <Stack.Screen
                    name="permissions"
                    component={PermissionsScreen}
                />

                <Stack.Screen
                    name="SettingsScreen"
                    component={SettingsScreen}
                    options={{ headerTitle: "Configuracion" }}
                />

                <Stack.Screen
                    name="MapsScreen"
                    component={MapsScreen}
                    options={{ headerTitle: "Mapas" }}
                />
            </Stack.Navigator>
        </PaperProvider>
    );


}
