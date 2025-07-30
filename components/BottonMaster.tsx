import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@/i18n/i18nConfig';

interface Props {
    masterAlarmState: boolean;
    onToggleMaster: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    //  swVersion: string;

}

const ButtonMaster: React.FC<Props> = ({
    masterAlarmState,
    onToggleMaster,
    disabled = false,
    isLoading = false,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return '#4B5563';
        return masterAlarmState ? '#007AFF' : '#4B5563';
    };

    return (
        <Pressable
            disabled={disabled || isLoading}
            onPress={onToggleMaster}
            style={({ pressed }) => [
                styles.btn,
                { backgroundColor: getBackgroundColor() },
                (disabled || isLoading) && { opacity: 0.7 },  // reposo
                pressed && !disabled && !isLoading && { opacity: 0.7 }, // pulsado
            ]}
        >
            <Text style={styles.label}>{t('BottonMaster.label')}</Text>
            <MaterialCommunityIcons name="power" size={32} color="#fff" />
        </Pressable>
    );


};

const styles = StyleSheet.create({
    btn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
        elevation: 6,
    },
    label: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 12,
    },
    /** ───────── overlay spinner ───────── */
    overlay: {
        ...StyleSheet.absoluteFillObject,      // ocupa todo el botón
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',   // oscurece un poco
        borderRadius: 30,                      // mismo radio que el botón
    },
});

export default ButtonMaster;
