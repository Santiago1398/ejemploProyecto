// src/utils/credencialesSeguras.ts
import * as SecureStore from "expo-secure-store";

const CLAVE_USUARIO = "credenciales_username";
const CLAVE_PASSWORD = "credenciales_password";

export const guardarCredencialesSeguras = async (
  username: string,
  password: string
) => {
  await SecureStore.setItemAsync(CLAVE_USUARIO, username);
  await SecureStore.setItemAsync(CLAVE_PASSWORD, password);
};

export const obtenerCredencialesSeguras = async () => {
  const username = await SecureStore.getItemAsync(CLAVE_USUARIO);
  const password = await SecureStore.getItemAsync(CLAVE_PASSWORD);

  if (!username || !password) {
    return null;
  }

  return { username, password };
};

export const borrarCredencialesSeguras = async () => {
  await SecureStore.deleteItemAsync(CLAVE_USUARIO);
  await SecureStore.deleteItemAsync(CLAVE_PASSWORD);
};