import { create } from "zustand";
import { persist } from "zustand/middleware";
import zustandStorage from "./zustandStorage";
import { post, postxxx } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
    username: string | null;
    password: string | null;
    token: string | null;
    userId: number | null;
    isAuthenticated: boolean;
    isActive: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
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
            login: async (username, password) => {
                try {
                    console.log("llamando a la api")
                    const data = await post("auth/login", { username, password }); // Realiza la solicitud POST al servidor
                    console.log("iniciando sesision Datos del servidor:", data);


                    // Guarda el token y el userId en AsyncStorage
                    await AsyncStorage.setItem("token", data.token);
                    await AsyncStorage.setItem("userId", data.userId.toString());

                    // Actualiza el estado en el store
                    set({
                        username,
                        password,
                        token: data.token,
                        userId: data.userId,
                        isAuthenticated: true,
                        isActive: true,
                    });

                    console.log("Token guardado en AsyncStorage:", data.token);
                    console.log("UserId guardado en AsyncStorage:", data.userId);
                    return true;
                } catch (error) {
                    console.error("Error en el inicio de sesión:", error);
                    return false;
                }
            },



            logout: () => {
                set({
                    username: null,
                    password: null,
                    token: null,
                    userId: null,
                    isAuthenticated: false,
                    isActive: false,
                });
            },
        }),
        {
            name: "auth-storage",
            storage: zustandStorage,
        }
    )
);

