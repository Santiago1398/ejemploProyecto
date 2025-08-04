// src/config/apiConfig.ts
import Constants from "expo-constants";
import { useAuthStore } from "@/store/authStore";

type Extras = {
    apiUrl: string;
    apiUrlDev: string;
};

export function getApiUrl(): string {
    const isDev = useAuthStore.getState().isDeveloperMode;
    // intenta leer extra de expoConfig o de manifest (Expo Go)
    const expoExtra = (Constants.expoConfig as any)?.extra;
    const manifestExtra = (Constants.manifest as any)?.extra;
    console.log("🔍 Constants.expoConfig.extra:", expoExtra);
    console.log("🔍 Constants.manifest.extra:", manifestExtra);

    const extras: Extras | undefined = expoExtra || manifestExtra;
    if (!extras) {
        console.warn("⚠️ No se han encontrado 'extra' con apiUrl/apiUrlDev");
        return "";
    }

    console.log(`🔧Tiene que aparecer esto API Mode: ${isDev ? "DEV" : "PROD"}`,
        `→ usando ${isDev ? "apiUrlDev" : "apiUrl"}`,
        isDev ? extras.apiUrlDev : extras.apiUrl);
    return isDev ? extras.apiUrlDev : extras.apiUrl;
}
