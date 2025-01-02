import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '@/types/navigation';
import { resultado } from '@/infrastructure/intercafe/listapi.interface';

export default function DeviceList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [devices, setDevices] = useState<resultado[]>([]);


    useEffect(() => {
        const fechDevices = async () => {
            const data: resultado[] = [
                { id: 1, ubicacion: "Llano de Brujas", numeroNave: "A", estado: 1, mac: 123456789 },
                { id: 2, ubicacion: "Murcia", numeroNave: "B", estado: 2, mac: 234567890 },
                { id: 3, ubicacion: "Alquerías", numeroNave: "C", estado: 0, mac: 345678912 },
                { id: 4, ubicacion: "Beniajam", numeroNave: "D", estado: 3, mac: 456789123 },
                { id: 5, ubicacion: "Lorca", numeroNave: "E", estado: 4, mac: 567891234 },
                { id: 6, ubicacion: "Santomera", numeroNave: "F", estado: 1, mac: 67891234 },
                { id: 7, ubicacion: "Beniel", numeroNave: "G", estado: 2, mac: 789123456 },
                { id: 8, ubicacion: "El Raal", numeroNave: "H", estado: 0, mac: 891234567 },
                { id: 9, ubicacion: "Ronda sur", numeroNave: "I", estado: 3, mac: 912345678 },
            ];
            setDevices(data); //Esto se asegura los datos sean iguales que la interfaz Resultado
        };
        fechDevices();

    }, []);

    const getBackgroundColor = (estado: number) => {
        switch (estado) {
            case 0:
                return "#8a9bb9"; //Fuera de linea , gris
            case 1:
                return "#76db36"; //En linea sin alarma , verde
            case 2:
                return "red"; //En linea con alarma , rojo
            case 3:
                return "#9E75C6"; //contraseña incorrecta, violeta
            case 4:
                return "#F6BC31"; //En linea desarmada, amarilla
            default:
                return "white";

        }
    };



    return (

        <FlatList
            data={devices}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={[
                        styles.deviceContainer,
                        { backgroundColor: getBackgroundColor(item.estado) },
                    ]}
                    onPress={() => navigation.navigate("DeviceDetails", { device: item })}
                >
                    <Text style={styles.text}> {item.ubicacion}</Text>
                    <Text style={styles.text}> {item.numeroNave}</Text>
                </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
        />

    );
}

const styles = StyleSheet.create({

    listContainer: {
        padding: 16,
    },
    deviceContainer: {
        padding: 16,
        marginVertical: 8,
        borderRadius: 8,
    },
    text: {
        fontSize: 16,
        color: "#222222",
    },
})

