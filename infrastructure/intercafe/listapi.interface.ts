export interface listApi {
    id: number,
    ubicacion: string,
    Numero_nave: string,
    estado: number,
    mac: number,
    alarmas: Alarma[];

}

export interface resultado {
    id: number,
    ubicacion: string,
    numeroNave: string,
    estado: number,
    mac: number,

}

interface Alarma {
    id: number;
    nombre: string;
    estado: number;
}
