import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { RootDrawerParamList } from "@/app/HomeStack";
export default function HeaderLeftButton() {
    const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();

    return (
        <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
    );
}
