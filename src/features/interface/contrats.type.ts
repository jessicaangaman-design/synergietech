import type { Client } from "./client.type";
import {
  MotifResiliation,
  StatutContrat,
  TypeContrat,
} from "./enum";

export interface LigneContrat {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  contratId: string;
}
export interface CreateLigneContratDto {
  designation: string;
  quantite: number;
  prixUnitaire: number;
}

export interface Contrat {
  id: string;

  type: TypeContrat;
  statut: StatutContrat;
  motifResiliation: MotifResiliation | null;

  montant: number;

  dateSignature: string | null;
  dureeMois: number | null;
  dateEcheance: string | null;

  createdAt: string;
  updatedAt: string;

  clientId: string;

  client?: Client;
  lignes?: LigneContrat[];
}

export interface CreateContratDto {
  type: TypeContrat;
  clientId: string;
  montant: number;

  statut?: StatutContrat;


  dateSignature?: string;
  dateEcheance?: string;
  dureeMois?: number;

  lignes?: CreateLigneContratDto[];
}

export interface UpdateContratDto {
  type?: TypeContrat;
  montant?: number;
  clientId?: string;

  dateSignature?: string | null;
  dureeMois?: number | null;

  statut?: StatutContrat;
  motifResiliation?: MotifResiliation | null;
}