import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function CustomHeader({ navigation }: { navigation: any }) {
    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
                <FontAwesome name="bars" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Home</Text>
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

