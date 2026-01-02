import { createClient } from "@steamboat/api/client";
import { config } from "./config";

export const apiClient = createClient({
  baseUrl: config.API_URL,
  credentials: "include",
});
