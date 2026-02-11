import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { t } from "@/i18n/i18nConfig";

interface Props {
    visible: boolean;
    onClose: () => void;
    onConfirm: (telefono: string) => void;
}

export default function PhoneNumberDialog({ visible, onClose, onConfirm }: Props) {
    const [telefono, setTelefono] = useState("");

    //  NUEVA función de validación
    const isValidPhone = (phone: string): boolean => {
        // Si empieza con +, formato internacional
        if (phone.startsWith('+')) {
            // Mínimo +34 + 9 dígitos, máximo +999 + 12 dígitos
            return phone.length >= 12 && phone.length <= 16;
        } else {
            // Formato nacional español: exactamente 9 dígitos
            return phone.length === 9;
        }
    };

    //  NUEVA función de formateo
    const formatPhoneInput = (text: string): string => {
        // Permitir solo números y el símbolo + al inicio
        let cleaned = text.replace(/[^0-9+]/g, '');

        // Si empieza con +, formato internacional
        if (cleaned.startsWith('+')) {
            // Máximo 16 caracteres (+34 + hasta 12 dígitos)
            return cleaned.substring(0, 16);
        } else {
            // Solo números nacionales, máximo 9 dígitos
            return cleaned.substring(0, 9);
        }
    };

    //  MODIFICAR handleConfirm
    const handleConfirm = () => {
        if (isValidPhone(telefono)) {
            console.log(" Teléfono válido ingresado:", telefono);
            onConfirm(telefono);
            setTelefono("");
        } else {
            // Mensaje de error más específico
            if (telefono.startsWith('+')) {
                alert("Formato internacional inválido. Ej: +34612345678");
            } else {
                alert(t("PhoneNumberDialog.invalid"));
            }
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.dialog}>
                    <Text style={styles.title}>{t("PhoneNumberDialog.title")}</Text>
                    {/*  subtitle para mencionar formato internacional */}
                    <Text style={styles.subtitle}>
                        {t("PhoneNumberDialog.subtitle")} {"\n"}
                        612345678 o +34612345678
                    </Text>
                    <TextInput
                        placeholder="612345678"
                        keyboardType="phone-pad"
                        style={styles.input}
                        value={telefono}
                        onChangeText={(text) => setTelefono(formatPhoneInput(text))}
                    />
                    <View style={styles.buttons}>
                        <TouchableOpacity onPress={onClose} style={styles.cancel}>
                            <Text style={styles.cancelText}>{t("PhoneNumberDialog.cancel")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.confirm}>
                            <Text style={styles.confirmText}>{t("PhoneNumberDialog.save")}</Text>
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