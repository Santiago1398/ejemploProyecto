import React, { useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerContent from "../components/DrawerContent";
import LoginScreen from "./login";
import TabsNavigator from "./(tabs)/TabsNavigator";
import PermissionsCkeckProvider from "@/presentation/providers/PermissionsCkeckProvider";
//import ExtraStack from "./extra/Extra";
import { useAuthStore } from "@/store/authStore";
import HomeScreen from "./(tabs)/HomeScreen";
import PermissionsScreen from "./extra/permissions/PermissionScreen";
import MapsScreen from "./extra/map/MapsScreen";
import { stopAlarmSound } from "@/utils/sound";
import { Platform } from "react-native";
import * as Notifications from 'expo-notifications';

//import { Stack } from "expo-router";

const Drawer = createDrawerNavigator();

export default function Layout() {
    const { isAuthenticated } = useAuthStore();

    const configureNotificationChannel = async () => {
        try {
            if (Platform.OS === 'android') {
                console.log("Configurando para android");
                console.log("creando canal de alarm-channel");
                await Notifications.setNotificationChannelAsync('alarm-channel', {
                    name: 'Notificaciones por defecto',
                    importance: Notifications.AndroidImportance.MAX,
                    sound: 'alarmcar',
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            } else {
                console.log("Configurando para ios");
            }
        } catch (err) {
            console.error("Error configurando canal:", err);
        }
    };



    useEffect(() => {
        // Ejecutar canal + revisar si la notificación fue la que abrió la app
        console.log("Configurando useEffect canal de notificaciones");
        configureNotificationChannel();


        const checkInitialNotification = async () => {
            const response = await Notifications.getLastNotificationResponseAsync();
            const data = response?.notification?.request?.content?.data;

            if (data?.isAlarm) {
                console.log("App abierta desde notificación de alarma");
                stopAlarmSound();
            }
        };

        checkInitialNotification();
    }, []);

    return (
        //<GestureHandlerRootView> </GestureHandlerRootView> por si me da error de gestos
        <PermissionsCkeckProvider>
            <Drawer.Navigator
                drawerContent={(props) => <DrawerContent {...props} />}
                screenOptions={{
                    headerShown: true, // Muestra el encabezado
                    headerTitleAlign: "center", // Alinea el título en el centro
                    headerStyle: {
                        backgroundColor: "#fff",
                    },
                    headerTintColor: "#000", // Color del texto del encabezado

                }}
                initialRouteName={isAuthenticated ? "Home" : "Login"}

            >
                {/*  Ruta para HomeScreen */}
                {isAuthenticated ? (
                    <Drawer.Screen
                        name="Home"
                        component={TabsNavigator}
                        options={{ headerTitle: "Home" }}
                    />
                ) : (
                    <Drawer.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{
                            headerTitle: "Iniciar Sesión",
                            swipeEnabled: false,
                            drawerItemStyle: { display: "none" },
                        }}
                    />
                )}
                {/* <Drawer.Screen name="Home" component={TabsNavigator} options={{ headerTitle: "Home" }} />
                <Drawer.Screen name="Login" component={LoginScreen} options={{
                    headerTitle: "Iniciar Sesión", swipeEnabled: false,
                    drawerItemStyle: { display: "none" }
                }} /> */}
                <Drawer.Screen name="Map" component={MapsScreen} />
                <Drawer.Screen name="permissions" component={PermissionsScreen} />

                {/*Esto es para los permisos de google maps
                <Drawer.Screen name="Extra" component={ExtraStack} options={{ headerShown: false }} /> */}
            </Drawer.Navigator>
        </PermissionsCkeckProvider>


    );
}









