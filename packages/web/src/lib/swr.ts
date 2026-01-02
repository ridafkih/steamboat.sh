import { apiClient } from "./api";

export type LinkedAccount = Awaited<
  ReturnType<typeof apiClient.steam.linkedAccounts>
>[number];

export type OwnedGame = Awaited<
  ReturnType<typeof apiClient.library.myGames>
>[number];

export const fetchLinkedAccounts = () => apiClient.steam.linkedAccounts();

export const fetchGames = () => apiClient.library.myGames();

export const fetcher = async (path: string) => {
  switch (path) {
    case "steam.linkedAccounts":
      return fetchLinkedAccounts();
    case "library.myGames":
      return fetchGames();
    default:
      throw new Error(`Unknown API path: ${path}`);
  }
};
