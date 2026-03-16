import { LinkedTc5AlarmResponse, TopAlarmCardData } from "@/types/LinkedTc5AlarmInterface";
import { deviceName, deviceTraduccionAlarmas } from "./switch/dispositivos";
import traduccionesES from "@/utils/switch/translation.json";
import traduccionesEN from "@/utils/switch/ingles/translationIngles.json";
import { getCurrentLanguage } from "@/i18n/i18nConfig";

/**
 * Lee un valor anidado por ruta tipo "alarmasEquipos.alpha2.texto.10039"
 */
function getByPath(obj: any, path: string) {
    return path.split(".").reduce((acc, k) => acc?.[k], obj);
}

/**
 * ✅ Reglas:
 * - Si el idioma actual es español ("es" o empieza por "es") => usa JSON ES
 * - Cualquier otro idioma => usa JSON EN
 *
 * Importante:
 * - Tus JSON de alarmas tienen el root "alarmasEquipos"
 * - deviceTraduccionAlarmas devuelve keys tipo "alpha2.texto.10039"
 *   así que aquí se lo prefijamos con "alarmasEquipos."
 */
function makeAlarmTranslator() {
    const lang = String(getCurrentLanguage() ?? "").toLowerCase();
    const isSpanish = lang === "es" || lang.startsWith("es");

    const primary = isSpanish ? traduccionesES : traduccionesEN;

    // Si falta en EN, hacemos fallback a ES (mejor que mostrar la key)
    const fallback = traduccionesES;

    return (key: string) => {
        const k = `alarmasEquipos.${key}`;

        const fromPrimary = getByPath(primary, k);
        if (typeof fromPrimary === "string") return fromPrimary;

        const fromFallback = getByPath(fallback, k);
        if (typeof fromFallback === "string") return fromFallback;

        return `__MISSING__:${key}`;
    };
}

export function resolverTextoAlarma(
    mac: string,
    alarmRef: number,
    alarmText: string,
    _t: any, // lo mantenemos por compatibilidad con tu firma, pero aquí no lo necesitamos
    modelName?: string
) {
    const isTc5 =
        String(modelName ?? "").toUpperCase() === "TC5" ||
        String(deviceName(mac) ?? "").toUpperCase() === "TC5";

    // ✅ TC5: siempre usar alarmText (viene ya bien del backend)
    if (isTc5) return alarmText?.trim() || "Alarma TC5";

    // ✅ Resto: traducir por alarmRef usando los JSON externos (ES/EN)
    const tAlarm = makeAlarmTranslator();
    const translated = deviceTraduccionAlarmas(mac, tAlarm, alarmRef);

    if (typeof translated === "string" && translated.startsWith("__MISSING__:")) {
        // si no existe traducción, usa el texto del backend
        return alarmText?.trim() || `Alarma (${alarmRef})`;
    }

    return translated?.trim() || alarmText?.trim() || `Alarma (${alarmRef})`;
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
    const textoAlarma = resolverTextoAlarma(
        a.mac,
        a.alarmRef,
        a.alarmText,
        t,
        a.modelName
    );

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