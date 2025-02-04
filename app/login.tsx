import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuthStore } from "../store/authStore";
import { Feather } from "@expo/vector-icons";

export default function LoginScreen({ navigation }: any) { // Props navigation
    const { username: savedEmail, password: savedPassword, login } = useAuthStore();
    const [email, setEmail] = useState(savedEmail || "");
    const [password, setPassword] = useState(savedPassword || "");

    const handleLogin = async () => {
        try {
            const success = await login(email, password);
            if (success) {
                navigation.navigate("Home");
            } else {
                Alert.alert("Correo electrónico o contraseña incorrectos");
            }
        } catch (error) {
            throw new Error("Algo salió mal");
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ingresar</Text>
            <Text style={styles.subtitle}>Por favor ingrese para continuar</Text>
            <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#666" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#666" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Ingresar</Text>
                <Feather name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
            </TouchableOpacity>
        </View>
    );
}

// BLOQUE DE ESTILOS
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#000",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
        width: "100%",
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#000",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 16,
        width: "100%",
        justifyContent: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonIcon: {
        marginLeft: 8,
    },
});


