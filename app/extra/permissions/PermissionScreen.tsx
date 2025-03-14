import React from "react";
import { View, Text, Pressable } from "react-native";
import { usePermissionsStore } from "@/store/usePermissions";
import { ThemedText } from "@/components/ThemedText";
import ThemedPressable from "@/components/ThemedPressable";

export default function PermissionsScreen() {
  const { locationStatus, requestLocationPermission } = usePermissionsStore();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ThemedPressable
        onPress={() => {
          requestLocationPermission();
        }}
      >

        Habilitar ubicación
      </ThemedPressable>
      <ThemedText>Estado actual: {locationStatus}</ThemedText>
    </View>
  );
}
