// src/screens/WebViewExplotacion.tsx
import React, { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/app/HomeStack";

type WebViewRouteProp = RouteProp<RootStackParamList, "Explotacion">;

export default function WebViewConfiguracionTC5() {
    const route = useRoute<WebViewRouteProp>();
    const { mac, token, idioma = "es", idSite } = route.params;

    // 🔥 DEBUG: Imprimir parámetros recibidos
    console.log("=== PARÁMETROS RECIBIDOS ===");
    console.log("mac:", mac);
    console.log("token:", token);
    console.log("idioma:", idioma);
    console.log("idSite:", idSite);

    const [loading, setLoading] = useState(true);

    // 🔥 Construir URL paso a paso para debug
    //const baseUrl = "https://ctiportal.cticontrol.com/login.xhtml";
    const baseUrl = "https://ctiportaltest.cticontrol.com/login.xhtml";

    const queryParams = `mac=${mac}&token=${token}&idioma=${idioma}&idNave=${idSite}&app=appmovilv3&type=control-remoto`;
    const url = `${baseUrl}?${queryParams}`;

    // 🔥 DEBUG: Imprimir URL completa
    console.log("=== URL CONSTRUIDA ===");
    console.log("Base URL:", baseUrl);
    console.log("Query Params:", queryParams);
    console.log("URL Completa:", url);
    console.log("Longitud URL:", url.length);

    // 🔥 DEBUG: Verificar si la URL es válida
    try {
        const urlObj = new URL(url);
        console.log("✅ URL válida:");
        console.log("  - Protocol:", urlObj.protocol);
        console.log("  - Host:", urlObj.host);
        console.log("  - Search:", urlObj.search);
    } catch (error) {
        console.error("❌ URL inválida:", error);
    }

    return (
        <SafeAreaView style={styles.container}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
            <WebView
                source={{ uri: url }}
                onLoadStart={() => {
                    console.log("🔄 WebView: Iniciando carga...");
                    console.log("🔄 Cargando URL:", url);
                }}
                onLoadEnd={() => {
                    console.log("✅ WebView: Carga completada");
                    setLoading(false);
                }}
                onLoadProgress={({ nativeEvent }) => {
                    console.log(`📈 WebView: Progreso ${(nativeEvent.progress * 100).toFixed(0)}%`);
                }}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error("❌ WebView Error:", nativeEvent);
                    console.error("❌ Error Code:", nativeEvent.code);
                    console.error("❌ Error Description:", nativeEvent.description);
                    console.error("❌ URL que falló:", nativeEvent.url);
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error("🌐 HTTP Error:", nativeEvent.statusCode);
                    console.error("🌐 URL:", nativeEvent.url);
                }}
                onMessage={(event) => {
                    console.log("📨 Mensaje desde WebView:", event.nativeEvent.data);
                }}
                // 🔥 JavaScript mejorado para debug
                injectedJavaScript={`
                    console.log("=== WEBVIEW DEBUG ===");
                    console.log("URL actual:", window.location.href);
                    console.log("User Agent:", navigator.userAgent);
                    console.log("Parámetros URL:", window.location.search);
                    
                    // Enviar datos de vuelta al React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'page_info',
                        url: window.location.href,
                        title: document.title,
                        timestamp: new Date().toISOString()
                    }));
                    
                    true;
                `}
                // 🔥 Headers adicionales para debug
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
    container: { flex: 1 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff", // fondo blanco hasta que cargue
        zIndex: 10,
    },
});