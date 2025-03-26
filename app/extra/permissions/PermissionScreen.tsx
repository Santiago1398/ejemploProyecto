import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { usePermissionsStore } from "@/store/usePermissions";
import { ThemedText } from "@/components/ThemedText";
import { PermissionStatus } from "@/infrastructure/interface/location";
import { useNavigation } from "@react-navigation/native";
import ThemedPressable from "@/components/ThemedPressable";

export default function PermissionsScreen() {
  const navigation = useNavigation();
  const { locationStatus, requestLocationPermission, checkLocationPermission } = usePermissionsStore();

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (locationStatus === PermissionStatus.GRANTED) {
      navigation.goBack();
    }
  }, [locationStatus]);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Permisos de Ubicación</ThemedText>
      <ThemedText style={styles.description}>
        Para usar esta función, necesitamos acceder a tu ubicación.
      </ThemedText>
      <ThemedPressable
        onPress={requestLocationPermission}
      >
        Habilitar ubicación
      </ThemedPressable>
      <ThemedText style={styles.status}>Estado: {locationStatus}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  status: {
    marginTop: 10,
  },
});