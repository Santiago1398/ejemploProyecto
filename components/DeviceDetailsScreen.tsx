import React, { useState, useEffect } from "react";
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
import { get } from "@/services/api";
import { ParamTC } from "@/infrastructure/intercafe/listapi.interface";
import { useRoute, RouteProp } from "@react-navigation/native";
import axios from "axios";

type RouteParams = {
    AlarmList: {
        mac: number;
    };
};

export default function AlarmList() {
    const route = useRoute<RouteProp<RouteParams, "AlarmList">>();
    const { mac } = route.params;

    const [selectedAlarm, setSelectedAlarm] = useState<ParamTC | null>(null);
    const [isOptionModalVisible, setOptionModalVisible] = useState(false);
    const [alarms, setAlarms] = useState<ParamTC[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlarms = async () => {
        if (!mac) {
            console.error("La dirección MAC no está definida");
            return;
        }

        try {
            setLoading(true);
            console.log(`Obteniendo alarmas para el dispositivo con MAC: ${mac}`);
            const data: ParamTC[] = await get(`alarmtc/status?mac=${mac}`);
            console.log("Alarmas obtenidas:", data);

            const enabledAlarms = data.filter(alarm => alarm.habilitado);
            setAlarms(enabledAlarms);
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error("Error de Axios:", error.response?.data || error.message);
            } else if (error instanceof Error) {
                console.error("Error estándar:", error.message);
            } else {
                console.error("Error desconocido:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mac) {
            fetchAlarms();
        }
    }, [mac]);

    const getBackgroundColor = (armado: boolean) => {
        return armado ? "#76db36" : "#8a9bb9";
    };

    const openOptionModal = (alarm: ParamTC) => {
        setSelectedAlarm(alarm);
        setOptionModalVisible(true);
    };

    const handleOptionSelect = (option: "Armada" | "Desarmada") => {
        if (selectedAlarm) {
            setAlarms((prevAlarms) =>
                prevAlarms.map((alarm) =>
                    alarm.idAlarm === selectedAlarm.idAlarm
                        ? { ...alarm, armado: option === "Armada" }
                        : alarm
                )
            );
        }
        setTimeout(() => setOptionModalVisible(false), 250);
    };

    return (
        <View style={styles.container}>
            {loading ? (
                <Text style={styles.loadingText}>Cargando alarmas</Text>
            ) : alarms.length === 0 ? (
                <Text style={styles.loadingText}>No hay alarmas habilitadas</Text>
            ) : (
                <FlatList
                    data={alarms}
                    keyExtractor={(item) => item.idAlarm.toString()}
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.alarmContainer,
                                { backgroundColor: getBackgroundColor(item.armado) },
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

