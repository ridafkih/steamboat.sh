import { createClient } from "@steamboat/api/client";

export const apiClient = createClient({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
});
