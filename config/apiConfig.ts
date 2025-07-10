// import Constants from "expo-constants";



// interface ExpoExtra {
//     apiUrl: string;
//     router: {
//         origin: boolean;
//     };
// }

// const extra = ((Constants.expoConfig as any)?.extra as ExpoExtra) ||
//     ((Constants.manifest as any)?.extra as ExpoExtra);

// export const API_URL = extra.apiUrl;

//?Pra modo desarrollo y modo produccion
// @/config/apiConfig.ts
import Constants from "expo-constants";
import { useAuthStore } from "@/store/authStore";

interface ExpoExtra {
    apiUrl: string;
    apiUrlDev?: string; // 🔥 NUEVA: URL de desarrollo
    router: {
        origin: boolean;
    };
}

const extra = ((Constants.expoConfig as any)?.extra as ExpoExtra) ||
    ((Constants.manifest as any)?.extra as ExpoExtra);

// 🔥 URLs base desde app.json
const PRODUCTION_API_URL = extra.apiUrl; // URL de producción desde app.json
const DEVELOPMENT_API_URL = extra.apiUrlDev || "http://37.187.180.179:8032/api"; // URL dev desde app.json o fallback

// 🔥 FUNCIÓN PARA OBTENER LA URL SEGÚN EL MODO
export const getApiUrl = (): string => {
    try {
        const { isDeveloperMode } = useAuthStore.getState();
        const selectedUrl = isDeveloperMode ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

        console.log(`🔧 API Mode: ${isDeveloperMode ? 'DEVELOPMENT' : 'PRODUCTION'}`);
        console.log(`🌐 API URL: ${selectedUrl}`);

        return selectedUrl;
    } catch (error) {
        console.warn("⚠️ Error getting developer mode, using production URL", error);
        return PRODUCTION_API_URL;
    }
};

export const API_URL = PRODUCTION_API_URL;