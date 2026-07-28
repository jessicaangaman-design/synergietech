export const apiEndpoints = {
  prospects: "/prospects",
  prospect: (id: string) => `/prospects/${id}`,
  prospectNotes: (id: string) => `/prospects/${id}/notes`,
  prospectConversion: (id: string) => `/prospects/${id}/convert`,
  contrats: "/contrats",
  contrat: (id: string) => `/contrats/${id}`,
  contratLignes: (id: string) => `/contrats/${id}/lignes`,
  contratLigne: (id: string, ligneId: string) => `/contrats/${id}/lignes/${ligneId}`,
  interventions: "/interventions",
  intervention: (id: string) => `/interventions/${id}`,
  equipe: "/equipe",
  membre: (id: string) => `/equipe/${id}`,
} as const;
