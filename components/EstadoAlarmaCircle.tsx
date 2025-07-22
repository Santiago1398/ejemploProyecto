import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
    armado: boolean;
    disparado: boolean;
    raised: boolean;
}

export default function EstadoAlarmaCircle({ armado, disparado, raised }: Props) {
    let backgroundColor = "transparent";

    // 🔥 NUEVA LÓGICA CORREGIDA:

    // 1️⃣ PRIORIDAD MÁXIMA: Si está 'raised' (activada realmente), mostrar ROJO
    if (raised) {
        backgroundColor = "#FF3B30"; // 🔴 ROJO - Alarma activada
    }
    // 2️⃣ Si está armada pero no activada, mostrar VERDE
    else if (armado && !raised) {
        backgroundColor = "#4CAF50"; // 🟢 VERDE - Armada y OK
    }
    // 3️⃣ Si no está armada ni activada, mostrar GRIS
    else if (!armado && !raised) {
        backgroundColor = "#8a9bb9"; // ⚫ GRIS - Desarmada
    }
    // 4️⃣ Fallback por si acaso
    else {
        backgroundColor = "#8a9bb9"; // ⚫ GRIS por defecto
    }

    // 🔍 DEBUG: Console log para verificar estados
    //console.log(`🔴 Alarma Circle - armado: ${armado}, disparado: ${disparado}, raised: ${raised} → ${backgroundColor}`);

    return <View style={[styles.circle, { backgroundColor }]} />;
}

const styles = StyleSheet.create({
    circle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        marginRight: 10,
        borderWidth: 2,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
});
