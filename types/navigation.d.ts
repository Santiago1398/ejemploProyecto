import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { resultado } from '@/infrastructure/interface/listapi.interface'; // Import `resultado` type

// Define the types for the navigation stack
export type RootStackParamList = {
    DeviceList: undefined; // No parameters for DeviceList
    DeviceDetails: { device: resultado }; // Pass `device` as a parameter
};

// Navigation prop for DeviceList screen
export type DeviceListNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'DeviceList'
>;

// Route prop for DeviceDetails screen
export type DeviceDetailsRouteProp = RouteProp<RootStackParamList, 'DeviceDetails'>;
