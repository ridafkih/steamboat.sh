import useSWR from "swr";
import { fetchLinkedAccounts, type LinkedAccount } from "@/lib/swr";

export const useLinkedAccounts = () => {
  return useSWR<LinkedAccount[]>("steam.linkedAccounts", fetchLinkedAccounts);
};
