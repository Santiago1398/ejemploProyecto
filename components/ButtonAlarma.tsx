import React, { useEffect } from "react";
import { TouchableOpacity, Alert, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { post } from "@/services/api";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { globalAlarmSound } from "@/utils/globalSound";

interface AlarmButtonProps {
    mac: number;
    farmName: string;
    siteName: string;
    alarms: any[];
    fetchAlarms: () => Promise<void>;
}

const AlarmButton: React.FC<AlarmButtonProps> = ({ mac, farmName, siteName, alarms, fetchAlarms }) => {
    const { sendPushNotification, expoPushToken } = usePushNotifications();

    // Función para detener el sonido
    const stopAlarmSound = async () => {
        if (globalAlarmSound.sound) {
            console.log("⏹️ Deteniendo sonido de alarma...");
            await globalAlarmSound.sound.stopAsync();
            await globalAlarmSound.sound.unloadAsync();
            globalAlarmSound.sound = null;
        }
    };

    // Función para reproducir sonido de alarma
    const playAlarmSound = async () => {
        try {
            if (globalAlarmSound.sound) {
                console.log("🔊 Sonido ya en reproducción. No se inicia de nuevo.");
                return; // ⏳ Si ya hay un sonido en reproducción, no lo iniciamos otra vez
            }

            console.log("🔊 Reproduciendo sonido de alarma...");
            const { sound } = await Audio.Sound.createAsync(
                require("../assets/images/alarm-car-or-home-62554.mp3"),
                { shouldPlay: true, isLooping: true } //  Se repetirá hasta que lo detengamos
            );

            globalAlarmSound.sound = sound; // Guardamos la referencia global
            await sound.playAsync();
        } catch (error) {
            console.error("⚠️ Error al reproducir el sonido:", error);
        }
    };

    // Función para simular una alarma
    const simulateAlarm = async () => {
        if (!expoPushToken) {
            Alert.alert("Error", "No se ha generado un token de notificación aún.");
            return;
        }

        const simulatedAlarm = alarms[0];
        if (!simulatedAlarm) {
            Alert.alert("Error", "No hay alarmas para simular.");
            return;
        }

        console.log("🔍 Datos de la alarma simulada:", {
            farmName,
            siteName,
            alarma: simulatedAlarm.texto,
        });

        try {
            // Asegurar que solo haya un sonido activo
            await playAlarmSound();

            await post(`alarmtc/arm?mac=${mac}&alarm=${simulatedAlarm.idAlarm}&status=1`, {});

            // Enviar notificación*
            await sendPushNotification({
                to: [expoPushToken],
                title: "🚨 ¡Alarma Activada!",
                body: `📍 Granja: ${farmName || "Desconocida"}\n🏠 Sitio: ${siteName || "Desconocido"}\n🚨 Mensaje: ${simulatedAlarm.texto}`,
                data: { action: "STOP_ALARM" }, // 🔥 Enviamos acción para detener la alarma
            });

            Alert.alert("Éxito", "Notificación de alarma simulada enviada.");
            await fetchAlarms();

        } catch (error) {
            Alert.alert("Error", "No se pudo simular la alarma.");
        }
    };

    // Manejar la interacción con la notificación
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("📲 Notificación tocada:", response);
            stopAlarmSound();
        });

        return () => subscription.remove();
    }, []);

    return (
        <TouchableOpacity style={styles.testButton} onPress={simulateAlarm}>
            <MaterialCommunityIcons name="bell-ring" size={40} color="white" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    testButton: {
        position: "absolute",
        bottom: -1,
        marginBottom: 10,
        right: 100,
        width: 73,
        height: 73,
        borderRadius: 37.5,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: "#007AFF",
        elevation: 6,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
    },
});

export default AlarmButton;
