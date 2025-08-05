// utils/units.ts
export const UnitEnum = {
    EN_GT_UNID_NO_UNIDAD: 0,
    EN_GT_UNID_GRADO_CENTIGRADO: 1,
    EN_GT_UNID_GRADO_Fahrenheit: 2,
    EN_GT_UNID_LITROS: 3,
    EN_GT_UNID_GALONES: 4,
    EN_GT_UNID_KILOS: 5,
    EN_GT_UNID_LIBRA: 6,
    EN_GT_UNID_M3H: 7,
    EN_GT_UNID_CFM: 8,
    EN_GT_UNID_VATIO: 9,
    EN_GT_UNID_PORCENTAJE: 10,
    EN_GT_UNID_PASCALES: 11,
    EN_GT_UNID_PPM: 12,
    EN_GT_UNID_METRO: 13,
    EN_GT_UNID_PULGADA: 14,
    EN_GT_UNID_PIE: 15,
} as const;

export type UnitKey = keyof typeof UnitEnum;

export const getUnitString = (unitNumber: number): string => {
    switch (unitNumber) {
        case UnitEnum.EN_GT_UNID_NO_UNIDAD:
            return "";
        case UnitEnum.EN_GT_UNID_GRADO_CENTIGRADO:
            return "°C";
        case UnitEnum.EN_GT_UNID_GRADO_Fahrenheit:
            return "°F";
        case UnitEnum.EN_GT_UNID_LITROS:
            return "L";
        case UnitEnum.EN_GT_UNID_GALONES:
            return "gal";
        case UnitEnum.EN_GT_UNID_KILOS:
            return "kg";
        case UnitEnum.EN_GT_UNID_LIBRA:
            return "lb";
        case UnitEnum.EN_GT_UNID_M3H:
            return "m³/h";
        case UnitEnum.EN_GT_UNID_CFM:
            return "CFM";
        case UnitEnum.EN_GT_UNID_VATIO:
            return "W";
        case UnitEnum.EN_GT_UNID_PORCENTAJE:
            return "%";
        case UnitEnum.EN_GT_UNID_PASCALES:
            return "Pa";
        case UnitEnum.EN_GT_UNID_PPM:
            return "ppm";
        case UnitEnum.EN_GT_UNID_METRO:
            return "m";
        case UnitEnum.EN_GT_UNID_PULGADA:
            return '"';
        case UnitEnum.EN_GT_UNID_PIE:
            return "ft";
        default:
            return "";
    }
};
