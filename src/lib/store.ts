import { create } from "zustand";

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
  | "Nouveau"
  | "Contacté"
  | "Devis envoyé"
  | "Négociation"
  | "Converti"
  | "Perdu";

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

export type ContratType =
  | "Installation ponctuelle"
  | "Contrat de maintenance annuel"
  | "Abonnement télésurveillance";

export type ContratStatut = "Brouillon" | "Actif" | "En renouvellement" | "Expiré" | "Résilié";

export interface LigneContrat {
  id: string;
  description: string;
  quantite: number;
}

export interface Contrat {
  id: string;
  clientNom: string;
  clientId?: string; // prospect id if converted
  type: ContratType;
  besoin: BesoinType;
  montant: number;
  dateSignature: string;
  dureeMois: number;
  statut: ContratStatut;
  lignes: LigneContrat[];
  echeance: string;
}

export type InterventionType =
  | "Installation"
  | "Maintenance préventive"
  | "Dépannage"
  | "Contrôle périodique";

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

export type MembreRole = "commercial" | "technicien";

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

const SEED_COMMERCIAUX = ["Aya Kouamé", "Serge Diabaté", "Marlène N'Guessan", "Yves Kouassi"];
const SEED_TECHNICIENS = [
  "Ibrahim Traoré",
  "Kouadio Yao",
  "Bakary Ouattara",
  "Franck Bamba",
  "Désiré Koffi",
];

// Backwards-compat exports (initial seed values, used only for seed data)
export const COMMERCIAUX = SEED_COMMERCIAUX;
export const TECHNICIENS = SEED_TECHNICIENS;

function seedEquipe(): Membre[] {
  const specs: Record<string, string> = {
    "Ibrahim Traoré": "Vidéosurveillance & alarmes",
    "Kouadio Yao": "Contrôle d'accès",
    "Bakary Ouattara": "Radios & réseaux",
    "Franck Bamba": "Incendie & télésurveillance",
    "Désiré Koffi": "Clôtures & motorisation",
  };
  return [
    ...SEED_COMMERCIAUX.map<Membre>((nom) => ({
      id: uid(),
      nom,
      role: "commercial",
      email: nom.toLowerCase().replace(/[^a-z]+/g, ".") + "@sts.ci",
      telephone: "+225 07 00 00 00 00",
      actif: true,
    })),
    ...SEED_TECHNICIENS.map<Membre>((nom) => ({
      id: uid(),
      nom,
      role: "technicien",
      specialite: specs[nom],
      email: nom.toLowerCase().replace(/[^a-z]+/g, ".") + "@sts.ci",
      telephone: "+225 05 00 00 00 00",
      actif: true,
    })),
  ];
}

const uid = () => Math.random().toString(36).slice(2, 10);

const daysAgo = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
};
const daysAhead = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
};

function seedProspects(): Prospect[] {
  const data: Omit<Prospect, "id" | "notes">[] = [
    { nom: "Konan Aristide", entreprise: "Boulangerie Konan", telephone: "+225 07 12 34 56 78", email: "a.konan@gmail.com", adresse: "Cocody Riviera 3", besoin: "vidéosurveillance", source: "recommandation", commercial: "Aya Kouamé", statut: "Nouveau", dateCreation: daysAgo(2) },
    { nom: "Adjoua Marie-Ange", entreprise: "Clinique Espérance", telephone: "+225 05 88 22 11 03", email: "contact@clinique-esperance.ci", adresse: "Marcory Zone 4", besoin: "contrôle d'accès", source: "site web", commercial: "Serge Diabaté", statut: "Contacté", dateCreation: daysAgo(6), derniereRelance: daysAgo(2) },
    { nom: "Yao Bernard", entreprise: "SCI Palmiers", telephone: "+225 07 45 67 89 12", email: "byao@sci-palmiers.ci", adresse: "Cocody Angré 8e Tranche", besoin: "motorisation", source: "recommandation", commercial: "Aya Kouamé", statut: "Devis envoyé", dateCreation: daysAgo(10), derniereRelance: daysAgo(4) },
    { nom: "Diallo Hassan", entreprise: "Supermarché Bon Prix", telephone: "+225 01 23 45 67 89", email: "h.diallo@bonprix.ci", adresse: "Yopougon Selmer", besoin: "alarme", source: "appel direct", commercial: "Marlène N'Guessan", statut: "Négociation", dateCreation: daysAgo(15), derniereRelance: daysAgo(1) },
    { nom: "Ouattara Fatim", entreprise: "École Les Lauréats", telephone: "+225 07 55 44 33 22", email: "direction@leslaureats.edu.ci", adresse: "Riviera Bonoumin", besoin: "vidéosurveillance", source: "site web", commercial: "Yves Kouassi", statut: "Devis envoyé", dateCreation: daysAgo(18), derniereRelance: daysAgo(5) },
    { nom: "Kouassi Éric", entreprise: "Résidence Les Rosiers", telephone: "+225 05 11 22 33 44", email: "syndic@rosiers.ci", adresse: "Cocody Deux Plateaux", besoin: "clôture électrique", source: "recommandation", commercial: "Serge Diabaté", statut: "Négociation", dateCreation: daysAgo(20), derniereRelance: daysAgo(3) },
    { nom: "Bamba Ismaël", telephone: "+225 07 99 88 77 66", email: "ismael.bamba@yahoo.fr", adresse: "Angré Château", besoin: "vidéosurveillance", source: "réseaux sociaux", commercial: "Aya Kouamé", statut: "Nouveau", dateCreation: daysAgo(1) },
    { nom: "N'Dri Christelle", entreprise: "Pharmacie Espoir", telephone: "+225 01 55 66 77 88", email: "pharma.espoir@gmail.com", adresse: "Abobo Baoulé", besoin: "alarme", source: "appel direct", commercial: "Marlène N'Guessan", statut: "Contacté", dateCreation: daysAgo(4), derniereRelance: daysAgo(1) },
    { nom: "Sanogo Aboubacar", entreprise: "STE Transbaobab", telephone: "+225 07 33 22 11 00", email: "as@transbaobab.ci", adresse: "Zone Industrielle Vridi", besoin: "radio", source: "site web", commercial: "Yves Kouassi", statut: "Contacté", dateCreation: daysAgo(7), derniereRelance: daysAgo(2) },
    { nom: "Coulibaly Awa", entreprise: "Hôtel Ivoire Star", telephone: "+225 05 44 55 66 77", email: "reception@ivoirestar.ci", adresse: "Plateau", besoin: "incendie", source: "recommandation", commercial: "Serge Diabaté", statut: "Négociation", dateCreation: daysAgo(25), derniereRelance: daysAgo(2) },
    { nom: "Traoré Salif", telephone: "+225 07 66 55 44 33", email: "s.traore@outlook.com", adresse: "Bingerville", besoin: "motorisation", source: "réseaux sociaux", commercial: "Aya Kouamé", statut: "Perdu", dateCreation: daysAgo(35), derniereRelance: daysAgo(20) },
    { nom: "Koffi Emmanuel", entreprise: "Garage Central", telephone: "+225 01 77 88 99 00", email: "garage.central@ci.com", adresse: "Treichville", besoin: "contrôle d'accès", source: "appel direct", commercial: "Marlène N'Guessan", statut: "Nouveau", dateCreation: daysAgo(3) },
    { nom: "Bakayoko Salimata", entreprise: "Villa privée", telephone: "+225 07 22 33 44 55", email: "s.bakayoko@gmail.com", adresse: "Cocody Ambassades", besoin: "vidéosurveillance", source: "recommandation", commercial: "Yves Kouassi", statut: "Devis envoyé", dateCreation: daysAgo(12), derniereRelance: daysAgo(4) },
    { nom: "Cissé Moussa", entreprise: "Cité Bellevue", telephone: "+225 05 99 00 11 22", email: "cite.bellevue@gmail.com", adresse: "Riviera Palmeraie", besoin: "clôture électrique", source: "site web", commercial: "Serge Diabaté", statut: "Contacté", dateCreation: daysAgo(9), derniereRelance: daysAgo(3) },
    { nom: "Kouamé Léa", entreprise: "Cabinet Comptable KL", telephone: "+225 07 88 99 00 11", email: "l.kouame@cabinet-kl.ci", adresse: "II Plateaux Vallon", besoin: "alarme", source: "recommandation", commercial: "Aya Kouamé", statut: "Nouveau", dateCreation: daysAgo(5) },
  ];
  return data.map((p) => ({ ...p, id: uid(), notes: [] }));
}

function seedContrats(): Contrat[] {
  const raw: Omit<Contrat, "id" | "lignes">[] = [
    { clientNom: "Boulangerie Konan", type: "Installation ponctuelle", besoin: "vidéosurveillance", montant: 850000, dateSignature: daysAgo(45), dureeMois: 0, statut: "Actif", echeance: daysAhead(20) },
    { clientNom: "Clinique Espérance", type: "Contrat de maintenance annuel", besoin: "contrôle d'accès", montant: 1200000, dateSignature: daysAgo(340), dureeMois: 12, statut: "En renouvellement", echeance: daysAhead(15) },
    { clientNom: "SCI Palmiers", type: "Installation ponctuelle", besoin: "motorisation", montant: 1750000, dateSignature: daysAgo(30), dureeMois: 0, statut: "Actif", echeance: daysAhead(60) },
    { clientNom: "Hôtel Ivoire Star", type: "Abonnement télésurveillance", besoin: "incendie", montant: 480000, dateSignature: daysAgo(60), dureeMois: 12, statut: "Actif", echeance: daysAhead(300) },
    { clientNom: "Supermarché Bon Prix", type: "Installation ponctuelle", besoin: "alarme", montant: 2200000, dateSignature: daysAgo(75), dureeMois: 0, statut: "Actif", echeance: daysAhead(90) },
    { clientNom: "École Les Lauréats", type: "Contrat de maintenance annuel", besoin: "vidéosurveillance", montant: 950000, dateSignature: daysAgo(370), dureeMois: 12, statut: "Expiré", echeance: daysAgo(5) },
    { clientNom: "Résidence Les Rosiers", type: "Installation ponctuelle", besoin: "clôture électrique", montant: 3000000, dateSignature: daysAgo(15), dureeMois: 0, statut: "Actif", echeance: daysAhead(180) },
    { clientNom: "Pharmacie Espoir", type: "Abonnement télésurveillance", besoin: "alarme", montant: 360000, dateSignature: daysAgo(200), dureeMois: 12, statut: "Actif", echeance: daysAhead(165) },
    { clientNom: "STE Transbaobab", type: "Installation ponctuelle", besoin: "radio", montant: 1500000, dateSignature: daysAgo(50), dureeMois: 0, statut: "Actif", echeance: daysAhead(25) },
    { clientNom: "Cabinet Comptable KL", type: "Brouillon", besoin: "alarme", montant: 550000, dateSignature: daysAgo(2), dureeMois: 0, statut: "Brouillon", echeance: daysAhead(365) } as any,
  ];
  const lignesMap: Record<string, string[]> = {
    "vidéosurveillance": ["4 caméras IP 4MP", "NVR 8 canaux 2To", "Câblage et pose"],
    "contrôle d'accès": ["2 lecteurs biométriques", "Centrale de contrôle", "20 badges RFID"],
    "motorisation": ["Motorisation portail battant", "Télécommandes x4", "Cellule photoélectrique"],
    "alarme": ["Centrale alarme filaire/radio", "6 détecteurs de mouvement", "Sirène extérieure"],
    "incendie": ["Centrale incendie 4 zones", "8 détecteurs de fumée", "Sirène + flash"],
    "clôture électrique": ["Clôture électrique 200m", "Électrificateur 8J", "Panneaux d'avertissement"],
    "radio": ["10 talkies-walkies pro", "Base relais VHF", "Programmation & formation"],
  };
  return raw.map((c) => ({
    ...c,
    id: uid(),
    lignes: (lignesMap[c.besoin] || []).map((d) => ({ id: uid(), description: d, quantite: 1 })),
  }));
}

function seedInterventions(contrats: Contrat[]): Intervention[] {
  const pick = (n: string) => contrats.find((c) => c.clientNom === n);
  const data: Omit<Intervention, "id">[] = [
    { clientNom: "Boulangerie Konan", contratId: pick("Boulangerie Konan")?.id, type: "Installation", technicien: "Ibrahim Traoré", dateHeure: daysAgo(40), statut: "Terminée", description: "Installation du système de vidéosurveillance complet", rapport: "Installation OK, 4 caméras opérationnelles, client formé.", materielRemplace: false },
    { clientNom: "Clinique Espérance", contratId: pick("Clinique Espérance")?.id, type: "Maintenance préventive", technicien: "Kouadio Yao", dateHeure: daysAgo(10), statut: "Terminée", description: "Maintenance trimestrielle des lecteurs biométriques", rapport: "Nettoyage capteurs, mise à jour firmware. RAS.", materielRemplace: false },
    { clientNom: "SCI Palmiers", contratId: pick("SCI Palmiers")?.id, type: "Installation", technicien: "Bakary Ouattara", dateHeure: daysAgo(25), statut: "Terminée", description: "Pose motorisation portail battant 2 vantaux", rapport: "Installation conforme, réglage effectué.", materielRemplace: false },
    { clientNom: "Hôtel Ivoire Star", contratId: pick("Hôtel Ivoire Star")?.id, type: "Contrôle périodique", technicien: "Franck Bamba", dateHeure: daysAhead(2), statut: "Planifiée", description: "Contrôle semestriel centrale incendie" },
    { clientNom: "Résidence Les Rosiers", contratId: pick("Résidence Les Rosiers")?.id, type: "Installation", technicien: "Désiré Koffi", dateHeure: daysAhead(4), statut: "Planifiée", description: "Installation clôture électrique périmétrique 200m" },
    { clientNom: "Supermarché Bon Prix", contratId: pick("Supermarché Bon Prix")?.id, type: "Dépannage", technicien: "Ibrahim Traoré", dateHeure: daysAhead(1), statut: "Planifiée", description: "Sirène déclenche par intermittence, à diagnostiquer" },
    { clientNom: "Pharmacie Espoir", contratId: pick("Pharmacie Espoir")?.id, type: "Maintenance préventive", technicien: "Kouadio Yao", dateHeure: daysAhead(6), statut: "Planifiée", description: "Vérification centrale alarme + batteries" },
    { clientNom: "STE Transbaobab", contratId: pick("STE Transbaobab")?.id, type: "Installation", technicien: "Bakary Ouattara", dateHeure: daysAgo(5), statut: "En cours", description: "Déploiement radios VHF sur flotte camions" },
    { clientNom: "École Les Lauréats", contratId: pick("École Les Lauréats")?.id, type: "Dépannage", technicien: "Franck Bamba", dateHeure: daysAgo(8), statut: "Terminée", description: "Caméra entrée principale HS", rapport: "Caméra remplacée sous garantie, testée OK.", materielRemplace: true },
    { clientNom: "Boulangerie Konan", contratId: pick("Boulangerie Konan")?.id, type: "Contrôle périodique", technicien: "Désiré Koffi", dateHeure: daysAhead(9), statut: "Planifiée", description: "Contrôle 30 jours post-installation" },
    { clientNom: "Cabinet Comptable KL", type: "Installation", technicien: "Ibrahim Traoré", dateHeure: daysAhead(12), statut: "Planifiée", description: "Devis validé, pose alarme prévue" },
    { clientNom: "Hôtel Ivoire Star", contratId: pick("Hôtel Ivoire Star")?.id, type: "Dépannage", technicien: "Kouadio Yao", dateHeure: daysAgo(2), statut: "Annulée", description: "Client a résolu seul, intervention annulée" },
  ];
  return data.map((i) => ({ ...i, id: uid() }));
}

interface StoreState {
  prospects: Prospect[];
  contrats: Contrat[];
  interventions: Intervention[];
  equipe: Membre[];
  addProspect: (p: Omit<Prospect, "id" | "notes" | "dateCreation" | "statut"> & { statut?: ProspectStatut }) => void;
  updateProspect: (id: string, patch: Partial<Prospect>) => void;
  setProspectStatut: (id: string, statut: ProspectStatut) => void;
  addNote: (id: string, texte: string) => void;
  convertirProspect: (id: string) => string; // returns contrat id
  addContrat: (c: Omit<Contrat, "id" | "lignes"> & { lignes?: LigneContrat[] }) => string;
  updateContrat: (id: string, patch: Partial<Contrat>) => void;
  addLigne: (id: string, description: string, quantite: number) => void;
  removeLigne: (id: string, ligneId: string) => void;
  addIntervention: (i: Omit<Intervention, "id">) => void;
  updateIntervention: (id: string, patch: Partial<Intervention>) => void;
  addMembre: (m: Omit<Membre, "id" | "actif"> & { actif?: boolean }) => void;
  updateMembre: (id: string, patch: Partial<Membre>) => void;
  removeMembre: (id: string) => void;
  reset: () => void;
}

const buildInitial = () => {
  const prospects = seedProspects();
  const contrats = seedContrats();
  const interventions = seedInterventions(contrats);
  const equipe = seedEquipe();
  return { prospects, contrats, interventions, equipe };
};

export const useStore = create<StoreState>((set, get) => ({
  ...buildInitial(),
  addProspect: (p) =>
    set((s) => ({
      prospects: [
        {
          ...p,
          id: uid(),
          notes: [],
          dateCreation: new Date().toISOString(),
          statut: p.statut || "Nouveau",
        },
        ...s.prospects,
      ],
    })),
  updateProspect: (id, patch) =>
    set((s) => ({
      prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  setProspectStatut: (id, statut) =>
    set((s) => ({
      prospects: s.prospects.map((p) => (p.id === id ? { ...p, statut } : p)),
    })),
  addNote: (id, texte) =>
    set((s) => ({
      prospects: s.prospects.map((p) =>
        p.id === id
          ? {
              ...p,
              notes: [{ id: uid(), date: new Date().toISOString(), texte }, ...p.notes],
              derniereRelance: new Date().toISOString(),
            }
          : p,
      ),
    })),
  convertirProspect: (id) => {
    const p = get().prospects.find((x) => x.id === id);
    if (!p) return "";
    const cid = uid();
    set((s) => ({
      prospects: s.prospects.map((x) => (x.id === id ? { ...x, statut: "Converti" } : x)),
      contrats: [
        {
          id: cid,
          clientNom: p.entreprise || p.nom,
          clientId: p.id,
          type: "Installation ponctuelle",
          besoin: p.besoin,
          montant: 0,
          dateSignature: new Date().toISOString(),
          dureeMois: 0,
          statut: "Brouillon",
          lignes: [],
          echeance: daysAhead(180),
        },
        ...s.contrats,
      ],
    }));
    return cid;
  },
  addContrat: (c) => {
    const id = uid();
    set((s) => ({ contrats: [{ ...c, id, lignes: c.lignes || [] }, ...s.contrats] }));
    return id;
  },
  updateContrat: (id, patch) =>
    set((s) => ({ contrats: s.contrats.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  addLigne: (id, description, quantite) =>
    set((s) => ({
      contrats: s.contrats.map((c) =>
        c.id === id ? { ...c, lignes: [...c.lignes, { id: uid(), description, quantite }] } : c,
      ),
    })),
  removeLigne: (id, ligneId) =>
    set((s) => ({
      contrats: s.contrats.map((c) =>
        c.id === id ? { ...c, lignes: c.lignes.filter((l) => l.id !== ligneId) } : c,
      ),
    })),
  addIntervention: (i) => set((s) => ({ interventions: [{ ...i, id: uid() }, ...s.interventions] })),
  updateIntervention: (id, patch) =>
    set((s) => ({
      interventions: s.interventions.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })),
  addMembre: (m) =>
    set((s) => ({
      equipe: [{ ...m, id: uid(), actif: m.actif ?? true }, ...s.equipe],
    })),
  updateMembre: (id, patch) =>
    set((s) => {
      const prev = s.equipe.find((x) => x.id === id);
      const next = s.equipe.map((x) => (x.id === id ? { ...x, ...patch } : x));
      // Propager les renommages aux prospects/interventions pour cohérence
      if (prev && patch.nom && patch.nom !== prev.nom) {
        const nouveau = patch.nom;
        return {
          equipe: next,
          prospects: s.prospects.map((p) =>
            p.commercial === prev.nom ? { ...p, commercial: nouveau } : p,
          ),
          interventions: s.interventions.map((i) =>
            i.technicien === prev.nom ? { ...i, technicien: nouveau } : i,
          ),
        };
      }
      return { equipe: next };
    }),
  removeMembre: (id) => set((s) => ({ equipe: s.equipe.filter((x) => x.id !== id) })),
  reset: () => set(buildInitial()),
}));

export const formatFCFA = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const daysUntil = (iso: string) => {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
