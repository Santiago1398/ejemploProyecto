
import { initializeApp } from "firebase/app";


const firebaseConfig = {
    apiKey: "AIzaSyBqrNqrA8NEOhdflFJ334PsAMUHSatgkwk",
    authDomain: "mi-proyecto-e32ff.firebaseapp.com",
    projectId: "mi-proyecto-e32ff",
    storageBucket: "mi-proyecto-e32ff.appspot.com",
    messagingSenderId: "503923979781",
    appId: "1:503923979781:android:65a46594edac9480d6ce6c",
};

// Inicializa solo una vez
const app = initializeApp(firebaseConfig);


export default app;
