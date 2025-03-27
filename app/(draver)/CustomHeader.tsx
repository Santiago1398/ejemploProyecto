import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigationState } from "@react-navigation/native";

interface CustomHeaderProps {
    navigation: any
}

export default function CustomHeader({ navigation }: CustomHeaderProps) {
    const state = useNavigationState(state => state);
    const currentRoute = state.routes[state.index].name;
    const getHeaderTitle = () => {
        switch (currentRoute) {
            case 'Home':
                return 'Inicio';
            case 'Settings':
                return 'Configuración';
            case 'Profile':
                return 'Perfil';
            case 'Maps':
                return 'Mapas';
            default:
                return 'Inicio';
        }
    }

    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
                <FontAwesome name="bars" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#fff",
        height: 60,
    },
    menuButton: {
        paddingRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
    },
});

