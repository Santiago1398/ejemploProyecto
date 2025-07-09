// import * as Localization from 'expo-localization';
// import { I18n } from 'i18n-js';
// import en from './locales/en.json';
// import es from './locales/es.json';

// // Crear instancia de I18n
// const i18n = new I18n({
//     es,
//     en,
// });

// // Obtener el idioma del dispositivo
// const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

// // Configurar el idioma (español por defecto si no está soportado)
// i18n.locale = ['es', 'en'].includes(deviceLanguage) ? deviceLanguage : 'en';
// i18n.fallbacks = true;

// // Función para cambiar idioma dinámicamente
// export const changeLanguage = (language: string) => {
//     if (['es', 'en'].includes(language)) {
//         i18n.locale = language;
//     }
// };

// // Función para obtener el idioma actual
// export const getCurrentLanguage = () => i18n.locale;

// // Función para obtener las traducciones
// export const t = (key: string, options?: any) => i18n.t(key, options);

// console.log(`Idioma configurado: ${i18n.locale}`);
// console.log('Traducciones disponibles:', Object.keys(i18n.translations));

// export default i18n;


// import * as Localization from 'expo-localization';
// import { I18n } from 'i18n-js';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import en from './locales/en.json';
// import es from './locales/es.json';

// // Crear instancia de I18n
// const i18n = new I18n({
//     es,
//     en,
// });

// // Función para inicializar idioma
// const initializeLanguage = async () => {
//     try {
//         // Primero, intentar obtener idioma guardado
//         const savedLanguage = await AsyncStorage.getItem('app_language');

//         if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
//             i18n.locale = savedLanguage;
//             console.log(` Idioma guardado encontrado: ${savedLanguage}`);
//         } else {
//             // Si no hay idioma guardado, usar el del dispositivo
//             const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'es';
//             i18n.locale = ['es', 'en'].includes(deviceLanguage) ? deviceLanguage : 'es';
//             console.log(` Usando idioma del dispositivo: ${i18n.locale}`);
//         }

//         // PARA PRUEBAS: Descomentar para forzar inglés
//         // i18n.locale = 'en';
//         // console.log(' FORZANDO INGLÉS PARA PRUEBAS');

//     } catch (error) {
//         console.error('Error al inicializar idioma:', error);
//         i18n.locale = 'es'; // Fallback
//     }
// };

// // Función para cambiar idioma dinámicamente
// export const changeLanguage = async (language: string) => {
//     if (['es', 'en'].includes(language)) {
//         i18n.locale = language;
//         await AsyncStorage.setItem('app_language', language);
//         console.log(` Idioma cambiado a: ${language}`);

//         // Opcional: Forzar re-render global
//         // Si usas Context o Redux, aquí podrías disparar un evento
//     }
// };

// // Función para obtener el idioma actual
// export const getCurrentLanguage = () => i18n.locale;

// // Función para obtener las traducciones
// export const t = (key: string, options?: any) => i18n.t(key, options);

// // Inicializar idioma
// initializeLanguage().then(() => {
//     console.log(`Idioma configurado: ${i18n.locale}`);
//     console.log('Traducciones disponibles:', Object.keys(i18n.translations));
// });

// i18n.fallbacks = true;

// export default i18n;

import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import es from './locales/es.json';
import it from './locales/it.json';
import fr from './locales/fr.json';
import catala from './locales/catala.json';
import ruso from './locales/ruso.json';
import uk from './locales/uk.json';
import polaco from './locales/polaco.json';
import coreano from './locales/coreano.json';
import taiwan from './locales/taiwan.json';




console.log('🔍 DEBUG: Cargando traducciones...');
console.log('ES translations:', es);
console.log('EN translations:', en);

// Usar require para evitar problemas de importación
const i18n = require('i18n-js');

// Configurar traducciones
i18n.translations = {
    es,
    en,
    it,
    fr,
    catala,
    ruso,
    uk,
    polaco,
    coreano,
    taiwan
};

i18n.fallbacks = true;

const SUPPORTED_LANGUAGES = [
    "es",
    "en",
    "it",
    "fr",
    "catala",
    "ruso",
    "uk",
    "polaco",
    "coreano",
    "taiwan"
]

// console.log('🔍 DEBUG: i18n configurado');
// console.log('i18n.translations:', i18n.translations);

// Función para inicializar idioma
const initializeLanguage = async () => {
    try {
        // Primero, intentar obtener idioma guardado
        const savedLanguage = await AsyncStorage.getItem('app_language');

        if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
            i18n.locale = savedLanguage;
            // console.log(`📱 Idioma guardado encontrado: ${savedLanguage}`);
        } else {
            // Si no hay idioma guardado, usar el del dispositivo
            const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
            const languageMap: { [key: string]: string } = {
                'es': 'es',
                'en': 'en',
                'it': 'it',
                'fr': 'fr',
                'ca': 'catala',
                'ru': 'ruso',
                'uk': 'uk',
                'pl': 'polaco',
                'ko': 'coreano',
                'zh': 'taiwan'
            };
            i18n.locale = languageMap[deviceLanguage] || 'en';
            //console.log(`🌍 Usando idioma del dispositivo: ${i18n.locale}`);
        }

        // console.log('🔍 DEBUG: Idioma final configurado:', i18n.locale);
        // console.log('🔍 DEBUG: Traducciones para idioma actual:', i18n.translations[i18n.locale]);

    } catch (error) {
        console.error('Error al inicializar idioma:', error);
        i18n.locale = 'en'; // Fallback
    }
};

// Función para cambiar idioma dinámicamente
export const changeLanguage = async (language: string) => {
    if (SUPPORTED_LANGUAGES.includes(language)) {
        i18n.locale = language;
        await AsyncStorage.setItem('app_language', language);
        console.log(`🔄 Idioma cambiado a: ${language}`);
    }
};

// Función para obtener el idioma actual
export const getCurrentLanguage = () => i18n.locale;
export const getSupportedLanguajes = () => SUPPORTED_LANGUAGES
// Función auxiliar para traducir con debug
export const t = (key: string, options?: any) => {
    try {
        // console.log(`🔍 DEBUG: Traduciendo "${key}" en idioma "${i18n.locale}"`);
        // console.log('🔍 DEBUG: Traducciones completas:', JSON.stringify(i18n.translations, null, 2));

        // Navegación manual para debug
        const keys = key.split('.');
        let value = i18n.translations[i18n.locale];

        // console.log('🔍 DEBUG: Valor inicial:', JSON.stringify(value, null, 2));
        // console.log('🔍 DEBUG: Claves a buscar:', keys);

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                break;
            }
        }

        if (value === undefined) {
            value = i18n.translations["en"];
            for (const k of keys) {
                value = value?.[k];
                if (value === undefined) break;
            }
        }

        if (typeof value === 'string' && options) {
            // Reemplazar placeholders como {{numero}}
            return value.replace(/\{\{(\w+)\}\}/g, (match, key) => options[key] || match);
        }

        return value || key;
    } catch (error) {
        console.error('🔍 DEBUG: Error en traducción:', error);
        return key; // Fallback: devolver la clave
    }
}


// Inicializar idioma
initializeLanguage();

export default i18n;