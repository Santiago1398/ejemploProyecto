import { getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
    apiKey: "AIzaSyDydjxyrSrgos_Bhq6iGQM90OUjQaxbhOY",
    authDomain: "mi-proyecto-e32ff.firebaseapp.com",
    projectId: "mi-proyecto-e32ff",
    storageBucket: "mi-proyecto-e32ff.firebasestorage.app",
    messagingSenderId: "503923979781",
    appId: "1:503923979781:web:ffaccf2ed9d4a685d6ce6c",
    measurementId: "G-8PEBV6Y9JK"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
//const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const analytics = getAnalytics(app);


//export { app, analytics };