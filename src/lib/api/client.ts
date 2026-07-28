import { getAuthToken } from "@/lib/auth/token-storage";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);

  if (!API_URL && !isAbsoluteUrl) {
    throw new ApiError("VITE_API_URL n'est pas configurée.", 0);
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    const authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    headers.set("Authorization", authorization);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const url = isAbsoluteUrl ? path : `${API_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `La requête API a échoué (${response.status}).`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
