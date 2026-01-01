import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  discordId: text("discord_id").notNull().unique(),
  discordUsername: text("discord_username").notNull(),
  discordAvatar: text("discord_avatar"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  steamAccounts: many(steamAccounts),
}));

export const steamAccounts = sqliteTable("steam_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  steamId: text("steam_id").notNull().unique(),
  steamUsername: text("steam_username").notNull(),
  steamAvatar: text("steam_avatar"),
  profileUrl: text("profile_url"),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const steamAccountsRelations = relations(steamAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [steamAccounts.userId],
    references: [users.id],
  }),
  ownedGames: many(ownedGames),
}));

export const games = sqliteTable("games", {
  appId: integer("app_id").primaryKey(),
  name: text("name").notNull(),
  iconUrl: text("icon_url"),
  logoUrl: text("logo_url"),
  headerImageUrl: text("header_image_url"),
  shortDescription: text("short_description"),
  developers: text("developers"),
  publishers: text("publishers"),
  genres: text("genres"),
  releaseDate: text("release_date"),
  isFree: integer("is_free", { mode: "boolean" }).default(false),
  cachedAt: integer("cached_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const gamesRelations = relations(games, ({ many }) => ({
  ownedGames: many(ownedGames),
}));

export const ownedGames = sqliteTable(
  "owned_games",
  {
    steamAccountId: integer("steam_account_id")
      .notNull()
      .references(() => steamAccounts.id, { onDelete: "cascade" }),
    appId: integer("app_id")
      .notNull()
      .references(() => games.appId, { onDelete: "cascade" }),
    playtimeForever: integer("playtime_forever").default(0),
    playtimeRecent: integer("playtime_recent").default(0),
    playtimeWindows: integer("playtime_windows").default(0),
    playtimeMac: integer("playtime_mac").default(0),
    playtimeLinux: integer("playtime_linux").default(0),
    lastPlayedAt: integer("last_played_at", { mode: "timestamp" }),
    hidden: integer("hidden", { mode: "boolean" }).default(false),
    syncedAt: integer("synced_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.steamAccountId, table.appId] })]
);

export const ownedGamesRelations = relations(ownedGames, ({ one }) => ({
  steamAccount: one(steamAccounts, {
    fields: [ownedGames.steamAccountId],
    references: [steamAccounts.id],
  }),
  game: one(games, {
    fields: [ownedGames.appId],
    references: [games.appId],
  }),
}));
