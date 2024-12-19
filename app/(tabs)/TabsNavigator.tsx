import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import HomeScreen from "./HomeScreen";
import SettingsScreen from "./SettingsScreen";
import ProfileScreen from "./PorfileScreen";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
    return (
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
                headerShown: false, // Oculta el encabezado del Tab.Navigator
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

