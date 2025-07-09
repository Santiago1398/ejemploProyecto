import React from "react";
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
    Modal,
    Platform,
    Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "@/app/HomeStack";
import { useAuthStore } from "@/store/authStore";
import { t } from "@/i18n/i18nConfig";

type DeviceDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export interface MenuOption {
    id: string;
    label: string;
    icon: string;
    onPress: () => void;
}

export interface Menu3PuntosProps {
    visible: boolean;
    onClose: () => void;
    device: {
        latitude: number;
        longitude: number;
        farmName: string;
        siteName: string;
        mac: number;
        idSite: number;
        buildPortalRef: number;

    };
    options?: MenuOption[];
}

const Menu3Puntos: React.FC<Menu3PuntosProps> = ({
    visible,
    onClose,
    device,
    options,
}) => {
    const navigation = useNavigation<DeviceDetailsNavigationProp>();
    const token = useAuthStore((state) => state.token);
    const insets = useSafeAreaInsets();

    const defaultOptions: MenuOption[] = [
        {
            id: "save",
            label: t("Menu3Puntos.save"),
            icon: "save",
            onPress: () => {
                console.log("🔥 Navegando a DeviceMaps");
                navigation.navigate("DeviceMaps", {
                    deviceLocation: {
                        latitude: device.latitude,
                        longitude: device.longitude,
                    },
                    farmName: device.farmName,
                    siteName: device.siteName,
                    mac: device.mac,
                    idSite: device.idSite,
                });
            },
        },
        {
            id: "delete",
            label: t("Menu3Puntos.delete"),
            icon: "trash",
            onPress: () => {
                console.log("🔥 Eliminar Ubicación");
                Alert.alert("Debug", "Eliminar Ubicación presionado");
            },
        },
        {
            id: "explotacion",
            label: t("Menu3Puntos.explotacion"),
            icon: "external-link",
            onPress: () => {
                if (!token) {
                    console.log("🔥 No hay token disponible");
                    return;
                }
                console.log("🔥 Navegando a Explotacion");
                navigation.navigate("Explotacion", {
                    mac: device.mac,
                    token,
                    idioma: "es",
                    siteName: device.siteName,
                    farmName: device.farmName,
                    idSite: device.idSite,
                    buildPortalRef: device.buildPortalRef,
                });
            },
        },
        {
            id: "configuracion",
            label: t("Menu3Puntos.configuracion"),
            icon: "settings",
            onPress: () => {
                if (!token) {
                    console.log("🔥 No hay token disponible");
                    return;
                }
                console.log("🔥 Navegando a ConfiguracionTC5");
                navigation.navigate("ConfiguracionTC5", {
                    mac: device.mac,
                    token,
                    idioma: "es",
                    siteName: device.siteName,
                    farmName: device.farmName,
                    idSite: device.idSite,
                });
            },
        },
    ];

    const finalOptions = options ?? defaultOptions;

    const handleOptionPress = (option: MenuOption) => {
        console.log(`🔥 Opción ${option.id} presionada`);

        // Cerrar primero
        onClose();

        // Ejecutar después de un delay
        setTimeout(() => {
            option.onPress();
        }, 100);
    };

    const handleBackdropPress = () => {
        console.log("🔥 Backdrop presionado - cerrando menú");
        onClose();
    };

    console.log("🔥 Menu3Puntos renderizado - visible:", visible);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={false}
            hardwareAccelerated={Platform.OS === 'android'}
            presentationStyle="overFullScreen"
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleBackdropPress}
            >
                <View style={[styles.menuContainer, { top: insets.top + 60 }]}>
                    {finalOptions.map((option, index) => (
                        <View key={option.id}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleOptionPress(option)}
                                activeOpacity={0.7}
                            >
                                <Feather
                                    name={option.icon as any}
                                    size={24}
                                    color="#2563EB"
                                    style={styles.menuItemIcon}
                                />
                                <Text style={styles.menuItemText}>{option.label}</Text>
                            </TouchableOpacity>
                            {index < finalOptions.length - 1 && (
                                <View style={styles.divider} />
                            )}
                        </View>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
    },
    menuContainer: {
        position: "absolute",
        right: 15,
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
        minWidth: 200,
        zIndex: 1000,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#fff",
        minHeight: 48,
    },
    menuItemIcon: {
        marginRight: 12,
        width: 24,
    },
    menuItemText: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 4,
        marginHorizontal: 12,
    },
});

export default React.memo(Menu3Puntos);