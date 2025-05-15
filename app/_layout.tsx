import React, { useState, useEffect } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerContent from "../components/DrawerContent";
import LoginScreen from "./login";
import TabsNavigator from "./(tabs)/TabsNavigator";
import PermissionsCkeckProvider from "@/presentation/providers/PermissionsCkeckProvider";
import { useAuthStore } from "@/store/authStore";
import PermissionsScreen from "./extra/permissions/PermissionScreen";
import MapsScreen from "./extra/map/MapsScreen";
import { stopAlarmSound } from "@/utils/sound";
import {
    Platform,
    AppState,
    Modal,
    View,
    Text,
    Button,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const Drawer = createDrawerNavigator();

export default function Layout() {
    const { isAuthenticated } = useAuthStore();
    const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const [ready, setReady] = useState(false);

    const configureNotificationChannel = async () => {
        try {
            if (Platform.OS === "android") {
                console.log("Configurando canal para Android");
                await Notifications.setNotificationChannelAsync("alarm-channel", {
                    name: "Notificaciones de alarma",
                    importance: Notifications.AndroidImportance.MAX,
                    sound: "alarmcar",
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#FF231F7C",
                });
            }
        } catch (err) {
            console.error("Error configurando canal:", err);
        }
    };

    const handleAlarmState = async (isActive: boolean) => {
        if (isActive) {
            console.log(" Activando alarma");
            await AsyncStorage.setItem("alarmPlaying", "true");
            setShowAlarmDialog(true);
        } else {
            console.log(" Desactivando alarma");
            await stopAlarmSound();
            await AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
            setShowAlarmDialog(false);
        }
    };


    // Mostrar el modal cuando esté lista la app y detecte alarma pendiente
    useEffect(() => {
        const checkAlarmFlag = async () => {
            const flag = await AsyncStorage.getItem("alarma_activa_pendiente");
            if (flag === "true") {
                console.log(" alarma_activa_pendiente detectada");
                setShowAlarmDialog(true);
            }
        };

        if (ready) {
            checkAlarmFlag();
        }
    }, [ready]);
    // useFocusEffect(
    //     useCallback(() => {
    //         Notifications.dismissAllNotificationsAsync();
    //     }, [])
    // );

    // Escuchar si la app vuelve al foreground
    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (nextAppState) => {
            if (nextAppState === "active") {
                const alarm = await AsyncStorage.getItem("alarmPlaying");
                if (alarm === "true") {
                    await handleAlarmState(true);
                }
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        configureNotificationChannel();
    }, []);

    return (
        <PermissionsCkeckProvider>
            <Drawer.Navigator
                drawerContent={(props) => <DrawerContent {...props} />}
                screenOptions={{
                    headerShown: true,
                    headerTitleAlign: "center",
                    headerStyle: {
                        backgroundColor: "#fff",
                    },
                    headerTintColor: "#000",
                }}
                initialRouteName={isAuthenticated ? "Home" : "Login"}
            >
                {isAuthenticated ? (
                    <Drawer.Screen name="Home" component={TabsNavigator} options={{ headerTitle: "Home" }} />
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
                <Drawer.Screen name="Map" component={MapsScreen} />
                <Drawer.Screen name="permissions" component={PermissionsScreen} />
            </Drawer.Navigator>
        </PermissionsCkeckProvider>
    );
}
