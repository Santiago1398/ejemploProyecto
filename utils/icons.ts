/* utils/icons.ts --------------------------------------------------- */
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUnitString, UnitEnum } from '@/utils/units';

export type IconSpec =
    | { lib: 'ion'; name: keyof typeof Ionicons.glyphMap }
    | { lib: 'mc'; name: keyof typeof MaterialCommunityIcons.glyphMap };

export function getSensorIcon(type: number, unit: number): IconSpec {
    const u = getUnitString(unit);

    /* °C / °F ──────────────── */
    if (u === '°C' || u === '°F')
        return { lib: 'ion', name: 'thermometer-outline' };

    /* ppm ──────────────────── */
    if (u === 'ppm') {
        if (type === 3) return { lib: 'ion', name: 'flask-outline' };     // NH₃
        if (type === 2) return { lib: 'ion', name: 'analytics-outline' }; // CO₂
        return { lib: 'ion', name: 'speedometer-outline' };               // otros
    }

    /* Pascales ─────────────── */
    if (u === 'Pa' || type === 4)
        return { lib: 'mc', name: 'weather-windy' };  // icono viento

    /* Resto ────────────────── */
    switch (type) {
        case 0: return { lib: 'ion', name: 'thermometer-outline' };
        case 1: return { lib: 'ion', name: 'water-outline' };
        case 2: return { lib: 'ion', name: 'speedometer-outline' };
        default: return { lib: 'ion', name: 'hardware-chip-outline' };
    }
}
