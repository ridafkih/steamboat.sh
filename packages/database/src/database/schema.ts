import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  discordUsername: text("discord_username").notNull(),
  discordAvatar: text("discord_avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  steamAccounts: many(steamAccounts),
  serverMemberships: many(discordServerMembers),
}));

export const steamAccounts = pgTable("steam_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  steamId: text("steam_id").notNull().unique(),
  steamUsername: text("steam_username").notNull(),
  steamAvatar: text("steam_avatar"),
  profileUrl: text("profile_url"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const steamAccountsRelations = relations(steamAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [steamAccounts.userId],
    references: [users.id],
  }),
  ownedGames: many(ownedGames),
}));

export const games = pgTable("games", {
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
  isFree: boolean("is_free").default(false),
  cachedAt: timestamp("cached_at").notNull().defaultNow(),
});

export const gamesRelations = relations(games, ({ many }) => ({
  ownedGames: many(ownedGames),
}));

export const ownedGames = pgTable(
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
    lastPlayedAt: timestamp("last_played_at"),
    hidden: boolean("hidden").default(false),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
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

export const discordServers = pgTable("discord_servers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const discordServersRelations = relations(discordServers, ({ many }) => ({
  members: many(discordServerMembers),
}));

export const discordServerMembers = pgTable(
  "discord_server_members",
  {
    discordServerId: text("discord_server_id")
      .notNull()
      .references(() => discordServers.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.discordServerId, table.userId] })]
);

export const discordServerMembersRelations = relations(discordServerMembers, ({ one }) => ({
  server: one(discordServers, {
    fields: [discordServerMembers.discordServerId],
    references: [discordServers.id],
  }),
  user: one(users, {
    fields: [discordServerMembers.userId],
    references: [users.id],
  }),
}));

export const keyValue = pgTable("key_value", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hash: text("hash").notNull(),
  oneTimeUse: boolean("one_time_use").notNull().default(false),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});
