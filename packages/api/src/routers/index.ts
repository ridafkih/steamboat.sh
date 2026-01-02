import { libraryRouter } from "./library";
import { adminRouter } from "./admin";
import { steamRouter } from "./steam";

export const router = {
  library: libraryRouter,
  admin: adminRouter,
  steam: steamRouter,
};

export type Router = typeof router;
