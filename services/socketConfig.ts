// src/config/socketConfig.ts
import Constants from "expo-constants";
import { useAuthStore } from "@/store/authStore";

type Extras = {
    socketUrl: string;
    socketUrlDev: string;
};

export function getSocketUrl(): string {
    const isDev = useAuthStore.getState().isDeveloperMode;

    // expoConfig.extra es donde EAS inyecta lo de app.json
    const extras = (Constants.expoConfig as any)?.extra as Extras
        || // para que no rompa en Web o en caso raro:
        (Constants.manifest as any)?.extra as Extras;

    if (!extras) {
        console.warn("⚠️ No se han encontrado las URLs de socket en extra");
        return "";
    }

    return isDev ? extras.socketUrlDev : extras.socketUrl;
}