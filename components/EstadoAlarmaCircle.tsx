import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
    armado: boolean;
    disparado: boolean;
}

export default function EstadoAlarmaCircle({ armado, disparado }: Props) {
    if (armado && !disparado) return null; // todo OK, no se muestra nada y ninguna alrma disparada
    if (armado && disparado) return null;  //  ya se volvió a armar, no se muestra

    let backgroundColor = "#8a9bb9"; // gris por defecto

    if (!armado && disparado) {
        backgroundColor = "#FF3B30"; //  alerta pendiente estado rojo 
    }

    return <View style={[styles.circle, { backgroundColor }]} />;
}

const styles = StyleSheet.create({
    circle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 8,
    },
});
