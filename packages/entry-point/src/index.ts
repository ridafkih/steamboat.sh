import arkenv, { createEnv, type } from "arkenv";
import { log, type Logger } from "@steamboat/log";

type ArkEnvSchemaDefinition = Parameters<typeof createEnv>[0];

type GetEnvFromSchema<ArkEnvSchema extends ArkEnvSchemaDefinition> = ReturnType<
  typeof type<ArkEnvSchema>
>["inferOut"];

type MaybePromise<T> = T | Promise<T>;

type SetupCallback<ArkEnvSchema extends ArkEnvSchemaDefinition> = (options: {
  env: GetEnvFromSchema<ArkEnvSchema>;
}) => MaybePromise<unknown>;

type RunCallback<
  ArkEnvSchema extends ArkEnvSchemaDefinition,
  Extension extends Record<string, unknown>,
> = (
  options: EntryPointContext<ArkEnvSchema> & Extension,
) => MaybePromise<unknown>;

type EntryPointContext<ArkEnvSchema extends ArkEnvSchemaDefinition> = {
  env: GetEnvFromSchema<ArkEnvSchema>;
  log: Logger;
  context: Map<string, unknown>;
  flags: Set<string>;
};

type EntryPointSetupFunction<
  CallbackSchema extends ArkEnvSchemaDefinition,
  Extension extends Record<string, unknown> = never,
> = (callback: SetupCallback<CallbackSchema>) => {
  run: EntryPointRunFunction<CallbackSchema, Extension>;
};

type EntryPointRunFunction<
  CallbackSchema extends ArkEnvSchemaDefinition,
  SetupFunctionReturn extends Record<string, unknown>,
> = (
  callback: RunCallback<CallbackSchema, SetupFunctionReturn>,
) => Promise<void>;

/**
 * TODO: This ended up a roundabout type assertion, but I've spent too
 * much time getting the type-safety work with `arktype` so I am moving on for now.
 * @param env
 * @returns
 */
const isObjectWithKeysOfType = <T>(env: unknown): env is T => {
  if (!env) return false;
  if (typeof env !== "object") return false;
  if (Object.keys(env).some((key) => typeof key !== "string")) return false;
  return true;
};

const serializeContext = (context: Map<string, unknown>) =>
  Object.fromEntries(context.entries());

const serializeFlags = (flags: Set<string>) => [...flags];

/**
 * A wrapper around long-living service entry-points.
 * Implements the wide events pattern - accumulates context throughout
 * the lifecycle and emits a single canonical log line on completion.
 *
 * @param name Prefer to setting this to the "name" attribute in the package.json file
 * @param timeout The number of milliseconds to wait before timing out, cancelled when `run` completes
 */
export const entry = <const ServiceName extends string>(
  name: ServiceName,
  timeout: number = 5000,
) => {
  const context = new Map<string, unknown>();
  const flags = new Set<string>();
  const startedAt = Date.now();

  const entryLog = log.child({ service: name });

  const emitCanonicalLog = (
    level: "info" | "error" | "fatal",
    message: string,
  ) => {
    const durationMs = Date.now() - startedAt;
    entryLog[level](
      {
        ...serializeContext(context),
        flags: serializeFlags(flags),
        durationMs,
      },
      message,
    );
  };

  const timeoutId = setTimeout(() => {
    flags.add("timed-out");
    context.set("error.type", "EntryPointTimeout");
    context.set(
      "error.message",
      `Entry point did not complete within ${timeout}ms`,
    );
    emitCanonicalLog("fatal", "entry point timed out");
    process.exit(1);
  }, timeout);

  flags.add("started");

  context.set("timeout", timeout);

  return {
    env<const ArkEnvSchema extends ArkEnvSchemaDefinition>(
      schema: ArkEnvSchema,
    ) {
      const run: EntryPointRunFunction<
        ArkEnvSchema,
        Record<never, never>
      > = async (runCallback) => {
        try {
          flags.add("env-validating");
          const env = arkenv(schema);

          if (!isObjectWithKeysOfType<GetEnvFromSchema<ArkEnvSchema>>(env)) {
            throw Error(
              "There was an issue validating the environment structure type, this should never happen.",
            );
          }

          flags.add("env-validated");
          flags.add("running");

          await runCallback({
            env,
            log: entryLog,
            context,
            flags,
          });

          flags.add("completed");
          clearTimeout(timeoutId);
          emitCanonicalLog("info", "entry point started");
        } catch (error) {
          flags.add("failed");

          const name = error instanceof Error ? error.name : undefined;
          const message =
            error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : String(error);

          context.set("error.name", name);
          context.set("error.message", message);
          context.set("error.stack", stack);

          clearTimeout(timeoutId);
          emitCanonicalLog("fatal", "entry point failed");
          process.exit(1);
        }
      };

      const setup = <
        InstantiatedSetupCallback extends SetupCallback<ArkEnvSchema>,
        InstantiatedSetupCallbackReturnType extends
          ReturnType<InstantiatedSetupCallback>,
      >(
        callback: InstantiatedSetupCallback,
      ) => {
        type AwaitedSetupResult = Awaited<InstantiatedSetupCallbackReturnType>;

        type SetupExtension =
          AwaitedSetupResult extends Record<string, unknown>
            ? AwaitedSetupResult
            : Record<never, never>;

        const validateEnvironment = () => {
          flags.add("env-validating");
          const env = arkenv(schema);

          const isValid =
            isObjectWithKeysOfType<Parameters<typeof callback>[0]["env"]>(env);

          if (!isValid) {
            throw Error(
              "There was an issue validating the environment structure type, this should never happen.",
            );
          }

          return env;
        };

        const onRun: EntryPointRunFunction<
          ArkEnvSchema,
          SetupExtension
        > = async (runCallback) => {
          try {
            const env = validateEnvironment();
            flags.add("env-validated");
            flags.add("setup-running");

            const setupResult = await callback({ env });

            if (!isObjectWithKeysOfType<SetupExtension>(setupResult)) {
              throw Error(
                "Setup callback must return an object with string keys.",
              );
            }

            flags.add("setup-completed");
            flags.add("running");

            await runCallback({
              env,
              log: entryLog,
              context,
              flags,
              ...setupResult,
            });

            flags.add("completed");
            clearTimeout(timeoutId);
            emitCanonicalLog("info", "entry point started");
          } catch (error) {
            flags.add("failed");

            const name = error instanceof Error ? error.name : undefined;
            const message =
              error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : String(error);

            context.set("error.name", name);
            context.set("error.message", message);
            context.set("error.stack", stack);

            clearTimeout(timeoutId);
            emitCanonicalLog("fatal", "entry point failed");
            process.exit(1);
          }
        };

        return { run: onRun };
      };

      return {
        setup,
        run,
      };
    },
  };
};
