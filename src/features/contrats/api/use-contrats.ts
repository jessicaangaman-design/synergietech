import useSWR, { useSWRConfig } from "swr";

import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import { extractList, type ListResponse } from "@/lib/api/list-response";
import { Contrat, LigneContrat,CreateContratDto} from "@/features/interface/contrats.type";


export type CreateContratPayload = CreateContratDto;

export function useContrats() {
  const { data, error, mutate, isLoading } = useSWR<ListResponse<Contrat>>(
    apiEndpoints.contrats,
    apiRequest,
  );

  return { contrats: extractList(data), error, mutate, isLoading };
}

export function useContrat(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<Contrat | null>(
    id ? apiEndpoints.contrat(id) : null,
    apiRequest,
  );

  return { contrat: data ?? null, error, mutate, isLoading };
}

export function useContratActions() {
  const { mutate } = useSWRConfig();

  // refresh
  const refresh = (id?: string) =>
    Promise.all([
      mutate(apiEndpoints.contrats),
      id ? mutate(apiEndpoints.contrat(id)) : Promise.resolve(),
    ]);

  return {
    addContrat: async (payload: CreateContratPayload) => {
      const contrat = await apiRequest<Contrat>(apiEndpoints.contrats, {
        method: "POST",
        body: payload,
      });
      await refresh();
      return contrat.id;
    },
    updateContrat: async (id: string, patch: Partial<Contrat>) => {
      const contrat = await apiRequest<Contrat>(apiEndpoints.contrat(id), {
        method: "PUT",
        body: patch,
      });
      await refresh(id);
      return contrat;
    },
    addLigne: async (id: string, designation: string, quantite: number, prixUnitaire: number) => {
      const ligne = await apiRequest<LigneContrat>(apiEndpoints.contratLignes(id), {
        method: "POST",
        body: { designation, quantite, prixUnitaire },
      });
      await refresh(id);
      return ligne;
    },
    updateLigne: async (id: string, ligneId: string, patch: Partial<LigneContrat>) => {
      const ligne = await apiRequest<LigneContrat>(apiEndpoints.contratLigne(id, ligneId), {
        method: "PUT",
        body: patch,
      });
      await refresh(id);
      return ligne;
    },
    removeLigne: async (id: string, ligneId: string) => {
      await apiRequest<void>(apiEndpoints.contratLigne(id, ligneId), { method: "DELETE" });
      await refresh(id);
    },
  };
}
