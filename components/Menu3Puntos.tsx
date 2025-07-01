import React from "react";
import {
    View,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    Text,
    Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/app/HomeStack";
import { useAuthStore } from "@/store/authStore";

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
    };
    options?: MenuOption[];
}

const Menu3Puntos: React.FC<Menu3PuntosProps> = ({ visible, onClose, device, options }) => {
    const navigation = useNavigation<DeviceDetailsNavigationProp>();
    const token = useAuthStore((state) => state.token);

    const defaultOptions: MenuOption[] = [
        {
            id: "save",
            label: "Guardar Ubicación",
            icon: "save",
            onPress: () => {
                navigation.navigate("DeviceMaps", {
                    deviceLocation: {
                        latitude: device.latitude,
                        longitude: device.longitude,
                    },
                    farmName: device.farmName,
                    siteName: device.siteName,
                    mac: device.mac,
                });
            },
        },
        {
            id: "delete",
            label: "Eliminar Ubicación",
            icon: "trash",
            onPress: () => console.log("Eliminar Ubicación"),
        },
        {
            id: "explotacion",
            label: "Ir Explotación",
            icon: "external-link",
            onPress: () => {
                if (!token) {
                    console.warn("No hay token disponible");
                    return;
                }
                navigation.navigate("Explotacion", {
                    mac: device.mac,
                    token,
                    idioma: "es",
                    siteName: device.siteName,
                    farmName: device.farmName,
                    idSite: device.idSite
                });
            },
        },
        {
            id: "configuracion",
            label: "Configuración TC5",
            icon: "settings",
            onPress: () => {
                if (!token) {
                    console.warn("No hay token disponible");
                    return;
                }
                navigation.navigate("ConfiguracionTC5", {
                    mac: device.mac,
                    token,
                    idioma: "es",
                    siteName: device.siteName,
                    farmName: device.farmName,
                    idSite: device.idSite
                });
            },
        }
    ];

    const finalOptions = options ?? defaultOptions;

    const handleOptionPress = (option: MenuOption) => {
        option.onPress();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                <View style={[styles.menuContainer, { top: 50, right: 10 }]}>
                    {finalOptions.map((option, index) => (
                        <View key={option.id}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => handleOptionPress(option)}
                                activeOpacity={0.7}
                            >
                                <Feather
                                    name={option.icon as any}
                                    size={27}
                                    color="#333"
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
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    menuContainer: {
        position: "absolute",
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
        minWidth: 180,
        zIndex: 1000,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: "#fff",
    },
    menuItemIcon: {
        marginRight: 8,
        color: "#2563EB",
    },
    menuItemText: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 4,
    },
});

export default React.memo(Menu3Puntos);
