import AsyncStorage from "@react-native-async-storage/async-storage";

export const zustandStorage = {
    getItem: async (name: string) => {
        // Función asíncrona para obtener un valor del almacenamiento.
        const value = await AsyncStorage.getItem(name);
        return value ? JSON.parse(value) : null;
        // Si existe el valor, lo parsea de JSON a objeto. Si no, devuelve `null`.
    },
    setItem: async (name: string, value: any) => {
        await AsyncStorage.setItem(name, JSON.stringify(value));
    },
    removeItem: async (name: string) => {
        await AsyncStorage.removeItem(name);
        // Elimina la clave `name` del almacenamiento persistente.
    },
};
export default zustandStorage;

