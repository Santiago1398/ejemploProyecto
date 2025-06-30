// utils/apiConfig.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_API = "http://192.168.10.157:8032/api";

export const getApiUrl = async (): Promise<string> => {
    const storedUrl = await AsyncStorage.getItem("customApiUrl");
    return storedUrl || DEFAULT_API;
};

export const setApiUrl = async (url: string) => {
    await AsyncStorage.setItem("customApiUrl", url);
};