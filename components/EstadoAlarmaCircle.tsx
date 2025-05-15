import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
    armado: boolean;
    disparado: boolean;
    activo: boolean;
}

export default function EstadoAlarmaCircle({ armado, disparado, activo }: Props) {

    let backgroundColor = "transparent"; // por defecto, para evitar el salto visual

    if (armado && !disparado) {
        backgroundColor = "#77dc36"; // verde  claro cuando está todo OK
    } else if (!armado && disparado && activo) {
        backgroundColor = "#FF3B30"; // rojo
    } else if (!armado && !disparado) {
        backgroundColor = "#8a9bb9"; // gris
    }

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
    },
});

