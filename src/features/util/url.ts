const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");

export const api = configuredApiUrl ? `${configuredApiUrl}/` : "/api/";
