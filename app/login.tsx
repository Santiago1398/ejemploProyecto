import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ImageBackground,
    Pressable,
    Image
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { Feather } from "@expo/vector-icons";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { ActivityIndicator } from "react-native";
import { t } from "@/i18n/i18nConfig";

export default function LoginScreen({ navigation }: any) {
    const {
    username: savedEmail,
    login,
    isDeveloperMode,
    toggleDeveloperMode
} = useAuthStore();

const [email, setEmail] = useState(savedEmail || "");
const [password, setPassword] = useState("");
    const { requestPermission } = useNotificationPermission();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // 🔥 MODO DESARROLLO - Como en tu app que funciona
    const [tapCount, setTapCount] = useState(0);

    useEffect(() => {
        const initializePermissions = async () => {
            try {
                await requestPermission();
            } catch (error) {
                console.error('Error al solicitar permisos:', error);
            }
        };

        initializePermissions();
    }, []);

    // 🔥 FUNCIÓN PARA MANEJAR TOQUES DE DESARROLLO (igual que tu app que funciona)
    const handleDevTap = () => {
        const next = tapCount + 1;
        setTapCount(next);
        console.log(`🔧 Dev tap count: ${next}/5`);

        if (next >= 5) {
            toggleDeveloperMode();
            Alert.alert(
                "Modo cambiado",
                isDeveloperMode ? "Modo producción" : "Modo desarrollo"
            );
            setTapCount(0);
        }
    };

    // 🔥 RESETEAR CONTADOR DESPUÉS DE 3 SEGUNDOS
    useEffect(() => {
        if (tapCount > 0) {
            const timer = setTimeout(() => {
                console.log("🔧 Reseteando contador de toques");
                setTapCount(0);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [tapCount]);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                navigation.navigate("Home");
            } else {
                Alert.alert(t("login.error.datos"));
            }
        } catch (error) {
            Alert.alert(t("login.error.general"), t("login.error.mensaje"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require("assets/images/imagenTecnologicaLogin.jpg")}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    {/* 🔥 ÁREA PARA DETECTAR TOQUES - En el título "Ingresar" */}
                    <Pressable onPress={handleDevTap} style={{ width: "100%", alignItems: "center" }}>
                        <View>
                            <Text style={styles.title}>{t("login.titulo")}</Text>
                            <Text style={styles.subtitle}>{t("login.subtitulo")}</Text>

                            {/* 🔥 INDICADOR DE MODO DESARROLLO */}
                            {isDeveloperMode && (
                                <Text style={styles.devText}>🔧 Modo desarrollo</Text>
                            )}
                        </View>
                    </Pressable>

                    <View style={styles.inputContainer}>
                        <Feather name="mail" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo electrónico"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="lock" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            style={[styles.input, { paddingRight: 35 }]}
                            placeholder="Contraseña"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* 🔥 BOTÓN DE LOGIN SEPARADO - Sin mezclar con modo desarrollo */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>{t("login.titulo")}</Text>
                                <Feather name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* 🔥 CONTADOR DE TOQUES VISIBLE DURANTE LA SECUENCIA */}
                    {/* {tapCount > 0 && tapCount < 5 && (
                        <View style={styles.tapCountContainer}>
                            <Text style={styles.tapCountText}>
                                🔧 {tapCount}/5 toques para modo desarrollo
                            </Text>
                        </View>
                    )} */}
                </View>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        justifyContent: "center",
    },
    overlay: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        marginHorizontal: 20,
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#000",
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 24,
        textAlign: "center",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
        width: "100%",
        backgroundColor: "#fff",
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#000",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 16,
        width: "100%",
        justifyContent: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonIcon: {
        marginLeft: 8,
    },
    eyeIcon: {
        position: "absolute",
        right: 12,
    },

    // 🔥 ESTILO PARA MODO DESARROLLO (como en tu app que funciona)
    devText: {
        color: "red",
        fontWeight: "bold",
        textAlign: "center",
        fontSize: 12,
        marginTop: 5,
    },

    // 🔥 CONTADOR DE TOQUES
    tapCountContainer: {
        marginTop: 10,
        padding: 8,
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#007bff",
        width: "100%",
        alignItems: "center",
    },
    tapCountText: {
        color: "#007bff",
        fontSize: 11,
        textAlign: "center",
        fontWeight: "600",
    },
});