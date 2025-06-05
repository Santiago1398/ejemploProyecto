import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text, Switch, Platform, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePermissionsStore } from "@/store/usePermissions";
import { PermissionStatus } from "@/infrastructure/intercafe/location";
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { requestLocationPermission } from "@/core/actions/permissions/locations";
import { registerForPushNotificationsAsync } from "@/utils/notifications";


export default function SettingsScreen() {
    const { locationStatus, checkLocationPermission } = usePermissionsStore();
    const [notificationStatus, setNotificationStatus] = useState<boolean>(false);


    useEffect(() => {
        const initializePermissions = async () => {
            await checkLocationPermission();
            await checkNotificationStatus();
        };

        initializePermissions();
    }, []);

    const checkNotificationStatus = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationStatus(status === 'granted');
    };

    const handleNotificationToggle = async () => {
        if (notificationStatus) {
            // Si están activadas, mostrar diálogo para desactivar
            Alert.alert(
                "Desactivar notificaciones",
                "¿Deseas desactivar las notificaciones de la aplicación?",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Desactivar",
                        onPress: async () => {
                            Platform.OS === 'ios'
                                ? await Linking.openURL('app-settings:')
                                : await Linking.openSettings();
                        }
                    }
                ]
            );
        } else {
            // Si están desactivadas, solicitar permisos
            Alert.alert(
                "Activar notificaciones",
                "¿Deseas recibir notificaciones de alarmas y actualizaciones?",
                [
                    {
                        text: "No",
                        style: "cancel"
                    },
                    {
                        text: "Sí",
                        onPress: async () => {
                            const token = await registerForPushNotificationsAsync();
                            if (token) {
                                setNotificationStatus(true);
                                await AsyncStorage.setItem('hasAskedForNotifications', 'true');
                            } else {
                                Platform.OS === 'ios'
                                    ? await Linking.openURL('app-settings:')
                                    : await Linking.openSettings();
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleToggle = async () => {
        if (locationStatus === PermissionStatus.GRANTED) {
            // Si ya está habilitado, mostrar diálogo de confirmación
            Alert.alert(
                "Desactivar ubicación",
                "¿Deseas desactivar los permisos de ubicación?",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Desactivar",
                        onPress: async () => {
                            // Redirigir a configuración del sistema para desactivar manualmente
                            Platform.OS === 'ios'
                                ? await Linking.openURL('app-settings:')
                                : await Linking.openSettings();
                        }
                    }
                ]
            );
        } else {
            // Si está deshabilitado, solicitar permisos
            const status = await requestLocationPermission();
            if (status !== PermissionStatus.GRANTED) {
                Platform.OS === 'ios'
                    ? await Linking.openURL('app-settings:')
                    : await Linking.openSettings();
            }
        }
    };

    return (
        <View style={styles.screen}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Permisos</Text>

                {/* Control de Ubicación */}
                <View style={styles.button}>
                    <View style={styles.buttonText}>
                        <Ionicons name="map-outline" size={24} color="#007AFF" />
                        <Text style={styles.buttonText}>Permisos de Ubicación</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={locationStatus === PermissionStatus.GRANTED ? "#007AFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={handleToggle}
                        value={locationStatus === PermissionStatus.GRANTED}
                    />
                </View>

                {/* Control de Notificaciones */}
                <View style={styles.button}>
                    <View style={styles.buttonText}>
                        <Ionicons name="notifications-outline" size={24} color="#007AFF" />
                        <Text style={styles.buttonText}>Notificaciones</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={notificationStatus ? "#007AFF" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={handleNotificationToggle}
                        value={notificationStatus}
                    />
                </View>
            </View>
        </View>
    );
}
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginBottom: 8,
    },
    buttonText: {
        marginLeft: 12,
        flexDirection: "row",
        alignItems: "center",
        fontSize: 16,
        gap: 8,
        color: '#333',
    },
});