import { createClient } from "@steamboat/api/client";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error("VITE_API_URL is required");
}

export const apiClient = createClient({
  baseUrl: apiUrl,
  credentials: "include",
});
