import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
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
import { ParamTC } from "@/infrastructure/intercafe/listapi.interface";
import Menu3Puntos from "@/components/Menu3Puntos";

import { notificationService } from '@/hooks/NotificationService';
import EstadoAlarmaCircle from "./EstadoAlarmaCircle";



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
    //const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const navigation = useNavigation<any>();
    const [headerText, setHeaderText] = useState<string>("Alarmas Activas"); // Texto del header para controlarlo
    const [headerColor, setHeaderColor] = useState<string>("#76db36"); // Color del header para controlarloconst flatListRef = useRef<FlatList>(null);
    const flatListRef = useRef<FlatList>(null);

    const COLORS = {
        yellowBackground: "#fef9c3",
        yellowText: "#ca8a04",
        greenBackground: "#dcfe7f",
        greenText: "#16a34a",
        redBackground: "#FFCDD2",
        redText: "#C62828",
        greyBackground: "#CFD8DC",
        greyText: "#37474F",
    };

    const scrollOffset = useRef(0); // valor persistente

    const handleScroll = (event: any) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
    };






    //const [pushToken, setPushToken] = useState<string | null>(null);
    //const [fcmToken, setFcmToken] = useState<string | null>(null);

    const updateHeaderStatus = (alarms: ParamTC[], masterState: boolean) => {
        const alarmaDisparada = alarms.some(alarm => alarm.disparado);
        if (alarmaDisparada) {
            setHeaderText("Alarma Activada");
            setHeaderColor("#FF3B30"); // rojo
        } else if (masterState) {
            setHeaderText("Alarmas Activadas");
            setHeaderColor("#76db36"); // verde
        } else {
            setHeaderText("Alarmas Desarmadas");
            setHeaderColor("#8a9bb9"); // gris
        }
    };

    const handleToggleMaster = async () => {
        const status = masterAlarmState ? 0 : 1;
        try {
            const response = await post(`alarmtc/armMaster?mac=${mac}&status=${status}`, {});
            if (response.status === "Master Button Alarm Armed" || response.status === "Master Button Alarm Disarmed") {
                Alert.alert("Éxito", `Las alarmas han sido ${status === 1 ? "activadas" : "desactivadas"}.`);
                const nuevoEstado = !masterAlarmState;
                setMasterAlarmState(nuevoEstado);
                updateHeaderStatus(alarms, nuevoEstado);
                if (status === 1) {
                    fetchAlarms(); // solo si se activan
                }
            }
        } catch (error) {
            console.error("Error:", error);
            Alert.alert("Error", "No se pudo cambiar el estado de las alarmas.");
        }
    };




    // 1. Obtener las alarmas (GET)
    const fetchAlarms = async () => {
        try {
            setLoading(true);
            const scrollY = scrollOffset.current; // guarda antes

            console.log("Petición GET:", `alarmtc/status?mac=${mac}`);
            const data = await get(`alarmtc/status?mac=${mac}`);
            console.table("Datos obtenidos:", data);

            // Guardamos el estado de la alarma del Botón Master
            const masterAlarm = data.find((alarm: { idAlarm: number }) => alarm.idAlarm === 1000);
            if (masterAlarm) {
                setMasterAlarmState(masterAlarm.armado);
            }

            // Filtramos las alarmas habilitadas y distintas de 1000
            const enabledAlarms = data
                .filter((alarm: { habilitado: boolean; idAlarm: number }) => alarm.habilitado && alarm.idAlarm !== 1000)
                .map((alarm: ParamTC) => ({
                    ...alarm,
                    activada: false,
                }));

            console.table("Alarmas habilitadas:", enabledAlarms);

            setAlarms(enabledAlarms);
            updateHeaderStatus(enabledAlarms, masterAlarm?.armado ?? false);
            // Actualiza el estado del header
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({ offset: scrollY, animated: false });
            }, 50);
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
        const latitude = device.latitude || 0;
        const longitude = device.longitude || 0;

        navigation.setOptions({
            headerTitle: () => (
                <Text style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#FFFFFF",
                    textAlign: "center"
                }}>
                    {headerText}
                </Text>
            ),
            headerStyle: {
                backgroundColor: headerColor, // Usa los tonos suaves sugeridos
                elevation: 0, // Android: quita sombra si no la necesitas
                shadowOpacity: 0, // iOS: quita sombra
            },
            headerTintColor: "#000000",
            headerRight: () => (
                <Menu3Puntos
                    device={{ latitude, longitude, farmName, siteName, mac }}
                />
            ),
        });
    }, [navigation, device, farmName, siteName, mac, headerText, headerColor]);




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
    // const handleAlarmDetected = (idAlarm: number) => {
    //     console.log(" Alarma detectada con id:", idAlarm);
    //     setAlarms(prev =>
    //         prev.map(alarm =>
    //             alarm.idAlarm === idAlarm
    //                 ? { ...alarm, disparado: true }
    //                 : alarm
    //         )
    //     );

    // };

    const handleAlarmDetected = (idAlarm: number) => {
        console.log(" Alarma detectada con id:", idAlarm);
        setAlarms(prev => {
            const nuevas = prev.map(alarm =>
                alarm.idAlarm === idAlarm
                    ? { ...alarm, disparado: true }
                    : alarm
            );
            updateHeaderStatus(nuevas, masterAlarmState); // 👉 Añadir esta línea
            return nuevas;
        });
    };


    useEffect(() => {
        notificationService.setOnAlarmDetected(handleAlarmDetected);
        return () => {
            notificationService.setOnAlarmDetected(() => { });
        };
    }, []);



    // 5. Abre el modal para la alarma seleccionada
    const openOptionModal = (alarm: ParamTC) => {
        setSelectedAlarm(alarm);
        setOptionModalVisible(true);
    };

    // useEffect(() => {
    //     const checkPendiente = async () => {
    //         const flag = await AsyncStorage.getItem("alarma_activa_pendiente");
    //         if (flag === "true") {
    //             console.log(" alarma_activa_pendiente detectada al abrir app");
    //             setTimeout(() => setShowAlarmDialog(true), 500);
    //         }
    //     };
    //     checkPendiente();
    // }, []);

    const getIconNameForAlarm = (texto: string): keyof typeof Ionicons.glyphMap => {
        const lowerText = texto.toLowerCase();
        if (lowerText.includes("electrico")) return "flash-outline";
        if (lowerText.includes("temperatura")) return "thermometer-outline";
        if (lowerText.includes("humedad")) return "water-outline";
        return "alert-circle-outline"; // genérico
    };


    // 6. Render de cada alarma (con mejoras visuales)
    const renderAlarmItem = ({ item }: { item: ParamTC }) => {
        let backgroundColor = "#8a9bb9"; // gris más fuerte
        let textColor = "#000000"; // negro por defecto

        if (item.disparado) {
            backgroundColor = "#FF0000"; // rojo fuerte
            textColor = "#000000";
        } else if (!masterAlarmState) {
            backgroundColor = "#fde047"; // amarillo fuerte
            textColor = "#000000";
        } else if (item.armado) {
            backgroundColor = "#a3e635"; // verde fuerte
            textColor = "#000000";
        }

        return (
            <TouchableOpacity
                style={[styles.alarmContainer, { backgroundColor }]}
                onPress={() => openOptionModal(item)}
            >
                <View style={styles.alarmRow}>
                    <EstadoAlarmaCircle armado={item.armado} disparado={item.disparado} activo={item.activo} />

                    <View style={styles.iconAndText}>
                        {item.disparado && (
                            <Ionicons
                                name={getIconNameForAlarm(item.texto)}
                                size={24}
                                color="#000"
                                style={styles.alarmIcon}
                            />
                        )}
                        <Text style={[styles.alarmText, { color: textColor }]}>{item.texto}</Text>
                    </View>
                </View>
                <Entypo name="chevron-thin-right" size={20} color="#000" />
            </TouchableOpacity>
        );
    };





    // Función para enviar notificación de alarma de prueba
    // const sendTestAlarm = async () => {
    //     try {
    //         if (!device || !farmName || !siteName) {
    //             Alert.alert("Error", "Información del dispositivo incompleta");
    //             return;
    //         }

    //         // Crear objeto de notificación según la interfaz
    //         const notification: Notification = {
    //             title: '¡ALARMA ACTIVADA!',
    //             data: {
    //                 farmName: farmName,
    //                 siteName: siteName,
    //                 alarmText: selectedAlarm?.texto || 'Alarma activada',
    //                 type: 'alarm'
    //             },
    //             isAlarm: true,
    //         };

    //          Mostrar notificación usando el servicio
    //         await notificationService.showLocalNotification(notification);

    //          Reproducir sonido de alarma
    //         await playAlarmSound();
    //         await AsyncStorage.setItem("alarmPlaying", "true");


    //         Alert.alert(
    //             'Alarma Enviada',
    //             'La alarma sonará hasta que toques la notificación o abras la app desde ella'
    //         );
    //     } catch (error) {
    //         console.error('Error al enviar notificación de alarma:', error);
    //         Alert.alert('Error', 'No se pudo enviar la notificación de alarma');
    //     }
    // };


    // const getPushToken = async () => {
    //     const token = await notificationService.getExpoPushToken();
    //     if (token) {
    //         setPushToken(token);
    //         Alert.alert('Expo Push Token', token);
    //     }
    // };


    // const getDeviceToken = async () => {
    //     const token = await notificationService.getFCMToken();
    //     if (token) {
    //         setFcmToken(token);
    //         await Clipboard.setStringAsync(token); //  Copia al portapapeles
    //         Alert.alert("FCM Token obtenido", "Copiado al portapapeles:\n\n" + token);
    //     } else {
    //         Alert.alert("Error", "No se pudo obtener el token");
    //     }
    // };


    return (
        <View style={styles.container}>

            {/* Botón de prueba de alarma
            <TouchableOpacity
                style={styles.testAlarmButton}
                onPress={sendTestAlarm}
            >
                <Ionicons name="notifications" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.testAlarmButtonText}>Probar Notificación de ALARMA</Text>
            </TouchableOpacity> */}

            {/* Botón para obtener token
            <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#3478F6',
                    padding: 12,
                    borderRadius: 12
                }}
            onPress={getPushToken}
            ></TouchableOpacity> */}

            {/* <TouchableOpacity
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#3478F6',
                    padding: 12,
                    borderRadius: 12
                }}
            onPress={getDeviceToken}
            >
                <Ionicons name="key-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Obtener Token FCM</Text>
            </TouchableOpacity> */}

            {loading ? (
                <Text style={styles.loadingText}>Cargando alarmas...</Text>
            ) : alarms.length === 0 ? (
                <View style={styles.centeredContainer}>
                    <Text style={styles.noAlarmsText}>No hay alarmas habilitadas</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={alarms}
                    keyExtractor={(item) => `${item.idAlarm}`}
                    renderItem={renderAlarmItem}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}

            {/* Botón Master en la esquina inferior derecha */}
            <ButtonMaster
                mac={mac}
                fetchAlarms={fetchAlarms}
                masterAlarmState={masterAlarmState}
                onToggleMaster={handleToggleMaster}
            />

            {/* Modal para armar/desarmar la alarma */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isOptionModalVisible}
                onRequestClose={() => setOptionModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setOptionModalVisible(false)}>
                    <Pressable style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setOptionModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>{selectedAlarm?.texto}</Text>

                        <TouchableOpacity style={styles.optionRow} onPress={() => handleOptionSelect("Armada")}>
                            <View style={[styles.circle, selectedAlarm?.armado ? { backgroundColor: "#76db36" } : {}]} />
                            <Text style={styles.optionText}>Armada</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionRow} onPress={() => handleOptionSelect("Desarmada")}>
                            <View style={[styles.circle, !selectedAlarm?.armado ? { backgroundColor: "#8a9bb9" } : {}]} />
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
    },
    alarmRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingVertical: 2,
    },

    iconAndText: {
        flexDirection: "row",
        alignItems: "center",
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
    statusCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    closeButton: {
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 1,
    }


});



