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
import AlarmasScreen from "./(tabs)/AlarmasScreen";
import Explotacion from "@/components/Explotacion";
import ConfiguracionTC5 from "@/components/ConfiguracionTC5";
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
const Stack = createNativeStackNavigator<RootStackParamList>();


export type RootStackParamList = {
    Home: undefined;
    openDrawer: undefined;
    DeviceDetails: {
        device: {
            mac: number;
            farmName: string;
            siteName: string;
            latitude: number;
            longitude: number;
            idSite: number;
        };
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
    AlarmasScreen: undefined;
    Explotacion: {
        mac: number;
        token: string;
        idioma: string;
        siteName: string;
        farmName: string;
        idSite: number;
    };
    ConfiguracionTC5: {
        mac: number;
        token: string;
        idioma: string;
        siteName: string;
        farmName: string;
        idSite: number;
    };
    EditarPrioridadScreen: undefined;


}

export default function HomeStack() {
    return (
        <PaperProvider>
            <Stack.Navigator >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={({ navigation }) => ({
                        headerShown: true,
                        headerTitle: "Home",
                        headerTitleAlign: "center",
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                                <Ionicons name="menu" size={28} color="#000" style={{ marginLeft: 12 }} />
                            </TouchableOpacity>
                        ),
                    })}
                />

                <Stack.Screen
                    name="DeviceDetails"
                    component={DeviceDetailsScreen}
                    options={({ route }) => ({
                        // headerShown: false,
                        headerTitleAlign: "center",
                        title: route.params.device.farmName,
                        headerLeft: () => null,
                        headerRight: () => <Menu3Puntos device={route.params.device}

                        />,
                    })}
                />


                <Stack.Screen
                    name="DeviceMaps"
                    component={DeviceMaps}
                    options={{ headerTitle: "Ubicación del Dispositivo" }}

                />
                <Stack.Screen
                    name="AlarmasScreen"
                    component={AlarmasScreen}
                    options={{ headerTitle: "Alarmas" }}

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
                {/* <Stack.Screen name="EditarPrioridadScreen" component={EditarPrioridadScreen} /> */}

            </Stack.Navigator>
        </PaperProvider>
    );


}