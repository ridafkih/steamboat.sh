import { createORPCClient } from "@orpc/client";
import type { RouterClient } from "@orpc/server";
import { RPCLink } from "@orpc/client/fetch";
import type { router } from "./routers";

type AppRouter = typeof router;

type CreateClientOptions = {
  baseUrl: string;
  credentials?: "include" | "omit" | "same-origin";
  apiKey?: string;
};

export const createClient = ({ baseUrl, credentials, apiKey }: CreateClientOptions): RouterClient<AppRouter> => {
  const rpcUrl = new URL("/rpc", baseUrl);
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const link = new RPCLink({
    url: rpcUrl.toString(),
    headers,
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        credentials: credentials ?? "include",
      }),
  });

  return createORPCClient(link);
};

export type Client = RouterClient<AppRouter>;
