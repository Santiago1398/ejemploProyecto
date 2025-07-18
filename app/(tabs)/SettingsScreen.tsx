import React, { useEffect, useState } from "react";
import {
    View, StyleSheet, Text, Switch, Platform, Linking, Alert, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePermissionsStore } from "@/store/usePermissions";
import { PermissionStatus } from "@/infrastructure/intercafe/location";
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { requestLocationPermission } from "@/core/actions/permissions/locations";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/app/HomeStack";
import { getApiUrl } from "@/utils/apiconfig";
import { changeLanguage, getCurrentLanguage, t } from "@/i18n/i18nConfig";

// 🔥 CONFIGURACIÓN DE IDIOMAS DISPONIBLES
const AVAILABLE_LANGUAGES = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'catala', name: 'Català', flag: '🇪🇸' },
    { code: 'ruso', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
    { code: 'polaco', name: 'Polski', flag: '🇵🇱' },
    { code: 'coreano', name: '한국어', flag: '🇰🇷' },
    { code: 'taiwan', name: '繁體中文', flag: '🇹🇼' },
];

export default function SettingsScreen() {
    const { locationStatus, checkLocationPermission } = usePermissionsStore();
    const [notificationStatus, setNotificationStatus] = useState<boolean>(false);
    const [telefonoGuardado, setTelefonoGuardado] = useState<string | null>(null);
    const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
    const [showLanguageModal, setShowLanguageModal] = useState(false); // 🔥 NUEVO STATE
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();


    const [apiUrl, setApiUrlState] = useState("");

    useEffect(() => {
        const loadApiUrl = async () => {
            const url = await getApiUrl();
            setApiUrlState(url);
        };
        loadApiUrl();
    }, []);

    useEffect(() => {
        const initializePermissions = async () => {
            await checkLocationPermission();
            await checkNotificationStatus();
        };

        initializePermissions();
    }, []);

    useEffect(() => {
        const cargarDatosGuardados = async () => {
            console.log("Cargando datos guardados de AsyncStorageSettingsScreen");
            const telefono = await AsyncStorage.getItem("telefono");
            setTelefonoGuardado(telefono);
        };

        const unsubscribe = navigation.addListener("focus", cargarDatosGuardados);
        return unsubscribe;
    }, [navigation]);

    const checkNotificationStatus = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationStatus(status === 'granted');
    };

    // FUNCIONES DEL SELECTOR DE IDIOMAS
    const getCurrentLanguageInfo = () => {
        return AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage) || AVAILABLE_LANGUAGES[0];
    };

    const handleLanguageSelect = async (languageCode: string) => {
        try {
            await changeLanguage(languageCode);
            setCurrentLanguage(languageCode);
            setShowLanguageModal(false);

            // Mostrar confirmación en el idioma seleccionado
            const confirmationMessages: { [key: string]: { title: string, message: string } } = {
                'es': { title: 'Idioma cambiado', message: 'La aplicación ahora está en español' },
                'en': { title: 'Language Changed', message: 'The application is now in English' },
                'it': { title: 'Lingua cambiata', message: 'L\'applicazione è ora in italiano' },
                'fr': { title: 'Langue changée', message: 'L\'application est maintenant en français' },
                'catala': { title: 'Idioma canviat', message: 'L\'aplicació ara està en català' },
                'ruso': { title: 'Язык изменён', message: 'Приложение теперь на русском языке' },
                'uk': { title: 'Мову змінено', message: 'Додаток тепер українською мовою' },
                'polaco': { title: 'Język zmieniony', message: 'Aplikacja jest teraz w języku polskim' },
                'coreano': { title: '언어 변경됨', message: '앱이 이제 한국어로 표시됩니다' },
                'taiwan': { title: '語言已更改', message: '應用程式現在使用繁體中文' }
            };

            const msg = confirmationMessages[languageCode] || confirmationMessages['en'];
            Alert.alert(msg.title, msg.message);
        } catch (error) {
            console.error('Error cambiando idioma:', error);
        }
    };

    const handleNotificationToggle = async () => {
        if (notificationStatus) {
            Alert.alert(
                t("SettingsScreen.notificaciones.desactivar.titulo"),
                t("SettingsScreen.notificaciones.desactivar.mensaje"),
                [
                    {
                        text: t("SettingsScreen.notificaciones.cancelar"),
                        style: "cancel"
                    },
                    {
                        text: t("SettingsScreen.notificaciones.desactivars"),
                        onPress: async () => {
                            Platform.OS === 'ios'
                                ? await Linking.openURL('app-settings:')
                                : await Linking.openSettings();
                        }
                    }
                ]
            );
        } else {
            Alert.alert(
                t("SettingsScreen.notificaciones.activar.titulo"),
                t("SettingsScreen.notificaciones.activar.mensaje"),
                [
                    {
                        text: t("SettingsScreen.notificaciones.no"),
                        style: "cancel"
                    },
                    {
                        text: t("SettingsScreen.notificaciones.si"),
                        onPress: async () => {
                            const token = await registerForPushNotificationsAsync();
                            if (token) {
                                setNotificationStatus(true);
                                await AsyncStorage.setItem('hasAskedForNotifications', 'true');
                            } else {
                                Platform.OS === 'ios'
                                    ? await Linking.openURL('app-settings:')
                                    : await Linking.openSettings();
                            }
                        }
                    }
                ]
            );
        }
    };

    const handleToggle = async () => {
        if (locationStatus === PermissionStatus.GRANTED) {
            Alert.alert(
                t("SettingsScreen.ubicacion.desactivar"),
                t("SettingsScreen.ubicacion.permisos.desactivar"),
                [
                    {
                        text: t("SettingsScreen.notificaciones.cancelar"),
                        style: "cancel"
                    },
                    {
                        text: t("SettingsScreen.ubicacion.desactivar"),
                        onPress: async () => {
                            Platform.OS === 'ios'
                                ? await Linking.openURL('app-settings:')
                                : await Linking.openSettings();
                        }
                    }
                ]
            );
        } else {
            const status = await requestLocationPermission();
            if (status !== PermissionStatus.GRANTED) {
                Platform.OS === 'ios'
                    ? await Linking.openURL('app-settings:')
                    : await Linking.openSettings();
            }
        }
    };

    const currentLangInfo = getCurrentLanguageInfo();

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
                {/* NUEVO: Botón atrás en la primera sección */}

                <View style={styles.section}>
                    <View style={styles.headerWithBack}>
                        <TouchableOpacity
                            style={styles.inlineBackButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Ionicons name="arrow-back" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <Text style={styles.sectionTitle}>{t("SettingsScreen.titulo.permisos")}</Text>
                    </View>



                    {/* Control de Ubicación */}
                    <View style={styles.button}>
                        <View style={styles.buttonText}>
                            <Ionicons name="map-outline" size={24} color="#007AFF" />
                            <Text style={styles.buttonText}>{t("SettingsScreen.ubicacion.label")}</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={locationStatus === PermissionStatus.GRANTED ? "#007AFF" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={handleToggle}
                            value={locationStatus === PermissionStatus.GRANTED}
                        />
                    </View>

                    {/* Control de Notificaciones */}
                    <View style={styles.button}>
                        <View style={styles.buttonText}>
                            <Ionicons name="notifications-outline" size={24} color="#007AFF" />
                            <Text style={styles.buttonText}>{t("SettingsScreen.titulo.notificaciones")}</Text>
                        </View>
                        <Switch
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={notificationStatus ? "#007AFF" : "#f4f3f4"}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={handleNotificationToggle}
                            value={notificationStatus}
                        />
                    </View>
                </View>

                {/*  SECCIÓN DE IDIOMA ACTUALIZADA */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>
                        {t('SettingsScreen.language.title')}
                    </Text>

                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={() => setShowLanguageModal(true)}
                    >
                        <View style={styles.languageButtonContent}>
                            <Ionicons name="language-outline" size={24} color="#007AFF" />
                            <Text style={styles.languageButtonText}>
                                {currentLangInfo.flag} {currentLangInfo.name}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Sección de Nivel de Prioridad */}
                <TouchableOpacity style={[styles.section, { marginTop: 24 }]} onPress={() => navigation.navigate("EditarPrioridadScreen")}>
                    <Text style={styles.sectionTitle}>{t("SettingsScreen.titulo.nivelPrioridad")}</Text>
                    {telefonoGuardado ? (
                        <Text style={{ fontSize: 16 }}>
                            {t("SettingsScreen.telefono.presente")} {telefonoGuardado}
                        </Text>
                    ) : (
                        <Text style={{ fontSize: 16, color: '#999' }}>
                            {t("SettingsScreen.telefono.ausente")}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/*  MODAL DE SELECCIÓN DE IDIOMA */}
            <Modal
                visible={showLanguageModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowLanguageModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                            <Text style={styles.cancelButton}>
                                {t('EditarPrioridadScreen.cancel')}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {t('SettingsScreen.language.title')}
                        </Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <ScrollView style={styles.languageList}>
                        {AVAILABLE_LANGUAGES.map((language) => (
                            <TouchableOpacity
                                key={language.code}
                                style={[
                                    styles.languageOption,
                                    currentLanguage === language.code && styles.selectedLanguageOption
                                ]}
                                onPress={() => handleLanguageSelect(language.code)}
                            >
                                <View style={styles.languageOptionContent}>
                                    <Text style={styles.languageFlag}>{language.flag}</Text>
                                    <Text style={[
                                        styles.languageName,
                                        currentLanguage === language.code && styles.selectedLanguageName
                                    ]}>
                                        {language.name}
                                    </Text>
                                </View>
                                {currentLanguage === language.code && (
                                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginBottom: 8,
    },
    buttonText: {
        marginLeft: 12,
        flexDirection: "row",
        alignItems: "center",
        fontSize: 16,
        gap: 8,
        color: '#333',
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: "space-between",
        padding: 12,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        marginBottom: 8,
    },
    languageButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    languageButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    cancelButton: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSpacer: {
        width: 60,
    },
    languageList: {
        flex: 1,
        paddingTop: 16,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedLanguageOption: {
        backgroundColor: '#f0f8ff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    languageOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    languageFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    languageName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    selectedLanguageName: {
        color: '#007AFF',
        fontWeight: '600',
    },
    headerWithBack: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },

    inlineBackButton: {
        marginRight: 12,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f0f8ff',
    },
});