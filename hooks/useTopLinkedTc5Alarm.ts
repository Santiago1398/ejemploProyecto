import { useEffect, useState } from "react";
import { get } from "@/services/api";
import { LinkedTc5AlarmResponse, TopAlarmCardData } from "@/types/LinkedTc5AlarmInterface";
import { obtenerTopAlarmCardData } from "@/utils/linkedTc5Alarm";

export function useTopLinkedTc5Alarm(mac: string, t: any) {
    const [topAlarmCard, setTopAlarmCard] = useState<TopAlarmCardData | null>(null);
    const [totalLinkedAlarms, setTotalLinkedAlarms] = useState(0);
    const [loadingTopAlarm, setLoadingTopAlarm] = useState(false);

    const fetchTopAlarm = async () => {
        try {
            setLoadingTopAlarm(true);

            const data: LinkedTc5AlarmResponse[] = await get(`alarmtc/linkedtc5alarms/${mac}`);

            if (!Array.isArray(data) || data.length === 0) {
                setTopAlarmCard(null);
                setTotalLinkedAlarms(0);
                return;
            }

            setTotalLinkedAlarms(data.length);
            setTopAlarmCard(obtenerTopAlarmCardData(data, t));
        } catch (error) {
            console.log("❌ Error obteniendo linkedtc5alarms:", error);
            setTopAlarmCard(null);
            setTotalLinkedAlarms(0);
        } finally {
            setLoadingTopAlarm(false);
        }
    };

    useEffect(() => {
        if (!mac) return;
        fetchTopAlarm();
    }, [mac]);

    return {
        topAlarmCard,
        totalLinkedAlarms,
        loadingTopAlarm,
        refetchTopAlarm: fetchTopAlarm,
    };
}