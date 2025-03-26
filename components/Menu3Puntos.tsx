import React, { useRef, useState } from "react"
import {
    View,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    Text,
} from "react-native"
import { Entypo, Feather } from "@expo/vector-icons"
import { Portal } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "@/app/HomeStack"


type DeviceDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList>;



export interface MenuOption {
    id: string
    label: string
    icon: string
    onPress: () => void
}

export interface Menu3PuntosProps {
    device: {
        latitude: number
        longitude: number
        farmName: string
        siteName: string
        mac: number
    }
    options?: MenuOption[]
}

const Menu3Puntos: React.FC<Menu3PuntosProps> = ({ device, options }) => {
    // Obtenemos la navegación
    const navigation = useNavigation<DeviceDetailsNavigationProp>()

    const [visible, setVisible] = useState(false)
    //const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const buttonRef = useRef<View>(null)

    // Definimos las opciones por defecto usando la prop device y navigation
    const defaultOptions: MenuOption[] = [
        {
            id: "save",
            label: "Guardar Ubicación",
            icon: "save",
            onPress: () => {
                // Navega a la pantalla DeviceMap pasando los datos del dispositivo
                if (device.latitude === 0 && device.longitude === 0) {
                    navigation.navigate("DeviceMaps", {
                        deviceLocation: {
                            latitude: 0,
                            longitude: 0,
                        },
                        farmName: device.farmName,
                        siteName: device.siteName,
                        mac: device.mac
                    })
                } else {
                    navigation.navigate("DeviceMaps", {
                        deviceLocation: {
                            latitude: device.latitude,
                            longitude: device.longitude,
                        },
                        farmName: device.farmName,
                        siteName: device.siteName,
                        mac: device.mac

                    })

                }
            },
        },
        {
            id: "delete",
            label: "Eliminar Ubicación",
            icon: "trash",
            onPress: () => console.log("Eliminar Ubicación"),
        },
    ]


    // Si se pasan opciones por props, las usamos; si no, usamos las por defecto
    const finalOptions = options ?? defaultOptions

    // Al pulsar el botón, medimos su posición
    const onMenuPress = () => {
        if (buttonRef.current) {
            buttonRef.current.measureInWindow((x, y, width, height) => {
                console.log("Posición del botón:", { x, y, width, height })
                const adjustedY = y < 0 ? 0 : y + height // Ajusta según el header
                // setMenuPosition({ x, y: adjustedY })
                setVisible(true)
            })
        }
    }

    const closeMenu = () => {
        setVisible(false)
    }

    const handleOptionPress = (option: MenuOption) => {
        option.onPress()
        closeMenu()
    }

    return (
        <View>
            {/* Botón de los 3 puntos */}
            <TouchableOpacity ref={buttonRef} onPress={onMenuPress} style={styles.menuButton}>
                <Entypo name="dots-three-horizontal" size={30} color="#333" />
            </TouchableOpacity>

            {visible && (
                <Portal>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu}>
                        <View style={[styles.menuContainer, { top: 50, right: 10 }]}>
                            {finalOptions.map((option) => (
                                <TouchableOpacity key={option.id} style={styles.menuItem} onPress={() => handleOptionPress(option)}>
                                    <Feather name={option.icon as any} size={30} color="#333" style={styles.menuItemIcon} />
                                    <Text style={styles.menuItemText}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Pressable>
                </Portal>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    menuButton: {
        padding: 8,
    },
    menuContainer: {
        position: "absolute",
        backgroundColor: "#fff",
        borderRadius: 4,
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        //zIndex: 9999,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    menuItemIcon: {
        marginRight: 10,
    },
    menuItemText: {
        fontSize: 16,
        color: "#333",
    },
})

export default Menu3Puntos
