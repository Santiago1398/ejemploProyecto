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

                {/* Título */}
                <Text style={styles.headerTitle}>{t("CustomHeader.home")}</Text>
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
                    <View style={styles.ctiContainer}>
                        <Text style={styles.headerText}>
                            <Text style={styles.cti}>{t("HomeScreen.cti")}</Text>
                            <Text style={styles.control}>{t("HomeScreen.control")}</Text>
                        </Text>
                    </View>
                    <DeviceList />
                </View>
            </ImageBackground>

            {/* 🔥 MANTENER EL BOTÓN DE PRUEBA TEMPORALMENTE
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: 100,
                    left: 20,
                    width: 80,
                    height: 50,
                    backgroundColor: 'green', // Verde para diferenciarlo
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                }}
                onPress={() => {
                    console.log("🔥 BOTÓN PRUEBA VERDE");
                    Alert.alert("PRUEBA", "Botón verde funciona");
                    navigation.dispatch(DrawerActions.openDrawer());
                }}
            > 
                <Text style={{ color: 'white' }}>TEST</Text>
            </TouchableOpacity>*/}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    customHeader: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center', // Cambiar de 'flex-end' a 'center'
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 52 + (Platform.OS === 'ios' ? 44 : 24), // iOS: 88px, Android: 68px
        paddingTop: Platform.OS === 'ios' ? 44 : 24, // Safe area
        paddingBottom: 0, // Quitar padding bottom
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },

    drawerButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
    },

    headerTitle: {
        fontSize: 27,
        fontWeight: '500',
        color: '#444444',
        textAlign: 'center',
        flex: 1,
    },

    headerSpacer: {
        width: 44,
    },

    background: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        padding: 12,
    },
    ctiContainer: {
        alignItems: "center",
        marginBottom: 16,
    },
    headerText: {
        fontSize: 36,
        fontWeight: "bold",
    },
    cti: {
        color: "blue",
    },
    control: {
        color: "green",
    },
});