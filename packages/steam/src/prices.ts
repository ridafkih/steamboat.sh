import { eq, sql } from "drizzle-orm";
import { games } from "@steamboat/database/schema";
import type { DatabaseClient } from "@steamboat/database";
import {
  steamAppDetailsResponseSchema,
  type SteamPriceOverview,
} from "@steamboat/data-schemas";
import { log } from "@steamboat/log";

const STEAM_APPDETAILS_URL = "https://store.steampowered.com/api/appdetails/";
const MAX_FETCH_ATTEMPTS = 3;

type PriceResult = {
  appId: number;
  priceOverview: SteamPriceOverview | null;
};

export const fetchGamePrices = async (
  appIds: number[],
): Promise<PriceResult[]> => {
  if (appIds.length === 0) {
    return [];
  }

  const url = new URL(STEAM_APPDETAILS_URL);
  url.searchParams.set("appids", appIds.join(","));
  url.searchParams.set("filters", "price_overview");

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch game prices: ${response.statusText}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const results: PriceResult[] = [];

  for (const appId of appIds) {
    const appData = json[String(appId)];

    if (!appData) {
      results.push({ appId, priceOverview: null });
      continue;
    }

    try {
      const parsed = steamAppDetailsResponseSchema.assert(appData);

      if (!parsed.success || !parsed.data?.price_overview) {
        results.push({ appId, priceOverview: null });
        continue;
      }

      results.push({ appId, priceOverview: parsed.data.price_overview });
    } catch (error) {
      log.warn(
        { appId, error: error instanceof Error ? error.message : String(error) },
        "Failed to parse app details response",
      );
      results.push({ appId, priceOverview: null });
    }
  }

  return results;
};

export const syncGamePrices = async (
  database: DatabaseClient,
  appIds: number[],
): Promise<{ succeeded: number; failed: number }> => {
  if (appIds.length === 0) {
    return { succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  try {
    const results = await fetchGamePrices(appIds);

    for (const result of results) {
      if (result.priceOverview) {
        await database
          .update(games)
          .set({
            priceCurrency: result.priceOverview.currency,
            priceInitial: result.priceOverview.initial,
            priceFinal: result.priceOverview.final,
            priceDiscountPercent: result.priceOverview.discount_percent,
            priceLastFetchedAt: new Date(),
            priceFetchAttempts: sql`${games.priceFetchAttempts} + 1`,
          })
          .where(eq(games.appId, result.appId));
        succeeded++;
      } else {
        await database
          .update(games)
          .set({
            priceFetchAttempts: sql`${games.priceFetchAttempts} + 1`,
          })
          .where(eq(games.appId, result.appId));
        failed++;
      }
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error), appIds },
      "Failed to fetch game prices",
    );

    for (const appId of appIds) {
      await database
        .update(games)
        .set({
          priceFetchAttempts: sql`${games.priceFetchAttempts} + 1`,
        })
        .where(eq(games.appId, appId));
    }

    failed += appIds.length;
  }

  return { succeeded, failed };
};

export const syncMissingGamePrices = async (
  database: DatabaseClient,
): Promise<{ succeeded: number; failed: number; total: number }> => {
  const gamesWithMissingPrices = await database.query.games.findMany({
    where: sql`${games.priceLastFetchedAt} IS NULL AND ${games.priceFetchAttempts} < ${MAX_FETCH_ATTEMPTS}`,
    columns: { appId: true },
  });

  const appIds = gamesWithMissingPrices.map((game) => game.appId);
  const result = await syncGamePrices(database, appIds);

  return { ...result, total: appIds.length };
};

export { MAX_FETCH_ATTEMPTS };
