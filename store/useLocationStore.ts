//import Layout from "@/app/_layout";
import { getCurrentLocation, watchCurrentPosition } from "@/core/actions/location/location";
import { post } from "@/services/api";
import { LocationSubscription } from "expo-location";
import { LatLng } from "react-native-maps";
import { create } from "zustand";


//
interface LocationState {

    //Ultima ubicacion conocida
    lastKnownLocation: LatLng | null;
    //Lista de ubicaciones del usuario
    userLocationList: LatLng[];
    //Subscription para la ubicacion paea poder cancelarla cuando se desee
    watchSubscriptionID: LocationSubscription | null;

    // lista de ubicaciones guardadas manualmente
    saveLocations: LatLng[];


    getLocation: () => Promise<LatLng>;
    watchLocation: () => void;
    clearWatchLocation: () => void;

    //Funcion para guardar la ubicacion actual del usuario
    saveLocation: () => Promise<void>;




}

export const useLocationStore = create<LocationState>()((set, get) => ({
    lastKnownLocation: null,
    userLocationList: [],
    watchSubscriptionID: null,

    saveLocations: [],

    //Con esta funcion se obtiene la ubicacion actual del usuario y se guarda en el estado de la aplicacion
    getLocation: async () => {
        const location = await getCurrentLocation();
        set({ lastKnownLocation: location });
        return location;
    },

    //Con esta funcion se inicia la suscripcion para obtener la ubicacion actual del usuario
    watchLocation: async () => {
        const oldSubscription = get().watchSubscriptionID;
        if (oldSubscription !== null) {
            // Llama a la función para limpiar la suscripción anterior
            get().clearWatchLocation();
        }
        // Inicia la suscripción
        // Se espera a que se resuelva la promesa que devuelve watchCurrentPosition
        // para obtener la suscripción (la cual incluye el método remove)
        const watchSubscription = await watchCurrentPosition((LatLng) => {

            //console.log(get().userLocationList);
            // Actualiza el estado con la última ubicación conocida y la lista de ubicaciones
            set({
                lastKnownLocation: LatLng,
                userLocationList: [...get().userLocationList, LatLng],
            });
        });
        // Guarda la suscripción en el estado
        set({ watchSubscriptionID: watchSubscription });
    },

    //Funcion para limpiar la suscripcion de la ubicacion
    clearWatchLocation: () => {
        const subscription = get().watchSubscriptionID;
        if (subscription !== null) {
            // Llama al método remove de la suscripción para cancelarla
            subscription.remove();
            // Limpia la suscripción del estado
            set({ watchSubscriptionID: null });
        }
    },


    //con este metodo se guarda la ubicacion actual del usuario
    saveLocation: async () => {
        const current = get().lastKnownLocation;
        if (!current) return;
        set({ saveLocations: [...get().saveLocations, current] });
        try {
            // Se envían todos los datos en el body
            await post("alarmtc/saveLocation?", {
                latitude: current.latitude,
                longitude: current.longitude,

            });
        } catch (error) {

            console.error("Error al guardar la ubicacion", error);
        }
    }


}));

