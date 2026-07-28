import type { User } from "@/features/interface/user.type";
import { api } from "@/features/util/url";
import { apiRequest } from "@/lib/api/client";
import useSWR from "swr";

//users
export const useUsers = () => {
  const { data, error, mutate, isLoading } = useSWR<User[]>(`${api}user/getAll`, apiRequest);

  return { users: data ?? [], error, mutate, isLoading };
};

export const useUser = (id: string) => {
  const { data, error, mutate, isLoading } = useSWR<User | null>(
    id ? `${api}user/get/${id}` : null,
    apiRequest,
  );

  return { user: data ?? null, error, mutate, isLoading };
};
