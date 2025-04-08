import { View, Text, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'

interface Props {
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;

    style?: StyleProp<ViewStyle>

}

const FAB = ({ onPress, style, iconName }: Props) => {

    return (
        <View style={[styles.btn, style]}>
            <TouchableOpacity onPress={onPress}>
                <Ionicons name={iconName} color="white" size={35} />
            </TouchableOpacity>
        </View>
    )
}

export default FAB

const styles = StyleSheet.create({

    btn: {
        zIndex: 99,
        position: 'absolute',
        height: 50,
        width: 50,
        borderRadius: 30,
        backgroundColor: "balck",
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "0.3",
        shadowOffset: {
            width: 4.5,
            height: 0.27,
        },
        elevation: 5,
    }

})