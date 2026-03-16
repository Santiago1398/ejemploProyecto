import alarmasEsRaw from "@/utils/switch/translation.json";
import alarmasEnRaw from "@/utils/switch/ingles/translationIngles.json";
import { getCurrentLanguage } from "@/i18n/i18nConfig";

// tus JSON vienen con wrapper "alarmasEquipos"
const alarmasEs: any = (alarmasEsRaw as any).alarmasEquipos ?? alarmasEsRaw;
const alarmasEn: any = (alarmasEnRaw as any).alarmasEquipos ?? alarmasEnRaw;

function getByPath(obj: any, path: string) {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

// ✅ Esta función imita la firma de i18n.t(key)
export function tAlarma(key: string) {
    const lang = getCurrentLanguage();

    // decide qué diccionario usar
    // (puedes ajustar esto como quieras)
    const dict =
        lang === "es" || lang === "catala" ? alarmasEs : alarmasEn;

    // 1) idioma actual
    let value = getByPath(dict, key);

    // 2) fallback a EN
    if (value == null) value = getByPath(alarmasEn, key);

    // 3) fallback a ES
    if (value == null) value = getByPath(alarmasEs, key);

    return typeof value === "string" ? value : key;
}