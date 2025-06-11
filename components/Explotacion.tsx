// src/screens/WebViewExplotacion.tsx
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/app/HomeStack";

type WebViewRouteProp = RouteProp<RootStackParamList, "Explotacion">;

export default function WebViewExplotacion() {
    const route = useRoute<WebViewRouteProp>();
    const { mac, token, idioma = "es", siteName } = route.params;
    const url = `https://ctiportal.cticontrol.com?mac=${mac}&token=${token}&idioma=${idioma}&nave=${siteName}&app=appmovilv3`;

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                source={{ uri: url }}
                onMessage={(event) => {
                    console.log("Mensaje desde WebView:", event.nativeEvent.data);
                }}
                injectedJavaScript={`("Hola2: ${url}"); true;`}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
});
