// ExtraStack.tsx con React Navigation
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import MapScreen from "./map/MapsScreen";
import PermissionsScreen from "./permissions/PermissionScreen";

const Stack = createStackNavigator();

export default function ExtraStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="permissions" component={PermissionsScreen} />
        </Stack.Navigator>
    );
}
