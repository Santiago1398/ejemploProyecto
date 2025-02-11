import { Audio } from "expo-av";


//Aqui cremos una variable global para el sonido de la alarma asi no seuna mas de una vez
export const globalAlarmSound = {
    sound: null as Audio.Sound | null,
};
