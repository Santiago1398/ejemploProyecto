import { resultado } from "../intercafe/listapi.interface";


export class ListApi {



  static fromThelistApiDBToMovie = (listApi: resultado) => {

    return {
      id: listApi.id,
      ubicacion: listApi.ubicacion,
      numeroNave: listApi.numeroNave,
      estado: listApi.estado


    }


  }
}