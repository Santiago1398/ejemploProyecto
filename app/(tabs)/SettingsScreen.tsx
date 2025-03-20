import React from "react";
import { View, StyleSheet, Button } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../HomeStack";
import { useNavigation } from "expo-router"; // o '@react-navigation/native'

type PermissionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'permissions'>;

export default function SettingsScreen() {
    const navigation = useNavigation<PermissionsScreenNavigationProp>();

    return (
        <View style={styles.screen}>
            <Button
                title="Ir a Permisos"
                onPress={() => navigation.navigate("permissions")}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
