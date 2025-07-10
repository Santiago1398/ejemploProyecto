import React, { useState } from "react";
import {
    SafeAreaView,
    StyleSheet,
    View,
    ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/app/HomeStack";

type WebViewRouteProp = RouteProp<RootStackParamList, "Explotacion">;

export default function WebViewExplotacion() {
    const route = useRoute<WebViewRouteProp>();
    const { mac, token, idioma = "es", siteName, idSite, buildPortalRef } = route.params;
    console.log("Parametros recibidos:", { mac, token, idioma, siteName, idSite, buildPortalRef });
    //const url = `https://ctiportal.cticontrol.com/login.xhtml?mac=${mac}&token=${token}&idioma=${idioma}&nave=${siteName}&idNave=${buildPortalRef}&app=appmovilv3&type=nave`;
    const url = `https://ctiportaltest.cticontrol.com/login.xhtml?mac=${mac}&token=${token}&idioma=${idioma}&nave=${siteName}&idNave=${buildPortalRef}&app=appmovilv3&type=nave`;


    const [loading, setLoading] = useState(true);

    return (
        <SafeAreaView style={styles.container}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
            <WebView
                source={{ uri: url }}
                onLoadEnd={() => setLoading(false)}
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
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        zIndex: 10,
    },
});
