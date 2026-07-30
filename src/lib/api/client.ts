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

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function getPayloadMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload !== "object" || payload === null) return fallback;

  if ("message" in payload) {
    if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
    if (Array.isArray(payload.message)) {
      const messages = payload.message.filter(
        (message): message is string => typeof message === "string" && message.trim().length > 0,
      );
      if (messages.length) return messages.join(" ");
    }
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  return fallback;
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);

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

  const url = isAbsoluteUrl
    ? path
    : API_URL && !path.startsWith("/api/")
      ? `${API_URL}/${path.replace(/^\/+/, "")}`
      : path;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials ?? "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError("Impossible de joindre le serveur API.", 0, error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  const apiReportedFailure =
    typeof payload === "object" &&
    payload !== null &&
    (("success" in payload && payload.success === false) ||
      ("status" in payload && payload.status === "error"));

  if (!response.ok || apiReportedFailure) {
    const message = getPayloadMessage(payload, `La requête API a échoué (${response.status}).`);

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
