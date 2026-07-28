import type { BesoinType } from "@/types/prospect";

export type ContratType =
  "Installation ponctuelle" | "Contrat de maintenance annuel" | "Abonnement télésurveillance";

export type ContratStatut = "Brouillon" | "Actif" | "En renouvellement" | "Expiré" | "Résilié";

export interface LigneContrat {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
}

export const totalLignes = (lignes: LigneContrat[]) =>
  lignes.reduce((total, ligne) => total + (ligne.quantite || 0) * (ligne.prixUnitaire || 0), 0);

export interface Contrat {
  id: string;
  clientNom: string;
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
