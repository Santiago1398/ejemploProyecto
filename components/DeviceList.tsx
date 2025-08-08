import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Modal,
    AppState,
    SectionList,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";
import { useDeviceStore } from "@/store/useDeviceStore";
import { RootStackParamList } from "@/types/navigation";
import { get } from "@/services/api";
import { stopAlarmSound } from "@/utils/sound";
import { notificationService } from "@/hooks/NotificationService";
import { ResponseAlarmaSite } from "@/infrastructure/intercafe/listapi.interface";
import * as Notifications from "expo-notifications";
import PhoneNumberDialog from "./PhoneNumberDialog";
import { t } from "@/i18n/i18nConfig";
import { socketService } from "@/services/socketService";
import { useRef } from 'react';
import { EmptyState } from "@/utils/EmptyState";
//import { useGeneralSocketListener } from "@/hooks/useSocketListener";


export default function DeviceList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { token, userId } = useAuthStore();
    const isFocused = useIsFocused();

    const {

        devices,
        loading,
        error: isError,
        setDevices,
        setLoading,
        setError,
        updateDevice,
        // realDevices
    } = useDeviceStore();

    //!Prueba de pantalla vacia 
    // const DEV_FORCE_EMPTY = true;         // ⬅︎ ponlo a true sólo para probar

    const [showAlarmDialog, setShowAlarmDialog] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [errorAlertShown, setErrorAlertShown] = useState(false);
    const previousMacsRef = useRef<string[]>([]);

    //! Ahora recibe la lista completa y decide qué secciones crear
    const prepareSectionData = (deviceList: ResponseAlarmaSite[]) => {
        const sections: {
            title: string;
            data: ResponseAlarmaSite[];
            type: 'alarms' | 'all';
        }[] = [];

        // ! Sección “Alarmas” SOLO si hay +5 ubicaciones
        const devicesWithAlarms = deviceList.filter(d => d.alarmType === 1);

        if (deviceList.length > 5 && devicesWithAlarms.length > 0) {
            sections.push({
                title: t('deviceList.Alarmas'),
                data: devicesWithAlarms,
                type: 'alarms',
            });
        }

        //!  Sección “Todas las ubicaciones”
        sections.push({
            title: t('deviceList.TODAS_LAS_UBICACIONES'),
            data: deviceList,
            type: 'all',
        });

        return sections;
    };
    //!-------------------------------------------------------------


    // En DeviceList.tsx - AGREGAR después de los imports
    useEffect(() => {
        // Inicializar socket cuando DeviceList se monta
        console.log('🚀 DeviceList montado, inicializando SocketService...');
        socketService.initialize();

        return () => {
            // Opcional: desconectar cuando se desmonta DeviceList
            // socketService.disconnect();
        };
    }, []); // Solo una vez al montar

    useEffect(() => {
        const subscription = AppState.addEventListener("change", async (state) => {
            if (state === "active") {
                // console.log(" App volvió del background, matando notificaciones...");
                await Notifications.dismissAllNotificationsAsync();
            }
        });

        return () => subscription.remove();
    }, []);

    useEffect(() => {
        notificationService.setOnAlarmDetected((idAlarm) => {
            //console.log(" WebSocket callback ejecutado con idAlarm:", idAlarm);
            setShowAlarmDialog(true);
        });

        return () => {
            notificationService.setOnAlarmDetected(() => { });
        };
    }, []);

    useEffect(() => {
        const checkAlarm = async () => {
            const pendiente = await AsyncStorage.getItem("alarma_activa_pendiente");
            if (pendiente === "true") {
                setShowAlarmDialog(true);
            }
        };

        checkAlarm();
    }, []);

    //! Los Eventos Pruebas

    useEffect(() => {
        const handleRegisterMacsEvent = (payload: any) => {
            // Ignora si la pantalla no está en foco
            if (!isFocused) return;

            //  Acepta string, número u objeto
            const eventMac = typeof payload === 'string' || typeof payload === 'number'
                ? String(payload)
                : String(
                    payload?.mac ||
                    payload?.device?.mac ||
                    payload?.macAddress ||
                    ''
                );

            if (eventMac) {
                console.log(`🔄 MAC ${eventMac} ha cambiado, refrescando lista en DeviceList 1`);
                fetchDevices(true);            // true = sin loading
            } else {
                console.log(' register_macs sin MAC, ignorado');
            }
        };

        socketService.on('register_macs', handleRegisterMacsEvent);
        return () => socketService.off('register_macs', handleRegisterMacsEvent);
    }, [isFocused]);

    // useGeneralSocketListener('register_macs', (payload) => {
    //     const eventMac = typeof payload === 'string' || typeof payload === 'number'
    //         ? String(payload)
    //         : String(
    //             payload?.mac ||
    //             payload?.device?.mac ||
    //             payload?.macAddress ||
    //             ''
    //         );

    //     if (eventMac) {
    //         console.log(`🔄 MAC ${eventMac} ha cambiado, refrescando lista en DeviceList`);
    //         fetchDevices(true);
    //     }
    // },
    //     true,      // requiresFocus = true
    //     isFocused  // estado de foco actual
    // );


    //!-------------------------------------------------------------



    useEffect(() => {
        const interval = setInterval(() => {
            if (token && userId) fetchDevices(true);
        }, 7000);

        return () => clearInterval(interval);
    }, [token, userId]);

    useEffect(() => {
        fetchDevices(false);
    }, []);

    useEffect(() => {
        const checkTelefono = async () => {
            const telefono = await AsyncStorage.getItem("telefono");
            const preguntado = await AsyncStorage.getItem("telefonoPreguntado");

            if (!telefono && !preguntado) {
                setDialogVisible(true);
            }
        };

        checkTelefono();
    }, []);

    //! Manejo del teléfono
    const handleConfirmTelefono = async (telefono: string) => {
        console.log(" Guardando teléfono desde DeviceList:", telefono);
        setDialogVisible(false);
        await AsyncStorage.setItem("telefono", telefono);
        await AsyncStorage.setItem("telefonoPreguntado", "true");

        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
            await notificationService.registerDevice(Number(userId));
        }
    };
    //!-------------------------------------------------------------


    const handleCancelTelefono = async () => {
        setDialogVisible(false);
        await AsyncStorage.setItem("telefonoPreguntado", "true");
    };
    //! la función que obtiene los dispositivos
    const fetchDevices = async (isAutoRefresh = false) => {
        try {
            console.log('------------ fetchDevices ejecutado:------------------------');
            console.log('   - isAutoRefresh:', isAutoRefresh);
            console.log('   - Origen:', new Error().stack?.split('\n')[2]); // Ver desde dónde se llamó
            console.log('   - Hora:', new Date().toLocaleTimeString());
            if (!isAutoRefresh) setLoading(true);

            if (isError && !errorAlertShown) {
                setErrorAlertShown(false);
            }

            setError(false);
            const startTime = Date.now();

            const storedUserId = await AsyncStorage.getItem("userId");
            //console.log('🌐 PETICIÓN HTTP:');
            //console.log(`   - URL: alarmtc/sites/usershared2/${storedUserId}`);
            //console.log('   - Método: GET');
            //const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/user/${storedUserId}`);
            const data: ResponseAlarmaSite[] = await get(`alarmtc/sites/usershared2/${storedUserId}`);
            // const endTime = Date.now();

            // console.log('✅ RESPUESTA HTTP:');
            //console.log(`   - Tiempo: ${endTime - startTime}ms`);
            // console.log(`   - Dispositivos recibidos: ${data.length}`);
            //  console.log('   - Datos:', JSON.stringify(data.slice(0, 2), null, 2));

            //console.log("📍 Dispositivos del backend:", data.length);

            const formattedData = data.map((device) => ({
                ...device,
                mac: Number(device.mac),
                alarmType: device.alarmType ?? 1,
                armed: device.armed ?? true
            }));
            console.log(data)
            const FORCE_EMPTY = false;        // ponlo a *false* o bórralo cuando termines
            if (__DEV__ && FORCE_EMPTY) {
                setDevices([]);                // simula 0 ubicaciones
                return;                        // salta el resto
            }
            setDevices(formattedData);
            setErrorAlertShown(false);

            //Aqui le envio los mac
            const macAddresses = formattedData.map(device => String(device.mac));
            console.log('------- Enviando MACs al socket desde DeviceList:--------- SI LOS ENVIA', macAddresses);
            socketService.setMacAddresses(macAddresses);

            // if (!socketService.isConnected()) {
            //     console.log('🔄 Socket no conectado, inicializando...');
            //     socketService.initialize();

            //     // Esperar un momento para que se conecte antes de enviar MACs
            //     setTimeout(() => {
            //         socketService.setMacAddresses(macAddresses);
            //     }, 1000);
            // } else {
            //     socketService.setMacAddresses(macAddresses);
            // }

        } catch (error) {
            console.error("Error al cargar dispositivos:", error);
            setError(true);

            if (!isAutoRefresh && !errorAlertShown) {
                setErrorAlertShown(true);
                Alert.alert(
                    "Error de conexión",
                    t("deviceList.deviceLoadError"),
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                console.log("Usuario cerró el alert de error");
                            }
                        }
                    ]
                );
            }
        } finally {
            if (!isAutoRefresh) {
                setLoading(false);
                setInitialLoad(false);
            }
        }
    };
    //!-------------------------------------------------------------


    useEffect(() => {
        notificationService.setOnSiteAlarmDetected((macStr) => {
            const mac = Number(macStr);
            updateDevice(mac, { alarmType: 2 });
        });
        return () => {
            notificationService.setOnSiteAlarmDetected(() => { });
        };
    }, [updateDevice]);

    // useEffect(() => {
    //     notificationService.connectWebSocket();
    //     return () => {
    //         notificationService.disconnect();
    //     };
    // }, []);

    // !FUNCIÓN ACTUALIZADA: getBackgroundColor con nueva lógica
    const getBackgroundColor = (alarmType: number, armed: boolean) => {
        //  PRIMERA PRIORIDAD: Si alarmType = 2, siempre gris (sin importar armed)
        if (alarmType === 2) {
            return "#6C7B8F"; // Gris para alarmType 2
        }

        // SEGUNDA PRIORIDAD: Si alarmType ≠ 2 Y armed = false, amarillo
        if (!armed) {
            return "#3b99cf"; // Amarillo para desarmados (que no sean alarmType 2)
        }

        // TERCERA PRIORIDAD: Colores normales según alarmType para dispositivos armados
        switch (alarmType) {
            case 0: return "#63C723";  // Verde para alarmType 0 armado
            case 1: return "#FF0000";  // Rojo para alarmType 1 armado
            case 3: return "#9E75C6";  // Morado para alarmType 3 armado
            default: return "#000000"; // Negro por defecto
        }
    };

    /*
    Ejemplos con tus datos:
    
    1. {"alarmType": 2, "armed": true}  → Gris (#9E9E9E)
    2. {"alarmType": 2, "armed": false} → Gris (#9E9E9E) - ¡Sin importar armed!
    3. {"alarmType": 0, "armed": false} → Amarillo (#facc15)
    4. {"alarmType": 1, "armed": false} → Amarillo (#facc15)  
    5. {"alarmType": 0, "armed": true}  → Verde (#78dd35)
    6. {"alarmType": 1, "armed": true}  → Rojo (#FF0000)
    */

    //!-------------------------------------------------------------


    // ! Renderizar header de sección
    const renderSectionHeader = ({ section }: { section: any }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionLine} />
        </View>
    );

    //!-------------------------------------------------------------


    //! MODIFICADO: Renderizar cada dispositivo
    const renderDeviceItem = ({ item }: { item: ResponseAlarmaSite }) => {
        const backgroundColor = getBackgroundColor(item.alarmType, item.armed);
        const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

        return (
            <TouchableOpacity
                style={[styles.deviceContainer, { backgroundColor }]}
                onPress={() => {
                    navigation.navigate("DeviceDetails", {
                        device: {
                            mac: Number(item.mac),
                            farmName: capitalize(item.farmName),
                            siteName: capitalize(item.siteName),
                            latitude: item.latitude,
                            longitude: item.longitude,
                            idSite: item.idSite,
                            buildingPortalRef: item.buildingPortalRef,
                            armed: item.armed,
                            alarmType: item.alarmType
                        }
                    });
                }}
            >
                <View style={styles.row}>
                    {/* #e9e9e7-#e2e2e0  - #dcdcd9 - #F9FAFB */}
                    <Ionicons name="home-outline" size={24} color="#F8F9FA" style={{ marginRight: 8 }} />
                    <Text style={styles.deviceTitle}>{capitalize(item.farmName)}</Text>
                </View>
                <Text style={styles.deviceSubtitle}>{capitalize(item.siteName)}</Text>
                <Text style={styles.deviceLocation}>
                    {capitalize(item.town)}, {capitalize(item.province)}, {capitalize(item.country)}
                </Text>
            </TouchableOpacity>
        );
    };
    //!-------------------------------------------------------------


    return (
        <View style={styles.container}>
            {initialLoad ? (
                <Text style={styles.loadingText}>{t("deviceList.loadingDevices")}</Text>
            ) : isError ? (
                <View style={styles.centeredContainer}>
                    <Ionicons name="cloud-offline-outline" size={64} color="#FF6B6B" />
                    <Text style={styles.errorTitle}>{t("deviceList.error.noConnection")}</Text>
                    <Text style={styles.errorMessage}>
                        {t("deviceList.error.cannotLoadLocations")}
                    </Text>
                </View>
            ) : devices.length === 0 ? (
                <EmptyState
                    icon="map-marker-off"
                    lib="mc"
                    title={t('deviceList.noLocationsAvailable')}
                    color="#2563EB"
                    size={88}
                />
            ) : (
                // !  SectionList en lugar de FlatList
                <SectionList
                    sections={prepareSectionData(devices)}
                    keyExtractor={(item, index) => `${item.idSite}-${item.mac}-${index}`}
                    renderItem={renderDeviceItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={styles.listContainer}
                    stickySectionHeadersEnabled={false}
                />
            )}

            {dialogVisible && (
                <PhoneNumberDialog
                    visible={dialogVisible}
                    onClose={handleCancelTelefono}
                    onConfirm={handleConfirmTelefono}
                />
            )}

            {showAlarmDialog && (
                <Modal transparent animationType="fade" visible={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>🚨{t("deviceList.alarmActive")}</Text>
                            <TouchableOpacity
                                onPress={async () => {
                                    await stopAlarmSound();
                                    await AsyncStorage.multiRemove(["alarmPlaying", "alarma_activa_pendiente"]);
                                    setShowAlarmDialog(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>{t("deviceList.acceptAndStopAlarm")}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f2f2" },
    listContainer: { padding: 16 },

    // NUEVOS ESTILOS PARA HEADERS DE SECCIÓN
    sectionHeader: {
        backgroundColor: '#f2f2f2',
        paddingVertical: 12,
        paddingHorizontal: 0,
        marginTop: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        letterSpacing: 1,
    },
    sectionLine: {
        height: 2,
        backgroundColor: '#333',
        width: '100%',
    },

    deviceContainer: {
        padding: 16,
        marginVertical: 4, // Reducido para mejor espaciado con headers
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 4,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    deviceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#F3F4F6", // #000 - #e9e9e7 -#e2e2e0 - #dcdcd9 - #c9c9c7 - #d3d3d1 - #dcdcd9 - #F9FAFB - #F3F4F6 - #F4F5F7 - #F4F5F7
    },
    deviceSubtitle: {
        fontSize: 16,
        color: "#F3F4F6", // #e9e9e7 - #e2e2e0 - #dcdcd9 - #c9c9c7 -#d3d3d1 -#dcdcd9 - #F9FAFB - #F3F4F6 - #F4F5F7 - #F4F5F7
        marginBottom: 4,
    },
    deviceLocation: {
        fontSize: 14,
        color: "#F3F4F6", // #e9e9e7 -#e2e2e0 - #dcdcd9 - #c9c9c7 - #d3d3d1 - #dcdcd9 - #F9FAFB - #F3F4F6 - #F4F5F7 - #F4F5F7
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
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FF6B6B",
        marginTop: 16,
        marginBottom: 8,
        textAlign: "center",
    },
    errorMessage: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginBottom: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalContent: {
        backgroundColor: "#fff",
        padding: 30,
        borderRadius: 20,
        width: "80%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#FF3B30", // #FF3B30
        textAlign: "center",
    },
    modalButtonText: {
        backgroundColor: "#FF3B30",
        color: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        overflow: "hidden",
        marginTop: 10,
        borderRadius: 8,
    },
});