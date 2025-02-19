import axios from "axios";



export const listApi = axios.create({

    baseURL:process.env.Expo_Public_MOVIE_DB_URL,
    params:{
       
        api_key: process.env.Expo_Public_MOVIE_DB_KEY

    },
});

