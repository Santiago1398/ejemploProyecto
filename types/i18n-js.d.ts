// Le decimos a TypeScript: "voy a definir los tipos para este módulo llamado i18n-js".
declare module "i18n-js" {
    // Definimos una interfaz para las opciones de traducción que pueden incluir un scope y otros parámetros.
    // Esto es útil para manejar traducciones que pueden tener contextos específicos.
    interface ScopeOptions {
        scope: string;
        [key: string]: any;
    }
    // Definimos la función `t` que se usa para traducir textos. Puede recibir un scope y opciones adicionales.
    export function t(scope: string, options?: ScopeOptions): string;
    // Definimos la función `locale` que se usa para obtener o establecer el idioma actual.
    const i18n: {
        t: typeof t;
        locale: string;
        fallbacks: boolean;
        translations: { [locale: string]: any };
    };

    export default i18n;
}