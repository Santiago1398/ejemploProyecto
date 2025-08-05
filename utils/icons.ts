/* icons.ts ------------------------------------------------------ */
import Ionicons from '@expo/vector-icons/Ionicons';
import { getUnitString } from './units';

export const getSensorIcon = (
    type: number,
    unit: number
): keyof typeof Ionicons.glyphMap => {
    const unitString = getUnitString(unit);

    /* Temperaturas en °C / °F */
    if (unitString === '°C' || unitString === '°F') return 'thermometer-outline';

    /* Gases en ppm */
    if (unitString === 'ppm') {
        if (type === 3) return 'flask-outline';      // NH₃
        if (type === 2) return 'analytics-outline';  // CO₂
        return 'speedometer-outline';                // otros gases
    }

    /* Resto de sensores */
    switch (type) {
        case 0: return 'thermometer-outline'; // temperatura
        case 1: return 'water-outline';       // humedad
        case 2: return 'speedometer-outline'; // presión
        default: return 'hardware-chip-outline';
    }
};