import useSWR, { useSWRConfig } from "swr";

import { RoleSTS } from "@/features/interface/enum";
import type { UpdateUserDto, User } from "@/features/interface/user.type";
import { apiRequest } from "@/lib/api/client";
import { apiEndpoints } from "@/lib/api/endpoints";
export type EquipeRole =
  RoleSTS.COMMERCIAL | RoleSTS.TECHNICIEN | RoleSTS.SECRETAIRE | RoleSTS.ADMIN;

export interface CreateMembrePayload {
  name: string;
  password: string;
  role: EquipeRole;
  phone?: string;
  email: string;
  isActive?: boolean;
}

interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useUsers() {
  const { data, error, mutate, isLoading } = useSWR<UsersResponse>(
    apiEndpoints.allUser,
    apiRequest,
  );

  return {
    users: data?.data ?? [],
    pagination: data
      ? {
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        }
      : null,
    error,
    mutate,
    isLoading,
  };
}

export function useUser(id?: string) {
  const { data, error, mutate, isLoading } = useSWR<User | null>(
    id ? apiEndpoints.userId(id) : null,
    apiRequest,
  );

  return { user: data ?? null, error, mutate, isLoading };
}

export function useUserQuery(search: string) {
  const { data, error, mutate, isLoading } = useSWR<User | null>(
    search ? apiEndpoints.userQuery(search) : null,
    apiRequest,
  );

  return { user: data ?? null, error, mutate, isLoading };
}

export function useEquipeActions() {
  const { mutate } = useSWRConfig();

  const refresh = (id?: string) =>
    Promise.all([
      mutate(apiEndpoints.allUser),
      id ? mutate(apiEndpoints.userId(id)) : Promise.resolve(),
      mutate(apiEndpoints.prospects),
      mutate(apiEndpoints.interventions),
    ]);

  return {
    addMembre: async (payload: CreateMembrePayload) => {
      const user = await apiRequest<User>(apiEndpoints.createUser, {
        method: "POST",
        body: payload,
      });
      await refresh();
      return user;
    },
    updateMembre: async (id: string, patch: UpdateUserDto) => {
      const user = await apiRequest<User>(apiEndpoints.updateUser(id), {
        method: "PUT",
        body: patch,
      });
      await refresh(id);
      return user;
    },
    removeMembre: async (id: string) => {
      await apiRequest<void>(apiEndpoints.deleteUser(id), { method: "DELETE" });
      await refresh();
    },
  };
}
