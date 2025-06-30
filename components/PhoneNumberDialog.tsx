import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (telefono: string) => void;
}

export default function PhoneNumberDialog({ visible, onClose, onConfirm }: Props) {
    const [telefono, setTelefono] = useState("");

    const handleConfirm = () => {
        if (telefono.length === 9) {
            console.log("📱 Teléfono válido ingresado:", telefono);
            onConfirm(telefono);
            setTelefono("");
        } else {
            alert("Número inválido. Debe tener 9 dígitos.");
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.dialog}>
                    <Text style={styles.title}>Introduzca su número de teléfono</Text>
                    <Text style={styles.subtitle}>
                        Para que la app de TC5 sepa cuál es su número.
                    </Text>
                    <TextInput
                        placeholder="Ej: 612345678"
                        keyboardType="phone-pad"
                        style={styles.input}
                        value={telefono}
                        onChangeText={(text) => setTelefono(text.replace(/[^0-9]/g, "").slice(0, 9))}
                    />
                    <View style={styles.buttons}>
                        <TouchableOpacity onPress={onClose} style={styles.cancel}>
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.confirm}>
                            <Text style={styles.confirmText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "#000000aa",
        justifyContent: "center",
        alignItems: "center",
    },
    dialog: {
        backgroundColor: "white",
        padding: 20,
        width: "80%",
        borderRadius: 10,
    },
    title: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    buttons: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    cancel: {
        marginRight: 16,
    },
    cancelText: {
        color: "red",
    },
    confirmText: {
        color: "blue",
        fontWeight: "bold",
    },
    confirm: {
        paddingHorizontal: 10,
    },


});
