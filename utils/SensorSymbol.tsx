/* utils/SensorSymbol.tsx ------------------------------------------ */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUnitString } from '@/utils/units';
import { getSensorIcon } from '@/utils/icons';

const CLOUD = 34, FONT = 10;

export const SensorSymbol: React.FC<{ type: number; unit: number }> = ({
    type, unit,
}) => {
    const u = getUnitString(unit);

    /* ─── Nube CO₂ / NH₃ ─────────────────────────── */
    if (u === 'ppm' && (type === 2 || type === 3)) {
        const label = type === 2 ? 'CO₂' : 'NH₃';
        return (
            <View style={[styles.box, { width: CLOUD, height: CLOUD }]}>
                <Ionicons name="cloud-outline" size={CLOUD} color="#fff" />
                <Text style={[styles.tag, { fontSize: FONT }]}>{label}</Text>
            </View>
        );
    }

    /* ─── Resto de sensores ───────────────────────── */
    const { lib, name } = getSensorIcon(type, unit);
    if (lib === 'ion')
        return <Ionicons name={name} size={22} color="#fff" style={styles.icon} />;
    return <MaterialCommunityIcons name={name} size={22} color="#fff" style={styles.icon} />;
};

const styles = StyleSheet.create({
    box: { justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    tag: {
        position: 'absolute',
        top: 13,
        left: 0, right: 0,
        textAlign: 'center',
        fontWeight: '700',
        color: '#fff',
    },
    icon: { marginRight: 8 },
});
