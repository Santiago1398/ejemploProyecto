import React, { useState } from "react";
import { TouchableOpacity, Alert, StyleSheet } from "react-native";
import { post } from "@/services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ButtonMasterProps {
    mac: number;
    fetchAlarms: () => void; // Función para actualizar alarmas
}

const ButtonMaster: React.FC<ButtonMasterProps> = ({ mac, fetchAlarms }) => {
    const [isEnabled, setIsEnabled] = useState(true);

    const handleToggleMaster = async () => {
        const status = isEnabled ? 0 : 1;
        try {
            console.log(`Enviando estado ${status} para mac: ${mac}`);
            const response = await post(`alarmtc/armMaster?mac=${mac}&status=${status}`, {});

            console.log("Respuesta del servidor:", response);

            // Validamos si el API devuelve un JSON ya procesado
            const data = response;

            // Verificamos si el estado del botón maestro cambió correctamente
            if (data.status === "Master Button Alarm Armed" || data.status === "Master Button Alarm Disarmed") {
                Alert.alert("Éxito", `Las alarmas han sido ${status === 1 ? "activadas" : "desactivadas"}.`);
                setIsEnabled(!isEnabled); // Cambia el estado del botón
                fetchAlarms(); // Realiza un GET para actualizar el estado de las alarmas
            } else {
                Alert.alert("Error", "No se pudo cambiar el estado de las alarmas.");
            }
        } catch (error) {
            console.error("Error al cambiar el estado de la alarma:", error);
            Alert.alert("Error", "No se pudo cambiar el estado de las alarmas.");
        }
    };


    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: isEnabled ? "green" : "red" },
            ]}
            onPress={handleToggleMaster}
        >
            <MaterialCommunityIcons name="power" size={40} color="white" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        position: "absolute",
        bottom: 10, // Ajuste para evitar que se corte
        right: 20, // Asegurar que esté bien alineado a la derecha
        width: 75, // Aumentar tamaño para evitar corte
        height: 75, // Asegurar el tamaño uniforme
        borderRadius: 37.5, // Circular
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "red",
        elevation: 5, // Sombra para resaltar
    },
});

export default ButtonMaster;






