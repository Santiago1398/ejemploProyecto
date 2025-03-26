import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../HomeStack";
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type PermissionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'permissions'>;



export default function SettingsScreen() {
    const navigation = useNavigation<PermissionsScreenNavigationProp>();

    return (
        <View style={styles.screen}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Permisos</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate("permissions")}
                >
                    <Ionicons name="map-outline" size={24} color="#007AFF" />
                    <Text style={styles.buttonText}>Permisos de Ubicacion</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginBottom: 8,
    },
    buttonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
});
