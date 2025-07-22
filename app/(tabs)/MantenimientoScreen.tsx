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
//  IMPORTS PARA SOCKET.IO
import { useSocket } from '@/hooks/useSocket';
import { socketService } from '@/services/socketService';

export default function MantenimientoScreen() {
    const [apiUrl, setApiUrlState] = useState("");

    //  ESTADOS PARA SOCKET.IO - Conexión automática
    const { isConnected, lastError, socketId } = useSocket();
    const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
    const [testMessage, setTestMessage] = useState("Mensaje de prueba desde app");

    useEffect(() => {
        const loadApiUrl = async () => {
            const url = await getApiUrl();
            setApiUrlState(url);
        };
        loadApiUrl();
    }, []);

    //  CONFIGURAR LISTENERS DE SOCKET.IO - Solo el callback principal
    useEffect(() => {
        console.log('📱 [MAINTENANCE] Configurando listeners...');

        socketService.setOnAlarmDetected((data) => {
            // 🔥 LOGS DETALLADOS
            console.log('📨 [MAINTENANCE] Mensaje recibido:', {
                timestamp: new Date().toISOString(),
                data: data,
                type: typeof data,
                keys: Object.keys(data || {}),
                socketConnected: socketService.isConnected(),
                socketId: socketService.getSocketId()
            });

            const timestamp = new Date().toLocaleTimeString();
            let messageType = 'GENERAL';

            if (data.from === 'maintenance_screen') {
                messageType = 'ECHO';
                console.log('🔄 [MAINTENANCE] Es un eco de nuestro propio mensaje');
            } else if (data.type === 'test') {
                messageType = 'TEST';
                console.log('🧪 [MAINTENANCE] Es un mensaje de prueba');
            } else if (data.response) {
                messageType = 'RESPONSE';
                console.log('💬 [MAINTENANCE] Es una respuesta del servidor');
            }

            setReceivedMessages(prev => {
                const newMessage = `${timestamp}: [${messageType}] ${JSON.stringify(data)}`;
                console.log('📝 [MAINTENANCE] Agregando mensaje a la lista:', newMessage);
                return [...prev, newMessage];
            });

            if (messageType === 'TEST' || messageType === 'RESPONSE') {
                console.log('🔔 [MAINTENANCE] Mostrando alerta para mensaje importante');
                Alert.alert('🔔 Socket Message', `${messageType}: ${JSON.stringify(data)}`);
            }
        });

        return () => {
            console.log('🧹 [MAINTENANCE] Limpiando listeners...');
            socketService.setOnAlarmDetected(() => { });
        };
    }, []);

    //  EFECTO PARA MOSTRAR ESTADO DE CONEXIÓN
    useEffect(() => {
        console.log('🔗 [MAINTENANCE] Estado de conexión cambió:', {
            isConnected,
            socketId,
            timestamp: new Date().toISOString()
        });

        if (isConnected) {
            console.log('✅ [MAINTENANCE] Socket conectado automáticamente');
            const timestamp = new Date().toLocaleTimeString();
            setReceivedMessages(prev => [...prev, `${timestamp}: [SYSTEM] Socket conectado (ID: ${socketId})`]);
        } else {
            console.log('❌ [MAINTENANCE] Socket desconectado');
            const timestamp = new Date().toLocaleTimeString();
            setReceivedMessages(prev => [...prev, `${timestamp}: [SYSTEM] Socket desconectado`]);
        }
    }, [isConnected, socketId]);

    const handleSave = async () => {
        try {
            await setApiUrl(apiUrl);
            Alert.alert(t("MantenimientoScreen.saveSuccessTitle"), t("MantenimientoScreen.saveSuccessMessage"));
        } catch {
            Alert.alert(t("MantenimientoScreen.saveErrorTitle"), t("MantenimientoScreen.saveErrorMessage"));
        }
    };

    //  FUNCIÓN PARA ENVIAR MENSAJE DE PRUEBA
    const sendTestMessage = () => {
        if (!isConnected) {
            Alert.alert(' Error', 'Socket no está conectado');
            return;
        }

        const messageData = {
            message: testMessage,
            timestamp: new Date().toISOString(),
            from: 'maintenance_screen',
            type: 'test',
            socketId: socketId
        };

        socketService.emit('test_message', messageData);

        const timestamp = new Date().toLocaleTimeString();
        setReceivedMessages(prev => [...prev, `${timestamp}: [SENT] ${JSON.stringify(messageData)}`]);

        Alert.alert('Mensaje Enviado', `Enviado: ${testMessage}`);
    };

    //  FUNCIÓN PARA RECONECTAR (manual)
    const handleReconnect = () => {
        if (isConnected) {
            socketService.disconnect();
            // Reconectar después de un pequeño delay
            setTimeout(() => {
                socketService.connect();
            }, 1000);
        } else {
            socketService.connect();
        }
    };

    //  FUNCIÓN PARA LIMPIAR MENSAJES
    const clearMessages = () => {
        setReceivedMessages([]);
        Alert.alert('🧹 Mensajes Limpiados', 'Historial de mensajes borrado');
    };

    //  FUNCIÓN PARA COPIAR SOCKET ID
    const copySocketId = async () => {
        if (socketId) {
            await Clipboard.setStringAsync(socketId);
            Alert.alert(' Socket ID Copiado', socketId);
        }
    };

    //  FUNCIÓN PARA PROBAR DIFERENTES TIPOS DE MENSAJES
    const sendPingTest = () => {
        if (!isConnected) {
            Alert.alert(' Error', 'Socket no está conectado');
            return;
        }

        const pingData = {
            type: 'ping',
            timestamp: new Date().toISOString(),
            from: 'maintenance_screen'
        };

        socketService.emit('ping', pingData);

        const timestamp = new Date().toLocaleTimeString();
        setReceivedMessages(prev => [...prev, `${timestamp}: [PING] Enviado ping al servidor`]);
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
                <Button title={t("MantenimientoScreen.saveButton")} onPress={handleSave} />
            </View>

            {/*  SECCIÓN: SOCKET.IO TESTING - CONEXIÓN AUTOMÁTICA */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔌 Socket.IO (Auto-Conectado)</Text>

                {/* Estado de conexión */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]} />
                    <Text style={styles.statusText}>
                        {isConnected ? ` Conectado (ID: ${socketId?.substring(0, 8)}...)` : ' Desconectado'}
                    </Text>
                    {socketId && (
                        <TouchableOpacity onPress={copySocketId} style={styles.copyButton}>
                            <Ionicons name="copy-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Error si existe */}
                {lastError && (
                    <Text style={styles.errorText}> Error: {lastError}</Text>
                )}

                {/* Botones de control */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                        onPress={handleReconnect}
                    >
                        <Ionicons name="refresh-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Reconectar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
                        onPress={sendPingTest}
                        disabled={!isConnected}
                    >
                        <Ionicons name="pulse-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Ping</Text>
                    </TouchableOpacity>
                </View>

                {/* Input para mensaje de prueba */}
                <TextInput
                    style={styles.input}
                    value={testMessage}
                    onChangeText={setTestMessage}
                    placeholder="Mensaje de prueba..."
                    multiline
                />

                {/* Botones de envío y limpieza */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, {
                            backgroundColor: isConnected ? '#2196F3' : '#CCCCCC',
                        }]}
                        onPress={sendTestMessage}
                        disabled={!isConnected}
                    >
                        <Ionicons name="send-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Enviar Test</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                        onPress={clearMessages}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Limpiar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/*  SECCIÓN: MENSAJES RECIBIDOS */}
            <View style={styles.section}>
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
            </View>

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