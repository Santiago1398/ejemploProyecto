import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { post } from "@/services/api";

export default function EditarPrioridadScreen() {
    const [telefono, setTelefono] = useState("");
    const [prioridad, setPrioridad] = useState<number | null>(null);
    const navigation = useNavigation();

    // Cargar valores guardados (opcional)
    useEffect(() => {
        const cargarDatos = async () => {
            const tel = await AsyncStorage.getItem("telefono");
            const prio = await AsyncStorage.getItem("prioridad");
            if (tel) setTelefono(tel);
            if (prio) setPrioridad(parseInt(prio));
        };
        cargarDatos();
    }, []);

    const enviar = async () => {
        if (!telefono || telefono.length !== 9 || !prioridad) {
            Alert.alert("Error", "Introduce un número de teléfono válido de 9 dígitos y una prioridad.");
            return;
        }

        try {
            // Enviar al backend
            await post("/api/alarmtc/prioridad", { telefono, prioridad });

            // Guardar localmente
            await AsyncStorage.setItem("telefono", telefono);
            await AsyncStorage.setItem("prioridad", prioridad.toString());

            Alert.alert("Éxito", "Información guardada correctamente");

            // Regresar a la pantalla anterior
            navigation.goBack();
        } catch (error) {
            console.error("Error al enviar:", error);
            Alert.alert("Error", "No se pudo enviar la información");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Prioridad</Text>

            <Text style={styles.label}>Número de teléfono:</Text>
            <TextInput
                placeholder="Ingrese su número de teléfono"
                style={styles.input}
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={(text) => {
                    const numericText = text.replace(/[^0-9]/g, ''); // solo números
                    if (numericText.length <= 9) setTelefono(numericText);
                }}
            />

            <Text style={styles.label}>Prioridad:</Text>
            <View style={styles.priorityContainer}>
                {[1, 2, 3].map((nivel) => (
                    <TouchableOpacity
                        key={nivel}
                        style={[
                            styles.priorityButton,
                            prioridad === nivel && styles.priorityButtonSelected,
                        ]}
                        onPress={() => setPrioridad(nivel)}
                    >
                        <Text
                            style={[
                                styles.priorityText,
                                prioridad === nivel && styles.priorityTextSelected,
                            ]}
                        >
                            {nivel}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {(telefono && prioridad) && (
                <TouchableOpacity style={styles.sendButton} onPress={enviar}>
                    <Text style={styles.sendButtonText}>Guardar</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#333",
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
        fontWeight: "500",
        color: "#333",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        backgroundColor: "#fff",
    },
    priorityContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    priorityButton: {
        flex: 1,
        alignItems: "center",
        padding: 10,
        borderWidth: 1,
        borderColor: "#007AFF",
        borderRadius: 8,
        marginHorizontal: 4,
    },
    priorityButtonSelected: {
        backgroundColor: "#007AFF",
    },
    priorityText: {
        color: "#007AFF",
        fontWeight: "bold",
    },
    priorityTextSelected: {
        color: "#fff",
    },
    sendButton: {
        backgroundColor: "#28a745",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    sendButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
