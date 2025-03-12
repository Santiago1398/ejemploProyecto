import { Audio } from "expo-av";

export const globalAlarmSound: { sound: Audio.Sound | null } = { sound: null };

export const playAlarmSound = async () => {
    try {
        if (globalAlarmSound.sound) return;
        console.log("Reproduciendo sonido de alarma");
        const { sound } = await Audio.Sound.createAsync(
            require("../assets/images/alarm-car-or-home-62554.mp3"),
            { shouldPlay: true, isLooping: true }
        );
        globalAlarmSound.sound = sound;
        await sound.playAsync();
    } catch (error) {
        console.error("Error al reproducir el sonido:", error);
    }
}

export const stopAlarmSound = async () => {
    if (globalAlarmSound.sound) {
        console.log("Deteniendo sonido de alarma...");
        await globalAlarmSound.sound.stopAsync();
        await globalAlarmSound.sound.unloadAsync();
        globalAlarmSound.sound = null;
    }
}
