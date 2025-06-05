import { listApi } from "./list-api";


export const nowPlayingAction = async () => {

    try {

        const { data } = await listApi.get("/list-api")

        const list = data.resultado.map(listApi.post)

        console.log(JSON.stringify(data, null, 4));

    } catch (eror) {
        console.log(eror);
        throw "No se pude traer la peticion"
    }

}