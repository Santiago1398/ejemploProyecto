import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';

const firebaseConfig = {
    apiKey: "AIzaSyDydjxyrSrgos_Bhq6iGQM90OUjQaxbhOY",
    authDomain: "mi-proyecto-e32ff.firebaseapp.com",
    projectId: "mi-proyecto-e32ff",
    storageBucket: "mi-proyecto-e32ff.firebasestorage.app",
    messagingSenderId: "503923979781",
    appId: "1:503923979781:web:ffaccf2ed9d4a685d6ce6c",
    measurementId: "G-8PEBV6Y9JK"
};

export const initializeFirebase = async () => {
    try {
        // Verifica si Firebase ya está inicializado
        if (!firebase.apps.length) {
            await firebase.initializeApp(firebaseConfig);
        }
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
};

export { firebase, messaging };