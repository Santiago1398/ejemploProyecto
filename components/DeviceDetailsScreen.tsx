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
import Ionicons from "@expo/vector-icons/Ionicons";
import { get, post } from "@/services/api";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/navigation";
import ButtonMaster from "./BottonMaster";
import { ParamTC } from "@/infrastructure/interface/listapi.interface";
import Menu3Puntos from "@/components/Menu3Puntos";

import { notificationService } from '@/hooks/NotificationService';
import { playAlarmSound } from '@/utils/sound';
import { Notification } from '@/hooks/usePushNotifications';

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

    const navigation = useNavigation<any>();

    // 1. Obtener las alarmas (GET)
    const fetchAlarms = async () => {
        try {
            setLoading(true);
            console.log("Petición GET:", `alarmtc/status?mac=${mac}`);
            const data = await get(`alarmtc/status?mac=${mac}`);
            console.table("Datos obtenidos:", data);

            // Guardamos el estado de la alarma del Botón Master
            const masterAlarm = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 1000);
            if (masterAlarm) {
                setMasterAlarmState(masterAlarm.armado);
            }

            // Filtramos las alarmas habilitadas y distintas de 1000
            const enabledAlarms = data.filter(
                (alarm: { habilitado: boolean; idAlarm: number }) =>
                    alarm.habilitado === true && alarm.idAlarm !== 1000
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

    // 2. useEffect para cargar las alarmas al montar
    useEffect(() => {
        if (mac) {
            fetchAlarms();
        }
    }, [mac]);

    // 3. useLayoutEffect para configurar el header con Menu3Puntos
    useLayoutEffect(() => {
        if (!device || !farmName || !siteName || !mac) {
            console.error("Faltan datos necesarios", { device, farmName, siteName, mac });
        }
        const latitude = device.latitude || 0;
        const longitude = device.longitude || 0;
        navigation.setOptions({
            headerTitle: false,
            headerRight: () => (
                <Menu3Puntos
                    device={{
                        latitude,
                        longitude,
                        farmName,
                        siteName,
                        mac,
                    }}
                />
            ),
        });
    }, [navigation, device, farmName, siteName, mac]);

    // 4. Manejo de armado/desarmado de alarma
    const handleOptionSelect = async (option: string) => {
        if (selectedAlarm) {
            const status = option === "Armada" ? 1 : 0;
            const idAlarm = selectedAlarm.idAlarm;

            try {
                const response = await post(`alarmtc/arm?mac=${mac}&alarm=${idAlarm}&status=${status}`, {});
                console.log("Respuesta del servidor:", response);

                // Actualizamos el estado antes de cerrar el modal
                setSelectedAlarm((prev) => (prev ? { ...prev, armado: status === 1 } : prev));

                setTimeout(() => {
                    setOptionModalVisible(false);
                    fetchAlarms(); // Refrescamos la lista tras el cambio
                }, 250);
            } catch (error) {
                console.error("Error al cambiar el estado de la alarma:", error);
                Alert.alert("Error", "No se pudo cambiar el estado de la alarma.");
            }
        }
    };

    // 5. Abre el modal para la alarma seleccionada
    const openOptionModal = (alarm: ParamTC) => {
        setSelectedAlarm(alarm);
        setOptionModalVisible(true);
    };

    // 6. Render de cada alarma (con mejoras visuales)
    const renderAlarmItem = ({ item }: { item: ParamTC }) => {
        return (
            <TouchableOpacity
                style={[
                    styles.alarmContainer,
                    { backgroundColor: item.armado ? "#76db36" : "#8a9bb9" },
                ]}
                onPress={() => openOptionModal(item)}
            >
                <View style={styles.alarmRow}>
                    {/* Ícono de campana u otro representativo */}
                    <Ionicons name="alert-circle-outline" size={24} color="#fff" style={styles.alarmIcon} />
                    <Text style={styles.alarmText}>{item.texto}</Text>
                </View>
                {/* Flecha a la derecha */}
                <Entypo name="chevron-thin-right" size={20} color="#fff" />
            </TouchableOpacity>
        );
    };

    // Función para enviar notificación de alarma de prueba
    const sendTestAlarm = async () => {
        try {
            if (!device || !farmName || !siteName) {
                Alert.alert("Error", "Información del dispositivo incompleta");
                return;
            }

            // Crear objeto de notificación según la interfaz
            const notification: Notification = {
                title: '¡ALARMA ACTIVADA!',
                data: {
                    farmName: farmName,
                    siteName: siteName,
                    alarmText: selectedAlarm?.texto || 'Alarma activada',
                    type: 'alarm'
                },
                isAlarm: true
            };

            // Mostrar notificación usando el servicio
            await notificationService.showLocalNotification(notification);

            // Reproducir sonido de alarma
            await playAlarmSound();

            Alert.alert(
                'Alarma Enviada',
                'La alarma sonará hasta que toques la notificación o abras la app desde ella'
            );
        } catch (error) {
            console.error('Error al enviar notificación de alarma:', error);
            Alert.alert('Error', 'No se pudo enviar la notificación de alarma');
        }
    };

    return (
        <View style={styles.container}>

            {/* Botón de prueba de alarma */}
            <TouchableOpacity
                style={styles.testAlarmButton}
                onPress={sendTestAlarm}
            >
                <Ionicons name="notifications" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.testAlarmButtonText}>Probar Notificación de ALARMA</Text>
            </TouchableOpacity>

            {loading ? (
                <Text style={styles.loadingText}>Cargando alarmas...</Text>
            ) : alarms.length === 0 ? (
                <View style={styles.centeredContainer}>
                    <Text style={styles.noAlarmsText}>No hay alarmas habilitadas</Text>
                </View>
            ) : (
                <FlatList
                    data={alarms}
                    keyExtractor={(item) => `${item.idAlarm}`}
                    renderItem={renderAlarmItem}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            {/* Botón Master en la esquina inferior derecha */}
            <ButtonMaster mac={mac} fetchAlarms={fetchAlarms} masterAlarmState={masterAlarmState} />

            {/* Modal para armar/desarmar la alarma */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isOptionModalVisible}
                onRequestClose={() => setOptionModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setOptionModalVisible(false)}>
                    <Pressable style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{selectedAlarm?.texto}</Text>
                        <TouchableOpacity style={styles.optionRow} onPress={() => handleOptionSelect("Armada")}>
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

/** Estilos mejorados */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f4",
    },
    loadingText: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginTop: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    noAlarmsText: {
        fontSize: 20,
        color: "#666",
        fontWeight: "bold",
        textAlign: "center",
    },
    alarmContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        borderRadius: 12,
        // Sombras
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
    },
    alarmRow: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1, // Para que el texto ocupe el espacio restante
    },
    alarmIcon: {
        marginRight: 8,
    },
    alarmText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
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
    // Añade estos estilos al objeto styles
    testAlarmButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF3B30",
        marginHorizontal: 16,
        marginVertical: 10,
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    testAlarmButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    buttonIcon: {
        marginRight: 8,
    },
});
