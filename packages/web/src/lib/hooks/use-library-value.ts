import useSWR from "swr";
import { fetchLibraryValue, type LibraryValue } from "@/lib/swr";

export const useLibraryValue = () => {
  return useSWR<LibraryValue>("library.value", fetchLibraryValue);
};
