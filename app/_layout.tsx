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
import { Platform, AppState, Modal, View, Text, Button } from "react-native";
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Drawer = createDrawerNavigator();

export default function Layout() {
    const { isAuthenticated } = useAuthStore();
    const [showAlarmDialog, setShowAlarmDialog] = useState(false);

    const configureNotificationChannel = async () => {
        try {
            if (Platform.OS === 'android') {
                console.log("Configurando para android");
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

    const checkIfAlarmIsActive = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo
        const alarm = await AsyncStorage.getItem("alarmPlaying");
        if (alarm === "true") {
            console.log("✅ Mostrando diálogo desde Layout");
            setShowAlarmDialog(true);
        } else {
            setShowAlarmDialog(false);
        }
    };

    useEffect(() => {
        checkIfAlarmIsActive();
    }, []);

    useEffect(() => {
        const checkInitialNotification = async () => {
            const response = await Notifications.getLastNotificationResponseAsync();
            const data = response?.notification?.request?.content?.data;

            if (data?.isAlarm) {
                console.log("App abierta desde notificación de alarma");
                await AsyncStorage.setItem("alarmPlaying", "true");
                setShowAlarmDialog(true);
            }
        };

        checkInitialNotification();
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (nextAppState) => {
            if (nextAppState === "active") {
                await checkIfAlarmIsActive();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        configureNotificationChannel();
    }, []);

    return (
        <PermissionsCkeckProvider>
            {showAlarmDialog && (
                <Modal transparent animationType="fade" visible={true}>
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000080" }}>
                        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10 }}>
                            <Text style={{ marginBottom: 10 }}>🚨 Alarma activa</Text>
                            <Button
                                title="OK, detener sonido"
                                onPress={async () => {
                                    await stopAlarmSound();
                                    await AsyncStorage.removeItem("alarmPlaying");
                                    setShowAlarmDialog(false);
                                }}
                            />
                        </View>
                    </View>
                </Modal>
            )}

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
                <Drawer.Screen name="Map" component={MapsScreen} />
                <Drawer.Screen name="permissions" component={PermissionsScreen} />
            </Drawer.Navigator>
        </PermissionsCkeckProvider>
    );
}