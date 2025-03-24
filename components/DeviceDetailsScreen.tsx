import React, { useState, useEffect, useLayoutEffect } from "react";
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
import { get, post } from "@/services/api";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/navigation";
import ButtonMaster from "./BottonMaster";
import { ParamTC } from "@/infrastructure/interface/listapi.interface";
//import AlarmButton from "./AlarmButtonProps";
import Menu3Puntos from "@/components/Menu3Puntos";

type DeviceDetailsRouteProp = RouteProp<RootStackParamList, "DeviceDetails">;





export default function AlarmList() {
    const route = useRoute<DeviceDetailsRouteProp>();
    const { device } = route.params;
    const { mac, farmName, siteName } = device;

    const [selectedAlarm, setSelectedAlarm] = useState<ParamTC | null>(null);
    const [isOptionModalVisible, setOptionModalVisible] = useState(false);
    const [alarms, setAlarms] = useState<ParamTC[]>([]);
    const [loading, setLoading] = useState(true);
    const [masterAlarmState, setMasterAlarmState] = useState<boolean>(true); // Estado de la alarma 1000


    // Función para obtener las alarmas (GET)
    const fetchAlarms = async () => {
        try {
            setLoading(true);
            console.log("Petición GET:", `alarmtc/status?mac=${mac}`);
            const data = await get(`alarmtc/status?mac=${mac}`);
            console.table("Datos obtenidos:", data);

            //Guardamoss el estado de la alarma del Boton Master
            const masterAlarm = data.find((alarm: { idAlarm: number; }) => alarm.idAlarm === 1000);
            if (masterAlarm) {
                setMasterAlarmState(masterAlarm.armado);
            }

            const enabledAlarms = data.filter(
                (alarm: { habilitado: boolean; idAlarm: number }) => alarm.habilitado === true && alarm.idAlarm !== 1000
            );
            console.table("Alarmas habilitadas:", enabledAlarms);

            setAlarms(enabledAlarms);
        } catch (error) {
            console.error("Error en la solicitud GET:", error);
            Alert.alert("Error", "No se pudieron cargar las alarmas.");
        } finally {
            setLoading(false);
        }
    };

    // Efecto para obtener alarmas al montar el componente
    useEffect(() => {
        if (mac) {
            fetchAlarms();
        }
    }, [mac]);

    const navigation = useNavigation<any>();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: false,
            headerRight: () => (
                <Menu3Puntos device={{
                    latitude: 0,
                    longitude: 0,
                    farmName: "",
                    siteName: "",
                    mac: 0
                }} />
            ),
        });
    }, [navigation, device]);


    // Manejo de la opción de armado/desarmado
    const handleOptionSelect = async (option: string) => {
        if (selectedAlarm) {
            const status = option === "Armada" ? 1 : 0;
            const idAlarm = selectedAlarm.idAlarm;

            try {
                const response = await post(`alarmtc/arm?mac=${mac}&alarm=${idAlarm}&status=${status}`, {});
                console.log("Respuesta del servidor:", response);

                //Aqui actualizamos el estado antes de la alarma amtes de que se cierre la pantalla modal 
                setSelectedAlarm((prev) => prev ? { ...prev, armado: status === 1 } : prev);

                setTimeout(() => {
                    setOptionModalVisible(false);
                    fetchAlarms(); // Actualiza la lista tras el cambio
                }, 250);
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
                <Text style={styles.loadingText}></Text>
            ) : alarms.length === 0 ? (
                <View style={styles.centeredContainer}>
                    <Text style={styles.noAlarmsText}>No hay alarmas habilitadas</Text>
                </View>) : (
                <FlatList
                    data={alarms.filter(
                        (alarm, index, self) =>
                            index === self.findIndex((a) => a.idAlarm === alarm.idAlarm)
                    )}
                    keyExtractor={(item) => `${item.idAlarm}`}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.alarmContainer,
                                { backgroundColor: item.armado ? "#76db36" : "#8a9bb9" },
                            ]}
                            onPress={() => openOptionModal(item)}
                        >
                            <Text style={styles.alarmText}>{item.texto}</Text>
                            <Entypo name="chevron-thin-right" size={24} color="#333" />
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Botón Master en la esquina inferior derecha */}
            <ButtonMaster mac={mac} fetchAlarms={fetchAlarms} masterAlarmState={masterAlarmState} />

            {/* Botón de simulación y maestro 
            <AlarmButton mac={mac} farmName={farmName} siteName={siteName} alarms={alarms} fetchAlarms={fetchAlarms} /> */}

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
                    <Pressable style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedAlarm?.texto}</Text>
                        <TouchableOpacity
                            style={styles.optionRow}
                            onPress={() => handleOptionSelect("Armada")}
                        >
                            <View
                                style={[
                                    styles.circle,
                                    selectedAlarm?.armado ? { backgroundColor: "#76db36" } : {},
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
                                    !selectedAlarm?.armado ? { backgroundColor: "#8a9bb9" } : {},
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
        backgroundColor: "#f4f4f4", //Establece un fondo gris claro para toda la pantalla.
        paddingBottom: 90, // Asegurar espacio suficiente para el botón
    },
    loadingText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 20, //margen un espacio de 20px arriba del texto  
    },
    alarmContainer: {
        padding: 14, // Agrega espacio alrededor del contenido dentro del contenedor de la alarma.
        marginVertical: 6,
        borderRadius: 12,
        flexDirection: "row", // Organiza los elementos en fila.
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 16,
        width: "90%", // El contenedor ocupa el 90% del ancho de la pantalla.
        alignSelf: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        backgroundColor: "#66BB6A", // Un verde más agradable
    },
    alarmText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333333", //Color gris oscuro.
        flex: 1,
    },
    centeredContainer: {
        flex: 1, // Ocupa toda la pantalla
        justifyContent: "center",
        alignItems: "center",
    },
    noAlarmsText: {
        fontSize: 20,
        color: "#666",
        fontWeight: "bold",
        textAlign: "center",
    },
    chevronButton: {
        padding: 8,
        marginRight: -8, //Mueve el botón 8px hacia la izquierda.
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%", // Ocupa el 80% del ancho de la pantalla.
        backgroundColor: "#fff", // Fondo blanco.
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000", // Sombra negra.
        shadowOffset: { width: 0, height: 2 }, // Desplazamiento de la sombra.
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20, // Espaciado entre el título y las opciones.
        textAlign: "center",
    },
    optionRow: {
        flexDirection: "row", // Organiza los elementos en fila.
        alignItems: "center", // Alinea los elementos verticalmente.
        paddingVertical: 10,
        width: "100%",
    },
    optionText: {
        marginLeft: 10,
        fontSize: 16,
        color: "#333", // Color gris oscuro.
        fontWeight: "bold",
    },
    circle: {
        width: 24, // Diámetro del círculo.
        height: 24, // Diámetro del círculo.
        borderRadius: 12, // Radio del círculo.
        borderWidth: 2,
        borderColor: "#999", // Color gris claro.
        marginRight: 10, // Espaciado a la derecha del círculo.
        backgroundColor: "transparent", // Fondo transparente.
    },

});