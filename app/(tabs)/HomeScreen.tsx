import DeviceList from "@/components/DeviceList";
import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";


export default function HomeScreen() {
    return (
        <ImageBackground
            source={require("../../assets/images/pigs.png")}
            style={styles.background}
            resizeMode="contain"
        >

            <View style={styles.overlay}>
                <View style={styles.ctiContainer}>
                    <Text style={styles.headerText}>
                        <Text style={styles.cti}>CTI</Text>
                        <Text style={styles.control}>Control</Text>
                    </Text>
                </View>

                {/*Aqui metemos del compoenente DeviceList */}
                <View style={styles.deviceContainer}>
                    <DeviceList />
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    overlay: {
        flex: 1,
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
    },
    ctiContainer: {
        position: "absolute",
        top: 20,
        left: 20,
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
    deviceContainer: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
        backgroundColor: "#fff", // Asegúrate de tener un color de fondo
        // Sombra para iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        // Elevación para Android
        elevation: 5,
    },
});
