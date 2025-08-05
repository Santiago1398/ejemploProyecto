/* SensorSymbol.tsx */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getSensorIcon } from '@/utils/icons';
import { getUnitString } from './units';

const CLOUD = 31;          // lado del cuadrado contenedor
const FONT = 10;          // tamaño fijo para la etiqueta química

export const SensorSymbol = ({ type, unit }: { type: number; unit: number }) => {
    const unitString = getUnitString(unit);

    if (unitString === 'ppm' && (type === 2 || type === 3)) {
        const label = type === 2 ? 'CO₂' : 'NH₃';

        return (
            <View style={[styles.box, { width: CLOUD, height: CLOUD }]}>
                <Ionicons name="cloud-outline" size={CLOUD} color="#fff" />
                <Text style={[styles.tag, { fontSize: FONT, lineHeight: FONT + 1, top: 12, },]} >
                    {label}
                </Text>
            </View>
        );
    }

    return (
        <Ionicons name={getSensorIcon(type, unit)} size={20} color="#fff" style={styles.icon} />
    );
};

const styles = StyleSheet.create({
    box: {
        width: CLOUD,
        height: CLOUD,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        position: 'relative',
    },
    tag: {
        position: 'absolute',
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        left: 0,
        right: 0,
    },
    icon: { marginRight: 8 },
});