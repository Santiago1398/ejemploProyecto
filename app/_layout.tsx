import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerContent from "../components/DrawerContent";
import LoginScreen from "./login";
import TabsNavigator from "./(tabs)/TabsNavigator";
import PermissionsCkeckProvider from "@/presentation/providers/PermissionsCkeckProvider";
import { Stack } from "expo-router";

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
            </Drawer.Navigator>

            {/*<Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="map" options={{ animation: "fade" }} />
                <Stack.Screen name="permissions" options={{ animation: "fade" }} />
            </Stack>*/}
        </PermissionsCkeckProvider>



    );
}










