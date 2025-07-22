// hooks/useSocket.ts - ACTUALIZADO
import { useState, useEffect } from 'react';
import { socketService } from '@/services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDeviceStore } from '@/store/useDeviceStore';

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const { devices } = useDeviceStore(); // Obtener dispositivos del store

    useEffect(() => {
        // Función para obtener y establecer los MACs
        const setupMacs = async () => {
            try {
                // Opción 1: Si tienes los dispositivos en el store
                if (devices.length > 0) {
                    const macs = devices.map(device => String(device.mac));
                    socketService.setMacAddresses(macs);
                }

                // Opción 2: Si prefieres obtenerlos de AsyncStorage directamente
                // const storedDevices = await AsyncStorage.getItem('devices');
                // if (storedDevices) {
                //     const parsedDevices = JSON.parse(storedDevices);
                //     const macs = parsedDevices.map((d: any) => String(d.mac));
                //     socketService.setMacAddresses(macs);
                // }
            } catch (error) {
                console.error('Error al configurar MACs:', error);
            }
        };

        setupMacs();
    }, [devices]); // Se ejecuta cuando cambian los dispositivos

    useEffect(() => {
        // Configurar callbacks
        socketService.setOnConnectionChange(setIsConnected);
        socketService.setOnError(setLastError);

        // Estado inicial
        setIsConnected(socketService.isConnected());

        // Cleanup
        return () => {
            socketService.setOnConnectionChange(() => { });
            socketService.setOnError(() => { });
        };
    }, []);

    // Función para actualizar MACs manualmente si es necesario
    const updateMacs = (macs: string[]) => {
        socketService.setMacAddresses(macs);
        // Si ya está conectado, enviar inmediatamente
        if (socketService.isConnected()) {
            socketService.emit('register_macs', { macs });
        }
    };

    return {
        isConnected,
        lastError,
        emit: socketService.emit.bind(socketService),
        disconnect: socketService.disconnect.bind(socketService),
        connect: socketService.connect.bind(socketService),
        socketId: socketService.getSocketId(),
        updateMacs // Nueva función exportada
    };
};

