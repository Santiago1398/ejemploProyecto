import { Audio } from "expo-av";

let soundObject: Audio.Sound | null = null;

export const playAlarmSound = async () => {
    try {
        if (soundObject) {
            console.log(" Sonido ya en reproducción.");
            return;
        }

        console.log(" Reproduciendo sonido de alarma...");
        const { sound } = await Audio.Sound.createAsync(
            require("../assets/images/alarmcar.mp3"),
            { shouldPlay: true, isLooping: true }
        );

        soundObject = sound;
        await sound.playAsync();
    } catch (error) {
        console.error(" Error al reproducir el sonido:", error);
    }
};

export const stopAlarmSound = async () => {
    try {
        if (soundObject) {
            console.log(" Deteniendo sonido...");
            await soundObject.stopAsync();
            await soundObject.unloadAsync();
            soundObject = null;
        } else {
            console.log(" No hay sonido activo para detener.");
        }
    } catch (error) {
        console.error(" Error al detener el sonido:", error);
    }
};
