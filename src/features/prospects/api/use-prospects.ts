import useSWR, { useSWRConfig } from "swr";

import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { extractList, type ListResponse } from "@/lib/api/list-response";
import { SourceProspect, StatutProspect, TypeBesoin } from "@/features/interface/enum";
import type {
  CreateProspectDto,
  Prospect as ApiProspect,
} from "@/features/interface/prospect.type";
import type { BesoinType, Contrat, Note, Prospect, ProspectStatut, Source } from "@/types";

export type CreateProspectPayload = CreateProspectDto;

type ApiProspectWithCommercial = ApiProspect & {
  commercial?: { name?: string | null; email?: string | null } | null;
  commercialNom?: string | null;
};

type ItemResponse<T> = T | { data: T };

const statutToUi: Record<StatutProspect, ProspectStatut> = {
  [StatutProspect.NOUVEAU]: "Nouveau",
  [StatutProspect.CONTACTE]: "Contacté",
  [StatutProspect.DEVIS_ENVOYE]: "Devis envoyé",
  [StatutProspect.NEGOCIATION]: "Négociation",
  [StatutProspect.GAGNE]: "Gagné",
  [StatutProspect.CONVERTI]: "Converti",
  [StatutProspect.PERDU]: "Perdu",
};

const statutToApi: Record<ProspectStatut, StatutProspect> = {
  Nouveau: StatutProspect.NOUVEAU,
  Contacté: StatutProspect.CONTACTE,
  "Devis envoyé": StatutProspect.DEVIS_ENVOYE,
  Négociation: StatutProspect.NEGOCIATION,
  Gagné: StatutProspect.GAGNE,
  Converti: StatutProspect.CONVERTI,
  Perdu: StatutProspect.PERDU,
};

const besoinToUi: Record<TypeBesoin, BesoinType> = {
  [TypeBesoin.VIDEOSURVEILLANCE]: "vidéosurveillance",
  [TypeBesoin.CONTROLE_ACCES]: "contrôle d'accès",
  [TypeBesoin.CLOTURE_ELECTRIQUE]: "clôture électrique",
  [TypeBesoin.MOTORISATION_PORTAIL]: "motorisation",
  [TypeBesoin.INCENDIE]: "incendie",
  [TypeBesoin.ALARME]: "alarme",
  [TypeBesoin.RADIO]: "radio",
};

const sourceToUi: Record<SourceProspect, Source> = {
  [SourceProspect.RECOMMANDATION]: "recommandation",
  [SourceProspect.SITE_WEB]: "site web",
  [SourceProspect.APPEL_DIRECT]: "appel direct",
  [SourceProspect.RESEAUX_SOCIAUX]: "réseaux sociaux",
  [SourceProspect.AUTRE]: "autre",
};

function extractItem<T>(response: ItemResponse<T>): T {
  return "data" in (response as { data?: T }) ? (response as { data: T }).data : (response as T);
}

function normalizeNotes(prospect: ApiProspect): Note[] {
  const notes = prospect.notes as unknown;
  if (Array.isArray(notes)) {
    return notes.flatMap((note, index) => {
      if (typeof note === "string") {
        return [{ id: `${prospect.id}-${index}`, date: prospect.createdAt, texte: note }];
      }
      if (typeof note !== "object" || note === null) return [];

      const item = note as { id?: string; date?: string; createdAt?: string; texte?: string };
      if (!item.texte) return [];
      return [
        {
          id: item.id ?? `${prospect.id}-${index}`,
          date: item.date ?? item.createdAt ?? prospect.createdAt,
          texte: item.texte,
        },
      ];
    });
  }

  return typeof notes === "string" && notes.trim()
    ? [{ id: `${prospect.id}-initial`, date: prospect.createdAt, texte: notes }]
    : [];
}

function toUiProspect(prospect: ApiProspectWithCommercial): Prospect {
  const statut = statutToUi[prospect.statut] ?? "Nouveau";
  const besoin = besoinToUi[prospect.typeBesoin] ?? "vidéosurveillance";
  const source = sourceToUi[prospect.source] ?? "autre";

  return {
    id: prospect.id,
    nom: prospect.nom,
    entreprise: prospect.entreprise ?? undefined,
    telephone: prospect.telephone,
    email: prospect.email ?? "",
    adresse: prospect.adresse,
    besoin,
    source,
    commercial:
      prospect.commercial?.name ??
      prospect.commercial?.email ??
      prospect.commercialNom ??
      prospect.commercialId ??
      "",
    notes: normalizeNotes(prospect),
    statut,
    dateCreation: prospect.createdAt,
    derniereRelance: prospect.dernierRelance ?? undefined,
  };
}

// recuperer tous les prospects
export function useProspects() {
  const { data, error, mutate, isLoading } = useSWR<ListResponse<ApiProspectWithCommercial>>(
    apiEndpoints.prospects,
    apiRequest,
  );
  console.log("Prospect data : ",data)
  return { prospects: extractList(data).map(toUiProspect), error, mutate, isLoading };
}

// recuperer a partir d'un id du prospect
export function useProspect(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<ItemResponse<ApiProspectWithCommercial> | null>(
    id ? apiEndpoints.prospectId(id) : null,
    apiRequest,
  );
console.log("Prospect data : ")
  return {
    prospect: data ? toUiProspect(extractItem(data)) : null,
    error,
    mutate,
    isLoading,
  };
}

export function useProspectActions() {
  const { mutate } = useSWRConfig();

  const refresh = () => mutate(apiEndpoints.prospects);

  return {
    // ajouter un prospect
    addProspect: async (payload: CreateProspectPayload) => {
      const response = await apiRequest<ItemResponse<ApiProspectWithCommercial>>(
        apiEndpoints.createProspects,
        {
          method: "POST",
          body: payload,
        },
      );
      await refresh();
      return toUiProspect(extractItem(response));
    },

    // modifier ou mettre a jour un prospect
    updateProspect: async (id: string, patch: Partial<Prospect>) => {
      const prospect = await apiRequest<Prospect>(apiEndpoints.updateProspect(id), {
        method: "PATCH",
        body: patch,
      });
      await Promise.all([refresh(), mutate(apiEndpoints.prospectId(id))]);
      return prospect;
    },
    // changer le statut d'un prospect
    setProspectStatut: async (id: string, statut: ProspectStatut) => {

      console.log("chenage statut", statut)
      const response = await apiRequest<ItemResponse<ApiProspectWithCommercial>>(
        apiEndpoints.changeStatutProspect(id),
        {
          method: "PUT",
          body: { statut: statutToApi[statut] },
        },
      );
      await Promise.all([refresh(), mutate(apiEndpoints.prospectId(id))]);
      return toUiProspect(extractItem(response));
    },
    addNote: async (id: string, texte: string) => {
      const note = await apiRequest<Note>(apiEndpoints.prospectNotes(id), {
        method: "POST",
        body: { texte },
      });
      await Promise.all([refresh(), mutate(apiEndpoints.prospectId(id))]);
      return note;
    },
    convertirProspect: async (id: string) => {
      const contrat = await apiRequest<Contrat>(apiEndpoints.prospectConversion(id), {
        method: "POST",
      });
      await Promise.all([
        refresh(),
        mutate(apiEndpoints.prospectConversion(id)),
        mutate(apiEndpoints.contrats),
      ]);
      return contrat.id;
    },
  };
}
