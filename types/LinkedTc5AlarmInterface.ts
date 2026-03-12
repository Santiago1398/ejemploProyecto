export interface LinkedTc5AlarmResponse {
    timestamp: string;
    mac: string;
    modelName: string;
    alarmRef: number;
    alarmText: string;
    alarmType: number;
    farm: string;
    building: string;
    locationId: number;
}

export interface TopAlarmCardData {
    mac: string;
    nombreEquipo: string;
    textoAlarma: string;
    fecha: string;
    hora: string;
    timestamp: string;
}