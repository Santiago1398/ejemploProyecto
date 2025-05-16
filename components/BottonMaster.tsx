import React, { useEffect, useState, } from "react";
import { TouchableOpacity, Alert, StyleSheet, Text, View } from "react-native";
import { post } from "@/services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ButtonMasterProps {
    mac: number;
    fetchAlarms: () => void; // Función para actualizar alarmas
    masterAlarmState: boolean; // Estado de la alarma 1000
}


const ButtonMaster: React.FC<ButtonMasterProps> = ({ mac, fetchAlarms, masterAlarmState }) => {
    const [isEnabled, setIsEnabled] = useState(masterAlarmState);
    useEffect(() => {
        setIsEnabled(masterAlarmState);
    }, [masterAlarmState]);

    const handleToggleMaster = async () => {
        const status = isEnabled ? 0 : 1;
        try {
            console.log(`Enviando estado ${status} para mac: ${mac}`);
            const response = await post(`alarmtc/armMaster?mac=${mac}&status=${status}`, {});

            console.log("Respuesta del servidor:", response);

            console.log(`🔴 Estado actual: ${isEnabled ? "OFF" : "ON"}`);
            console.log(`🟢 Enviando POST a: alarmtc/armMaster?mac=${mac}&status=${status}`);


            // Validamos si el API devuelve un JSON ya procesado
            const data = response;

            // Verificamos si el estado del botón maestro cambió correctamente
            if (data.status === "Master Button Alarm Armed" || data.status === "Master Button Alarm Disarmed") {
                Alert.alert("Éxito", `Las alarmas han sido ${status === 1 ? "activadas" : "desactivadas"}.`);
                setIsEnabled(!isEnabled); // Cambia el estado del botón
                if (status === 1) {
                    fetchAlarms(); // Realiza un GET para actualizar el estado de las alarmas
                }

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
                styles.masterButtonFull,
                { backgroundColor: isEnabled ? "#FF3B30" : "#4CD964" }, // rojo o verde
            ]}
            onPress={handleToggleMaster}
        >
            <Text style={styles.masterLabel}>Master</Text>
            <MaterialCommunityIcons name="power" size={32} color="white" />
        </TouchableOpacity>



    );
};

const styles = StyleSheet.create({
    masterButtonFull: {
        position: "absolute",
        bottom: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },

    masterLabel: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        marginRight: 12,
    },

    masterButtonContainer: {
        width: 60,
        height: 60,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },

    masterText: {
        marginTop: 4,
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    wrapper: {
        position: "absolute",
        bottom: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 12, // si usas React Native >= 0.71
    },



});

export default ButtonMaster;






