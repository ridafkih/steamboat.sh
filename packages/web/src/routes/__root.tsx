import { Outlet, createRootRoute } from "@tanstack/react-router";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swr";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <SWRConfig value={{ fetcher }}>
      <Outlet />
    </SWRConfig>
  );
}
