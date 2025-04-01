import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import Layout from './_layout';
import { initializeFirebase } from '@/config/firebaseConfig';

export default function App() {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const success = await initializeFirebase();
                if (!success) {
                    throw new Error('Failed to initialize Firebase');
                }
                setIsReady(true);
            } catch (err) {
                console.error('Initialization error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsReady(true); // Aún establecemos isReady a true para no bloquear la app
            }
        };

        init();
    }, []);

    if (!isReady) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Inicializando aplicación...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <Text style={styles.messageText}>
                    La aplicación no pudo inicializarse correctamente.
                    Por favor, inténtalo de nuevo más tarde.
                </Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Layout />
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'red',
        marginBottom: 10,
    },
    messageText: {
        fontSize: 16,
        textAlign: 'center',
    }
});