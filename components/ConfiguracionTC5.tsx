// src/screens/WebViewConfiguracionTC5.tsx
import React, { useState, useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/app/HomeStack";
import { Feather } from "@expo/vector-icons";

type WebViewRouteProp = RouteProp<RootStackParamList, "ConfiguracionTC5">;

export default function WebViewConfiguracionTC5() {
    const route = useRoute<WebViewRouteProp>();
    const navigation = useNavigation();
    const {
        mac,
        token,
        idioma = "es",
        idSite,
        simulado = false // NUEVO: Obtener parámetro simulado
    } = route.params;

    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // 🔥 NUEVO: Si es simulado, mostrar mensaje simple
    if (simulado) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.simulationContainer}>
                    <Feather name="settings" size={64} color="#8a9bb9" />
                    <Text style={styles.simulationTitle}> Esto es una simulación</Text>
                    <Text style={styles.simulationMessage}>No existe en el portal</Text>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={20} color="#fff" />
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    //  VALIDACIÓN DE PARÁMETROS OBLIGATORIOS
    const validateParams = () => {
        const errors = [];

        console.log("=== VALIDANDO PARÁMETROS CONFIGURACIÓN ===");
        console.log("mac:", mac, typeof mac);
        console.log("token:", token, typeof token);
        console.log("idioma:", idioma, typeof idioma);
        console.log("idSite:", idSite, typeof idSite);
        console.log("simulado:", simulado, typeof simulado);

        // Validar MAC
        if (!mac || mac === 0 || mac === null || mac === undefined) {
            errors.push("MAC del dispositivo");
        }

        // Validar Token
        if (!token || token === "" || token === null || token === undefined) {
            errors.push("Token de autenticación");
        }

        // Validar idSite
        if (!idSite || idSite === 0 || idSite === null || idSite === undefined) {
            errors.push("ID del sitio");
        }

        // Validar idioma (opcional, tiene valor por defecto)
        if (!idioma || idioma === "") {
            console.warn("⚠️ Idioma no especificado, usando 'es' por defecto");
        }

        if (errors.length > 0) {
            const errorMsg = `Faltan datos obligatorios:\n• ${errors.join('\n• ')}`;
            console.error("❌ VALIDACIÓN CONFIGURACIÓN FALLIDA:", errorMsg);
            setErrorMessage(errorMsg);
            setHasError(true);
            setLoading(false);
            return false;
        }

        console.log("✅ Todos los parámetros de configuración son válidos");
        return true;
    };

    // 🔥 EJECUTAR VALIDACIÓN AL CARGAR
    useEffect(() => {
        const isValid = validateParams();
        if (!isValid) {
            return; // No continuar si hay errores
        }
    }, []);

    // 🔥 SI HAY ERRORES, MOSTRAR PANTALLA DE ERROR
    if (hasError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color="#FF3B30" />
                    <Text style={styles.errorTitle}>Error de Configuración</Text>
                    <Text style={styles.errorMessage}>{errorMessage}</Text>
                    <Text style={styles.errorDescription}>
                        No se puede cargar el portal porque no hay conexion o no existe
                    </Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={20} color="#fff" />
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    //    const baseUrl = "https://ctiportal.cticontrol.com/login.xhtml";
    const baseUrl = "https://ctiportaltest.cticontrol.com/login.xhtml";
    const queryParams = `mac=${mac}&token=${token}&idioma=${idioma}&idNave=${idSite}&app=appmovilv3&type=control-remoto`;
    const url = `${baseUrl}?${queryParams}`;

    // 🔥 DEBUG: Imprimir URL construida
    console.log("=== URL CONFIGURACIÓN CONSTRUIDA ===");
    console.log("Base URL:", baseUrl);
    console.log("Query Params:", queryParams);
    console.log("URL Completa:", url);
    console.log("Longitud URL:", url.length);

    // 🔥 MANEJO DE ERRORES DE CARGA DE WEBVIEW
    const handleWebViewError = (syntheticEvent: any) => {
        const { nativeEvent } = syntheticEvent;
        console.error("❌ WebView Configuración Error:", nativeEvent);

        setHasError(true);
        setErrorMessage("Error al cargar el portal de configuración");
        setLoading(false);

        Alert.alert(
            "Error de Conexión",
            "No se pudo cargar el portal de configuración. Verifica tu conexión a internet.",
            [
                { text: "Reintentar", onPress: () => setLoading(true) },
                { text: "Volver", onPress: () => navigation.goBack() }
            ]
        );
    };

    const handleHttpError = (syntheticEvent: any) => {
        const { nativeEvent } = syntheticEvent;
        console.error("🌐 HTTP Error Configuración:", nativeEvent.statusCode);

        if (nativeEvent.statusCode >= 400) {
            setHasError(true);
            setErrorMessage(`Error del servidor (${nativeEvent.statusCode})`);
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Cargando configuración...</Text>
                </View>
            )}

            <WebView
                source={{ uri: url }}
                onLoadStart={() => {
                    console.log("🔄 WebView Configuración: Iniciando carga...");
                    setLoading(true);
                }}
                onLoadEnd={() => {
                    console.log("✅ WebView Configuración: Carga completada");
                    setLoading(false);
                }}
                onLoadProgress={({ nativeEvent }) => {
                    console.log(`📈 WebView Configuración: Progreso ${(nativeEvent.progress * 100).toFixed(0)}%`);
                }}
                onError={handleWebViewError}
                onHttpError={handleHttpError}
                onMessage={(event) => {
                    console.log("📨 Mensaje desde WebView Configuración:", event.nativeEvent.data);
                }}
                injectedJavaScript={`
                    console.log("=== WEBVIEW CONFIGURACIÓN DEBUG ===");
                    console.log("URL actual:", window.location.href);
                    console.log("Título:", document.title);
                    
                    // Verificar si la página se cargó correctamente
                    if (document.readyState === 'complete') {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'configuracion_loaded',
                            url: window.location.href,
                            title: document.title,
                            timestamp: new Date().toISOString()
                        }));
                    }
                    
                    true;
                `}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                mixedContentMode={'compatibility'}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        zIndex: 10,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f8f9fa",
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FF3B30",
        marginTop: 16,
        marginBottom: 12,
        textAlign: "center",
    },
    errorMessage: {
        fontSize: 16,
        color: "#333",
        marginBottom: 16,
        textAlign: "center",
        fontWeight: "600",
    },
    errorDescription: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    // 🔥 NUEVOS ESTILOS PARA SIMULACIÓN
    simulationContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f8f9fa",
    },
    simulationTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#8a9bb9",
        marginTop: 20,
        marginBottom: 10,
        textAlign: "center",
    },
    simulationMessage: {
        fontSize: 18,
        color: "#666",
        textAlign: "center",
        marginBottom: 40,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#007AFF",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
});