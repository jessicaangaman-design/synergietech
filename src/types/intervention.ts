export type InterventionType =
  "Installation" | "Maintenance préventive" | "Dépannage" | "Contrôle périodique";

export type InterventionStatut = "Planifiée" | "En cours" | "Terminée" | "Annulée";

export interface Intervention {
  id: string;
  contratId?: string;
  clientNom: string;
  type: InterventionType;
  technicien: string;
  dateHeure: string;
  statut: InterventionStatut;
  description: string;
  rapport?: string;
  materielRemplace?: boolean;
}
