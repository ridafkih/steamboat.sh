import { createClient } from "@steam-eye/api/client";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const apiClient = createClient({
  baseUrl: apiBaseUrl,
  credentials: "include",
});
