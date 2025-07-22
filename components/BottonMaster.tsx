import React, { useEffect, useState, } from "react";
import { TouchableOpacity, Alert, StyleSheet, Text, View } from "react-native";
import { post } from "@/services/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "@/i18n/i18nConfig";

interface ButtonMasterProps {
    mac: number;
    fetchAlarms: () => void; // Función para actualizar alarmas
    masterAlarmState: boolean; // Estado de la alarma 1000
    onToggleMaster: () => void | Promise<void>;
    disabled?: boolean; // <-- nuevo
}

const ButtonMaster: React.FC<ButtonMasterProps> = ({
    mac,
    fetchAlarms,
    masterAlarmState,
    onToggleMaster,
    disabled
}) => {
    const [isEnabled, setIsEnabled] = useState(masterAlarmState);

    useEffect(() => {
        setIsEnabled(masterAlarmState);
    }, [masterAlarmState]);

    useEffect(() => {
        console.log('🔄 ButtonMaster - masterAlarmState cambió:');
        console.log('   - Valor anterior:', isEnabled);
        console.log('   - Valor nuevo:', masterAlarmState);
        console.log('   - disabled:', disabled);

        setIsEnabled(masterAlarmState);
    }, [masterAlarmState]);

    // 🔥 LÓGICA SIMPLE: 
    // - Si disabled=true, siempre gris y no clickeable
    // - Si disabled=false, usar el estado normal (rojo/gris según masterAlarmState)
    const getBackgroundColor = () => {
        if (disabled) {
            return "#8a9bb9"; // Gris cuando está deshabilitado
        }
        return isEnabled ? "#007AFF" : "#4B5563"; // Rojo si activo, gris si inactivo
    }; //#1a4697 //007AFF

    return (
        <TouchableOpacity
            disabled={disabled}
            style={[
                styles.masterButtonFull,
                { backgroundColor: getBackgroundColor() }
            ]}
            onPress={disabled ? undefined : onToggleMaster}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <Text style={styles.masterLabel}>{t("BottonMaster.label")}</Text>
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
        borderRadius: 30,
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
    shadowColor: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
    },
});

export default ButtonMaster;