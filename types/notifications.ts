export interface Notification {
    title: string;
    data: {
        farmName: string;
        siteName: string;
        alarmText: string;
        type: 'alarm' | string;
    };
    isAlarm?: boolean;
}
