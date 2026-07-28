import { StatutIntervention, TypeIntervention } from "./enum";

export interface Intervention {
  id: string;
  type: TypeIntervention;
  statut: StatutIntervention;
  dateHeurePrevue: string;
  description: string | null;
  rapport: string | null;
  materielRemplace: boolean;
  clientId: string;
  contratId: string | null;
  technicienId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterventionDto {
  type: TypeIntervention;
  dateHeurePrevue: string;
  description?: string;
  clientId: string;
  contratId?: string;
  technicienId?: string;
}

export type UpdateInterventionDto = Partial<CreateInterventionDto> & {
  statut?: StatutIntervention;
  rapport?: string;
  materielRemplace?: boolean;
};
