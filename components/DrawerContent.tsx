import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer"; // Importa el tipo correcto
import { useAuthStore } from "../store/authStore";

export default function DrawerContent(props: DrawerContentComponentProps) {
    const { username: email, isActive, logout, isAuthenticated } = useAuthStore();
    const { navigation } = props;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Menú</Text>
            <View style={styles.userInfo}>
                <Text style={styles.email}>{email || "Invitado"}</Text>
                <Text style={styles.status}>
                    Estado:{" "}
                    <Text style={{ color: isActive ? "green" : "red" }}>
                        {isActive ? "Activo" : "Inactivo"}
                    </Text>
                </Text>
            </View>

            {/* Botón para iniciar sesión si no está autenticado */}
            {!isAuthenticated && (
                <TouchableOpacity
                    onPress={() => navigation.navigate("Login")}
                    style={styles.loginButton}
                >
                    <Text style={styles.loginText}>Iniciar Sesión</Text>
                </TouchableOpacity>
            )}

            {/* Botón para cerrar sesión si está autenticado */}
            {isAuthenticated && (
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f9f9f9",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    userInfo: {
        marginBottom: 20,
    },
    email: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    status: {
        fontSize: 16,
        marginTop: 5,
    },
    loginButton: {
        marginTop: 10,
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
        marginTop: 30,
        padding: 10,
        backgroundColor: "red",
        borderRadius: 8,
    },
    logoutText: {
        color: "#fff",
        fontWeight: "bold",
        textAlign: "center",
    },
});
