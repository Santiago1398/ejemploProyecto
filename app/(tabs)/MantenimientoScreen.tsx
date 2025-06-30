// screens/MantenimientoScreen.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    Alert,
    TextInput,
    Button,
    ScrollView,
} from "react-native";
import { getApiUrl, setApiUrl } from "@/utils/apiconfig";

export default function MantenimientoScreen() {
    const [apiUrl, setApiUrlState] = useState("");

    useEffect(() => {
        const loadApiUrl = async () => {
            const url = await getApiUrl();
            setApiUrlState(url);
        };
        loadApiUrl();
    }, []);

    const handleSave = async () => {
        try {
            await setApiUrl(apiUrl);
            Alert.alert("Guardado", "La URL del servidor ha sido actualizada.");
        } catch {
            Alert.alert("Error", "No se pudo guardar la URL.");
        }
    };

    return (
        <ScrollView style={styles.screen}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Servidor API</Text>
                <TextInput
                    style={styles.input}
                    value={apiUrl}
                    onChangeText={setApiUrlState}
                    placeholder="http://192.168.1.1:8032/api"
                    autoCapitalize="none"
                />
                <Button title="Guardar URL" onPress={handleSave} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    section: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 16,
        marginBottom: 24,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
});