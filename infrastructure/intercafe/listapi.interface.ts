
//Esto para la lista de los dispositivos (granjas)
export interface ResponseAlarmaSite {
    farmName: string;
    siteName: string;
    town: string;
    province: string;
    country: string;
    model: string;
    mac: number;
    idSite: number;
    locLevel: number;
    alarmStatus: boolean;
    alarmType: number;

    // Añadir los tipos
    latitude: number;
    longitude: number;
    buildingPortalRef: number
    armed: boolean


}

//Esto es para la lista de las alarmas
export interface ParamTC {
    idAlarm: number;
    armado: boolean;
    habilitado: boolean;
    disparado: boolean;
    tipoSonda: number;
    unidades: number;
    ValorSonda: number;
    consignaMinima: number;
    consignaMaxima: number;
    texto: string;
    conectado: boolean;
    //passwordCorrection: boolean;
    raised: boolean;
    reason: number;
}

//Esto es para los sensores Alarmas
export interface SensorData {
    id: number;
    value: number;
    minAlarm: number;
    maxAlarm: number;
    type: number;  //sensor type
    eventType: number;
    unit: number;
    minValueToday: number;
    maxValueToday: number;
    minValueYesterday: number;
    maxValueYesterday: number;
}


//Esto es el boton Master
//  export interface Props {
//     masterAlarmState: boolean;
//     onToggleMaster: () => void;
//     disabled?: boolean;
//     isLoading?: boolean;
//     //  swVersion: string;

// }

// export interface Props {
//     armado: boolean;
//     disparado: boolean;
//     raised: boolean;
// }


// export interface MenuOption {
//     id: string;
//     label: string;
//     icon: string;
//     lib?: 'feather' | 'mc';   // ← NUEVO, por defecto feather
//     onPress: () => void;
// }

// export interface Menu3PuntosProps {
//     visible: boolean;
//     onClose: () => void;
//     device: {
//         latitude: number;
//         longitude: number;
//         farmName: string;
//         siteName: string;
//         mac: number;
//         idSite: number;
//         buildingPortalRef: number;
//         simulado?: boolean; // 🔥 NUEVO

//     };
//     analogIds: number[];
//     options?: MenuOption[];
// }