import { ResponseAlarmaSite } from "../interface/listapi.interface";

export class ListApi {
  static fromThelistApiDBToMovie = (listApi: ResponseAlarmaSite) => {
    return {
      id: listApi.idSite, // Asegúrate de que `idSite` existe
      ubicacion: listApi.farmName,
      numeroNave: listApi.mac,
      estado: listApi.alarmStatus,
    };
  };
}
