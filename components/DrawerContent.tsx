import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useAuthStore } from "../store/authStore";
import { t } from "../i18n/i18nConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DrawerContent(props: DrawerContentComponentProps) {
    const { username: email, logout, isAuthenticated } = useAuthStore();
    const { navigation } = props;

    const handleLogout = async () => {
        try {
            // Cerrar el drawer primero
            props.navigation.closeDrawer();

            // Pequeña pausa para asegurar que el drawer se cierre
            await new Promise(resolve => setTimeout(resolve, 200));

            // Limpiar AsyncStorage
            await AsyncStorage.removeItem("userToken");

            // Ejecutar logout del store
            logout();

            console.log("Logout exitoso");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const handleNavigateToSettings = async () => {
        try {
            props.navigation.closeDrawer();
            // Pausa más larga para Samsung
            await new Promise(resolve => setTimeout(resolve, 300));
            navigation.navigate("Settings" as never);
        } catch (error) {
            console.error("Error navegando a Settings:", error);
        }
    };

    const handleNavigateToMaintenance = async () => {
        try {
            props.navigation.closeDrawer();
            await new Promise(resolve => setTimeout(resolve, 300));
            navigation.navigate("SolicitarMantenimiento" as never);
        } catch (error) {
            console.error("Error navegando a Mantenimiento:", error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Logo de CTIcontrol */}
            <Image
                source={require("../assets/images/logo-cti-verde-renombrado.png")}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* Texto TC5 */}
            <Text style={styles.tc5}>TC5</Text>

            {/* Email del usuario */}
            <Text style={styles.email}>{email}</Text>

            {/* Botón de sesión */}
            {isAuthenticated ? (
                <TouchableOpacity
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    activeOpacity={0.8}
                    delayPressIn={0}
                >
                    <Text style={styles.logoutText}>{t("DrawerContent.logout")}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => {
                        props.navigation.closeDrawer();
                        // El login se maneja automáticamente por el estado de App.js
                    }}
                    style={styles.loginButton}
                    activeOpacity={0.8}
                    delayPressIn={0}
                >
                    <Text style={styles.loginText}>{t("DrawerContent.login")}</Text>
                </TouchableOpacity>
            )}

            {/* Ajustes al fondo */}
            <View style={styles.footer}>
                <View style={styles.separator} />

                <TouchableOpacity
                    onPress={handleNavigateToSettings}
                    style={styles.footerButton}
                    activeOpacity={0.8}
                    delayPressIn={0}
                >
                    <Text style={styles.footerText}>{t("DrawerContent.settings")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleNavigateToMaintenance}
                    style={styles.footerButton}
                    activeOpacity={0.8}
                    delayPressIn={0}
                >
                    <Text style={styles.footerText}>{t("DrawerContent.maintenance")}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f9f9",
        justifyContent: "flex-start",
    },
    logo: {
        width: "100%",
        height: 50,
        marginBottom: 5,
    },
    tc5: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#A2D927",
        marginBottom: 20,
        textAlign: "center",
    },
    email: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
        marginBottom: 30,
    },
    loginButton: {
        padding: 12,
        backgroundColor: "blue",
        borderRadius: 8,
        minHeight: 44, // Altura mínima para mejor toque
    },
    loginText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 16,
    },
    logoutButton: {
        padding: 12,
        backgroundColor: "red",
        borderRadius: 8,
        minHeight: 44,
    },
    logoutText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 16,
    },
    footer: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: "flex-start",
    },
    separator: {
        height: 0.5,
        width: "100%",
        backgroundColor: "#ccc",
        marginBottom: 8,
    },
    footerButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        minHeight: 36,
        justifyContent: "center",
    },
    footerText: {
        fontSize: 16,
        color: "#555",
        fontWeight: "500",
    },
});