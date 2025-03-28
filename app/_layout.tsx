import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DrawerContent from "../components/DrawerContent";
import LoginScreen from "./login";
import TabsNavigator from "./(tabs)/TabsNavigator";
import PermissionsCkeckProvider from "@/presentation/providers/PermissionsCkeckProvider";
//import ExtraStack from "./extra/Extra";
import PermissionsScreen from "./extra/permissions/PermissionScreen";
import MapsScreen from "./extra/map/MapsScreen";
import { useAuthStore } from "@/store/authStore";
import HomeScreen from "./(tabs)/HomeScreen";
//import { Stack } from "expo-router";

const Drawer = createDrawerNavigator();

export default function Layout() {
    const { isAuthenticated } = useAuthStore();

    return (
        //<GestureHandlerRootView> </GestureHandlerRootView> por si me da error de gestos
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
                initialRouteName={isAuthenticated ? "Home" : "Login"}

            >
                {/*  Ruta para HomeScreen */}
                {isAuthenticated ? (
                    <Drawer.Screen
                        name="Home"
                        component={TabsNavigator}
                        options={{ headerTitle: "Home" }}
                    />
                ) : (
                    <Drawer.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{
                            headerTitle: "Iniciar Sesión",
                            swipeEnabled: false,
                            drawerItemStyle: { display: "none" },
                        }}
                    />
                )}
                {/* <Drawer.Screen name="Home" component={TabsNavigator} options={{ headerTitle: "Home" }} />
                <Drawer.Screen name="Login" component={LoginScreen} options={{
                    headerTitle: "Iniciar Sesión", swipeEnabled: false,
                    drawerItemStyle: { display: "none" }
                }} /> */}
                <Drawer.Screen name="Map" component={MapsScreen} />
                <Drawer.Screen name="permissions" component={PermissionsScreen} />

                {/*Esto es para los permisos de google maps
                <Drawer.Screen name="Extra" component={ExtraStack} options={{ headerShown: false }} /> */}
            </Drawer.Navigator>
        </PermissionsCkeckProvider>


    );
}










