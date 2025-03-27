import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import SettingsScreen from "./SettingsScreen";
import ProfileScreen from "./ProfileScreen";
import HomeStack from "../HomeStack";
import ExtraStack from "../extra/Extra";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    switch (route.name) {
                        case "Home":
                            iconName = "home-outline" as const;
                            break;
                        case "Profile":
                            iconName = "person-outline" as const;
                            break;
                        case "Settings":
                            iconName = "settings-outline" as const;
                            break;
                        case "Maps":
                            iconName = "map-outline" as const;
                            break;
                        default:
                            iconName = "help-circle-outline" as const;
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: "blue",
                tabBarInactiveTintColor: "gray",
                tabBarStyle: {
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                },

                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Inicio',

                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Perfil',

                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Configuracion',

                }}
            />
            <Tab.Screen
                name="Maps"
                component={ExtraStack}
                options={{
                    tabBarLabel: 'Mapas',

                }}
            />
        </Tab.Navigator>
    );
}
