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
import { t } from "@/i18n/i18nConfig";
import { Ionicons } from "@expo/vector-icons"; //  AÑADIR IMPORT

export default function EditarPrioridadScreen() {
    const [telefono, setTelefono] = useState("");
    const navigation = useNavigation();

    useEffect(() => {
        const cargarDatos = async () => {
            console.log("Cargando datos de AsyncStorage");
            const telefono = await AsyncStorage.getItem("telefono");
            if (telefono) setTelefono(telefono);
        };
        cargarDatos();
    }, []);

    const enviar = async () => {
        if (!telefono || telefono.length < 9) {
            Alert.alert(t("EditarPrioridadScreen.errorTitle"), t("EditarPrioridadScreen.invalidPhone"));
            return;
        }
        const userId = await AsyncStorage.getItem("userId");
        const token = await AsyncStorage.getItem("deviceToken");

        try {
            await post("alarmtc/prioridad", { telefono, userId, token });
            await AsyncStorage.setItem("telefono", telefono);
            Alert.alert(t("EditarPrioridadScreen.successTitle"), t("EditarPrioridadScreen.saved"));
            navigation.goBack();
        } catch (error) {
            console.error("Error al enviar:", error);
            Alert.alert(t("EditarPrioridadScreen.errorTitle"), t("EditarPrioridadScreen.sendError"));
        }
    };

    return (
        <View style={styles.container}>
            {/*  NUEVO: Header con botón atrás */}
            <View style={styles.headerWithBack}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()} // Esto va a Settings automáticamente
                >
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.title}>{t("EditarPrioridadScreen.title")}</Text>
            </View>

            <Text style={styles.label}>{t("EditarPrioridadScreen.label")}</Text>
            <View style={styles.phoneInputContainer}>
                <TextInput
                    placeholder={t("EditarPrioridadScreen.placeholder")}
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
                    <Text style={styles.sendButtonText}>{t("EditarPrioridadScreen.save")}</Text>
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

    //  NUEVOS ESTILOS para header con botón atrás
    headerWithBack: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },

    backButton: {
        marginRight: 12,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
    },

    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
        flex: 1, //  AÑADIDO para que ocupe el espacio restante
    },

    // ... resto de estilos sin cambios
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