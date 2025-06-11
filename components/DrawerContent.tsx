import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { useAuthStore } from "../store/authStore";

export default function DrawerContent(props: DrawerContentComponentProps) {
    const { username: email, logout, isAuthenticated } = useAuthStore();
    const { navigation } = props;

    return (
        <View style={styles.container}>
            {/* Logo de CTIcontrol */}
            <Image
                source={require("../assets/images/cticontrol-logo-verde.png")}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* Texto TC5 */}
            <Text style={styles.tc5}>TC5</Text>

            {/* Email del usuario */}
            <Text style={styles.email}>{email}</Text>

            {/* Botón de sesión */}
            {isAuthenticated ? (
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    style={styles.loginButton}
                >
                    <Text style={styles.loginText}>Iniciar Sesión</Text>
                </TouchableOpacity>
            )}

            {/* Ajustes al fondo */}
            <View style={styles.footer}>
                <View style={styles.separator} />
                <TouchableOpacity
                    onPress={() => navigation.navigate("Settings")}
                    style={styles.footerButton}
                >
                    <Text style={styles.footerText}>Ajustes</Text>
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
        fontSize: 36    ,
        fontWeight: "bold",
        color: "#A2D927", // Verde del logo
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
        padding: 10,
        backgroundColor: "blue",
        borderRadius: 8,
    },
    loginText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
    },
    logoutButton: {
        padding: 10,
        backgroundColor: "red",
        borderRadius: 8,
    },
    logoutText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
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
        paddingVertical: 6,
    },
    footerText: {
        fontSize: 16,
        color: "#555",
        fontWeight: "500",
    },
});