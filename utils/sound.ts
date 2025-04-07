import { Audio } from "expo-av";

// Objeto global para mantener referencia al sonido
export const globalAlarmSound: { sound: Audio.Sound | null } = { sound: null };

/**
 * Prepara el sonido de alarma para su uso
 */
export const prepareAlarmSound = async () => {
    try {
        // Si ya hay un sonido, lo liberamos primero
        if (globalAlarmSound.sound) {
            await releaseAlarmSound();
        }

        // Configurar el modo de audio (similar a setCategory en react-native-sound)
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,  // Reproduce incluso en modo silencio en iOS
            staysActiveInBackground: true, // Mantiene la reproducción en segundo plano
            shouldDuckAndroid: true,  // Baja el volumen de otras apps en Android
            playThroughEarpieceAndroid: false, // Usar altavoz en lugar de auricular

        });

        console.log('Audio configurado correctamente');
    } catch (error) {
        console.error('Error al preparar el audio:', error);
    }
};

/**
 * Reproduce el sonido de alarma
 */
export const playAlarmSound = async () => {
    try {
        // Detener primero si ya está sonando
        if (globalAlarmSound.sound) {
            await stopAlarmSound();
        }

        console.log("Reproduciendo sonido de alarma");
        const { sound } = await Audio.Sound.createAsync(
            require("../assets/images/alarm-car-or-home-62554.mp3"),
            { shouldPlay: true, isLooping: true, volume: 1.0 }
        );

        globalAlarmSound.sound = sound;
    } catch (error) {
        console.error("Error al reproducir el sonido:", error);
    }
};

/**
 * Detiene el sonido de alarma
 */
export const stopAlarmSound = async () => {
    if (globalAlarmSound.sound) {
        console.log("Deteniendo sonido de alarma...");
        try {
            await globalAlarmSound.sound.stopAsync();
            await releaseAlarmSound();
        } catch (error) {
            console.error("Error al detener el sonido:", error);
        }
    }
};

/**
 * Libera recursos asociados con el sonido
 */
export const releaseAlarmSound = async () => {
    if (globalAlarmSound.sound) {
        try {
            await globalAlarmSound.sound.unloadAsync();
            globalAlarmSound.sound = null;
        } catch (error) {
            console.error("Error al liberar el sonido:", error);
        }
    }
};