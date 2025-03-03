import { NavigationContainer } from "@react-navigation/native";
import Layout from "./_layout";
import { LogBox } from "react-native";
import { usePushNotifications } from "@/hooks/usePushNotifications";
//import { app } from "@/config/firebaseConfig"; // ✅ Importa Firebase

LogBox.ignoreLogs(["Setting a timer"]);

export default function App() {


    return (
        <NavigationContainer>
            <Layout />
        </NavigationContainer>
    );
}


