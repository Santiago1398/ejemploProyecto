import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
} from "react-native";
import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import { t } from "../i18n/i18nConfig";
import { useAppExtra } from "@/hooks/useAppExtra";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
    bg: "#F7F8FA",
    card: "#FFFFFF",
    line: "#E5E7EB",
    text: "#111827",
    textSub: "#6B7280",
    brand: "#15803d",      // forest-700
    brandDark: "#14532d",  // forest-900
    danger: "#ef4444",
    dangerBg: "rgba(239,68,68,0.08)",
};

export default function DrawerContent(props: DrawerContentComponentProps) {
    const { navigation } = props;
    const { username: email, logout, isAuthenticated } = useAuthStore();
    const { devBuildNumber } = useAppExtra();
      const insets = useSafeAreaInsets(); // 👈


    // Cierra sesión inmediatamente (sin confirmación)
    const doLogout = async () => {
        try {
            props.navigation.closeDrawer();
            await new Promise((r) => setTimeout(r, 220));
            await AsyncStorage.removeItem("userToken");
            logout();
        } catch (e) {
            console.error("Error al cerrar sesión:", e);
        }
    };

    const goSettings = async () => {
        props.navigation.closeDrawer();
        await new Promise((r) => setTimeout(r, 280));
        navigation.navigate("Settings" as never);
    };

    const goMaintenance = async () => {
        props.navigation.closeDrawer();
        await new Promise((r) => setTimeout(r, 280));
        navigation.navigate("SolicitarMantenimiento" as never);
    };

    const MenuRow = ({
        icon,
        label,
        onPress,
        danger = false,
    }: {
        icon: keyof typeof Ionicons.glyphMap;
        label: string;
        onPress: () => void;
        danger?: boolean;
    }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                styles.row,
                danger && { backgroundColor: COLORS.dangerBg, borderColor: "transparent" },
            ]}
            {...(Platform.OS === "android"
                ? { android_ripple: { color: danger ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.05)" } }
                : {})}
        >
            <View style={styles.rowLeft}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={danger ? COLORS.danger : COLORS.text}
                    style={{ marginRight: 10 }}
                />
                <Text style={[styles.rowLabel, danger && { color: COLORS.danger, fontWeight: "700" }]}>
                    {label}
                </Text>
            </View>
            {!danger && <Ionicons name="chevron-forward" size={18} color={COLORS.textSub} />}
        </TouchableOpacity>
    );

    return (
    <DrawerContentScrollView
      {...props}
      // 👇 padding respetando notch y home indicator
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: insets.top + 8,       // sube/desciende el header
        paddingBottom: insets.bottom + 12 // separa el footer del borde
      }}
      // evita que el ScrollView añada su propio padding top en iOS
      alwaysBounceVertical={false}
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <Image
          source={require('../assets/images/logo-cti-verde-renombrado.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.product}>TC5</Text>
        <Text style={styles.email} numberOfLines={1}>{email}</Text>
      </View>

      {/* Menú */}
      <View style={styles.menuGroup}>
        <MenuRow icon="settings-outline" label={t('DrawerContent.settings')} onPress={goSettings} />
        <MenuRow icon="construct-outline" label={t('DrawerContent.maintenance')} onPress={goMaintenance} />
        {isAuthenticated
          ? <MenuRow icon="log-out-outline" label={t('DrawerContent.logout')} onPress={doLogout} danger />
          : <MenuRow icon="log-in-outline" label={t('DrawerContent.login')} onPress={() => props.navigation.closeDrawer()} />
        }
      </View>

      {/* Footer pegado abajo pero con safe area */}
      <View style={[styles.footer, { marginTop: 'auto' }]}>
        <View style={styles.divider} />
        <Text style={styles.version}>{t('softwareVersion')}&nbsp;{devBuildNumber}</Text>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        paddingHorizontal: 16,
        paddingTop: 14,
    },

    // Header
    headerCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 16,
        alignItems: "center",
    },
    logo: {
        width: "70%",
        height: 44,
        marginBottom: 8,
    },
    product: {
        fontSize: 26,
        fontWeight: "800",
        color: COLORS.brand,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: COLORS.textSub,
        fontWeight: "600",
    },

    // Menu
    menuGroup: {
        backgroundColor: "transparent",
        borderRadius: 0,
        borderWidth: 0,
        paddingVertical: 0,
        overflow: "visible",
        marginTop: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 4, // sube a 12 si lo prefieres
        paddingVertical: 12,
        backgroundColor: "transparent",
        borderBottomWidth: 1, // línea separadora
        borderColor: COLORS.line,
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
    },
    rowLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: "600",
    },

    // Footer
    footer: {
        marginTop: "auto",
        paddingVertical: 12,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.line,
        marginBottom: 8,
        borderRadius: 1,
    },
    version: {
        fontSize: 12,
        color: COLORS.textSub,
        fontWeight: "700",
    },
});