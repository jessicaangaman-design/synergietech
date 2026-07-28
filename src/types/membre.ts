export type MembreRole = "commercial" | "technicien" | "informaticien";

export interface Membre {
  id: string;
  nom: string;
  role: MembreRole;
  telephone?: string;
  email?: string;
  specialite?: string;
  actif: boolean;
  dateEmbauche?: string;
}
