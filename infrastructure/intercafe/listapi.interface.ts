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
    passwordCorrection: boolean;
    raised: boolean;
    reason: number;
}

//  INTERFAZ PARA SENSORES
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