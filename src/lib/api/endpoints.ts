import { api } from "@/features/util/url";

export const apiEndpoints = {
  prospects: `${api}prospects`,
  createProspects: `${api}prospects`,
  prospectId: (id: string) => `${api}prospects/${id}`,
  updateProspect: (id: string) => `${api}prospects/${id}`,
  changeStatutProspect: (id: string) => `${api}prospects/${id}/statut`,
  deleteProspect: (id: string) => `${api}prospects/${id}`,
  prospectNotes: (id: string) => `${api}prospects/${id}/notes`,
  prospectConversion: (id: string) => `${api}prospects/${id}/convertir`,
  contrats: `${api}contrat`,
  contrat: (id: string) => `${api}contrat/${id}`,
  contratLignes: (id: string) => `${api}contrat/${id}/lignes`,
  contratLigne: (id: string, ligneId: string) => `${api}contrat/${id}/lignes/${ligneId}`,
  interventions: `${api}interventions`,
  intervention: (id: string) => `${api}interventions/${id}`,
  addIntervention: `${api}interventions`,
  updateIntervention: (id: string) => `${api}interventions/${id}`,
  endIntervention : (id : string) => `${api}interventions/${id}/end`,
  deleteIntervention: (id: string) => `${api}interventions/delete/${id}`,
  userId: (id: string) => `${api}user/get/${id}`,
  userQuery: (search: string) => `${api}user/findQuery?search=${encodeURIComponent(search)}`,
  allUser: `${api}user/getAll`,
  createUser: `${api}user/create`,
  updateUser: (id: string) => `${api}user/update/${id}`,
  deleteUser: (id: string) => `${api}user/delete/${id}`,
  client :  `${api}client`,
  createClient :  `${api}client`,
  clientId:  (id:string)=>`${api}client/${id}`,
  updateClient: (id:string)=>`${api}client/update/${id}`,
  deleteClient: (id:string)=>`${api}client/delete/${id}`

} as const;
