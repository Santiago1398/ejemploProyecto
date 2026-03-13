import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";

let soundObject: Audio.Sound | null = null;

export const playAlarmSound = async (
    archivo: "alarmcar" | "telephone" = "alarmcar"
) => {
    try {
        console.log(`Reproduciendo sonido: ${archivo}`);

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });

        if (soundObject) {
            await soundObject.stopAsync();
            await soundObject.unloadAsync();
            soundObject = null;
        }

        const recurso =
            archivo === "telephone"
                ? require("../assets/images/telephone.mp3")
                : require("../assets/images/alarmcar.mp3");

        const { sound } = await Audio.Sound.createAsync(recurso, {
            shouldPlay: true,
            isLooping: true,
        });

        soundObject = sound;
        await sound.playAsync();
        await AsyncStorage.setItem("alarmPlaying", "true");
    } catch (error) {
        console.log("Error reproduciendo sonido:", error);
    }
};

export const stopAlarmSound = async () => {
    try {
        console.log("Intentando detener sonido...");

        if (soundObject) {
            await soundObject.stopAsync();
            await soundObject.unloadAsync();
            soundObject = null;
        }

        await AsyncStorage.removeItem("alarmPlaying");
    } catch (error) {
        console.log("Error deteniendo sonido:", error);
    }
};