// export const reloginSilencioso = async () => {
//   try {
//     const credenciales = await obtenerCredencialesSeguras();

//     if (!credenciales) {
//       return false;
//     }

//     const data = await postxxx("auth/login", {
//       username: credenciales.username,
//       password: credenciales.password,
//     });

//     await AsyncStorage.setItem("token", data.token);
//     await AsyncStorage.setItem("userId", data.userId.toString());
//     await AsyncStorage.setItem("fechaUltimoLogin", new Date().toISOString());

//     useAuthStore.setState({
//       username: credenciales.username,
//       token: data.token,
//       userId: data.userId,
//       isAuthenticated: true,
//       isActive: true,
//     });

//     return true;
//   } catch (error) {
//     console.error("Error en relogin silencioso:", error);
//     return false;
//   }
// };