import { MotifResiliation, StatutContrat, TypeContrat } from "./enum";

export interface Contrat {
  id: string;
  type: TypeContrat;
  statut: StatutContrat;
  motifResiliation: MotifResiliation | null;
  montant: number;
  dateSignature: string | null;
  dureeMois: number | null;
  dateEcheance: string | null;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LigneContrat {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  contratId: string;
}

export interface CreateContratDto {
  type: TypeContrat;
  montant: number;
  clientId: string;
  dateSignature?: string;
  dureeMois?: number;
}

export type UpdateContratDto = Partial<CreateContratDto> & {
  statut?: StatutContrat;
  motifResiliation?: MotifResiliation;
};
