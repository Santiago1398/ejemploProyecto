import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    FlatList,
    TouchableOpacity,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { Alarma } from "@/infrastructure/intercafe/listapi.interface";

export default function DeviceList({ route }: any) {
    const { device } = route.params;
    const [selectedAlarm, setSelectedAlarm] = useState<Alarma | null>(null);
    const [isOptionModalVisible, setOptionModalVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string>("Armada");

    const alarmas = [
        { id: 1, nombre: "A1 Cuadro Electrica ", estado: 0 },
        { id: 2, nombre: "A2 Sistema de Calefaccion", estado: 2 },
        { id: 3, nombre: "A3 Sistemna de riego", estado: 1 },
        { id: 4, nombre: "A4 Sistema de Ventilacion", estado: 0 },
        { id: 5, nombre: "A5 Bebedores automaticos ", estado: 2 },
        { id: 6, nombre: "A6 Alimentadores automaticos", estado: 1 },
        { id: 7, nombre: "A7 Geneador en fallo", estado: 2 },
        { id: 8, nombre: "A8 Perdida de suminstro electrico", estado: 1 },
        { id: 9, nombre: "A9 Perdida de suminstro cuadro puerta", estado: 0 },
        { id: 10, nombre: "A10 Sobrecarga eléctrica  ", estado: 1 },
        { id: 11, nombre: "A11 Humedad fuera de rango ", estado: 2 },
    ];

    const getBackgroundColor = (estado: number) => {
        switch (estado) {
            case 0:
                return "#8a9bb9"; //Fuera de linea , gris
            case 1:
                return "#76db36"; //En linea sin alarma , verde
            case 2:
                return "red"; //En linea con alarma , rojo
            case 3:
                return "#9E75C6"; //contraseña incorrecta, violeta
            case 4:
                return "#F6BC31"; //En linea desarmada, amarilla
            default:
                return "white";

        }
    };


    const openOptionModal = (alarm: any) => {
        setSelectedAlarm(alarm);
        setOptionModalVisible(true);
    };

    const handleOptionSelect = (option: string) => {
        setSelectedOption(option);
        // Retraso de 500 ms antes de cerrar el modal
        setTimeout(() => {
            setOptionModalVisible(false);
        }, 300);
    };

    return (
        <View style={styles.container}>
            {/* Rectángulo superior */}
            <View style={[styles.headerContainer, { backgroundColor: getBackgroundColor(device.estado) }]}>
                <Text style={styles.headerText}>{device.ubicacion}</Text>
                <Text style={styles.headerText}>{device.numeroNave}</Text>
            </View>

            {/* Lista de alarmas */}
            <FlatList
                data={alarmas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.alarmContainer,
                            { backgroundColor: getBackgroundColor(item.estado) },
                        ]}
                    >
                        <Text style={styles.alarmText}>{item.nombre}</Text>
                        <TouchableOpacity
                            style={styles.chevronButton}
                            onPress={() => openOptionModal(item)}
                        >
                            <Entypo name="chevron-thin-right" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.alarmList}
            />

            {/* Modal de opciones */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isOptionModalVisible}
                onRequestClose={() => setOptionModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setOptionModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text style={styles.modalTitle}>
                            {selectedAlarm?.nombre}
                        </Text>

                        {/* Opción Armada */}
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => handleOptionSelect("Armada")}
                        >
                            <View
                                style={[
                                    styles.circle,
                                    selectedOption === "Armada" && { backgroundColor: "#85C285" },
                                ]}
                            />
                            <Text style={styles.optionText}>Armada</Text>
                        </TouchableOpacity>

                        {/* Opción Desarmada */}
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => handleOptionSelect("Desarmada")}
                        >
                            <View
                                style={[
                                    styles.circle,
                                    selectedOption === "Desarmada" && { backgroundColor: "#FF2323" },
                                ]}
                            />
                            <Text style={styles.optionText}>Desarmada</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },
    headerContainer: {
        padding: 20,
        margin: 16,
        borderRadius: 10,
        alignItems: "center",
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "rgb(60, 60, 60)",
    },
    alarmList: {
        paddingHorizontal: 16,
    },
    alarmContainer: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    alarmText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333333",
        flex: 1,
    },
    chevronButton: {
        padding: 8,
        marginRight: -8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        width: "100%",
    },
    optionText: {
        marginLeft: 10,
        fontSize: 16,
        color: "#333",
        fontWeight: "bold",
    },
    circle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#999",
        marginRight: 10,
        backgroundColor: "transparent",
    },
});
