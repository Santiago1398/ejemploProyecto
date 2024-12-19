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
                <View style={styles.ctiContainer}>
                    <Text style={styles.headerText}>
                        <Text style={styles.cti}>CTI</Text>
                        <Text style={styles.control}>Control</Text>
                    </Text>
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
                    headerShown: false, // Oculta el encabezado
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ tabBarLabel: "" }} // Elimina el texto debajo del icono
                />
                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{ tabBarLabel: "Perfil" }}
                />
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ tabBarLabel: "Configuración" }}
                />
            </Tab.Navigator>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },
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
        top: 20, // Reducido el valor para subir el texto
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
    screen: {
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
    },
});





