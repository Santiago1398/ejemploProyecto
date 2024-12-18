export const loginRequest = async (email: string, password: string) => {
    // Simula una solicitud de autenticación
    if (email === "admin@ejemplo.com" && password === "admin") {
        return {
            success: true,
            token: "mock-token",
        };
    } else {
        return {
            success: false,
        };
    }
};
