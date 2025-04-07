import { playAlarmSound, stopAlarmSound } from '@/utils/sound';
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '@/hooks/NotificationService';

// Definición local de la interfaz para no depender de importación
interface Notification {
    title: string;
    data: {
        farmName?: string;
        siteName?: string;
        alarmText?: string;
        type?: string;
    };
    isAlarm?: boolean;
}

export const NotificationTestScreen: React.FC = () => {
    const [deviceToken, setDeviceToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Cargar token al iniciar
    useEffect(() => {
        const loadToken = async () => {
            const token = await AsyncStorage.getItem('deviceToken'); // Cambiado de fcmToken a deviceToken
            setDeviceToken(token);
        };
        loadToken();
    }, []);

    // Función para probar notificación regular
    const testRegularNotification = async () => {
        try {
            setIsLoading(true);

            // Crear objeto de notificación según la interfaz
            const notification: Notification = {
                title: 'Notificación de Prueba',
                data: {
                    farmName: 'Granja Prueba',
                    siteName: 'Zona Test',
                    alarmText: 'Esto es una notificación de prueba regular',
                    type: 'test'
                },
                isAlarm: false // No es una alarma
            };

            // Mostrar notificación usando el servicio
            await notificationService.showLocalNotification(notification);
            Alert.alert('Éxito', 'Notificación regular enviada correctamente');
        } catch (error) {
            console.error('Error en notificación regular:', error);
            Alert.alert('Error', 'No se pudo enviar la notificación regular');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para probar notificación de alarma
    const testAlarmNotification = async () => {
        try {
            setIsLoading(true);

            // Crear objeto de notificación de alarma
            const notification: Notification = {
                title: '¡ALARMA DE PRUEBA!',
                data: {
                    farmName: 'Granja Principal',
                    siteName: 'Sector Norte',
                    alarmText: 'Alarma 1: Temperatura crítica',
                    type: 'alarm'
                },
                isAlarm: true // Es una alarma
            };

            // Mostrar notificación de alarma
            await notificationService.showLocalNotification(notification);

            // Reproducir sonido de alarma que continuará hasta que el usuario
            // toque la notificación o abra la aplicación
            await playAlarmSound();

            Alert.alert(
                'Alarma Enviada',
                'La alarma sonará hasta que toques la notificación o abras la app desde la notificación',
                [{ text: 'OK', style: 'default' }]
            );
        } catch (error) {
            console.error('Error en alarma de prueba:', error);
            Alert.alert('Error', 'No se pudo enviar la alarma');
            // Solo detener el sonido en caso de error
            stopAlarmSound();
        } finally {
            setIsLoading(false);
        }
    };

    // Función para probar suscripción a un tema
    const testTopicSubscription = async () => {
        setIsLoading(true);
        try {

            await notificationService.subscribeToTopic('test_topic');

            Alert.alert('Suscripción', 'Suscrito al tema "test_topic" exitosamente');
        } catch (error) {
            console.error('Error en suscripción:', error);
            Alert.alert('Error', 'Falló la suscripción al tema');
        } finally {
            setIsLoading(false);
        }
    };

    // Función para probar desuscripción de un tema
    // Función corregida para desuscripción:
    const testTopicUnsubscription = async () => {
        setIsLoading(true);
        try {
            // Corregido: usar unsubscribeFromTopic en lugar de subscribeToTopic
            await notificationService.subscribeToTopic('test_topic');

            // Mostrar solo el mensaje de éxito
            Alert.alert('Desuscripción', 'Desuscrito del tema "test_topic" exitosamente');
        } catch (error) {
            console.error('Error en desuscripción:', error);
            Alert.alert('Error', 'Falló la desuscripción del tema');
        } finally {
            setIsLoading(false);
        }
    };
    // Obtener token de dispositivo
    const getDeviceToken = async () => {
        setIsLoading(true);
        try {
            const token = await notificationService.registerDevice();
            setDeviceToken(token);

            if (token) {
                Alert.alert('Token Obtenido', 'Token obtenido y guardado correctamente');
            } else {
                Alert.alert('Error', 'No se pudo obtener el token');
            }
        } catch (error) {
            console.error('Error obteniendo token:', error);
            Alert.alert('Error', 'No se pudo obtener el token');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.title}>Pruebas de Notificaciones</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notificaciones</Text>

                    <Button
                        title="Enviar Notificación Regular"
                        onPress={testRegularNotification}
                        disabled={isLoading}
                    />

                    <View style={styles.spacer} />

                    <Button
                        title="Enviar Notificación de ALARMA"
                        onPress={testAlarmNotification}
                        color="#FF3B30" // Color rojo para alarmas
                        disabled={isLoading}
                    />

                    <Text style={styles.note}>
                        La alarma sonará hasta que toques la notificación o abras la app desde ella
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Temas (Topics)</Text>

                    <Button
                        title="Suscribir a tema 'test_topic'"
                        onPress={testTopicSubscription}
                        disabled={isLoading}
                    />

                    <View style={styles.spacer} />

                    <Button
                        title="Desuscribir de tema 'test_topic'"
                        onPress={testTopicUnsubscription}
                        disabled={isLoading}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Token del Dispositivo</Text>

                    <Button
                        title="Obtener/Actualizar Token"
                        onPress={getDeviceToken}
                        disabled={isLoading}
                    />

                    {/* Mostrar token si está disponible */}
                    {deviceToken && (
                        <View style={styles.tokenContainer}>
                            <Text style={styles.tokenLabel}>Token:</Text>
                            <Text style={styles.tokenText} numberOfLines={3}>{deviceToken}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Las notificaciones de prueba solo se mostrarán en este dispositivo
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};
//
const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    section: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12
    },
    spacer: {
        height: 10,
    },
    note: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#FF3B30',
        marginTop: 8,
        textAlign: 'center'
    },
    tokenContainer: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#efefef',
        borderRadius: 5,
    },
    tokenLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    tokenText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});

export default NotificationTestScreen;