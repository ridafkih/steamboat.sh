import useSWR from "swr";
import { fetchGames, type OwnedGame } from "@/lib/swr";

export const useGames = () => {
  return useSWR<OwnedGame[]>("library.myGames", fetchGames);
};
