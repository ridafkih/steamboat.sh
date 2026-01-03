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
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  steamAccounts: many(steamAccounts),
  serverMemberships: many(discordServerMembers),
}));

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const steamAccounts = pgTable("steam_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  steamId: text("steam_id").notNull().unique(),
  steamUsername: text("steam_username").notNull(),
  steamAvatar: text("steam_avatar"),
  profileUrl: text("profile_url"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const steamAccountsRelations = relations(
  steamAccounts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [steamAccounts.userId],
      references: [users.id],
    }),
    ownedGames: many(ownedGames),
  }),
);

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
  priceCurrency: text("price_currency"),
  priceInitial: integer("price_initial"),
  priceFinal: integer("price_final"),
  priceDiscountPercent: integer("price_discount_percent"),
  priceLastFetchedAt: timestamp("price_last_fetched_at"),
  priceFetchAttempts: integer("price_fetch_attempts").default(0),
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
  (table) => [primaryKey({ columns: [table.steamAccountId, table.appId] })],
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
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const discordServersRelations = relations(
  discordServers,
  ({ many }) => ({
    members: many(discordServerMembers),
  }),
);

export const discordServerMembers = pgTable(
  "discord_server_members",
  {
    discordServerId: text("discord_server_id")
      .notNull()
      .references(() => discordServers.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.discordServerId, table.userId] })],
);

export const discordServerMembersRelations = relations(
  discordServerMembers,
  ({ one }) => ({
    server: one(discordServers, {
      fields: [discordServerMembers.discordServerId],
      references: [discordServers.id],
    }),
    user: one(users, {
      fields: [discordServerMembers.userId],
      references: [users.id],
    }),
  }),
);

export const keyValue = pgTable("key_value", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hash: text("hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});
