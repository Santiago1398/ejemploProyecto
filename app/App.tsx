import { NavigationContainer } from "@react-navigation/native";
import Layout from "./_layout";
import { useEffect } from "react";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";


export default function App() {

    useEffect(() => {
        console.log("Registrando notificaciones push...");
        registerForPushNotificationsAsync();
        usePushNotifications();
    }, []);
    return (
        <NavigationContainer>
            <Layout />
        </NavigationContainer>
    );
}

