import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";



export default function DevicDetailsScreen({ route }: any) {
    const { device } = route.params;
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    //Estados alarmas
    const getBackgroundColor = (estado: number) => {
        switch (estado) {
            case 1:
                return "#90ee90"; //verde
            case 2:
                return "#FF2323"; //rojo
            default:
                return "#FFFFFF"; //blanco
        }


    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { backgroundColor: getBackgroundColor(device.estado) }]}>
                <Text style={styles.headerText}>Nombre: {device.ubicacion}</Text>
                <Text style={styles.headerText}>Alarma: {device.estado === 1 ? "Habilitada" : "Activada"}</Text>
            </View>

            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setDropdownVisible(!isDropdownVisible)}
            >
                <Text style={styles.dropdownText}>Opciones ▼</Text>
            </TouchableOpacity>

            {isDropdownVisible && (
                <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                        style={[
                            styles.dropdownItem,
                            { backgroundColor: "#90ee90" }, // Verde para Armada
                        ]}
                    >
                        <Text style={styles.dropdownItemText}>Armada</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.dropdownItem,
                            { backgroundColor: "#FF2323" }, // Rojo para Desarmada
                        ]}
                    >
                        <Text style={styles.dropdownItemText}>Desarmada</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    headerText: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "bold",
    },
    dropdownButton: {
        padding: 12,
        backgroundColor: "#000",
        borderRadius: 8,
    },
    dropdownText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
    },
    dropdownMenu: {
        marginTop: 8,
        borderRadius: 8,
        overflow: "hidden",
    },
    dropdownItem: {
        padding: 12,
    },
    dropdownItemText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
    },
});