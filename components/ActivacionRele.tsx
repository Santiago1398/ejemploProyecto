// screens/Relays/ActivacionReleScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons'; // si prefieres, deja: 'react-native-vector-icons/Ionicons'
import { get, post } from '@/services/api';
import { useRoute } from '@react-navigation/native';
import { t } from '@/i18n/i18nConfig';


// ===== Tipos de API =====
type ReleInfo = {
    rele: number | string;                 // 1 | 2
    active: boolean | number | string;     // true/false o "1"/"0"
    autoMan: number | string;              // 0=Auto, 1=Manual
    ncNa: number | string;                 // 0=NC, 1=NA
    onOff: number | string;                // 0=OFF, 1=ON
};

// ===== Tipos de VM =====
//type RelayMode = 'AUTO_NC' | 'AUTO_NA' | 'MANUAL';

type RelayVm = {
    id: number;
    name: 'R1' | 'R2';
    conectado: boolean;     // 👈 NUEVO
    activo: boolean;        // active
    mode: 'AUTO_NC' | 'AUTO_NA' | 'MANUAL';
    autoContact: 'NC' | 'NA';
    estado: 0 | 1;          // onOff
};


const PALETTE = {
    primary: '#2563EB',
    primarySoft: '#EFF6FF',
    primaryBorder: '#BFDBFE',

    success: '#16A34A',
    successSoft: '#ECFDF5',

    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    border: '#E5E7EB',

    text: '#0F172A',
    muted: '#6B7280',

    chipBg: '#F3F4F6',
    chipBorder: '#E5E7EB',
} as const;

// ===== Utils =====
const normalize = (payload: any): ReleInfo[] => {
    if (Array.isArray(payload)) return payload as ReleInfo[];
    if (Array.isArray(payload?.reles)) return payload.reles as ReleInfo[];
    if (Array.isArray(payload?.data)) return payload.data as ReleInfo[];
    if (payload && typeof payload === 'object') {
        const arr = Object.values(payload).filter(v => v && typeof v === 'object') as ReleInfo[];
        if (arr.length) return arr;
    }
    return [];
};

// coerción defensiva (APK puede traer strings)
const toNum = (v: any) => {
    if (v === true) return 1;
    if (v === false) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};
const toBool = (v: any) =>
    v === true || v === 'true' || v === 1 || v === '1';
const mapApiToVm = (d: ReleInfo, conectado: boolean): RelayVm => {
    const rele = toNum((d as any).rele);
    const active = toBool((d as any).active);
    const autoMan = toNum((d as any).autoMan);   // 0 auto, 1 manual
    const ncNa = toNum((d as any).ncNa);         // 0 NC, 1 NA
    const onOff = toNum((d as any).onOff);       // 0 OFF, 1 ON

    const autoContact: 'NC' | 'NA' = ncNa === 0 ? 'NC' : 'NA';
    const mode = autoMan === 1 ? 'MANUAL' : (autoContact === 'NC' ? 'AUTO_NC' : 'AUTO_NA');

    return {
        id: rele,
        name: rele === 2 ? 'R2' : 'R1',
        conectado,
        activo: active,
        mode,
        autoContact,
        estado: (onOff ? 1 : 0) as 0 | 1,
    };
};


// —— Toggle simple tipo “píldora” —— //
const Toggle = ({ value, disabled, onToggle, labelLeft, labelRight }: {
    value: boolean;
    disabled?: boolean;
    onToggle?: () => void;
    labelLeft?: string;
    labelRight?: string;
}) => {
    const isOn = value;
    const isEnabled = !disabled;

    return (
        <Pressable
            onPress={disabled ? undefined : onToggle}
            style={[
                styles.toggle,
                isOn ? styles.toggleTrackOn : (isEnabled ? styles.toggleTrackOffEnabled : styles.toggleTrackOffDisabled),
            ]}
        >
            <Text
                style={[
                    styles.toggleText,
                    disabled ? styles.toggleTextDisabled : (isOn ? styles.toggleTextOn : styles.toggleTextOff),
                ]}
            >
                {isOn ? (labelRight ?? 'ON') : (labelLeft ?? 'OFF')}
            </Text>

            <View
                style={[
                    styles.toggleThumb,
                    isOn ? styles.toggleThumbOn : styles.toggleThumbOff,
                    disabled ? styles.toggleThumbDisabled : (isOn ? styles.toggleThumbOnEnabled : styles.toggleThumbOffEnabled),
                ]}
            />
        </Pressable>
    );
};


// —— RelayCard —— //
const RelayCard = ({
    relay,
    busy,
    onSetMode,
    onToggleManual,
}: {
    relay: RelayVm;
    busy?: boolean;
    onSetMode: (m: "AUTO" | "MANUAL") => Promise<void>;
    onToggleManual: () => Promise<void>;
}) => {
    const isManual = relay.mode === "MANUAL";
    const stateText = relay.estado === 1 ? t("ActivacionRele.on") : t("ActivacionRele.off");
    const toggleDisabled = busy || !relay.conectado || !relay.activo || !isManual;
    const cardDisabled = !relay.activo;

    const StatePill = (
        <View
            style={[
                styles.statePill,
                relay.estado === 1 ? styles.statePillOn : styles.statePillOff,
            ]}
        >
            <Ionicons
                name={relay.estado === 1 ? "flash" : "flash-off"}
                size={16}
                color={relay.estado === 1 ? PALETTE.success : PALETTE.muted}
                style={{ marginRight: 6 }}
            />
            <Text
                style={[
                    styles.statePillText,
                    relay.estado === 1 ? styles.statePillTextOn : styles.statePillTextOff,
                ]}
            >
                {stateText}
            </Text>
        </View>
    );

    // ────────────────────────────────────────────────────────────
    // NO CONECTADO
    // ────────────────────────────────────────────────────────────
    if (!relay.conectado) {
        return (
            <View style={[styles.card, cardDisabled && { opacity: 0.6 }]}>
                <View style={[styles.accentBar, { backgroundColor: "#9CA3AF" }]} />

                <View style={styles.header}>
                    {/* IZQUIERDA: R1/R2 + OFF/ON pegadito */}
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>{relay.name}</Text>
                        {StatePill}
                    </View>

                    {/* DERECHA: nota opcional */}
                    {!relay.activo && (
                        <Text style={styles.headerNote}>{t("ActivacionRele.noActivado")}</Text>
                    )}
                </View>


            </View>
        );
    }

    // ────────────────────────────────────────────────────────────
    // CONECTADO (AQUÍ ES DONDE TE FALTABA EL PILL)
    // ────────────────────────────────────────────────────────────
    return (
        <View style={[styles.card, cardDisabled && { opacity: 0.75 }]}>
            <View style={styles.accentBar} />

            <View style={styles.header}>
                {/* IZQUIERDA: R1/R2 + OFF/ON pegadito */}
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>{relay.name}</Text>
                    {StatePill}
                </View>

                {/* DERECHA: nota opcional */}
                {!relay.activo && (
                    <Text style={styles.headerNote}>{t("ActivacionRele.noActivado")}</Text>
                )}
            </View>

            {/* Manual / Automático */}
            <View style={styles.modeRow}>
                {/* Columna Automático + badge debajo */}
                <View style={styles.autoCol}>
                    <Pressable
                        onPress={busy || !relay.activo ? undefined : () => onSetMode("AUTO")}
                        style={[
                            styles.modeSeg,
                            (relay.mode === "AUTO_NC" || relay.mode === "AUTO_NA") && styles.modeSegActive,
                            (busy || !relay.activo) && { opacity: 0.5 },
                        ]}
                    >
                        <Text
                            style={[
                                styles.modeSegText,
                                (relay.mode === "AUTO_NC" || relay.mode === "AUTO_NA") && styles.modeSegTextActive,
                            ]}
                        >
                            {t("ActivacionRele.automatico")}
                        </Text>
                    </Pressable>

                    {/* 👇 DEBAJO del botón Automático */}
                    <View style={styles.autoLine}>
                        <View style={[styles.autoDot, relay.autoContact === "NC" ? styles.dotNC : styles.dotNA]} />
                        <Text style={styles.autoLineText}>
                            {`${t("ActivacionRele.modo")}: ${relay.autoContact}`}
                        </Text>
                    </View>

                </View>

                {/* Manual al lado (sin separarlo a la derecha) */}
                <Pressable
                    onPress={busy || !relay.activo ? undefined : () => onSetMode("MANUAL")}
                    style={[
                        styles.modeSeg,
                        relay.mode === "MANUAL" && styles.modeSegActive,
                        (busy || !relay.activo) && { opacity: 0.5 },
                        styles.manualSegTop,
                    ]}
                >
                    <Text style={[styles.modeSegText, relay.mode === "MANUAL" && styles.modeSegTextActive]}>
                        {t("ActivacionRele.manual")}
                    </Text>
                </Pressable>
            </View>



            {/* Estado relé + Toggle en la MISMA FILA, a la izquierda */}
            <View style={styles.estadoRow}>
                <View style={styles.estadoRight}>
                    <Text style={styles.estadoLabel}>{t("ActivacionRele.estado")}</Text>

                    <Toggle
                        value={relay.estado === 1}
                        onToggle={onToggleManual}
                        disabled={toggleDisabled}
                        labelLeft={t("ActivacionRele.off")}
                        labelRight={t("ActivacionRele.on")}
                    />
                </View>
            </View>






            {busy && (
                <View style={styles.overlay}>
                    <ActivityIndicator />
                </View>
            )}
        </View>
    );
};

// ===== Pantalla =====
export default function ActivacionReleScreen() {
    const route = useRoute<any>();
    const mac = String(route.params?.mac ?? '');

    const [relays, setRelays] = useState<RelayVm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const [errorShown, setErrorShown] = useState(false);
    const userId = String(route.params?.id ?? '');
    const RELAYS_NO_CONECTADO: RelayVm[] = [
        { id: 1, name: 'R1', conectado: false, activo: false, mode: 'AUTO_NC', autoContact: 'NC', estado: 0 },
        { id: 2, name: 'R2', conectado: false, activo: false, mode: 'AUTO_NC', autoContact: 'NC', estado: 0 },
    ];




    const getReleIdx = (r: RelayVm) => r.id; // backend ya manda 1|2

    // GET /alarmtc/reles/:mac
    // helper arriba del fetchReles
    const toNum = (v: any) =>
        typeof v === 'number' ? v : Number(String(v).trim()) || 0;

    const fetchReles = async (silent = false) => {
        const url = `alarmtc/reles/${encodeURIComponent(mac)}`;
        try {
            if (!silent) setIsLoading(true);
            if (!mac) throw new Error(t('ActivacionRele.macInvalida'));


            const data = await get(url);

            const isConnect = data?.isConnect !== false;

            if (!isConnect) {
                setRelays([
                    { id: 1, name: 'R1', conectado: false, activo: false, mode: 'AUTO_NC', autoContact: 'NC', estado: 0 },
                    { id: 2, name: 'R2', conectado: false, activo: false, mode: 'AUTO_NC', autoContact: 'NC', estado: 0 },
                ]);
                setErrorShown(false);
                return;
            }
            const arr = normalize(data);

            if (!arr.length) throw new Error(t('ActivacionRele.sinDatos'));

            const mapped = arr
                .sort((a: any, b: any) => toNum(a.rele) - toNum(b.rele))
                .map((x) => mapApiToVm(x, true));
            setErrorShown(false);

            setRelays(mapped);
        } catch (e: any) {
            console.log('❌ GET FAIL:', url);
            console.log('· message:', e?.message);
            console.log('· raw error object:', e);

            // 👇 Si falla el GET y no hay nada para pintar, pinta "No conectado"
            setRelays(RELAYS_NO_CONECTADO);

            if (!errorShown && !silent) {
                setErrorShown(true);
                // Alert opcional si quieres
                // Alert.alert(t('ActivacionRele.errorTitle'), String(e?.message ?? 'Error'));
            }
        } finally {
            setIsLoading(false);
        }

    };


    useEffect(() => {
        fetchReles(false);
        const i = setInterval(() => fetchReles(true), 7000);
        return () => clearInterval(i);
    }, [mac]);

    // Modo AUTO/MANUAL
    const setMode = async (r: RelayVm, next: 'AUTO' | 'MANUAL') => {
        setSaving(r.id);
        const prev = r.mode;
        try {
            // UI optimista
            setRelays(ls =>
                ls.map(x => x.id === r.id
                    ? { ...x, mode: next === 'AUTO' ? (x.autoContact === 'NC' ? 'AUTO_NC' : 'AUTO_NA') : 'MANUAL' }
                    : x
                )
            );

            const value = next === 'MANUAL' ? 1 : 0;
            const url = `alarmtc/reles/autoMan/${encodeURIComponent(mac)}/${getReleIdx(r)}`;

            console.log('➡️ POST setMode', { url, params: { value } });
            await post(`${url}?value=${value}&userid=${encodeURIComponent(userId)}`, {});
            console.log('✅ POST setMode OK');
        } catch (e: any) {
            console.log('⚠️ autoMan error:', e?.message);
            setRelays(ls => ls.map(x => (x.id === r.id ? { ...x, mode: prev } : x)));
            Alert.alert(t('ActivacionRele.errorTitle'), t('ActivacionRele.cambioModoError'));
        } finally {
            setSaving(null);
        }
    };

    // Toggle manual NC⇄NA
    const toggleManual = async (r: RelayVm) => {
        setSaving(r.id);
        const prev = r.estado;
        const nextVal: 0 | 1 = prev === 1 ? 0 : 1; // OFF(NC) ⇄ ON(NA)
        try {
            // UI optimista
            setRelays(ls => ls.map(x => (x.id === r.id ? { ...x, estado: nextVal } : x)));

            const url = `alarmtc/reles/onoff/${encodeURIComponent(mac)}/${getReleIdx(r)}`;

            console.log('➡️ POST toggleManual', { url, params: { value: nextVal } });
            await post(`${url}?value=${nextVal}&userid=${encodeURIComponent(userId)}`, {});
            console.log('✅ POST toggleManual OK');
        } catch (e: any) {
            console.log('⚠️ setState error:', e?.message);
            setRelays(ls => ls.map(x => (x.id === r.id ? { ...x, estado: prev } : x)));
            Alert.alert(t('ActivacionRele.errorTitle'), t('ActivacionRele.cambioEstadoError'));
        } finally {
            setSaving(null);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {relays.map(r => (
                <RelayCard
                    key={r.id}
                    relay={r}
                    busy={saving === r.id}
                    onSetMode={(m) => setMode(r, m)}
                    onToggleManual={() => toggleManual(r)}
                />
            ))}
        </View>
    );
}

// ===== Estilos =====
const styles = StyleSheet.create({
    screen: { flex: 1, padding: 12, backgroundColor: PALETTE.surfaceAlt, gap: 12 },
    section: { marginTop: 6, marginBottom: 6, color: '#6B7280', fontSize: 12, fontWeight: '700' },
    modeRow: {
        flexDirection: "row",
        alignItems: "flex-start", //  clave (porque Automático ahora es “columna”)
        gap: 12,
        marginTop: 10,
        marginBottom: 8,
    },



    modeSeg: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    modeSegActive: {
        backgroundColor: PALETTE.primary,
        borderColor: PALETTE.primary,
        elevation: 0,
    },


    modeSegText: {
        fontWeight: '800',
        color: '#0F172A',
    },
    modeSegTextActive: {
        color: '#FFFFFF',
    },

    card: {
        backgroundColor: PALETTE.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.border,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    accentBar: {
        height: 3,
        backgroundColor: PALETTE.primary,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginHorizontal: -14,
        marginTop: -14,
        marginBottom: 10,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between", // separa izquierda y derecha
        marginBottom: 14,
    },

    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10, // separación entre R1 y el pill
    },
    title: { fontSize: 18, fontWeight: '800', color: PALETTE.text },

    // estado pill
    statePill: {
        //   alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        marginBottom: 0,
    },
    statePillOn: { backgroundColor: PALETTE.successSoft, borderColor: '#A7F3D0' },
    statePillOff: { backgroundColor: PALETTE.chipBg, borderColor: PALETTE.chipBorder },
    statePillText: { fontWeight: '700', fontSize: 12 },
    statePillTextOn: { color: PALETTE.success },
    statePillTextOff: { color: PALETTE.muted },

    // autoBadge: {
    //     marginLeft: 'auto',
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     gap: 8,
    //     paddingVertical: 8,
    //     paddingHorizontal: 12,
    //     borderRadius: 999,
    //     borderWidth: 1,
    // },
    // autoBadgeEmph: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    // autoBadgeMuted: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
    autoBadgeText: { fontWeight: '800', fontSize: 12 },
    autoBadgeTextEmph: { color: '#1E3A8A' },
    autoBadgeTextMuted: { color: '#6B7280' },

    autoDot: { width: 8, height: 8, borderRadius: 4 },
    dotNC: { backgroundColor: '#3B82F6' },
    dotNA: { backgroundColor: '#8B5CF6' },

    manualRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, justifyContent: "flex-end", // 👈 lo manda a la derecha
    },
    manualHint: { color: PALETTE.muted, fontWeight: '700' },

    toggle: {
        width: 110, height: 42, borderRadius: 9999,
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 6, position: 'relative',
        borderWidth: 1,
    },
    toggleOn: { backgroundColor: PALETTE.primarySoft, borderColor: PALETTE.primaryBorder },
    toggleOff: { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB' },
    toggleThumb: {
        position: 'absolute', top: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    },
    toggleThumbOn: { right: 4 },
    toggleThumbOff: { left: 4 },
    toggleText: { fontWeight: '800', color: PALETTE.text },

    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', borderRadius: 16 },

    autoBadge: {
        marginLeft: "auto",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
    },
    autoBadgeEmph: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
    autoBadgeMuted: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },

    toggleThumbEnabled: {
        backgroundColor: PALETTE.primary, // mismo azul que “Manual”
    },

    // TRACK
    toggleTrackOn: {
        backgroundColor: PALETTE.primarySoft,
        borderColor: PALETTE.primaryBorder,
    },
    toggleTrackOffEnabled: {
        backgroundColor: '#F1F5F9',  // gris “azulado” (más fino que #E5E7EB)
        borderColor: '#CBD5E1',
    },
    toggleTrackOffDisabled: {
        backgroundColor: '#E5E7EB',
        borderColor: '#D1D5DB',
    },

    // TEXTO
    toggleTextOn: { color: PALETTE.primary },
    toggleTextOff: { color: PALETTE.text },
    toggleTextDisabled: { color: '#9CA3AF' },

    // THUMB
    toggleThumbOnEnabled: {
        backgroundColor: PALETTE.primary,   // azul SOLO cuando ON
        borderWidth: 0,
    },
    toggleThumbOffEnabled: {
        backgroundColor: '#FFFFFF',         // OFF pero habilitado: blanco con borde azul
        borderColor: PALETTE.primary,
        borderWidth: 2,
    },
    toggleThumbDisabled: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        borderWidth: 1,
    },

    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        // marginLeft: 'auto',
    },
    headerNote: {
        color: '#6B7280',
        fontWeight: '800',
    },

    sectionRight: {
        alignSelf: 'stretch',   //para que ocupe todo el ancho
        textAlign: 'right',     // y se vaya a la derecha

    },
    estadoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 12,
        // marginTop: 12, 
    },

    estadoLabel: {
        color: "#6B7280",
        fontSize: 12,
        fontWeight: "700",
    },


    // manualRight: {
    //     marginLeft: "auto",
    // },
    autoCol: {
        alignItems: "flex-start",
        gap: 8, // separación entre botón y badge
    },

    autoBadgeBelow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
    },

    manualSegTop: {
        alignSelf: "flex-start",
    },

    autoLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 6,      // separación respecto al botón
        marginLeft: 4,     // opcional para “alinear” visual
    },

    autoLineText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6B7280",  // gris (o cambia a azul si lo quieres resaltado)
    },
    estadoRight: {
        marginLeft: "auto",        // mantiene el toggle donde estaba (a la derecha)
        flexDirection: "row",
        alignItems: "center",
        gap: 12,                   // separación entre texto y toggle (ajústalo a 6-10 si lo quieres más pegado)
    },


});