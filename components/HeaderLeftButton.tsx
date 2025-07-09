import React from "react";
import { TouchableOpacity, View, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";

export default function HeaderLeftButton() {
    const navigation = useNavigation();

    const handleOpenDrawer = () => {
        console.log("🔥 ====================================");
        console.log("🔥 DRAWER BUTTON PRESIONADO");
        console.log("🔥 Platform:", Platform.OS);
        console.log("🔥 Navigation state:", navigation.getState());
        console.log("🔥 ====================================");

        // Alert para confirmar que el botón responde
        Alert.alert("DEBUG DRAWER", "Botón drawer presionado");

        try {
            // SOLUCIÓN: Usar DrawerActions.openDrawer() que funciona en navegación anidada
            console.log("🔥 Intentando abrir drawer con DrawerActions...");
            navigation.dispatch(DrawerActions.openDrawer());
            console.log("🔥 DrawerActions.openDrawer() ejecutado");

        } catch (error) {
            console.error("🔥 ERROR en drawer:", error);
            Alert.alert("Error", `Error: ${error}`);
        }
    };

    return (
        <View style={{
            marginLeft: 16,
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255,0,0,0.2)', // DEBUG: área visible
        }}>
            <TouchableOpacity
                style={{
                    width: 44,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 22,
                }}
                onPress={handleOpenDrawer}
                onPressIn={() => console.log("🔥 DRAWER PRESS IN")}
                onPressOut={() => console.log("🔥 DRAWER PRESS OUT")}
                activeOpacity={0.7}
            >
                <Ionicons name="menu" size={24} color="black" />
            </TouchableOpacity>
        </View>
    );
}