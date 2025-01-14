import axios from "axios";

// Define la URL base de la API
const API_URL = "http://37.187.180.179:8032/api";

// Obtiene los headers con el token desde ` AsyncStorage`
import AsyncStorage from "@react-native-async-storage/async-storage";

const getHeaders = async () => {
    const token = await AsyncStorage.getItem("token"); // Obtiene el token almacenado
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};


// Función para realizar peticiones POST
export const post = async (path: string, data: unknown) => {
    try {
        const headers = await getHeaders(); // Espera los headers
        const response = await axios.post(`${API_URL}/${path}`, data, {
            headers, // Pasa los headers resueltos
        });
        console.log("Axios POST Response:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "POST");
    }
};

// Función para realizar peticiones GET
export const get = async (path: string, id?: number) => {
    try {
        const headers = await getHeaders(); // Espera los headers
        const url = id ? `${API_URL}/${path}/${id}` : `${API_URL}/${path}`;
        const response = await axios.get(url, { headers }); // Pasa los headers resueltos
        console.log("Axios GET Response:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "GET");
    }
};

// Función para manejar errores
const handleError = (error: any, method: string) => {
    if (error.response) {
        console.error(`Axios ${method} Error Response:`, error.response.data);
        throw new Error(error.response.data.message || "Error en la petición");
    } else {
        console.error(`Axios ${method} Error:`, error.message);
        throw new Error("Error de conexión con el servidor");
    }
};
