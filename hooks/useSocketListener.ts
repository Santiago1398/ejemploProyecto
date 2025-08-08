// // hooks/useSocketListener.ts
// import { useEffect, useRef } from 'react';
// import { socketService } from '@/services/socketService';

// interface UseSocketListenerOptions {
//     eventName: string;
//     onEvent: (payload: any) => void;
//     targetMac?: string; // Opcional: filtrar por MAC específica
//     requiresFocus?: boolean; // Opcional: solo ejecutar si la pantalla está en foco
//     isFocused?: boolean; // Estado de foco de la pantalla
// }

// export const useSocketListener = ({
//     eventName,
//     onEvent,
//     targetMac,
//     requiresFocus = false,
//     isFocused = true
// }: UseSocketListenerOptions) => {
//     // Referencias para evitar closures obsoletos
//     const onEventRef = useRef(onEvent);
//     const targetMacRef = useRef(targetMac);
//     const isFocusedRef = useRef(isFocused);

//     // Mantener referencias actualizadas
//     useEffect(() => {
//         onEventRef.current = onEvent;
//         targetMacRef.current = targetMac;
//         isFocusedRef.current = isFocused;
//     });

//     useEffect(() => {
//         const handleEvent = (payload: any) => {
//             // 1. Verificar si requiere foco y la pantalla no está en foco
//             if (requiresFocus && !isFocusedRef.current) {
//                 console.log(`⏸️ Evento ${eventName} ignorado - pantalla no en foco`);
//                 return;
//             }

//             // 2. Extraer MAC del payload
//             const eventMac = typeof payload === 'string' || typeof payload === 'number'
//                 ? String(payload)
//                 : String(
//                     payload?.mac ||
//                     payload?.device?.mac ||
//                     payload?.macAddress ||
//                     ''
//                 );

//             // 3. Si se especifica targetMac, filtrar por ella
//             if (targetMacRef.current && eventMac !== String(targetMacRef.current)) {
//                 console.log(`🔍 Evento ${eventName} para MAC ${eventMac} ignorado - no coincide con ${targetMacRef.current}`);
//                 return;
//             }

//             // 4. Si no hay MAC y se esperaba una, ignorar
//             if (targetMacRef.current && !eventMac) {
//                 console.log(`⚠️ Evento ${eventName} sin MAC, ignorado`);
//                 return;
//             }

//             // 5. Ejecutar callback
//             console.log(`✅ Ejecutando callback para evento ${eventName} con MAC: ${eventMac || 'N/A'}`);
//             onEventRef.current(payload);
//         };

//         // Registrar listener una sola vez
//         socketService.on(eventName, handleEvent);

//         return () => {
//             socketService.off(eventName, handleEvent);
//         };
//     }, [eventName]); // Solo depende del nombre del evento
// };

// // Hook específico para eventos de MAC (más conveniente)
// export const useMacSocketListener = (
//     eventName: string,
//     mac: string,
//     onEvent: () => void,
//     requiresFocus = false,
//     isFocused = true
// ) => {
//     useSocketListener({
//         eventName,
//         targetMac: mac,
//         onEvent: () => onEvent(),
//         requiresFocus,
//         isFocused
//     });
// };

// // Hook para eventos generales (como lista de dispositivos)
// export const useGeneralSocketListener = (
//     eventName: string,
//     onEvent: (payload: any) => void,
//     requiresFocus = false,
//     isFocused = true
// ) => {
//     useSocketListener({
//         eventName,
//         onEvent,
//         requiresFocus,
//         isFocused
//     });
// };