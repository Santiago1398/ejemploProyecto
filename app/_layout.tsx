import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerContent from "../components/DrawerContent";
import TabsNavigator from "./(tabs)/TabsNavigator";
import LoginScreen from "./login";

const Drawer = createDrawerNavigator();

export default function Layout() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DrawerContent {...props} />}
            screenOptions={{
                headerShown: true, // Muestra el encabezado
                headerTitleAlign: "center", // Alinea el título en el centro
                headerStyle: {
                    backgroundColor: "#fff",
                },
                headerTintColor: "#000", // Color del texto del encabezado
            }}
        >
            <Drawer.Screen name="Home" component={TabsNavigator} options={{ headerTitle: "Home" }} />
            <Drawer.Screen name="Login" component={LoginScreen} options={{ headerTitle: "Iniciar Sesión" }} />
        </Drawer.Navigator>
    );
}










