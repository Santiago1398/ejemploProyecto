import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const Tab = createBottomTabNavigator();

function HomeScreen() {
    return (
        <ImageBackground
            source={require("../assets/images/pigs.png")} // Ruta de la imagen
            style={styles.background}
            resizeMode="contain" // Ajustar la imagen dentro del contenedor sin recortarla
        >
            <View style={styles.overlay}>
                <View style={styles.screen}>
                    <Text style={styles.contentText}></Text>
                </View>
            </View>
        </ImageBackground>
    );
}


function ProfileScreen() {
    return (
        <View style={styles.screen}>
            <Text>Contenido de Perfil</Text>
        </View>
    );
}

function SettingsScreen() {
    return (
        <View style={styles.screen}>
            <Text>Contenido de Configuración</Text>
        </View>
    );
}

export default function Home() {
    return (
        <View style={styles.container}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        let iconName: React.ComponentProps<typeof FontAwesome>["name"];

                        switch (route.name) {
                            case "Home":
                                iconName = "home";
                                break;
                            case "Profile":
                                iconName = "user";
                                break;
                            case "Settings":
                                iconName = "cog";
                                break;
                            default:
                                iconName = "question-circle";
                        }

                        return <FontAwesome name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: "blue",
                    tabBarInactiveTintColor: "gray",
                    tabBarStyle: {
                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                    },
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, // Ocupa todo el espacio disponible
        backgroundColor: "#f9f9f9", // Fondo general
    },
    background: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.5)", // Fondo claro para toda la pantalla
    },
    overlay: {
        flex: 1,
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.5)", // Filtro blanco semitransparente
        justifyContent: "center",
        alignItems: "center",
    },
    screen: {
        justifyContent: "center",
        alignItems: "center",
    },
    contentText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
});

