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
    Vibration,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SettingsScreen from "./(tabs)/SettingsScreen";
import AlarmasScreen from "./(tabs)/AlarmasScreen";
import EditarPrioridadScreen from "@/components/EditarPrioridadScreen";
import { notificationService } from "@/hooks/NotificationService";
//import HeaderLeftButton from "@/components/HeaderLeftButton";
import MantenimientoScreen from "./(tabs)/MantenimientoScreen";
import SolicitarMantenimientoScreen from "@/utils/SolicitarMantenimiento";
import { socketService } from "@/services/socketService";







const Drawer = createDrawerNavigator();

export default function Layout() {
    const { isAuthenticated } = useAuthStore();
    const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const [ready, setReady] = useState(false);
    const { isDeveloperMode, token } = useAuthStore();


    const configureNotificationChannel = async () => {
        try {
            if (Platform.OS === "android") {
                console.log("Configurando canal para Android");
                await Notifications.setNotificationChannelAsync("alarm-channel", {
                    name: "Notificaciones de alarma",
                    importance: Notifications.AndroidImportance.MAX,
                    sound: "alarmcar",
                    vibrationPattern: [0, 1000, 200, 1000, 200, 1000, 200, 1000, 200, 1000],
                    lightColor: "#FF231F7C",
                    bypassDnd: true,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    enableLights: true,
                    enableVibrate: true,
                    showBadge: true,
                    audioAttributes: {
                        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
                        usage: Notifications.AndroidAudioUsage.ALARM,
                        flags: {
                            enforceAudibility: true,
                            requestHardwareAudioVideoSynchronization: false
                        }
                    },
                });
                //await requestDndPermission();
                // 🔕 Canal NORMAL (alta prioridad pero SIN sonido)
                await Notifications.setNotificationChannelAsync("channel-normal", {
                    name: "Notificaciones sin sonido",
                    importance: Notifications.AndroidImportance.HIGH,
                    sound: null,
                    vibrationPattern: [0, 1000, 200, 1000, 200, 1000, 200, 1000, 200, 1000],
                    lightColor: "#FF231F7C",
                    bypassDnd: false,
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    enableLights: true,
                    enableVibrate: true,
                    showBadge: true,


                });
                await requestDndPermission();
            }
        } catch (err) {
            console.error("Error configurando canal:", err);
        }
    };

    const requestDndPermission = async () => {
        try {
            // Primero los permisos básicos de notificaciones
            const { status } = await Notifications.getPermissionsAsync();

            if (status !== 'granted') {
                const response = await Notifications.requestPermissionsAsync({
                    ios: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                    },
                    android: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                        allowDisplayOverOtherApps: true,
                    }
                });

                console.log('Permisos de notificaciones:', response.status);
            }

            // Para Android: Verificar si tiene permisos DND
            // if (Platform.OS === 'android') {
            //     // Nota: Esto requiere que el usuario vaya manualmente a 
            //     // Configuración > Apps > Tu App > Notificaciones > Acceso especial
            //     console.log('⚠️ Para bypass DND: El usuario debe habilitar manualmente');
            //     console.log('   Configuración > Apps > [Tu App] > Permisos especiales > Acceso a No molestar');
            // }

        } catch (error) {
            // console.error('Error solicitando permisos DND:', error);
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


    //! prueba  WebSocket
    useEffect(() => {
        // Inicializar el socket cuando el app esté listo
        // y tengamos el estado de auth cargado
        if (token) {
            console.log('🚀 Inicializando SocketService con modo:', isDeveloperMode ? 'DEV' : 'PROD');
            socketService.initialize();
        }

        // Cleanup al desmontar
        return () => {
            socketService.disconnect();
        };
    }, [token]); // Solo reinicializar si cambia el token

    // // OPCIONAL: Si quieres reconectar cuando cambie el modo dev
    // useEffect(() => {
    //     if (token && socketService.isConnected()) {
    //         console.log('🔄 Modo desarrollo cambió, reconectando socket...');
    //         socketService.reconnectWithNewUrl();
    //     }
    // }, [isDeveloperMode]);


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

    //!! Prueba de notificaciones

    // useEffect(() => {
    //     const registerAndSend = async () => {
    //         try {
    //             const { userId } = useAuthStore.getState(); // Asegúrate de que tienes el userId
    //             if (isAuthenticated && userId) {
    //                 console.log(" Registrando dispositivo y enviando prueba...");
    //                 await notificationService.registerDeviceAndSendTestNotification(userId);
    //             }
    //         } catch (error) {
    //             console.error("Error al registrar y enviar notificación:", error);
    //         }
    //     };

    //     registerAndSend();
    // }, [isAuthenticated]);
    //!!



    return (
        <PermissionsCkeckProvider>
            <Drawer.Navigator
                drawerContent={(props) => <DrawerContent {...props} />}
                screenOptions={{
                    headerShown: false,
                    headerTitleAlign: "center",
                    headerStyle: {
                        backgroundColor: "#fff",
                    },
                    headerTintColor: "#000",
                    headerLeft: undefined,
                }}
                initialRouteName={isAuthenticated ? "Home" : "Login"}
            >
                {isAuthenticated ? (
                    <Drawer.Screen
                        name="Home"
                        component={TabsNavigator}
                        options={{
                            headerShown: false
                        }}
                    />
                ) : (
                    <Drawer.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{
                            headerShown: false,
                            swipeEnabled: false,
                            drawerItemStyle: { display: "none" },
                        }}
                    />
                )}

                <Drawer.Screen
                    name="Map"
                    component={MapsScreen}
                    options={{ headerShown: false }}
                />

                <Drawer.Screen
                    name="permissions"
                    component={PermissionsScreen}
                    options={{ headerShown: false }}
                />

                <Drawer.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ headerShown: false }}
                />

                <Drawer.Screen
                    name="Alarmas"
                    component={AlarmasScreen}
                    options={{
                        drawerItemStyle: { display: "none" },
                        headerShown: false
                    }}
                />

                <Drawer.Screen
                    name="EditarPrioridadScreen"
                    component={EditarPrioridadScreen}
                    options={{ headerShown: false }}
                />

                <Drawer.Screen
                    name="Mantenimiento"
                    component={MantenimientoScreen}
                    options={{
                        headerShown: false
                    }}
                />

                <Drawer.Screen
                    name="SolicitarMantenimiento"
                    component={SolicitarMantenimientoScreen}
                    options={{
                        headerShown: false,
                        drawerItemStyle: { display: "none" }
                    }}
                />
            </Drawer.Navigator>
        </PermissionsCkeckProvider>
    );
}