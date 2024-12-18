module.exports = function (api) {
    api.cache(true);
    return {
        presets: ["babel-preset-expo"], // Reemplaza el preset anterior
        plugins: ["nativewind/babel"], // Si tienes plugins adicionales, déjalos aquí
    };
};

