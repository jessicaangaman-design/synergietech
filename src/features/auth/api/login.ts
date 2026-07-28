import { api } from "@/features/util/url";
import { ApiError, apiRequest } from "@/lib/api/client";

export interface LoginPayload {
  email: string;
  password: string;
}

interface LoginData {
  token?: string;
  accessToken?: string;
  access_token?: string;
}

interface LoginResponse extends LoginData {
  success?: boolean;
  status?: string;
  message?: string;
  data?: LoginData;
}

function extractToken(response: LoginResponse): string | null {
  return (
    response.token ??
    response.accessToken ??
    response.access_token ??
    response.data?.token ??
    response.data?.accessToken ??
    response.data?.access_token ??
    null
  );
}

export async function login(payload: LoginPayload): Promise<string> {
  const response = await apiRequest<LoginResponse>(`${api}user/login`, {
    method: "POST",
    body: payload,
  });

  if (response.success === false || response.status === "error") {
    throw new ApiError(response.message || "Identifiants incorrects.", 401, response);
  }

  const token = extractToken(response);
  if (!token) {
    throw new ApiError("Le serveur n'a retourné aucun token d'authentification.", 500, response);
  }

  return token;
}
