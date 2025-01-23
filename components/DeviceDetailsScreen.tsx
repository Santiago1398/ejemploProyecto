import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    FlatList,
    TouchableOpacity,
    Alert,
} from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { get } from "@/services/api";
import { post } from "@/services/api";

import { ParamTC } from "@/infrastructure/intercafe/listapi.interface";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "@/types/navigation";

export default function AlarmList() {
    const route = useRoute<RouteProp<RootStackParamList, "DeviceDetails">>();
    const { device } = route.params;
    const { mac } = device;

    const [selectedAlarm, setSelectedAlarm] = useState<ParamTC | null>(null);
    const [isOptionModalVisible, setOptionModalVisible] = useState(false);
    const [alarms, setAlarms] = useState<ParamTC[]>([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(false); // Estado para disparar el GET

    // Función para obtener las alarmas
    const fetchAlarms = async () => {
        try {
            setLoading(true);

            if (!mac) {
                console.error("Error: La MAC no está definida.");
                return;
            }

            console.log("Petición GET:", `alarmtc/status?mac=${mac}`);
            const data: ParamTC[] = await get(`alarmtc/status?mac=${mac}`);
            console.log("Datos obtenidos del servidor:", data);

            const enabledAlarms = data.filter(
                (alarm) => alarm.habilitado === true && alarm.idAlarm !== 1000
            );
            console.log("Alarmas habilitadas:", enabledAlarms);

            setAlarms(enabledAlarms);
        } catch (error) {
            console.error("Error en la solicitud GET:", error);
            Alert.alert("Error", "No se pudieron cargar las alarmas.");
        } finally {
            setLoading(false); // Asegúrate de cambiar el estado loading
        }
    };


    // Efecto para obtener alarmas al montar el componente o cuando `refresh` cambie
    useEffect(() => {
        if (mac) {
            fetchAlarms();
        }
    }, [mac, refresh]);

    // Maneja la selección de opciones (POST)
    const handleOptionSelect = async (option: "Armada" | "Desarmada") => {
        if (selectedAlarm) {
            const status = option === "Armada" ? 1 : 0; // Status para la solicitud POST
            const idAlarm = selectedAlarm.idAlarm;
            console.log("MAC enviado:", mac, typeof mac);
            console.log("Alarm ID enviado:", selectedAlarm?.idAlarm, typeof selectedAlarm?.idAlarm);
            console.log("Status enviado:", option === "Armada" ? 1 : 0, typeof (option === "Armada" ? 1 : 0));

            try {
                const response = await post(`alarmtc/arm?/mac=${mac}&alarm=${idAlarm}&status=${status}`, {});
                console.log("Respuesta del servidor:", response);

                // Cierra el modal después de una pequeña espera
                setTimeout(() => setOptionModalVisible(false), 250);

                // Actualiza el trigger para refrescar el estado
                setRefresh((prev) => !prev);
            } catch (error) {
                console.error("Error al cambiar el estado de la alarma:", error);
                Alert.alert("Error", "No se pudo cambiar el estado de la alarma.");
            }
        }
    };

    // Abre el modal para la alarma seleccionada
    const openOptionModal = (alarm: ParamTC) => {
        setSelectedAlarm(alarm);
        setOptionModalVisible(true);
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <Text style={styles.loadingText}>Cargando alarmas...</Text>
            ) : alarms.length === 0 ? (
                <Text style={styles.loadingText}>No hay alarmas habilitadas</Text>
            ) : (
                <FlatList
                    data={alarms.filter(
                        (alarm, index, self) =>
                            index === self.findIndex((a) => a.idAlarm === alarm.idAlarm)
                    )}
                    keyExtractor={(item, index) =>
                        item.idAlarm ? `${item.idAlarm}-${index}` : `key-${index}`
                    }
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.alarmContainer,
                                { backgroundColor: item.armado ? "#76db36" : "#8a9bb9" },
                            ]}
                        >
                            <Text style={styles.alarmText}>{item.texto}</Text>
                            <TouchableOpacity
                                style={styles.chevronButton}
                                onPress={() => openOptionModal(item)}
                            >
                                <Entypo name="chevron-thin-right" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                    )}
                />

            )}

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
                        <Text style={styles.modalTitle}>{selectedAlarm?.texto}</Text>
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => handleOptionSelect("Armada")}
                        >
                            <View
                                style={[
                                    styles.circle,
                                    selectedAlarm?.armado && {
                                        backgroundColor: "#76db36",
                                    },
                                ]}
                            />
                            <Text style={styles.optionText}>Armada</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => handleOptionSelect("Desarmada")}
                        >
                            <View
                                style={[
                                    styles.circle,
                                    !selectedAlarm?.armado && {
                                        backgroundColor: "#8a9bb9",
                                    },
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
    loadingText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 20,
    },
    alarmContainer: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 16,
        width: "90%",
        alignSelf: "center",
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



