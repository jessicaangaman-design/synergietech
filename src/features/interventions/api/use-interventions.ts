import useSWR, { useSWRConfig } from "swr";

import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
import type { Intervention } from "@/types";

export type CreateInterventionPayload = Omit<Intervention, "id">;

export function useInterventions() {
  const { data, error, mutate, isLoading } = useSWR<Intervention[]>(
    apiEndpoints.interventions,
    apiRequest,
  );

  return { interventions: data ?? [], error, mutate, isLoading };
}

export function useIntervention(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<Intervention | null>(
    id ? apiEndpoints.intervention(id) : null,
    apiRequest,
  );

  return { intervention: data ?? null, error, mutate, isLoading };
}

export function useInterventionActions() {
  const { mutate } = useSWRConfig();

  const refresh = (id?: string) =>
    Promise.all([
      mutate(apiEndpoints.interventions),
      id ? mutate(apiEndpoints.intervention(id)) : Promise.resolve(),
    ]);

  return {
    addIntervention: async (payload: CreateInterventionPayload) => {
      const intervention = await apiRequest<Intervention>(apiEndpoints.interventions, {
        method: "POST",
        body: payload,
      });
      await refresh();
      return intervention;
    },
    updateIntervention: async (id: string, patch: Partial<Intervention>) => {
      const intervention = await apiRequest<Intervention>(apiEndpoints.intervention(id), {
        method: "PATCH",
        body: patch,
      });
      await refresh(id);
      return intervention;
    },
  };
}
