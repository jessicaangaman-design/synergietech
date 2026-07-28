import useSWR, { useSWRConfig } from "swr";

import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { Membre } from "@/types";

export type CreateMembrePayload = Omit<Membre, "id" | "actif"> & {
  actif?: boolean;
};

export function useEquipe() {
  const { data, error, mutate, isLoading } = useSWR<Membre[]>(apiEndpoints.equipe, apiRequest);

  return { equipe: data ?? [], error, mutate, isLoading };
}

export function useMembre(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<Membre | null>(
    id ? apiEndpoints.membre(id) : null,
    apiRequest,
  );

  return { membre: data ?? null, error, mutate, isLoading };
}

export function useEquipeActions() {
  const { mutate } = useSWRConfig();

  const refresh = (id?: string) =>
    Promise.all([
      mutate(apiEndpoints.equipe),
      id ? mutate(apiEndpoints.membre(id)) : Promise.resolve(),
      mutate(apiEndpoints.prospects),
      mutate(apiEndpoints.interventions),
    ]);

  return {
    addMembre: async (payload: CreateMembrePayload) => {
      const membre = await apiRequest<Membre>(apiEndpoints.equipe, {
        method: "POST",
        body: payload,
      });
      await refresh();
      return membre;
    },
    updateMembre: async (id: string, patch: Partial<Membre>) => {
      const membre = await apiRequest<Membre>(apiEndpoints.membre(id), {
        method: "PATCH",
        body: patch,
      });
      await refresh(id);
      return membre;
    },
    removeMembre: async (id: string) => {
      await apiRequest<void>(apiEndpoints.membre(id), { method: "DELETE" });
      await refresh();
    },
  };
}
