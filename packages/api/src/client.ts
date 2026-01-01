import { createORPCClient } from "@orpc/client";
import type { RouterClient } from "@orpc/server";
import { RPCLink } from "@orpc/client/fetch";
import type { router } from "./routers";

type AppRouter = typeof router;

export const createClient = (baseUrl: string): RouterClient<AppRouter> => {
  const link = new RPCLink({
    url: `${baseUrl}/rpc`,
  });

  return createORPCClient(link);
};

export type Client = RouterClient<AppRouter>;
