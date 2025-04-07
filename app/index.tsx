import React from "react";
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { View, FlatList } from 'react-native';
import { ThemedText } from "@/components/ThemedText";
import TabsNavigator from "./(tabs)/TabsNavigator";

export function Home() {
    return <TabsNavigator />;
}

const PushApp = () => {
    const { notifications } = usePushNotifications();

    return (
        <View style={{ marginHorizontal: 10, marginTop: 5 }}>
            <ThemedText
                style={{
                    marginTop: 10,
                    fontWeight: 'bold',
                    fontSize: 25,
                }}
            >
                Notificaciones
            </ThemedText>

            <FlatList
                data={notifications}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <View>
                        <ThemedText style={{ fontWeight: 'bold' }}>
                            {item.title}
                        </ThemedText>
                        <ThemedText>
                            {item.data.alarmText || ''}
                        </ThemedText>
                        <ThemedText>
                            {JSON.stringify(item.data, null, 2)}
                        </ThemedText>
                    </View>
                )}
                ItemSeparatorComponent={() => (
                    <View style={{ height: 1, backgroundColor: 'grey', opacity: 0.3 }} />
                )}
            />
        </View>
    );
};

export default Home;
export { PushApp };

