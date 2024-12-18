import { create } from "zustand";
import { persist } from "zustand/middleware";
import zustandStorage from "./zustandStorage";

interface AuthState {
    email: string | null;
    password: string | null;
    token: string | null;
    isAuthenticated: boolean;
    isActive: boolean; // Nueva propiedad
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            email: null,
            password: null,
            token: null,
            isAuthenticated: false,
            isActive: false, // Estado inicial de isActive
            login: async (email, password) => {
                if (email === "admin13@ejemplo.com" && password === "admin") {
                    set({
                        email,
                        password,
                        token: "mock-token",
                        isAuthenticated: true,
                        isActive: true, // Usuario activo después de iniciar sesión
                    });
                    return true;
                }
                return false;
            },
            logout: () => {
                set({
                    email: null,
                    password: null,
                    token: null,
                    isAuthenticated: false,
                    isActive: false, // Se desactiva el usuario al cerrar sesión
                });
            },
        }),
        {
            name: "auth-storage",
            storage: zustandStorage,
        }
    )
);


