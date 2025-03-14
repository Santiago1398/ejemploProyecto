import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerContent from "../components/DrawerContent";
import LoginScreen from "./login";
import TabsNavigator from "./(tabs)/TabsNavigator";
import PermissionsCkeckProvider from "@/presentation/providers/PermissionsCkeckProvider";
import ExtraStack from "./extra/Extra";
//import { Stack } from "expo-router";

const Drawer = createDrawerNavigator();

export default function Layout() {
    return (
        <PermissionsCkeckProvider>
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
                {/*Esto es para los permisos de google maps*/}
                <Drawer.Screen name="Extra" component={ExtraStack} options={{ headerShown: false }} />
            </Drawer.Navigator>
        </PermissionsCkeckProvider>


    );
}










