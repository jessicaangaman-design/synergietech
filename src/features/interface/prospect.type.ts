import { MotifPerte, SourceProspect, StatutProspect, TypeBesoin } from "./enum";

export interface Prospect {
  id: string;
  nom: string;
  entreprise: string | null;
  telephone: string;
  email: string | null;
  adresse: string;
  typeBesoin: TypeBesoin;
  source: SourceProspect;
  statut: StatutProspect;
  motifPerte: MotifPerte | null;
  notes: string | null;
  dernierRelance: string | null;
  commercialId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProspectDto {
  nom: string;
  entreprise?: string;
  telephone: string;
  email?: string;
  adresse: string;
  typeBesoin: TypeBesoin;
  source?: SourceProspect;
  notes?: string;
  commercialId?: string;
}

export interface UpdateProspectDto extends Partial<CreateProspectDto> {
  statut?: StatutProspect;
  motifPerte?: MotifPerte;
}
