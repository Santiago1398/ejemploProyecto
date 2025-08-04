// src/hooks/useAppExtra.ts
import Constants from 'expo-constants';

export function useAppExtra() {
    // en expo start: Constants.expoConfig.extra
    // en standalone/EAS: Constants.manifest?.extra
    const cfg = (Constants.expoConfig as any) ?? (Constants.manifest as any) ?? {};
    const extras = cfg.extra ?? {};
    return extras as {
        devBuildNumber?: number;
        [key: string]: any;
    };
}
