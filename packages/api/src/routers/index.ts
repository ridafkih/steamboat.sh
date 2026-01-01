import { libraryRouter } from "./library";
import { adminRouter } from "./admin";

export const router = {
  library: libraryRouter,
  admin: adminRouter,
};

export type Router = typeof router;
