import React, { useEffect, useLayoutEffect, useCallback, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/HomeStack";
import { useAuthStore } from "@/store/authStore";
import { get } from "@/services/api";

import type { LinkedTc5AlarmResponse } from "@/types/LinkedTc5AlarmInterface";
import { deviceName } from "@/utils/switch/dispositivos";
import { resolverTextoAlarma } from "@/utils/linkedTc5Alarm";
import { t } from "@/i18n/i18nConfig";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";


type Nav = NativeStackNavigationProp<RootStackParamList, "AlarmasActivasScreen">;
type RouteT = RouteProp<RootStackParamList, "AlarmasActivasScreen">;

type AlarmActivaUI = {
    id: string;
    mac: string;
    tituloEquipo: string;     // nombre del equipo (TC5, CTI-AT, etc.)
    ubicacion: string;        // farm - building (si existe)
    descripcion: string;      // texto resuelto (alarmRef -> i18n o alarmText)
    dateText: string;
    timeText: string;
};

export default function AlarmasActivasScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<RouteT>();
    const token = useAuthStore((s) => s.token);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    // evita solapes
    const fetchingRef = React.useRef(false);

    // ignora respuestas viejas
    const reqIdRef = React.useRef(0);


    const device = route.params?.device ?? {
        id: "demo-id",
        userid: "demo-user",
        latitude: 0,
        longitude: 0,
        farmName: "Granja demo",
        siteName: "Nave demo",
        mac: "123456",
        idSite: 1,
        buildingPortalRef: 1,
        simulado: true,
        alarmType: 0,
        swVersion: "0",
    };

    const [alarmas, setAlarmas] = useState<AlarmActivaUI[]>([]);
    const [loading, setLoading] = useState(false);

    const chipTextBase = String(device.mac ?? "");

    const formatearUbicacion = useCallback((farm?: string, building?: string) => {
        return [farm, building].filter((v) => v?.trim()).join(" - ");
    }, []);

    const fetchAlarmas = useCallback(
        async (opts?: { showLoader?: boolean; isPullToRefresh?: boolean }) => {
            if (!device?.mac) return;
            if (fetchingRef.current) return;

            fetchingRef.current = true;
            const myReq = ++reqIdRef.current;

            const showLoader = !!opts?.showLoader;
            const pull = !!opts?.isPullToRefresh;

            try {
                if (showLoader) setLoading(true);
                if (pull) setRefreshing(true);

                const data: LinkedTc5AlarmResponse[] = await get(
                    `alarmtc/linkedtc5alarms/${device.mac}`
                );

                // si llegó tarde, ignorar
                if (myReq !== reqIdRef.current) return;

                if (!Array.isArray(data) || data.length === 0) {
                    setAlarmas([]);
                    return;
                }

                // orden estable (si timestamps empatan)
                const ordenadas = [...data].sort((a, b) => {
                    const tb = new Date(b.timestamp).getTime();
                    const ta = new Date(a.timestamp).getTime();
                    if (tb !== ta) return tb - ta;

                    const macA = Number(a.mac);
                    const macB = Number(b.mac);
                    if (!Number.isNaN(macA) && !Number.isNaN(macB) && macA !== macB) return macA - macB;

                    return (a.alarmRef ?? 0) - (b.alarmRef ?? 0);
                });

                const ui: AlarmActivaUI[] = ordenadas.map((a, idx) => {
                    const fechaObj = new Date(a.timestamp);

                    const tituloEquipo = deviceName(a.mac);
                    const descripcion = resolverTextoAlarma(a.mac, a.alarmRef, a.alarmText, t);

                    // ✅ id estable (evita duplicados raros si timestamps iguales)
                    const idBase = [
                        a.mac,
                        a.alarmRef ?? 0,
                        a.alarmType ?? 0,
                        a.locationId ?? 0,
                        (a.farm ?? "").trim(),
                        (a.building ?? "").trim(),
                        (a.alarmText ?? "").trim(),
                    ].join("|");

                    return {
                        id: `${idBase}|${idx}`, // idx solo como fallback si hay repetidos exactos
                        mac: a.mac,
                        tituloEquipo,
                        ubicacion: formatearUbicacion(a.farm, a.building),
                        descripcion,
                        dateText: fechaObj.toLocaleDateString("es-ES"),
                        timeText: fechaObj.toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        }),
                    };
                });

                setAlarmas(ui);
            } catch (e) {
                if (myReq !== reqIdRef.current) return;
                console.log("❌ Error obteniendo linkedtc5alarms (lista):", e);

                // 👇 opcional: yo NO vaciaría la lista por un fallo puntual
                // setAlarmas([]);
            } finally {
                if (myReq === reqIdRef.current) {
                    if (showLoader) setLoading(false);
                    if (pull) setRefreshing(false);
                }
                fetchingRef.current = false;
            }
        },
        [device.mac, formatearUbicacion]
    );

    useFocusEffect(
        useCallback(() => {
            // primera carga al entrar a la pantalla
            fetchAlarmas({ showLoader: true });

            const id = setInterval(() => {
                fetchAlarmas(); // ✅ sin loader, refresco silencioso
            }, 7000);

            return () => clearInterval(id);
        }, [fetchAlarmas])
    );


    const handleGoToExplotacion = useCallback(() => {
        if (!token) {
            Alert.alert("Error", "No hay token disponible");
            return;
        }

        navigation.navigate("Explotacion", {
            mac: device.mac,
            token,
            idioma: "es",
            siteName: device.siteName,
            farmName: device.farmName,
            idSite: device.idSite,
            buildingPortalRef: device.buildingPortalRef,
            simulado: device.simulado,
        });
    }, [navigation, token, device]);

    // useLayoutEffect(() => {
    //     navigation.setOptions({
    //         title: "Alarmas activas",
    //         headerRight: () => (
    //             <TouchableOpacity
    //                 activeOpacity={0.7}
    //                 onPress={() => {
    //                     console.log("✅ pulsado portal header");
    //                     handleGoToExplotacion();
    //                 }}
    //                 hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    //                 style={{
    //                     width: 40,
    //                     height: 40,
    //                     alignItems: "center",
    //                     justifyContent: "center",
    //                 }}
    //             >
    //                 <Ionicons name="globe-outline" size={22} color="#2563EB" />
    //             </TouchableOpacity>
    //         ),
    //     });
    // }, [navigation, handleGoToExplotacion]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    const AlarmActivaCard = ({ item }: { item: AlarmActivaUI }) => {
        const chipText = item.mac ? String(item.mac) : chipTextBase;

        return (
            <View style={styles.topAlarmWrap}>
                <View style={styles.topAlarmCard}>
                    {/* Barra roja: TITULO = nombre del equipo */}
                    <LinearGradient
                        colors={["#dc2626", "#ef4444"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.topAlarmBar}
                    >
                        <View style={styles.topAlarmBarLeft}>
                            <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
                            <Text style={styles.topAlarmBarTitle} numberOfLines={1}>
                                {item.tituloEquipo}
                            </Text>
                        </View>

                        <View style={styles.topAlarmBarMac}>
                            <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
                            <Text style={styles.topAlarmBarMacText} numberOfLines={1}>
                                {chipText}
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* contenido */}
                    <View style={styles.topAlarmBody}>
                        <View style={styles.topAlarmMetaRow}>
                            {!!item.ubicacion && (
                                <Text style={styles.topAlarmLocation} numberOfLines={1}>
                                    {item.ubicacion}
                                </Text>
                            )}

                            <View style={styles.topAlarmDateTimeRow}>
                                <Text style={styles.topAlarmDateTime}>{item.dateText}</Text>
                                <Text style={styles.topAlarmDateTime}> • </Text>
                                <Text style={styles.topAlarmDateTime}>{item.timeText}</Text>
                            </View>
                        </View>

                        <Text style={styles.topAlarmStatus} numberOfLines={2}>
                            {item.descripcion}
                        </Text>
                    </View>

                    {/* chip mac */}
                    {/* <View style={styles.topAlarmChipRow}>
                        <View style={styles.topAlarmChip}>
                            <Ionicons name="hardware-chip-outline" size={14} color="#111827" />
                            <Text style={styles.topAlarmChipText}>{chipText}</Text>
                        </View>
                    </View> */}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.customHeader, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Alarmas activas</Text>
                </View>

                <TouchableOpacity
                    style={styles.portalButton}
                    onPress={() => {
                        console.log("✅ pulsado portal custom header");
                        handleGoToExplotacion();
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="globe-outline" size={22} color="#2563EB" />
                    <Text style={styles.portalButtonText}>
                        {t("DeviceDetailsScreen.portal")}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && (
                <View style={{ paddingTop: 14 }}>
                    <ActivityIndicator />
                </View>
            )}

            {!loading && alarmas.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="notifications-off-outline" size={48} color="#4B5563" />
                    <Text style={styles.emptyText}>{t("DeviceDetailsScreen.noActiveAlarms")}</Text>
                </View>
            ) : (
                <FlatList
                    data={alarmas}
                    keyExtractor={(it) => it.id}
                    renderItem={({ item }) => <AlarmActivaCard item={item} />}
                    contentContainerStyle={{ paddingBottom: 18, paddingTop: 10 }}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={() => fetchAlarmas({ isPullToRefresh: true })}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f4f4f4" },

    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
    emptyText: { fontSize: 18, fontWeight: "800", color: "#4B5563" },

    topAlarmWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },

    topAlarmCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 2,
        borderColor: "rgba(239,68,68,0.65)",
    },

    topAlarmBar: {
        height: 42,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    topAlarmBarLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
        marginRight: 10, // ✅ evita que el MAC empuje el título
    },
    topAlarmBarTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },

    topAlarmBarMac: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
    },
    topAlarmBody: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 10,
    },


    topAlarmMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 6,
    },
    topAlarmLocation: {
        flex: 1,
        fontSize: 13,
        fontWeight: "700",
        color: "#111827", // ✅ negro
    },



    topAlarmStatus: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
    },
    topAlarmChipRow: { paddingHorizontal: 12, paddingBottom: 10 },
    topAlarmChip: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
    },
    topAlarmChipText: { fontSize: 12, fontWeight: "800", color: "#111827" },

    topAlarmDateTimeRow: { flexDirection: "row", alignItems: "center" },
    topAlarmDateTime: { fontSize: 13, fontWeight: "800", color: "#374151" },
    topAlarmBarMacText: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 12,
    },
    customHeader: {
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 14,
        paddingBottom: 12,
        minHeight: 64,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },

    headerTitleContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },

    headerTitle: {
        color: "#000",
        fontSize: 20,
        fontWeight: "800",
        textAlign: "center",
    },

    portalButton: {
        minHeight: 44,
        minWidth: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },

    portalButtonText: {
        color: "#2563EB",
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 6,
    },
});