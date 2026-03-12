import { useEffect, useRef, useState, useCallback } from "react";
import { get } from "@/services/api";
import { LinkedTc5AlarmResponse, TopAlarmCardData } from "@/types/LinkedTc5AlarmInterface";
import { obtenerTopAlarmCardData } from "@/utils/linkedTc5Alarm";

export function useTopLinkedTc5Alarm(mac: string, t: any) {
    const [topAlarmCard, setTopAlarmCard] = useState<TopAlarmCardData | null>(null);
    const [totalLinkedAlarms, setTotalLinkedAlarms] = useState(0);
    const [loadingTopAlarm, setLoadingTopAlarm] = useState(false);

    // ✅ Para mantener fija la card si sigue existiendo
    const currentKeyRef = useRef<string | null>(null);

    // ✅ Para ignorar respuestas antiguas (solapa intervalos/socket)
    const reqIdRef = useRef(0);

    const fetchTopAlarm = useCallback(async () => {
        if (!mac) return;

        const myReq = ++reqIdRef.current;
        setLoadingTopAlarm(true);

        try {
            const data: LinkedTc5AlarmResponse[] = await get(`alarmtc/linkedtc5alarms/${mac}`);

            // ✅ si llegó tarde (hay otra petición más nueva), ignorar
            if (myReq !== reqIdRef.current) return;

            const list = Array.isArray(data) ? data : [];
            setTotalLinkedAlarms(list.length);

            if (list.length === 0) {
                currentKeyRef.current = null;
                setTopAlarmCard(null);
                return;
            }

            const card = obtenerTopAlarmCardData(list, t, currentKeyRef.current ?? undefined);

            // ✅ guarda la key para “stickiness”
            if (card?.key) currentKeyRef.current = card.key;

            setTopAlarmCard(card);
        } catch (error) {
            if (myReq !== reqIdRef.current) return;

            console.log("❌ Error obteniendo linkedtc5alarms:", error);

            // 🔥 IMPORTANTE: aquí yo NO pondría null para evitar “parpadeos” por fallos puntuales
            // setTopAlarmCard(null);
            // setTotalLinkedAlarms(0);
        } finally {
            if (myReq === reqIdRef.current) setLoadingTopAlarm(false);
        }
    }, [mac, t]);

    useEffect(() => {
        fetchTopAlarm();
    }, [fetchTopAlarm]);

    return {
        topAlarmCard,
        totalLinkedAlarms,
        loadingTopAlarm,
        refetchTopAlarm: fetchTopAlarm,
    };
}