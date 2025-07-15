// store/useDeviceStore.ts
import { create } from 'zustand';
import { ResponseAlarmaSite } from '@/infrastructure/intercafe/listapi.interface';

interface DeviceStore {
    devices: ResponseAlarmaSite[];
    loading: boolean;
    error: boolean;
    lastUpdated: Date | null;

    // Actions
    setDevices: (devices: ResponseAlarmaSite[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: boolean) => void;
    updateDevice: (mac: number, updates: Partial<ResponseAlarmaSite>) => void;
    clearDevices: () => void;

    // Computed values
    getDevicesWithValidCoordinates: () => ResponseAlarmaSite[];
    getDeviceCount: () => number;
    getValidCoordinatesCount: () => number;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
    devices: [],
    loading: false,
    error: false,
    lastUpdated: null,

    setDevices: (devices) => {
        console.log('🏪 DeviceStore: Guardando', devices.length, 'dispositivos');
        set({
            devices,
            lastUpdated: new Date(),
            error: false
        });
    },

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    updateDevice: (mac, updates) => {
        const devices = get().devices;
        const updatedDevices = devices.map(device =>
            device.mac === mac ? { ...device, ...updates } : device
        );
        set({ devices: updatedDevices });
    },

    clearDevices: () => set({ devices: [], lastUpdated: null }),

    // Computed values
    getDevicesWithValidCoordinates: () => {
        const devices = get().devices;
        return devices.filter(device =>
            device.latitude !== 0 &&
            device.longitude !== 0 &&
            device.latitude !== null &&
            device.longitude !== null &&
            device.latitude !== undefined &&
            device.longitude !== undefined
        );
    },

    getDeviceCount: () => get().devices.length,

    getValidCoordinatesCount: () => get().getDevicesWithValidCoordinates().length,
}));