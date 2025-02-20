import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import Layout from "./_layout";
import { LogBox } from "react-native";
import { app } from "@/config/firebaseConfig"; // ✅ Importa Firebase

LogBox.ignoreLogs(["Setting a timer"]);

export default function App() {
    useEffect(() => {
        console.log("✅ Firebase inicializado:", app);
    }, []);

    return (
        <NavigationContainer>
            <Layout />
        </NavigationContainer>
    );
}


