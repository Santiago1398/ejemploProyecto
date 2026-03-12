import React, { useMemo, useLayoutEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/app/HomeStack";
import { useAuthStore } from "@/store/authStore";

type Nav = NativeStackNavigationProp<RootStackParamList, "AlarmasActivasScreen">;
type RouteT = RouteProp<RootStackParamList, "AlarmasActivasScreen">;

type AlarmSimulada = {
    id: string;
    statusText: string;
    dateText: string;
    timeText: string;
};

export default function AlarmasActivasScreen() {
    const navigation = useNavigation<Nav>();
    const route = useRoute<RouteT>();
    const token = useAuthStore((s) => s.token);

    //  Por ahora: si no vienen params, usamos device simulado
    const device = route.params?.device ?? {
        id: "demo-id",
        userid: "demo-user",
        latitude: 0,
        longitude: 0,
        farmName: "Granja demo",
        siteName: "Nave demo",
        mac: 123456,
        idSite: 1,
        buildingPortalRef: 1,
        simulado: true,
    };

    const chipText = String(device.mac ?? "");

    const now = useMemo(() => new Date(), []);
    const dateTextBase = now.toLocaleDateString("es-ES");
    const timeTextBase = now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    //  Lista simulada (3 alarmas)
    const alarmas: AlarmSimulada[] = useMemo(
        () => [
            { id: "a1", statusText: "Temperatura alta", dateText: dateTextBase, timeText: timeTextBase },
            { id: "a2", statusText: "Humedad fuera de rango", dateText: dateTextBase, timeText: timeTextBase },
            { id: "a3", statusText: "CO₂ alto", dateText: dateTextBase, timeText: timeTextBase },
        ],
        [dateTextBase, timeTextBase]
    );

    //  Link al portal (igual que antes)
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

    //  Poner la “bola del mundo” en el header
    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Alarmas activas",
            headerRight: () => (
                <Pressable
                    onPress={handleGoToExplotacion}
                    hitSlop={10}
                    style={({ pressed }) => [
                        { paddingHorizontal: 10, opacity: pressed ? 0.6 : 1 },
                    ]}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="globe-outline" size={18} color="#2563EB" />
                        <Text
                            style={{
                                color: "#2563EB",
                                textDecorationLine: "underline",
                                fontWeight: "800",
                                fontSize: 18,
                            }}
                        >
                            Portal
                        </Text>
                    </View>
                </Pressable>
            ),
        });
    }, [navigation, handleGoToExplotacion]);

    const AlarmActivaCard = ({ item }: { item: AlarmSimulada }) => {
        return (
            <View style={styles.topAlarmWrap}>
                {/*  Card SOLO VISUAL (mismo estilo) */}
                <View style={styles.topAlarmCard}>
                    <LinearGradient
                        colors={["#dc2626", "#ef4444"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.topAlarmBar}
                    >
                        <View style={styles.topAlarmBarLeft}>
                            <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#fff" />
                            <Text style={styles.topAlarmBarTitle}>TC5</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.topAlarmBody}>
                        <Text style={styles.topAlarmStatus} numberOfLines={1}>
                            {item.statusText}
                        </Text>

                        <View style={styles.topAlarmDateTimeRow}>
                            <Text style={styles.topAlarmDateTime}>{item.dateText}</Text>
                            <Text style={styles.topAlarmDateTime}> • </Text>
                            <Text style={styles.topAlarmDateTime}>{item.timeText}</Text>
                        </View>
                    </View>

                    <View style={styles.topAlarmChipRow}>
                        <View style={styles.topAlarmChip}>
                            <Ionicons name="hardware-chip-outline" size={14} color="#111827" />
                            <Text style={styles.topAlarmChipText}>{chipText}</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={alarmas}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => <AlarmActivaCard item={item} />}
                contentContainerStyle={{ paddingBottom: 18, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f4f4f4" },

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
    topAlarmBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    topAlarmBarTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },

    topAlarmBody: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 10,
    },
    topAlarmStatus: {
        flex: 1,
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
        marginRight: 10,
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
});