import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '@/app/HomeStack'; // o donde tengas el tipo

export default function SolicitarMantenimientoScreen() {
    const navigation = useNavigation<DrawerNavigationProp<RootStackParamList>>();

    const [password, setPassword] = useState("");

    const handleConfirm = () => {
        if (password === "67890") {
            navigation.navigate("Mantenimiento");
        } else {
            Alert.alert("Contraseña incorrecta", "Inténtalo de nuevo.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Contraseña Mantenimiento</Text>
            <TextInput
                placeholder="Introduce contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                autoFocus
            />
            <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 20 },
    title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    input: {
        borderWidth: 1, borderColor: "#ccc", padding: 10,
        borderRadius: 8, marginBottom: 16
    },
    button: {
        backgroundColor: "#007AFF", padding: 12, borderRadius: 8,
        alignItems: "center"
    },
    buttonText: { color: "#fff", fontWeight: "bold" }
});