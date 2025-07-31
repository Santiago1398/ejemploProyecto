// HomeScreen.tsx
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    Platform,
    StatusBar
} from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/authStore";         // 🔥 traemos el flag
import DeviceList from "@/components/DeviceList";
import { t } from "@/i18n/i18nConfig";

export default function HomeScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const isDev = useAuthStore(state => state.isDeveloperMode); // 🔥

    const handleOpenDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <View style={styles.container}>
            {/* HEADER PERSONALIZADO */}
            <View style={[
                styles.customHeader, {
                    paddingTop: Platform.OS === 'ios'
                        ? insets.top
                        : StatusBar.currentHeight || 0
                }
            ]}>
                {/* Botón drawer */}
                <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={handleOpenDrawer}
                >
                    <Ionicons name="menu" size={24} color="black" />
                </TouchableOpacity>

                {/* 🔥 TÍTULO PERFECTAMENTE CENTRADO */}
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>
                        <Text style={styles.cti}>{t("HomeScreen.cti")}</Text>
                        <Text style={styles.control}>{t("HomeScreen.control")}</Text>
                    </Text>
                </View>

                {/* 🔥 BADGE Dev */}
                {isDev && (
                    <View style={styles.devBadge}>
                        <Text style={styles.devBadgeText}>Dev</Text>
                    </View>
                )}

                {/* Espacio para balance visual */}
                <View style={styles.headerSpacer} />
            </View>

            {/* Contenido principal */}
            <ImageBackground
                source={require("../../assets/images/pigs.png")}
                style={styles.background}
                resizeMode="contain"
            >
                <View style={styles.overlay}>
                    <DeviceList />
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f2f2" },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        height: 52 + (Platform.OS === 'ios' ? 44 : 24),
        paddingHorizontal: 16,
        position: 'relative', // para que el badge absolute se posicione dentro
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    drawerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: Platform.OS === 'ios' ? 44 : 24,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 80,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    cti: { color: "#2563eb" },
    control: { color: "#16a34a" },
    headerSpacer: { width: 44 },

    // 🔥 estilos para el circulo debug
    devBadge: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 44 : 24,
        right: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    devBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },

    background: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(242, 242, 242, 0.8)",
        paddingHorizontal: 12,
        paddingTop: 4,
        paddingBottom: 12,
    },
});