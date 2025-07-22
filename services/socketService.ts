import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;

    // 🔥 Callbacks para eventos
    private onAlarmDetectedCallback: ((data: any) => void) | null = null;
    private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;
    private macAddresses: string[] = [];
    private onDeviceUpdateCallback: ((eventName: string, data: any) => void) | null = null;



    constructor() {
        // 🔥 Conectar automáticamente sin validaciones
        this.connect();
    }

    setMacAddresses(macs: string[]) {
        this.macAddresses = macs;
        console.log('🔥 SocketService inicializado con direcciones MAC:', this.macAddresses);

    }

    //  CONECTAR AL SERVIDOR
    async connect() {
        if (this.isConnecting || this.socket?.connected) {
            console.log('🔌 Socket ya está conectado o conectándose');
            return;
        }

        try {
            this.isConnecting = true;

            // URL de tu servidor Socket.IO
            const SOCKET_URL = 'ws://37.187.180.179:8032';

            console.log('🔌 Conectando a Socket.IO...');

            this.socket = io(SOCKET_URL, {
                // 🔥 Sin autenticación - conexión directa
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            this.setupEventListeners();

        } catch (error) {
            console.error('❌ Error al conectar socket:', error);
            this.isConnecting = false;
            this.onErrorCallback?.('Error de conexión');
        }
    }

    // CONFIGURAR LISTENERS
    private setupEventListeners() {
        if (!this.socket) return;

        // 🔍 DEBUG: Ver TODOS los eventos (quitar en producción)
        this.socket.onAny((eventName, ...args) => {
            console.log('🔍 EVENTO RECIBIDO DEL BACKEND:');
            console.log('   - Nombre del evento:', eventName);
            console.log('   - Datos recibidos:', JSON.stringify(args, null, 2));
            console.log('-----------------------------------');

            // 🔥 IMPORTANTE: Llamar al callback genérico para cualquier evento
            // que pueda significar una actualización de dispositivos
            const eventsToWatch = [
                'device_update',
                'device_updated',
                'device_status_change',
                'mac_updated',
                'mac_changed',
                'alarm_detected',
                'alarm_cleared',
                'site_update',
                'device_armed',
                'device_disarmed'
            ];

            if (eventsToWatch.includes(eventName)) {
                this.onDeviceUpdateCallback?.(eventName, args[0]);
            }
        });

        // Tus listeners existentes...
        this.socket.on('connect', () => {
            console.log('✅ Socket conectado:', this.socket?.id);
            this.isConnecting = false;
            this.reconnectAttempts = 0;

            if (this.macAddresses.length) {
                this.emit('register_macs', { macs: this.macAddresses });
                console.log('📤 MACs enviadas automáticamente:', this.macAddresses);
            }

            this.onConnectionChangeCallback?.(true);
        });
        // Error de conexión
        this.socket.on('connect_error', (error) => {
            console.log('❌ Error de conexión socket:', error.message);
            this.isConnecting = false;
            this.handleReconnect();
        });

        // EVENTO: Alarma detectada
        // this.socket.on('alarm_detected', (data) => {
        //     console.log('🚨 Alarma detectada via socket:', data);
        //     this.onAlarmDetectedCallback?.(data);
        // });

        // EVENTO: Estado de dispositivo
        // this.socket.on('device_status_change', (data) => {
        //     console.log('📱 Cambio de estado de dispositivo:', data);
        //     // Manejar cambios de estado de dispositivos
        // });

        // EVENTO: Notificación general
        // this.socket.on('notification', (data) => {
        //     console.log('📢 Notificación recibida:', data);
        //     // Manejar notificaciones generales
        // });

        // 🔥 EVENTOS DE PRUEBA
        this.socket.on('test_message', (data) => {
            console.log('🧪 Mensaje de prueba recibido:', data);
            this.onAlarmDetectedCallback?.(data); // Usar el mismo callback para simplificar
        });

        this.socket.on('server_response', (data) => {
            console.log('💬 Respuesta del servidor:', data);
            this.onAlarmDetectedCallback?.(data);
        });
    }

    //  MANEJO DE RECONEXIÓN
    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts})`);

            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.log('❌ Máximo número de reintentos alcanzado');
            this.onErrorCallback?.('No se pudo conectar al servidor');
        }
    }

    on(event: string, callback: (data: any) => void) {
        if (this.socket) {
            this.socket.on(event, callback);
            console.log(`👂 Escuchando evento: ${event}`);
        }
    }

    // Método para dejar de escuchar
    off(event: string, callback?: (data: any) => void) {
        if (this.socket) {
            this.socket.off(event, callback);
            console.log(`🔇 Dejando de escuchar: ${event}`);
        }
    }


    //  DESCONECTAR
    disconnect() {
        if (this.socket) {
            console.log('🔌 Desconectando socket...');
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnecting = false;
        this.reconnectAttempts = 0;
    }

    //  ENVIAR MENSAJE AL SERVIDOR
    emit(event: string, data?: any) {
        if (this.socket?.connected) {
            console.log('=====================================');
            console.log('📤 ENVIANDO AL BACKEND:');
            console.log('   📌 Evento:', event);
            console.log('   📦 Datos:', JSON.stringify(data, null, 2));
            console.log('   🕐 Hora:', new Date().toLocaleTimeString());
            console.log('=====================================');

            this.socket.emit(event, data);
        } else {
            console.log('⚠️ Socket no conectado, no se puede enviar:', event);
        }
    }


    //  REGISTRAR CALLBACKS
    setOnAlarmDetected(callback: (data: any) => void) {
        this.onAlarmDetectedCallback = callback;
    }

    setOnConnectionChange(callback: (connected: boolean) => void) {
        this.onConnectionChangeCallback = callback;
    }

    setOnError(callback: (error: string) => void) {
        this.onErrorCallback = callback;
    }

    // GETTERS
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}

export const socketService = new SocketService();