// // src/config/apiConfig.ts
// import Constants from "expo-constants";
// import { useAuthStore } from "@/store/authStore";

// type Extras = {
//     apiUrl: string;
//     apiUrlDev: string;
// };

// export function getApiUrl(): string {
//     const isDev = useAuthStore.getState().isDeveloperMode;
//     // intenta leer extra de expoConfig o de manifest (Expo Go)
//     const expoExtra = (Constants.expoConfig as any)?.extra;
//     const manifestExtra = (Constants.manifest as any)?.extra;
//     console.log("🔍 Constants.expoConfig.extra:", expoExtra);
//     console.log("🔍 Constants.manifest.extra:", manifestExtra);

//     const extras: Extras | undefined = expoExtra || manifestExtra;
//     if (!extras) {
//         console.warn("⚠️ No se han encontrado 'extra' con apiUrl/apiUrlDev");
//         return "";
//     }

//     console.log(`🔧Tiene que aparecer esto API Mode: ${isDev ? "DEV" : "PROD"}`,
//         `→ usando ${isDev ? "apiUrlDev" : "apiUrl"}`,
//         isDev ? extras.apiUrlDev : extras.apiUrl);
//     return isDev ? extras.apiUrlDev : extras.apiUrl;
// }

// src/config/apiConfig.ts
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';

const STORAGE_KEY = 'api_url_override';

type Extras = {
    apiUrl: string;     // producción
    apiUrlDev: string;  // desarrollo
};

export async function getApiUrl(): Promise<string> {
    const override = await AsyncStorage.getItem(STORAGE_KEY);
    if (override) {
        console.log(' Usando URL *override* guardada:', override);
        return override;
    }

    const extras: Extras | undefined =
        (Constants.expoConfig as any)?.extra ||
        (Constants.manifest as any)?.extra;

    if (!extras) {
        console.warn('⚠️  No se encontró extra.apiUrl en el manifest');
        return '';
    }

    const isDev = useAuthStore.getState().isDeveloperMode;
    const url = isDev ? extras.apiUrlDev : extras.apiUrl;

    console.log(
        `🔧 API Mode: ${isDev ? 'DEV' : 'PROD'} → ${url}`
    );
    return url;
}

export async function setApiUrl(url: string): Promise<void> {
    const cleaned = url.trim().replace(/\/+$/, '');
    if (cleaned) {
        await AsyncStorage.setItem(STORAGE_KEY, cleaned);
        console.log(' URL override guardada:', cleaned);
    }
}

export async function clearApiUrl(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log(' URL override eliminada – se usará la del manifest');
}
