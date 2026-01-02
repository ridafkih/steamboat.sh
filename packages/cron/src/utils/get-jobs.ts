import { Glob } from "bun";
import { join } from "node:path";
import type { CronJobDefinition, CronContext } from "../types";

export const getAllJobs = async (
  rootDirectory: string,
  context: CronContext,
): Promise<CronJobDefinition[]> => {
  const globPattern = join(rootDirectory, "**/*.{ts,js}");
  const globScanner = new Glob(globPattern);
  const entrypoints = await Array.fromAsync(globScanner.scan());

  const imports = entrypoints.map(async (entrypoint) => {
    const module = await import(entrypoint);
    const createJob = module.default;
    return createJob(context);
  });

  return Promise.all(imports);
};
