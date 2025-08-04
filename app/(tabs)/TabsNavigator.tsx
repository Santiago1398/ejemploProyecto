import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { t } from "@/i18n/i18nConfig";

import HomeStack from "../HomeStack";
import AlarmasStack from "../AlarmasStack";
import ExtraStack from "../extra/Extra";

const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => {
                let iconName: React.ComponentProps<typeof Ionicons>["name"];
                switch (route.name) {
                    case "Home":
                        iconName = "home-outline";
                        break;
                    case "Alarmas":
                        iconName = "notifications-outline";
                        break;
                    case "Maps":
                        iconName = "map-outline";
                        break;
                    default:
                        iconName = "help-circle-outline";
                }

                return {
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name={iconName} size={size} color={color} />
                    ),
                    tabBarActiveTintColor: "blue",
                    tabBarInactiveTintColor: "gray",
                    tabBarStyle: { backgroundColor: "rgba(255,255,255,0.9)" },
                    headerShown: false,
                    // aquí usamos la key dentro de "TabBar" en cada JSON
                    tabBarLabel: t(`TabBar.${route.name}`),
                };
            }}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Alarmas" component={AlarmasStack} />
            <Tab.Screen name="Maps" component={ExtraStack} />
        </Tab.Navigator>
    );
}
