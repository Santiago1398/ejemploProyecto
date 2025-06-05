import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";

let soundObject: Audio.Sound | null = null;

export const playAlarmSound = async () => {
    try {
        console.log(" Reproduciendo alarma...");
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });

        const { sound } = await Audio.Sound.createAsync(
            require("../assets/images/alarmcar.mp3"),
            { shouldPlay: true, isLooping: true }
        );

        soundObject = sound;
        //await sound.setIsLoopingAsync(true);
        await sound.playAsync();
        await AsyncStorage.setItem("alarmPlaying", "true");
    } catch (error) {
        console.log(" Error reproduciendo sonido:", error);
    }
};

export const stopAlarmSound = async () => {
    try {
        console.log(" Intentando detener alarma...");

        // Intenta detener el sonido si ya está cargado
        if (soundObject) {
            await soundObject.stopAsync();
            await soundObject.unloadAsync();
            soundObject = null;
        } else {
            // Si no está en memoria, recárgalo y deténlo
            const sound = new Audio.Sound();
            await sound.loadAsync(require("../assets/images/alarmcar.mp3"));
            await sound.stopAsync();
            await sound.unloadAsync();
        }

        await AsyncStorage.removeItem("alarmPlaying");
    } catch (error) {
        console.log(" Error deteniendo sonido:", error);
    }
};