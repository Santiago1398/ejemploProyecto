import Constants from "expo-constants";



interface ExpoExtra {
    apiUrl: string;
    router: {
        origin: boolean;
    };
}

const extra = ((Constants.expoConfig as any)?.extra as ExpoExtra) ||
    ((Constants.manifest as any)?.extra as ExpoExtra);

export const API_URL = extra.apiUrl;
