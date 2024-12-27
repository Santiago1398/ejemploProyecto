import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";



export default function DeviceList({ route }: any) {
    const { device } = route.params;
    const [isDropdownVisible, setDropdownVisible] = useState(false);

    //Estados alarmas
    const getBackgroundColor = (estado: number) => {
        switch (estado) {
            case 0:
                return "#B0B0B0"; //Fuera de linea
            case 1:
                return "#85C285"; //En linea sin alarma
            case 2:
                return "red"; //En linea con alarma
            case 3:
                return "#9E75C6"; //contraseña incorrecta;
            case 4:
                return "#F6BC31"; //En linea desarmada
            default:
                return "white";

        }


    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { backgroundColor: getBackgroundColor(device.estado) }]}>
                <Text style={styles.headerText}> {device.ubicacion}</Text>
                <Text style={styles.headerText}>A1 {device.estado === 1 ? "Habilitada" : "Activada"}</Text>
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
        color: "#333333",
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