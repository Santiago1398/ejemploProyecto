import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerContent from "../components/DrawerContent";
import HomeScreen from "./index";
import LoginScreen from "./login"; // Añade tu pantalla de Login

const Drawer = createDrawerNavigator();

export default function Layout() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DrawerContent {...props} />}
        >
            <Drawer.Screen name="Home" component={HomeScreen} />
            <Drawer.Screen name="Login" component={LoginScreen} />
        </Drawer.Navigator>
    );
}




