// // translations.ts
// const translations = {
//     es: {

//         AlarmsScreen: {
//             errorLoadingAlarms: "No se pudieron cargar las alarmas disparadas",
//             noAlarms: "No hay Alarmas disparadas"
//         },
//         deviceList: {
//             loadingDevices: "Cargando dispositivos...",
//             serverDisconnected: "Servidor desconectado. Por favor, inténtalo más tarde.",
//             noLocationsAvailable: "No hay ubicaciones disponibles",
//             alarmActive: "🚨 Alarma activa",
//             acceptAndStopAlarm: "Aceptar y detener alarma",
//             errorTitle: "Error",
//             deviceLoadError: "No se pudieron cargar los dispositivos."
//         },
//         DeviceDetailsScreen: {
//             alarmTriggered: "Alarma Activada",
//             alarmsEnabled: "Alarmas Activadas",
//             alarmsDisabled: "Alarmas Desarmadas",
//             successTitle: "Éxito",
//             alarmsActivated: "Las alarmas han sido activadas.",
//             alarmsDeactivated: "Las alarmas han sido desactivadas.",
//             changeStatusError: "No se pudo cambiar el estado de las alarmas.",
//             errorTitle: "Error",
//             errorLoadingAlarms: "No se pudieron cargar las alarmas.",
//             errorChangeAlarmState: "No se pudo cambiar el estado de la alarma.",
//             loadingAlarms: "Cargando alarmas...",
//             tc5Disconnected: "TC5 Desconectado",
//             noEnabledAlarms: "No hay alarmas habilitadas",
//             armed: "Armada",
//             disarmed: "Desarmada"
//         },
//         DrawerContent: {
//             logout: "Cerrar sesión",
//             login: "Iniciar Sesión",
//             settings: "Ajustes",
//             maintenance: "Mantenimiento"
//         },
//         EditarPrioridadScreen: {
//             errorTitle: "Error",
//             invalidPhone: "Introduce un número de teléfono válido.",
//             successTitle: "Éxito",
//             saved: "Información guardada correctamente",
//             sendError: "No se pudo enviar la información",
//             title: "Prioridad",
//             label: "Número de teléfono:",
//             placeholder: "123456789",
//             save: "Guardar",
//             selectCountry: "Selecciona país",
//             cancel: "Cancelar"
//         },
//         BottonMaster: {
//             label: "Master"
//         },
//         CustomMaps: {
//             saveTitle: "Guardar Ubicación",
//             saveMessage: "¿Desea guardar la ubicación actual?",
//             cancel: "Cancelar",
//             save: "Guardar"
//         },
//         Menu3Puntos: {
//             "save": "Guardar Ubicación",
//             "delete": "Eliminar Ubicación",
//             "explotacion": "Ir Explotación",
//             "configuracion": "Configuración TC5"
//         },
//         PhoneNumberDialog: {
//             title: "Introduzca su número de teléfono",
//             subtitle: "Para que la app de TC5 sepa cuál es su número.",
//             placeholder: "Ej: 612345678",
//             cancel: "Cancelar",
//             save: "Guardar",
//             invalid: "Número inválido. Debe tener 9 dígitos."
//         },
//         HomeScreen: {
//             cti: "CTI",
//             control: "Control"
//         },
//         CustomHeader: {
//             home: "Inicio"
//         },
//         MantenimientoScreen: {
//             apiTitle: "Servidor API",
//             apiPlaceholder: "http://192.168.1.1:8032/api",
//             saveButton: "Guardar URL",
//             saveSuccessTitle: "Guardado",
//             saveSuccessMessage: "La URL del servidor ha sido actualizada.",
//             saveErrorTitle: "Error",
//             saveErrorMessage: "No se pudo guardar la URL.",
//             fcmTitle: "Token FCM del dispositivo",
//             fcmButton: "Obtener Token FCM",
//             fcmCopiedTitle: "Token copiado",
//             fcmCopiedMessage: "FCM token copiado al portapapeles:\n\n{{token}}",
//             fcmErrorTitle: "Error",
//             fcmErrorMessage: "No se pudo obtener el token."
//         },
//         SettingsScreen: {
//             notificaciones_desactivar_titulo: "Desactivar notificaciones",
//             notificaciones_desactivar_mensaje: "¿Deseas desactivar las notificaciones de la aplicación?",
//             notificaciones_activar_titulo: "Activar notificaciones",
//             notificaciones_activar_mensaje: "¿Deseas recibir notificaciones de alarmas y actualizaciones?",
//             notificaciones_cancelar: "Cancelar",
//             notificaciones_desactivar: "Desactivar",
//             notificaciones_no: "No",
//             notificaciones_si: "Yes",
//             ubicacion_desactivar: "Desactivar ubicación",
//             ubicacion_permisos_desactivar: "¿Deseas desactivar los permisos de ubicación?",
//             titulo_permisos: "Permisos",
//             ubicacion_label: "Permisos de Ubicación",
//             titulo_notificaciones: "Notificaciones",
//             titulo_nivelPrioridad: "Nivel de Prioridad",
//             telefono_presente: "Tel: {{numero}}",
//             telefono_ausente: "Sin número asignado"
//         },
//         login: {
//             titulo: "Ingresar",
//             subtitulo: "Por favor ingrese para continuar",
//             correo: "Correo electrónico",
//             contrasena: "Contraseña",
//             boton: "Ingresar",
//             error_datos: "Correo electrónico o contraseña incorrectos",
//             error_general: "Error",
//             error_mensaje: "Algo salió mal"
//         },
//         useNotificationPermission: {
//             alerta_titulo: "Notificaciones",
//             alerta_mensaje: "Habilite las notificaciones para recibir las alarmas TC5",
//             alerta_boton: "Aceptar",
//             error_permisos: "Error al manejar permisos de notificaciones",
//             error_verificacion: "Error al verificar estado de permisos"
//         },
//         locations: {
//             alerta_titulo: "Permiso de ubicación necesario",
//             ualerta_mensaje: "Para continuar debe de habilitar el permiso de ubicación en los ajustes de la app",
//             alerta_abrirAjustes: "Abrir ajustes",
//             alerta_cancelar: "Cancelar"
//         },
//         DeviceMaps: {
//             errorTitle: "Error",
//             error_mensaje: "No se pudo obtener tu ubicación.",
//             titulo_guardar: "Guardar Ubicación",
//             mensaje_guardar: "¿Desea guardar la ubicación actual?",
//             cancelar: "Cancelar",
//             guardar: "Guardar",
//             error_title: "Error",
//             error_obtener: "No se pudo obtener tu ubicación.",
//             ubicacion_guardada_titulo: "Ubicación Guardada",
//             ubicacion_guardada_mensaje: "La ubicación del dispositivo ha sido guardada correctamente.",
//             ubicacion_no_guardada: "No se pudo guardar la ubicación del dispositivo.",
//             permiso_necesario_titulo: "Permisos necesarios",
//             permiso_necesario_mensaje: "Necesitas habilitar los permisos de ubicación para usar esta función",
//             permiso_boton_ir: "Ir a Configuración",
//             permiso_boton_cancelar: "Cancelar",
//             loading_verificando: "Verificando permisos...",
//             loading_cargando_: "Cargando ubicación..."
//         },
//         MapsScreen: {
//             permission_title: "Permisos necesarios",
//             permission_message: "Habilite la geolocalización para posicionar su TC5 en el mapa",
//             permission_deniedTitle: "Permisos denegados",
//             permission_deniedMessage: "Debe permitir los permisos de ubicación para mostrar el mapa.",
//             permission_accept: "Aceptar",
//             errorTitle: "Error",
//             errorMessage: "Ocurrió un error al verificar los permisos de ubicación."
//         }

//     },

//     en: {
//         AlarmasScreen: {
//             errorLoadingAlarms: "Failed to load triggered alarms",
//             noAlarms: "No triggered alarms"
//         },
//         deviceList: {
//             loadingDevices: "Loading devices...",
//             serverDisconnected: "Server disconnected. Please try again later.",
//             noLocationsAvailable: "No locations available",
//             alarmActive: "🚨 Alarm active",
//             acceptAndStopAlarm: "Accept and stop alarm",
//             errorTitle: "Error",
//             deviceLoadError: "Could not load devices."
//         },
//         DeviceDetailsScreen: {
//             alarmTriggered: "Alarm triggered",
//             alarmsEnabled: "Alarms enabled",
//             alarmsDisabled: "Alarms disabled",
//             successTitle: "Success",
//             alarmsActivated: "Alarms have been activated.",
//             alarmsDeactivated: "Alarms have been deactivated.",
//             changeStatusError: "Failed to change alarm status.",
//             tc5Disconnected: "TC5 Disconnected",
//             errorTitle: "Error",
//             errorLoadingAlarms: "Failed to load alarms.",
//             errorChangeAlarmState: "Failed to change alarm state.",
//             loadingAlarms: "Loading alarms...",
//             noEnabledAlarms: "No enabled alarms",
//             armed: "Armed",
//             disarmed: "Disarmed"
//         },
//         DrawerContent: {
//             logout: "Logout",
//             login: "Login",
//             settings: "Settings",
//             maintenance: "Maintenance"
//         },
//         EditarPrioridadScreen: {
//             errorTitle: "Error",
//             invalidPhone: "Enter a valid phone number.",
//             successTitle: "Success",
//             saved: "Information saved successfully",
//             sendError: "Could not send the information",
//             title: "Priority",
//             label: "Phone number:",
//             placeholder: "123456789",
//             save: "Save",
//             selectCountry: "Select country",
//             cancel: "Cancel"
//         },
//         BottonMaster: {
//             label: "Master"
//         },
//         CustomMaps: {
//             aveTitle: "Save Location",
//             saveMessage: "Do you want to save the current location?",
//             cancel: "Cancel",
//             save: "Save"
//         },
//         Menu3Puntos: {
//             save: "Save Location",
//             delete: "Delete Location",
//             explotacion: "Go to Farm",
//             configuracion: "TC5 Settings"
//         },
//         PhoneNumberDialog: {
//             title: "Enter your phone number",
//             subtitle: "So the TC5 app knows your number.",
//             placeholder: "e.g. 612345678",
//             cancel: "Cancel",
//             save: "Save",
//             invalid: "Invalid number. It must be 9 digits."
//         },
//         HomeScreen: {
//             cti: "CTI",
//             control: "Control"
//         },
//         CustomHeader: {
//             home: "Home"
//         },
//         MantenimientoScreen: {
//             apiTitle: "API Server",
//             apiPlaceholder: "http://192.168.1.1:8032/api",
//             saveButton: "Save URL",
//             saveSuccessTitle: "Saved",
//             saveSuccessMessage: "Server URL has been updated.",
//             saveErrorTitle: "Error",
//             saveErrorMessage: "Could not save the URL.",
//             fcmTitle: "Device FCM Token",
//             fcmButton: "Get FCM Token",
//             fcmCopiedTitle: "Token copied",
//             fcmCopiedMessage: "FCM token copied to clipboard:\n\n{{token}}",
//             fcmErrorTitle: "Error",
//             fcmErrorMessage: "Could not get the token."
//         },
//         SettingsScreen: {
//             notificaciones_desactivar_titulo: "Disable notifications",
//             notificaciones_desactivar_mensaje: "Do you want to disable app notifications?",
//             notificaciones_activar_titulo: "Enable notifications",
//             notificaciones_activar_mensaje: "Do you want to receive alarm and update notifications?",
//             notificaciones_cancelar: "Cancel",
//             notificaciones_desactivar: "Disable",
//             notificaciones_no: "No",
//             notificaciones_si: "Si",
//             ubicacion_desactivar: "Disable location",
//             ubicacion_permisos_desactivar: "Do you want to disable location permissions?",
//             titulo_permisos: "Permissions",
//             ubicacion_label: "Location Permissions",
//             titulo_notificaciones: "Notifications",
//             titulo_nivelPrioridad: "Priority Level",
//             telefono_presente: "Phone: {{numero}}",
//             telefono_ausente: "No phone number assigned"
//         },
//         login: {
//             titulo: "Sign In",
//             subtitulo: "Please sign in to continue",
//             correo: "Email",
//             contrasena: "Password",
//             boton: "Sign In",
//             error_datos: "Incorrect email or password",
//             error_general: "Error",
//             error_mensaje: "Something went wrong"
//         },
//         useNotificationPermission: {
//             alerta_titulo: "Notifications",
//             alerta_mensaje: "Enable notifications to receive TC5 alarms",
//             alerta_boton: "Allow",
//             error_permisos: "Error handling notification permissions",
//             error_verificacion: "Error checking permission status"
//         },
//         locations: {
//             alerta_titulo: "Location permission required",
//             alerta_mensaje: "To continue, enable the location permission in the app settings",
//             alerta_brirAjustes: "Open settings",
//             alerta_cancelar: "Cancel"
//         },
//         DeviceMaps: {
//             errorTitle: "Error",
//             error_mensaje: "Could not retrieve your location.",
//             titulo_guardar: "Save Location",
//             mensaje_guardar: "Do you want to save the current location?",
//             cancelar: "Cancel",
//             guardar: "Save",
//             error_title: "Error",
//             error_obtener: "Could not retrieve your location.",
//             ubicacion_guardada_titulo: "Location Saved",
//             ubicacion_guardada_mensaje: "The device location has been successfully saved.",
//             ubicacion_no_guardada: "Failed to save the device location.",
//             permiso_necesario_titulo: "Permissions Required",
//             permiso_necesario_mensaje: "You need to enable location permissions to use this feature.",
//             permiso_boton_ir: "Go to Settings",
//             permiso_boton_cancelar: "Cancel",
//             loading_verificando: "Verifying permissions...",
//             loading_cargando: "Loading location..."
//         },
//         MapsScreen: {
//             permission_title: "Permissions required",
//             permission_message: "Enable geolocation to place your TC5 on the map",
//             permission_deniedTitle: "Permissions denied",
//             permission_deniedMessage: "You must allow location permissions to display the map.",
//             permission_goToSettings: "Go to Settings",
//             permission_accept: "Accept",
//             errorTitle: "Error",
//             errorMessage: "An error occurred while checking location permissions."
//         }
//     }
// };

// export default translations;
