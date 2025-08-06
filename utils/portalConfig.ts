// src/config/portalConfig.ts
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/authStore";

const STORAGE_KEY = "portal_url_override";

type Extras = {
    portalUrl: string;
    portalUrlDev: string;
};

export async function getPortalUrl(): Promise<string> {
    // 1) override manual
    const override = await AsyncStorage.getItem(STORAGE_KEY);
    if (override) {
        console.log("🌐 Usando portal *override*:", override);
        return override;
    }

    // 2) valores declarados en extra
    const extras: Extras | undefined =
        (Constants.expoConfig as any)?.extra ||
        (Constants.manifest as any)?.extra;

    if (!extras) {
        console.warn("⚠️  No se encontró extra.portalUrl");
        return "";
    }

    const isDev = useAuthStore.getState().isDeveloperMode;
    const url = isDev ? extras.portalUrlDev : extras.portalUrl;

    console.log(`🔧 Portal Mode: ${isDev ? "DEV" : "PROD"} → ${url}`);
    return url;
}

export async function setPortalUrl(url: string) {
    await AsyncStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ""));
}

export async function clearPortalUrl() {
    await AsyncStorage.removeItem(STORAGE_KEY);
}
