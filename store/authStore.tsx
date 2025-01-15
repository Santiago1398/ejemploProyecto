import { create } from "zustand";
import { persist } from "zustand/middleware";
import zustandStorage from "./zustandStorage";
import { post } from "@/services/api";

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
                    //console.log("llamando a al api")
                    const data = await post("auth/login", { username, password }); // Usa la función `post`
                    //console.log(data)
                    set({
                        username: username,
                        password,
                        token: data.token, // Asegúrate de que el backend devuelve `token`
                        userId: data.userId,
                        isAuthenticated: true,
                        isActive: true,
                    });
                    console.log(data.token)
                    return true;
                } catch (error) {
                    //console.error("Error en el Email o contraseña");
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

