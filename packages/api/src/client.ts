import { createORPCClient } from "@orpc/client";
import type { RouterClient } from "@orpc/server";
import { RPCLink } from "@orpc/client/fetch";
import type { router } from "./routers";

type AppRouter = typeof router;

type CreateClientOptions = {
  baseUrl: string;
  credentials?: "include" | "omit" | "same-origin";
};

export const createClient = ({ baseUrl, credentials }: CreateClientOptions): RouterClient<AppRouter> => {
  const rpcUrl = new URL("/rpc", baseUrl);
  const link = new RPCLink({
    url: rpcUrl.toString(),
    fetch: (input, init) =>
      fetch(input, {
        ...init,
        credentials: credentials ?? "include",
      }),
  });

  return createORPCClient(link);
};

export type Client = RouterClient<AppRouter>;
