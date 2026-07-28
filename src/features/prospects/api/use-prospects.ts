import useSWR, { useSWRConfig } from "swr";

import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { Contrat, Note, Prospect, ProspectStatut } from "@/types";

export type CreateProspectPayload = Omit<Prospect, "id" | "notes" | "dateCreation" | "statut"> & {
  statut?: ProspectStatut;
};

export function useProspects() {
  const { data, error, mutate, isLoading } = useSWR<Prospect[]>(apiEndpoints.prospects, apiRequest);

  return { prospects: data ?? [], error, mutate, isLoading };
}

export function useProspect(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<Prospect | null>(
    id ? apiEndpoints.prospect(id) : null,
    apiRequest,
  );

  return { prospect: data ?? null, error, mutate, isLoading };
}

export function useProspectActions() {
  const { mutate } = useSWRConfig();

  const refresh = () => mutate(apiEndpoints.prospects);

  return {
    addProspect: async (payload: CreateProspectPayload) => {
      const prospect = await apiRequest<Prospect>(apiEndpoints.prospects, {
        method: "POST",
        body: payload,
      });
      await refresh();
      return prospect;
    },
    updateProspect: async (id: string, patch: Partial<Prospect>) => {
      const prospect = await apiRequest<Prospect>(apiEndpoints.prospect(id), {
        method: "PATCH",
        body: patch,
      });
      await Promise.all([refresh(), mutate(apiEndpoints.prospect(id))]);
      return prospect;
    },
    setProspectStatut: async (id: string, statut: ProspectStatut) => {
      const prospect = await apiRequest<Prospect>(apiEndpoints.prospect(id), {
        method: "PATCH",
        body: { statut },
      });
      await Promise.all([refresh(), mutate(apiEndpoints.prospect(id))]);
      return prospect;
    },
    addNote: async (id: string, texte: string) => {
      const note = await apiRequest<Note>(apiEndpoints.prospectNotes(id), {
        method: "POST",
        body: { texte },
      });
      await Promise.all([refresh(), mutate(apiEndpoints.prospect(id))]);
      return note;
    },
    convertirProspect: async (id: string) => {
      const contrat = await apiRequest<Contrat>(apiEndpoints.prospectConversion(id), {
        method: "POST",
      });
      await Promise.all([
        refresh(),
        mutate(apiEndpoints.prospect(id)),
        mutate(apiEndpoints.contrats),
      ]);
      return contrat.id;
    },
  };
}
