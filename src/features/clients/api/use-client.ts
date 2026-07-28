import useSWR from "swr";

import type { Client } from "@/features/interface/client.type";
import { api } from "@/features/util/url";
import { apiRequest } from "@/lib/api/client";

type ClientListResponse =
  | Client[]
  | {
      clients?: Client[];
      data?: Client[] | { clients?: Client[] };
    };

function extractClients(response?: ClientListResponse): Client[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.clients)) return response.clients;
  if (Array.isArray(response?.data)) return response.data;
  if (response?.data && Array.isArray(response.data.clients)) return response.data.clients;
  return [];
}

export function useClients() {
  const { data, error, mutate, isLoading } = useSWR<ClientListResponse>(
    `${api}client/getAll`,
    apiRequest,
  );

  return {
    clients: extractClients(data),
    error,
    mutate,
    isLoading,
  };
}

export function useClient(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<Client | null>(
    id ? `${api}client/get/${id}` : null,
    apiRequest,
  );

  return {
    client: data ?? null,
    error,
    mutate,
    isLoading,
  };
}
