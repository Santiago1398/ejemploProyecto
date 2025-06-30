import React, { useEffect, useState } from "react";
import {
    View, StyleSheet, Text, Switch, Platform, Linking, Alert, TouchableOpacity, ScrollView,
    KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePermissionsStore } from "@/store/usePermissions";
import { PermissionStatus } from "@/infrastructure/intercafe/location";
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { requestLocationPermission } from "@/core/actions/permissions/locations";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { TextInput, Button, } from "react-native";
import { post } from "@/services/api";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/app/HomeStack";
import { getApiUrl, setApiUrl } from "@/utils/apiconfig";

//!Pruebas



export default function SettingsScreen() {
    const { locationStatus, checkLocationPermission } = usePermissionsStore();
    const [notificationStatus, setNotificationStatus] = useState<boolean>(false);
    const [telefonoGuardado, setTelefonoGuardado] = useState<string | null>(null);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [apiUrl, setApiUrlState] = useState("");



    useEffect(() => {
        const loadApiUrl = async () => {
            const url = await getApiUrl();
            setApiUrlState(url);
        };
        loadApiUrl();
    }, []);


    useEffect(() => {
        const initializePermissions = async () => {
            await checkLocationPermission();
            await checkNotificationStatus();
        };

        initializePermissions();
    }, []);

    useEffect(() => {
        const cargarDatosGuardados = async () => {
            // Cargar datos guardados de AsyncStorage
            console.log("Cargando datos guardados de AsyncStorageSettingsScreen");
            const telefono = await AsyncStorage.getItem("telefono");
            setTelefonoGuardado(telefono);
        };

        const unsubscribe = navigation.addListener("focus", cargarDatosGuardados);
        return unsubscribe;
    }, [navigation]);

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
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
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

                <TouchableOpacity style={[styles.section, { marginTop: 24 }]} onPress={() => navigation.navigate("EditarPrioridadScreen")}>
                    <Text style={styles.sectionTitle}>Nivel de Prioridad</Text>
                    {telefonoGuardado ? (
                        <Text style={{ fontSize: 16 }}>
                            Tel: {telefonoGuardado}
                        </Text>
                    ) : (
                        <Text style={{ fontSize: 16, color: '#999' }}>Sin número asignado</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
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
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    pickerContainer: {
        marginBottom: 10,
    },
    picker: {
        height: 40,
        backgroundColor: "#fff",
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 4,
    },
    priorityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 16,
    },
    priorityButton: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    priorityButtonSelected: {
        backgroundColor: '#007AFF',
    },
    priorityText: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    priorityTextSelected: {
        color: '#fff',
    },
    sendButton: {
        backgroundColor: '#28a745',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },


});