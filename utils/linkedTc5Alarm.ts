import { LinkedTc5AlarmResponse, TopAlarmCardData } from "@/types/LinkedTc5AlarmInterface";
import { deviceName, deviceTraduccionAlarmas } from "./switch/dispositivos";

export function resolverTextoAlarma(
    mac: string,
    alarmRef: number,
    alarmText: string,
    t: any
) {
    if (alarmRef === 0) {
        return alarmText?.trim() || "Alarma sin texto";
    }

    return deviceTraduccionAlarmas(mac, t, alarmRef);
}

export function obtenerTopAlarmCardData(
    data: LinkedTc5AlarmResponse[],
    t: any
): TopAlarmCardData | null {
    if (!Array.isArray(data) || data.length === 0) return null;

    const ordenadas = [...data].sort(
        (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const ultima = ordenadas[0];
    const fechaObj = new Date(ultima.timestamp);

    const nombreEquipo = deviceName(ultima.mac);
    const textoAlarma = resolverTextoAlarma(
        ultima.mac,
        ultima.alarmRef,
        ultima.alarmText,
        t
    );

    const ubicacion = [ultima.farm, ultima.building]
        .filter((valor) => valor?.trim())
        .join(" - ");

    const detalle = textoAlarma;
    return {
        mac: ultima.mac,
        titulo: "Alarma Portal",
        nombreEquipo,
        ubicacion,
        detalle,
        fecha: fechaObj.toLocaleDateString("es-ES"),
        hora: fechaObj.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }),
        timestamp: ultima.timestamp,
    };
}