// screens/MantenimientoScreen.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Text,
    Alert,
    TextInput,
    Button,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { getApiUrl, setApiUrl } from "@/utils/apiconfig";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { notificationService } from '@/hooks/NotificationService';
import { t } from "@/i18n/i18nConfig";



export default function MantenimientoScreen() {
    const [apiUrl, setApiUrlState] = useState("");

    useEffect(() => {
        const loadApiUrl = async () => {
            const url = await getApiUrl();
            setApiUrlState(url);
        };
        loadApiUrl();
    }, []);

    const handleSave = async () => {
        try {
            await setApiUrl(apiUrl);
            Alert.alert(t("MantenimientoScreen.saveSuccessTitle"), t("MantenimientoScreen.saveSuccessMessage"));
        } catch {
            Alert.alert(t("MantenimientoScreen.saveErrorTitle"), t("MantenimientoScreen.saveErrorMessage"));
        }
    };

    return (
        <ScrollView style={styles.screen}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("MantenimientoScreen.apiTitle")}</Text>
                <TextInput
                    style={styles.input}
                    value={apiUrl}
                    onChangeText={setApiUrlState}
                    placeholder={t("MantenimientoScreen.apiPlaceholder")}
                    autoCapitalize="none"
                />
                <Button title={t("MantenimientoScreen.saveButton")}
                    onPress={handleSave} />
            </View>
            <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle}>{t("MantenimientoScreen.fcmTitle")}</Text>
                <TouchableOpacity
                    style={styles.tokenButton}
                    onPress={async () => {
                        try {
                            const token = await notificationService.getFCMToken();
                            if (token) {
                                await Clipboard.setStringAsync(token);
                                Alert.alert("Token copiado", "FCM token copiado al portapapeles:\n\n" + token);
                            } else {
                                Alert.alert("Error", "No se pudo obtener el token.");
                            }
                        } catch (error) {
                            Alert.alert("Error", error instanceof Error ? error.message : JSON.stringify(error));
                        }
                    }}
                >
                    <Ionicons name="key-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Obtener Token FCM</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    section: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 16,
        marginBottom: 24,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    tokenButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3478F6",
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
    },

});