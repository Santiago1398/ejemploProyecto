import { create } from "zustand";
import { persist } from "zustand/middleware";
import zustandStorage from "./zustandStorage";
import { post, postxxx } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { notificationService } from "@/hooks/NotificationService";

interface AuthState {
    username: string | null;
    password: string | null;
    token: string | null;
    userId: number | null;
    isAuthenticated: boolean;
    isActive: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    reslogin: string;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            username: null,
            password: null,
            token: null,
            userId: null,
            isAuthenticated: false,
            isActive: false,
            reslogin: "",
            login: async (username, password) => {
                try {

                    const data = await postxxx("auth/login", { username, password });
                    set({ reslogin: data.toString() });

                    console.log(" Datos del servidor:", data);

                    await AsyncStorage.setItem("token", data.token);
                    await AsyncStorage.setItem("userId", data.userId.toString());
                    await notificationService.registerDevice(data.userId);



                    set({
                        username,
                        token: data.token,
                        userId: data.userId,
                        isAuthenticated: true,
                        isActive: true,
                    });

                    return true;
                } catch (error) {
                    console.error(" Error en el inicio de sesión:", error);
                    return false;
                }
            },
            logout: async () => {
                try {
                    notificationService.disconnect();

                    await AsyncStorage.removeItem("token");
                    await AsyncStorage.removeItem("userId");

                    set({
                        username: null,
                        password: null,
                        token: null,
                        userId: null,
                        isAuthenticated: false,
                        isActive: false,
                    });
                } catch (error) {
                    console.error("Error durante el logout:", error);
                }
            },

        }),
        {
            name: "auth-storage",
            storage: zustandStorage,
        }
    )
);

