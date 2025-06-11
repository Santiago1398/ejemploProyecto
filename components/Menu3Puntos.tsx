"use client"

import React, { useRef, useState } from "react";
import {
    View,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    Text,
} from "react-native";
import { Entypo, Feather } from "@expo/vector-icons";
import { Portal } from "react-native-paper";
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
    device: {
        latitude: number;
        longitude: number;
        farmName: string;
        siteName: string;
        mac: number;
    };
    options?: MenuOption[];
}

const Menu3Puntos: React.FC<Menu3PuntosProps> = ({ device, options }) => {
    // Obtenemos la navegación con el tipo correcto
    const navigation = useNavigation<DeviceDetailsNavigationProp>();

    const [visible, setVisible] = useState(false);
    const buttonRef = useRef<View>(null);
    const token = useAuthStore((state) => state.token);

    // Opciones por defecto. Se pueden modificar según necesidad.
    const defaultOptions: MenuOption[] = [
        {
            id: "save",
            label: "Guardar Ubicación",
            icon: "save",
            onPress: () => {
                // Si la ubicación del dispositivo es (0,0) se navega de la misma forma,
                // pero en DeviceMaps se podrá usar la ubicación actual del usuario.
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
            label: "Explotación",
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
                });
            },
        }


    ];

    // Si se pasan opciones por props, las usamos; de lo contrario, usamos las por defecto.
    const finalOptions = options ?? defaultOptions;

    // Al pulsar el botón, se muestra el menú.
    const onMenuPress = () => {
        if (buttonRef.current) {
            buttonRef.current.measureInWindow((x, y, width, height) => {
                console.log("Posición del botón:", { x, y, width, height });
                setVisible(true);
            });
        }
    };

    const closeMenu = () => {
        setVisible(false);
    };

    const handleOptionPress = (option: MenuOption) => {
        option.onPress();
        closeMenu();
    };

    return (
        <View>
            {/* Botón de los tres puntos */}
            <TouchableOpacity
                ref={buttonRef}
                onPress={onMenuPress}
                style={styles.menuButton}
            >
                <Entypo name="dots-three-horizontal" size={30} color="#333" />
            </TouchableOpacity>

            {visible && (
                <Portal>
                    {/* Cubre toda la pantalla para detectar clics fuera del menú */}
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
                        {/* Contenedor del menú: posición fija (ajusta top/right si lo necesitas) */}
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
                                            size={30}
                                            color="#333"
                                            style={styles.menuItemIcon}
                                        />
                                        <Text style={styles.menuItemText}>{option.label}</Text>
                                    </TouchableOpacity>
                                    {/* Agregamos un divisor entre opciones, excepto después de la última */}
                                    {index < finalOptions.length - 1 && (
                                        <View style={styles.divider} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </Pressable>
                </Portal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    menuButton: {
        padding: 8,
    },
    menuContainer: {
        position: "absolute",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
        minWidth: 200,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginVertical: 4,
        backgroundColor: "#F7F7F7",
    },
    menuItemIcon: {
        marginRight: 12,
        color: "#2F80ED",
    },
    menuItemText: {
        fontSize: 16,
        color: "#333",
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#E0E0E0",
        marginVertical: 4,
    },
});

export default Menu3Puntos;