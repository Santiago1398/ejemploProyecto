// components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = {
    icon: string;           // nombre del icono
    lib?: 'ion' | 'mc';     // biblioteca (Ionicons por defecto)
    title: string;          // línea principal
    subtitle?: string;      // línea secundaria
    color?: string;         // color corporativo
    size?: number;          // tamaño del icono
};

export const EmptyState: React.FC<Props> = ({
    icon,
    lib = 'ion',
    title,
    subtitle,
    color = '#34C759',   // ajusta a tu verde corporativo
    size = 96,
}) => (
    <View style={styles.container}>
        {lib === 'ion'
            ? <Ionicons name={icon as any} size={size} color={color} />
            : <MaterialCommunityIcons name={icon as any} size={size} color={color} />
        }

        <Text style={[styles.title, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    title: { fontSize: 20, fontWeight: '600', marginTop: 16, textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 22, maxWidth: '70%' },
});