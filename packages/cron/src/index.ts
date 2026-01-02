import { join } from "node:path";
import { createDatabase } from "@steamboat/database";
import { entry } from "@steamboat/entry-point";
import { getAllJobs } from "./utils/get-jobs";
import { injectJobs } from "./utils/inject-jobs";
import { registerJobs } from "./utils/register-jobs";

const jobsDirectory = join(import.meta.dir, "jobs");

entry("cron")
  .env({
    DATABASE_URL: "string.url",
    STEAM_API_KEY: "string",
  })
  .setup(({ env }) => {
    const database = createDatabase(env.DATABASE_URL);
    return { database, env };
  })
  .run(async ({ log, database, env, context }) => {
    const jobs = await getAllJobs(jobsDirectory, { database, env, log });
    const injectedJobs = injectJobs(jobs, log);
    const registeredJobs = registerJobs(injectedJobs, log);

    context.set("jobCount", registeredJobs.length);
    context.set(
      "jobNames",
      jobs.map((job) => job.name),
    );
  });
