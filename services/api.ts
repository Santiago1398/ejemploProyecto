import axios from "axios";

// Define la URL base de la API


// Obtiene los headers con el token desde ` AsyncStorage`
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/config/apiConfig";

const getHeaders = async () => {
    const token = await AsyncStorage.getItem("token"); // Obtiene el token almacenado
    const headers: any = {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
    };
    //Fix:En el login no tengo token por tanto si descomento esto me dara 
    //error en el login. Mirar como solucionar esto aposteriori.

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        headers,
    };
};




// AXIOS: Buen post de axios ****************************
export const post = async (path: string, data: unknown) => {
    console.log("PostData", data);
    console.log("path de post", `${API_URL}/${path}`);

    const headers = await getHeaders();
    const respuesta = await axios
        .post(`${API_URL}/${path}`, data, {
            headers: { ...headers },
            timeout: 10000,
            // No incluyas "Content-Type" aquí
        })
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            if (error.code !== "ERR_NETWORK") {
                console.log("Axios Error Response POST:", error.response);
                throw new Error(JSON.stringify(error.response.data));
            } else {
                console.log("Axios Error POST CONEXION:", error);
                throw new Error(JSON.stringify(error));
            }
        });

    return respuesta;
};




// AXIOS: Buen get de axios ****************************
export const get = async (path: string, id?: number) => {

    const headers = await getHeaders();
    const urlRequest = id ? `${API_URL}/${path}/${id}` : `${API_URL}/${path}`;
    console.log("path", urlRequest);
    // const xdata = await axios.get(`${API_URL}/${path}`, {
    const xdata = await axios.get(urlRequest, {
        headers: { ...headers },
    }).then(({ data }) => {
        console.log('Axios Success Response GET:', data);
        return data
    }).catch((error) => {
        if (error.code !== 'ERR_NETWORK') {
            console.log('Axios Error Response GET:', error.response);
            throw new Error(error.response.data);
        } else {
            console.log('Axios Error GET CONEXION:', error);
            throw new Error(error);
        }
    });
    //   console.log(res);
    return xdata;

};



// Función para realizar peticiones POST
export const postxxx = async (path: string, data: unknown) => {
    try {
        const headers = await getHeaders(); // Espera los headers
        const response = await axios.post(`${API_URL}/${path}`, data, {
            headers, // Pasa los headers resueltos
        });
        // console.log("Axios POST Response:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "POST");
    }
};

// Función para realizar peticiones GET
export const getxxx = async (path: string, id?: number) => {
    try {
        const headers = await getHeaders(); // Espera los headers
        const url = id ? `${API_URL}/${path}/${id}` : `${API_URL}/${path}`;
        const response = await axios.get(url, { headers }); // Pasa los headers resueltos
        // console.log("Axios GET Response:", response.data);
        return response.data;
    } catch (error) {
        handleError(error, "GET");
    }
};

// Función para manejar errores
const handleError = (error: any, method: string) => {
    if (error.response) {
        // console.error(`Axios ${method} Error Response:`, error.response.data);
        throw new Error(error.response.data.message || "Error en la petición");
    } else {
        // console.error(`Axios ${method} Error:`, error.message);
        throw new Error("Error de conexión con el servidor");
    }
};
