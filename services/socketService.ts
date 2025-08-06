import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from './socketConfig';
import { useAuthStore } from '@/store/authStore';

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isConnecting = false;
    private hasInitialized = false; // NUEVO: Flag para evitar conexión automática

    // 🔥 Callbacks para eventos
    private onAlarmDetectedCallback: ((data: any) => void) | null = null;
    private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;
    private onErrorCallback: ((error: string) => void) | null = null;
    private macAddresses: string[] = [];
    private onDeviceUpdateCallback: ((eventName: string, data: any) => void) | null = null;
    private static instances = 0;

    constructor() {
        // NO conectar automáticamente - esperar a que se llame initialize()
        console.log('🔧 SocketService constructor - esperando inicialización manual');
    }

    // NUEVO: Método para inicializar cuando el app esté listo
    initialize() {
        if (this.hasInitialized) {
            console.log('⚠️ SocketService ya fue inicializado');
            console.trace("📌 stack initialize");   // 2️⃣ quién lo llamó

            return;
        }

        this.hasInitialized = true;
        console.log('🚀 Inicializando SocketService...');
        this.connect();
    }
    private lastMacs: string[] = [];

    setMacAddresses(macs: string[]) {
        // ⚖️ 1. ¿La lista es idéntica?
        const same =
            macs.length === this.lastMacs.length &&
            macs.every((m, i) => m === this.lastMacs[i]);

        if (same) return;          // ⏩ nada que hacer

        // 2. Guarda copia y (si procede) emite
        this.lastMacs = [...macs];
        this.macAddresses = macs;

        if (this.isConnected()) {
            console.log('➡️  Enviando register_macs:', macs.join(','));

            this.emit('register_macs', { macs });
        }
    }




    //  CONECTAR AL SERVIDOR
    async connect() {
        if (this.isConnecting || this.socket?.connected) {
            console.count("🔂 connect() invocado"); // 3️⃣ cuántas veces se entra
            console.log('🔌 Socket ya está conectado ');
            return;
        }

        try {
            this.isConnecting = true;

            // Obtener la URL correcta basada en el modo actual
            const SOCKET_URL = getSocketUrl();

            console.log('🔍 Verificando modo de desarrollo...');
            const { isDeveloperMode } = useAuthStore.getState();
            console.log(`🔧 isDeveloperMode: ${isDeveloperMode}`);
            console.log(`🔌 Conectando a Socket.IO en: ${SOCKET_URL}`);

            console.log("🚀 CREANDO socket…");

            this.socket = io(SOCKET_URL, {
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

    // RECONECTAR con nueva URL si cambia el modo
    async reconnectWithNewUrl() {
        console.log('🔄 Reconectando con nueva URL...');

        // Desconectar el socket actual
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Conectar con la nueva URL
        await this.connect();
    }



    // CONFIGURAR LISTENERS
    private setupEventListeners() {
        if (!this.socket) return;

        // 🔍 DEBUG: Ver TODOS los eventos
        this.socket.onAny((eventName, ...args) => {
            console.log('🔍 EVENTO RECIBIDO DEL BACKEND 1:');
            console.log('   - Nombre del evento:', eventName);
            console.log('   - Datos recibidos:', JSON.stringify(args, null, 2));
            console.log('-----------------------------------');

            // Eventos que disparan actualización
            const eventsToWatch = [
                'register_macs'
            ];

            if (eventsToWatch.includes(eventName)) {
                this.onDeviceUpdateCallback?.(eventName, args[0]);
            }
        });

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


        this.socket.on('connect_error', (error) => {
            console.log('❌ Error de conexión socket:', error.message);
            this.isConnecting = false;
            this.handleReconnect();
        });

        this.socket.on('test_message', (data) => {
            console.log('🧪 Mensaje de prueba recibido:', data);
            this.onAlarmDetectedCallback?.(data);
        });

        this.socket.on('server_response', (data) => {
            console.log('💬 Respuesta del servidor:', data);
            this.onAlarmDetectedCallback?.(data);
        });

        this.socket.on('disconnect', (reason: string) => {
            console.log(`🔌 Socket desconectado de ${getSocketUrl()} (reason: ${reason})`);
            this.onConnectionChangeCallback?.(false);
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

    off(event: string, callback?: (data: any) => void) {
        if (this.socket) {
            this.socket.off(event, callback);
            console.log(`🔇 Dejando de escuchar: ${event}`);
        }
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 Desconectando socket...');
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnecting = false;
        this.reconnectAttempts = 0;
    }

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

    // REGISTRAR CALLBACKS
    setOnAlarmDetected(callback: (data: any) => void) {
        this.onAlarmDetectedCallback = callback;
    }

    setOnConnectionChange(callback: (connected: boolean) => void) {
        this.onConnectionChangeCallback = callback;
    }

    setOnError(callback: (error: string) => void) {
        this.onErrorCallback = callback;
    }

    setOnDeviceUpdate(callback: (eventName: string, data: any) => void) {
        this.onDeviceUpdateCallback = callback;
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

