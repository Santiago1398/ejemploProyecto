import { useEffect, useState } from "react"
import { resultado } from "@/infrastructure/intercafe/listapi.interface";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { rgbaArrayToRGBAColor, rgbaColor } from "react-native-reanimated/lib/typescript/Colors";

export default function DeviceList() {
    const [devices, setDevices] = useState<resultado[]>([]);  // Usa la interfaz Resultado


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
                return "#B0B0B0"; //Fuera de linea
            case 1:
                return "#66B266"; //En linea sin alarma
            case 2:
                return "#FF6666"; //En linea con alarma
            case 3:
                return "#9E75C6"; //contraseña incorrecta;
            case 4:
                return "#F6BC31"; //En linea desarmada
            default:
                return "white";

        }
    };

    const renderItem = ({ item }: { item: resultado }) => (
        <View
            style={[
                styles.deviceContainer,
                { backgroundColor: getBackgroundColor(item.estado) },
            ]}
        >
            <Text style={styles.text}>Ubicación: {item.ubicacion}</Text>
            <Text style={styles.text}>Nave: {item.numeroNave}</Text>
            <Text style={styles.text}>Estado: {item.estado}</Text>
            <Text style={styles.text}>Mac: {item.mac
            }</Text>
        </View>
    );

    return (
        <FlatList
            data={devices}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()} // Convierte el ID a string
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
        color: "#000",
    },
})

