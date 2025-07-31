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