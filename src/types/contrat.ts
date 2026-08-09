import type { BesoinType } from "@/types/prospect";

export type ContratType =
  "INSTALLATION" | "MAINTENANCE" | "ABONNEMENT";

export type ContratStatut = "BROUILLON" | "ACTIF" | "RENOUVELLEMENT" | "EXPIRE" | "RESILIE";

export interface LigneContrat {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export const totalLignes = (lignes: LigneContrat[]) =>
  lignes.reduce((total, ligne) => total + (ligne.quantite || 0) * (ligne.prixUnitaire || 0), 0);

export interface Contrat {
  id: string;
  
  clientId?: string;
  type: ContratType;
  besoin: BesoinType;
  montant: number;
  dateSignature: string;
  dureeMois: number;
  statut: ContratStatut;
  lignes: LigneContrat[];
  echeance: string;
  
}
