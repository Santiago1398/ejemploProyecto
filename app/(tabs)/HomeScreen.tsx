import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    Alert,
    Platform,
    StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeviceList from "@/components/DeviceList";
import { t } from "@/i18n/i18nConfig";

export default function HomeScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const handleOpenDrawer = () => {
        console.log("HEADER PERSONALIZADO - DRAWER PRESIONADO");
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <View style={styles.container}>
            {/* HEADER PERSONALIZADO */}
            <View style={[styles.customHeader, {
                paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0
            }]}>
                {/* Botón drawer */}
                <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={handleOpenDrawer}
                >
                    <Ionicons name="menu" size={24} color="black" />
                </TouchableOpacity>

                {/* 🔥 TÍTULO CON POSICIÓN ABSOLUTA - Perfectamente centrado */}
                <View style={styles.titleContainer}>
                    <Text style={styles.headerTitle}>
                        <Text style={styles.cti}>{t("HomeScreen.cti")}</Text>
                        <Text style={styles.control}>{t("HomeScreen.control")}</Text>
                    </Text>
                </View>

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
    container: {
        flex: 1,
        backgroundColor: "#f2f2f2",
    },

    customHeader: {
        backgroundColor: '#f8f9fa',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 52 + (Platform.OS === 'ios' ? 44 : 24),
        paddingTop: Platform.OS === 'ios' ? 44 : 24,
        paddingBottom: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        position: 'relative', // 🔥 NUEVO: Para posición absoluta del título
    },

    drawerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        zIndex: 10, // 🔥 NUEVO: Para que esté por encima
    },

    // 🔥 COMPLETAMENTE NUEVO: Título con posición absoluta perfectamente centrado
    titleContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: Platform.OS === 'ios' ? 44 : 24, // Mismo que paddingTop
        height: 52, // Mismo que la altura del header sin safe area
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 80, // 🔥 Mucho espacio para alejarlo de los bordes
    },

    headerTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 0.5,
    },

    headerSpacer: {
        width: 44,
    },

    background: {
        flex: 1,
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(242, 242, 242, 0.8)",
        paddingHorizontal: 12,
        paddingTop: 4,
        paddingBottom: 12,
    },

    cti: {
        color: "#2563eb",
        fontSize: 30,
        fontWeight: 'bold',
    },
    control: {
        color: "#16a34a",
        fontSize: 30,
        fontWeight: 'bold',
    },
});