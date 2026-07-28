const AUTH_TOKEN_KEY = (import.meta.env.VITE_AUTH_TOKEN_KEY as string | undefined) || "token";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getAuthToken(): string | null {
  return getStorage()?.getItem(AUTH_TOKEN_KEY) ?? null;
}

export function setAuthToken(token: string): void {
  getStorage()?.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  getStorage()?.removeItem(AUTH_TOKEN_KEY);
}
