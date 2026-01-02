import useSWR from "swr";
import { fetchCompareByDiscordId, type CompareResult } from "@/lib/swr";

export const useCompare = (discordId: string) => {
  return useSWR<CompareResult>(
    ["library.compareByDiscordId", discordId],
    () => fetchCompareByDiscordId(discordId),
  );
};
