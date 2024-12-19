import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SettingsScreen() {
    return (
        <View style={styles.screen}>
            <Text style={styles.contentText}>Contenido de Configuración</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    contentText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
});
