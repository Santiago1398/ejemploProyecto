import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DeviceDetailsScreen from "@/components/DeviceDetailsScreen";
import { Provider as PaperProvider } from "react-native-paper";
import HomeScreen from "./(tabs)/HomeScreen";
import SettingsScreen from "./(tabs)/SettingsScreen";
import DeviceMaps from "./extra/map/DeviceMaps";
import MapsScreen from "./extra/map/MapsScreen";
import PermissionsScreen from "./extra/permissions/PermissionScreen";
import AlarmasScreen from "./(tabs)/AlarmasScreen";
import Explotacion from "@/components/Explotacion";
import ConfiguracionTC5 from "@/components/ConfiguracionTC5";
import { DrawerActions } from '@react-navigation/native';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EditarPrioridadScreen from "@/components/EditarPrioridadScreen";
import { t } from "../i18n/i18nConfig";
import { ResponseAlarmaSite } from "@/infrastructure/intercafe/listapi.interface";
import DeviceLocationMap from "./extra/map/DebiceLocationMap";
import HistoriaAlarmas from "@/components/HistoriaAlarmas";
import EstadisticasWeb from "@/components/EstadisticasWeb";
import RelaysScreen from "@/components/ActivacionRele";
import AlarmasActivasScreen from "@/components/AlarmasActivasScreen";
import { useAuthStore } from "@/store/authStore";



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
            buildingPortalRef: number;
            armed: boolean;
            alarmType: number;
            simulado?: boolean; //  NUEVO
        };
    };
    BottonMaster: {
        mac: number
    };
    MapsScreen: {
        devices: ResponseAlarmaSite[];

    }
    DeviceMaps: {
        deviceLocation: {
            latitude: number;
            longitude: number;
        };
        farmName: string;
        siteName: string;
        mac: number;
        idSite: number
    };
    permissions: undefined;
    SettingsScreen: undefined;
    Settings: undefined;
    AlarmasScreen: undefined;
    HistoriaAlarmas: {
        mac: number;
        token: string;
        idioma: string;
        siteName: string;
        farmName: string;
        idSite: number;
        buildingPortalRef: number;
        simulado?: boolean;

    };
    EstadisticasWeb: {
        mac: number;
        token: string;
        idioma: string;
        siteName: string;
        farmName: string;
        idSite: number;
        buildingPortalRef: number;
        simulado?: boolean;
        analogIds: number[]; // ⬅️  NUEVO
    };
    Explotacion: {
        mac: number;
        token: string;
        idioma: string;
        siteName: string;
        farmName: string;
        idSite: number;
        buildingPortalRef: number;
        simulado?: boolean;

    };
    ConfiguracionTC5: {
        mac: number;
        token: string;
        idioma: string;
        siteName: string;
        farmName: string;
        idSite: number;
        simulado?: boolean; //  NUEVO

    };
    EditarPrioridadScreen: undefined;
    Mantenimiento: undefined;
    SolicitarMantenimiento: undefined;
    DeviceLocationMap: {
        deviceLocation: {
            latitude: number;
            longitude: number;
        };
        farmName: string;
        siteName: string;
        mac: number;
        idSite: number;
    };
    ActivacionRele: {
        id: string
        siteName: string;
        farmName: string;
        mac: number;

    }
    AlarmasActivasScreen: {
        device: {
            id: string;
            userid: string;
            latitude: number;
            longitude: number;
            farmName: string;
            siteName: string;
            mac: number;
            idSite: number;
            buildingPortalRef: number;
            simulado?: boolean;
        };
        analogIds?: number[];
    };
}

export type RootDrawerParamList = {
    Home: undefined;
    Login: undefined;
    Map: undefined;
    permissions: undefined;
    Settings: undefined;
    Alarmas: undefined;
    EditarPrioridadScreen: undefined;
    Mantenimiento: undefined;
};

export default function HomeStack() {
    //  const token = useAuthStore((s) => s.token);

    return (
        <PaperProvider>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={({ navigation }) => ({
                        headerShown: false,
                        headerTitle: "Home",
                        headerTitleAlign: "center",
                        // headerLeft: () => (
                        //     <View style={{ marginLeft: 12 }}>
                        //         <TouchableOpacity
                        //             onPress={() => {
                        //                 console.log("🔥 HOME DRAWER BUTTON PRESIONADO");
                        //                 // Usar DrawerActions también aquí
                        //                 navigation.dispatch(DrawerActions.openDrawer());
                        //             }}
                        //             style={{
                        //                 width: 44,
                        //                 height: 44,
                        //                 justifyContent: 'center',
                        //                 alignItems: 'center',
                        //                 backgroundColor: 'rgba(0,255,0,0.2)', // DEBUG verde
                        //             }}
                        //         >
                        //             <Ionicons name="menu" size={28} color="#000" />
                        //         </TouchableOpacity>
                        //     </View>
                        // ),
                    })}
                />

                <Stack.Screen
                    name="DeviceDetails"
                    component={DeviceDetailsScreen}
                    options={{
                        headerShown: false, // ✅ OCULTAR el header de React Navigation
                    }}
                />

                <Stack.Screen
                    name="DeviceMaps"
                    component={DeviceMaps}
                    options={{
                        headerShown: true,
                        headerTitle: t("HomeStack.DeviceMaps.title")
                    }}
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
                    name="ActivacionRele"
                    component={RelaysScreen}
                    options={({ route }) => ({
                        headerShown: true,
                        title: route.params.farmName,
                        sub: route.params.siteName,


                    })} />

                <Stack.Screen
                    name="HistoriaAlarmas"
                    component={HistoriaAlarmas}
                    options={({ route }) => ({
                        headerShown: true,
                        title: route.params.farmName,
                        sub: route.params.siteName,

                    })}
                />

                <Stack.Screen
                    name="EstadisticasWeb"
                    component={EstadisticasWeb}
                    options={({ route }) => ({
                        headerShown: true,
                        title: route.params.farmName,
                        sub: route.params.siteName,

                    })}
                />

                <Stack.Screen
                    name="Explotacion"
                    component={Explotacion}
                    options={({ route }) => ({
                        headerShown: true,
                        title: route.params.farmName,
                        sub: route.params.siteName,

                    })}
                />

                <Stack.Screen
                    name="ConfiguracionTC5"
                    component={ConfiguracionTC5}
                    options={({ route }) => ({
                        headerShown: true,
                        title: route.params.farmName,
                        subTitle: route.params.siteName,

                    })}

                />

                <Stack.Screen
                    name="DeviceLocationMap"
                    component={DeviceLocationMap}
                    options={({ route }) => ({
                        headerShown: false,
                        // title: route.params.farmName,
                        // sub: route.params.siteName,

                    })}
                />

                <Stack.Screen
                    name="AlarmasActivasScreen"
                    component={AlarmasActivasScreen}
                    options={{
                        headerShown: true,
                        title: "Alarmas activas",
                    }}
                />


            </Stack.Navigator>
        </PaperProvider>
    );
}