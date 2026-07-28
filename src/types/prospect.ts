export type BesoinType =
  | "vidéosurveillance"
  | "contrôle d'accès"
  | "clôture électrique"
  | "motorisation"
  | "incendie"
  | "alarme"
  | "radio";

export const BESOINS: BesoinType[] = [
  "vidéosurveillance",
  "contrôle d'accès",
  "clôture électrique",
  "motorisation",
  "incendie",
  "alarme",
  "radio",
];

export type ProspectStatut =
  "Nouveau" | "Contacté" | "Devis envoyé" | "Négociation" | "Converti" | "Perdu";

export const PROSPECT_STATUTS: ProspectStatut[] = [
  "Nouveau",
  "Contacté",
  "Devis envoyé",
  "Négociation",
  "Converti",
  "Perdu",
];

export type Source = "recommandation" | "site web" | "appel direct" | "réseaux sociaux";

export interface Note {
  id: string;
  date: string;
  texte: string;
}

export interface Prospect {
  id: string;
  nom: string;
  entreprise?: string;
  telephone: string;
  email: string;
  adresse: string;
  besoin: BesoinType;
  source: Source;
  commercial: string;
  notes: Note[];
  statut: ProspectStatut;
  dateCreation: string;
  derniereRelance?: string;
}
