import { LinkedTc5AlarmResponse, TopAlarmCardData } from "@/types/LinkedTc5AlarmInterface";
import { deviceName, deviceTraduccionAlarmas } from "./switch/dispositivos";

export function resolverTextoAlarma(mac: string, alarmRef: number, alarmText: string, t: any) {
    if (alarmRef === 0) return alarmText?.trim() || "Alarma sin texto";
    return deviceTraduccionAlarmas(mac, t, alarmRef);
}

// ✅ key estable (NO uses timestamp)
export function makeAlarmKey(a: LinkedTc5AlarmResponse) {
    return [
        String(a.mac ?? ""),
        String(a.alarmRef ?? ""),
        String(a.alarmType ?? ""),
        String(a.locationId ?? ""),
        String(a.farm ?? "").trim(),
        String(a.building ?? "").trim(),
        String(a.alarmText ?? "").trim(),
    ].join("|");
}

export function obtenerTopAlarmCardData(
    data: LinkedTc5AlarmResponse[],
    t: any,
    preferKey?: string
): TopAlarmCardData | null {
    if (!Array.isArray(data) || data.length === 0) return null;

    const list = data.map((a) => ({ ...a, _key: makeAlarmKey(a) }));

    // ✅ 1) STICKY: si la que estaba se mantiene, NO cambies
    if (preferKey) {
        const keep = list.find((x) => x._key === preferKey);
        if (keep) return buildCard(keep, t);
    }

    // ✅ 2) Si no, elige de forma determinista (sin depender solo del timestamp)
    const pick = [...list].sort((a, b) => {
        const tb = new Date(b.timestamp).getTime();
        const ta = new Date(a.timestamp).getTime();
        if (tb !== ta) return tb - ta;

        // tie-breakers fijos (para que sea siempre igual aunque timestamps empaten)
        const macA = Number(a.mac);
        const macB = Number(b.mac);
        if (!Number.isNaN(macA) && !Number.isNaN(macB) && macA !== macB) return macA - macB;

        if ((a.alarmRef ?? 0) !== (b.alarmRef ?? 0)) return (a.alarmRef ?? 0) - (b.alarmRef ?? 0);
        return (a.locationId ?? 0) - (b.locationId ?? 0);
    })[0];

    return buildCard(pick, t);
}

function buildCard(a: any, t: any): TopAlarmCardData {
    const fechaObj = new Date(a.timestamp);

    const nombreEquipo = deviceName(a.mac);
    const textoAlarma = resolverTextoAlarma(a.mac, a.alarmRef, a.alarmText, t);

    const ubicacion = [a.farm, a.building].filter((v: string) => v?.trim()).join(" - ");

    return {
        key: a._key, // ✅ guardamos la key
        mac: a.mac,
        titulo: "Alarma Portal",
        nombreEquipo,
        ubicacion,
        detalle: textoAlarma,
        fecha: fechaObj.toLocaleDateString("es-ES"),
        hora: fechaObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        timestamp: a.timestamp,
    };
}