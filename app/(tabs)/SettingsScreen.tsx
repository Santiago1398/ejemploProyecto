import React, { useEffect } from "react";
import { View, StyleSheet, Text, Switch, Platform, Linking, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { usePermissionsStore } from "@/store/usePermissions";
import { PermissionStatus } from "@/infrastructure/interface/location";
import { RootStackParamList } from "../HomeStack";
import { requestLocationPermission } from "@/core/actions/permissions/locations";



type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

export default function SettingsScreen() {
    const navigation = useNavigation<SettingsScreenNavigationProp>();
    const { locationStatus, checkLocationPermission } = usePermissionsStore();

    useEffect(() => {
        checkLocationPermission();
    }, []);

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
