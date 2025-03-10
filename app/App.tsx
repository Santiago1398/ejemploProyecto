import { NavigationContainer } from "@react-navigation/native";
import Layout from "./_layout";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function App() {
    usePushNotifications(); // Inicializa push notifications
    return (
        <NavigationContainer>
            <Layout />
        </NavigationContainer>
    );
}

