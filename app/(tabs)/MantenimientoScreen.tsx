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
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { notificationService } from '@/hooks/NotificationService';
import { t } from "@/i18n/i18nConfig";
import { getApiUrl } from '@/config/apiConfig';
import { clearApiUrl, setApiUrl } from "@/utils/apiconfig";


export default function MantenimientoScreen() {
    const [apiUrl, setApiUrlState] = useState("");

    useEffect(() => {
        (async () => setApiUrlState(await getApiUrl()))();
    }, []);

    const handleSave = async () => {
        try {
            await setApiUrl(apiUrl);               // guarda override
            Alert.alert('Éxito', 'URL guardada 👍');
        } catch {
            Alert.alert('Error', 'No se pudo guardar');
        }
    };

    const handleReset = async () => {
        await clearApiUrl();                     // vuelve al manifest
        const url = await getApiUrl();
        setApiUrlState(url);
        Alert.alert('Reiniciado', 'URL predeterminada restaurada');
    };


    return (
        <ScrollView style={styles.screen}>
            {/* Sección API existente */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t("MantenimientoScreen.apiTitle")}</Text>
                <TextInput
                    style={styles.input}
                    value={apiUrl}
                    onChangeText={setApiUrlState}
                    placeholder={t("MantenimientoScreen.apiPlaceholder")}
                    autoCapitalize="none"
                />
                <Button title="Guardar URL" onPress={handleSave} />
                <Button title="Restaurar por defecto" onPress={handleReset} />

            </View>

            {/*  SECCIÓN: SOCKET.IO TESTING - CONEXIÓN AUTOMÁTICA */}


            {/*  SECCIÓN: MENSAJES RECIBIDOS */}
            {/* <View style={styles.section}>
                <Text style={styles.sectionTitle}> Mensajes en Tiempo Real ({receivedMessages.length})</Text>
                {receivedMessages.length === 0 ? (
                    <Text style={styles.noMessagesText}> Esperando mensajes del servidor...</Text>
                ) : (
                    <ScrollView style={styles.messagesContainer} nestedScrollEnabled>
                        {receivedMessages.slice(-15).reverse().map((message, index) => (
                            <View key={index} style={styles.messageItem}>
                                <Text style={styles.messageText}>{message}</Text>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View> */}

            {/* Sección FCM existente */}
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
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    statusText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    copyButton: {
        padding: 4,
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 12,
    },
    messagesContainer: {
        maxHeight: 250,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 8,
    },
    messageItem: {
        backgroundColor: '#fff',
        padding: 8,
        marginBottom: 4,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    messageText: {
        fontSize: 11,
        fontFamily: 'monospace',
        lineHeight: 14,
    },
    noMessagesText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        padding: 20,
    },
});