import { join } from "node:path";
import { createClient } from "@steamboat/api/client";
import { entry } from "@steamboat/entry-point";
import { getAllJobs } from "./utils/get-jobs";
import { injectJobs } from "./utils/inject-jobs";
import { registerJobs } from "./utils/register-jobs";

const jobsDirectory = join(import.meta.dir, "jobs");

entry("cron")
  .env({
    API_URL: "string.url",
    API_KEY: "string",
  })
  .setup(({ env }) => {
    const api = createClient({
      baseUrl: env.API_URL,
      credentials: "omit",
      apiKey: env.API_KEY,
    });
    return { api };
  })
  .run(async ({ log, api, context }) => {
    const jobs = await getAllJobs(jobsDirectory, { api, log });
    const injectedJobs = injectJobs(jobs, log);
    const registeredJobs = registerJobs(injectedJobs, log);

    context.set("jobCount", registeredJobs.length);
    context.set(
      "jobNames",
      jobs.map((job) => job.name),
    );
  });
