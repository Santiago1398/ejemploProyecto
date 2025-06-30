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
    // const [prefijo, setPrefijo] = useState("+34"); // predeterminado
    // const [mostrarModalPrefijos, setMostrarModalPrefijos] = useState(false);
    const navigation = useNavigation();
    // const paises = [
    //     { nombre: "España", codigo: "+34" },
    // ];


    useEffect(() => {
        const cargarDatos = async () => {
            // Cargar datos de AsyncStorage
            console.log("Cargando datos de AsyncStorage");
            const telefono = await AsyncStorage.getItem("telefono");
            if (telefono) setTelefono(telefono);
        };
        cargarDatos();
    }, []);

    const enviar = async () => {
        if (!telefono || telefono.length < 9) {
            Alert.alert("Error", "Introduce un número de teléfono válido.");
            return;
        }
        const userId = await AsyncStorage.getItem("userId");
        const token = await AsyncStorage.getItem("deviceToken");



        try {
            // Enviar al backend
            await post("/api/alarmtc/prioridad", { telefono, userId, token });

            await AsyncStorage.setItem("telefono", telefono);

            Alert.alert("Éxito", "Información guardada correctamente");

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
            <View style={styles.phoneInputContainer}>
                {/* <TouchableOpacity onPress={() => setMostrarModalPrefijos(true)}>
                    <Text style={styles.prefix}>{prefijo}</Text>
                </TouchableOpacity> */}
                <TextInput
                    placeholder="123456789"
                    style={styles.phoneInput}
                    keyboardType="phone-pad"
                    value={telefono}
                    onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9+]/g, '');
                        setTelefono(cleaned);
                    }}

                />
            </View>


            {(telefono) && (
                <TouchableOpacity style={styles.sendButton} onPress={enviar}>
                    <Text style={styles.sendButtonText}>Guardar</Text>
                </TouchableOpacity>
            )}
            {/* {mostrarModalPrefijos && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Selecciona país</Text>
                        {paises.map((pais) => (
                            <TouchableOpacity
                                key={pais.codigo}
                                style={styles.modalItem}
                                onPress={() => {
                                    setPrefijo(pais.codigo);
                                    setMostrarModalPrefijos(false);
                                }}
                            >
                                <Text>{pais.nombre} ({pais.codigo})</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setMostrarModalPrefijos(false)}>
                            <Text style={{ marginTop: 12, color: 'red' }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )} */}

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
    phoneInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
        paddingHorizontal: 10,
        marginBottom: 16,
    },

    prefix: {
        fontSize: 16,
        fontWeight: "bold",
        marginRight: 8,
        color: "#333",
    },

    phoneInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 10,
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    modalItem: {
        paddingVertical: 8,
        width: "100%",
        alignItems: "center",
        borderBottomWidth: 0.5,
        borderBottomColor: "#ccc",
    },


});