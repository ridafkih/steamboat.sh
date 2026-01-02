CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hash" text NOT NULL,
	"one_time_use" boolean DEFAULT false NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "discord_server_members" (
	"discord_server_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discord_server_members_discord_server_id_user_id_pk" PRIMARY KEY("discord_server_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "discord_servers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"app_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon_url" text,
	"logo_url" text,
	"header_image_url" text,
	"short_description" text,
	"developers" text,
	"publishers" text,
	"genres" text,
	"release_date" text,
	"is_free" boolean DEFAULT false,
	"cached_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "key_value" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owned_games" (
	"steam_account_id" integer NOT NULL,
	"app_id" integer NOT NULL,
	"playtime_forever" integer DEFAULT 0,
	"playtime_recent" integer DEFAULT 0,
	"playtime_windows" integer DEFAULT 0,
	"playtime_mac" integer DEFAULT 0,
	"playtime_linux" integer DEFAULT 0,
	"last_played_at" timestamp,
	"hidden" boolean DEFAULT false,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "owned_games_steam_account_id_app_id_pk" PRIMARY KEY("steam_account_id","app_id")
);
--> statement-breakpoint
CREATE TABLE "steam_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"steam_id" text NOT NULL,
	"steam_username" text NOT NULL,
	"steam_avatar" text,
	"profile_url" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "steam_accounts_steam_id_unique" UNIQUE("steam_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_id" text NOT NULL,
	"discord_username" text NOT NULL,
	"discord_avatar" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_id_unique" UNIQUE("discord_id")
);
--> statement-breakpoint
ALTER TABLE "discord_server_members" ADD CONSTRAINT "discord_server_members_discord_server_id_discord_servers_id_fk" FOREIGN KEY ("discord_server_id") REFERENCES "public"."discord_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discord_server_members" ADD CONSTRAINT "discord_server_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_games" ADD CONSTRAINT "owned_games_steam_account_id_steam_accounts_id_fk" FOREIGN KEY ("steam_account_id") REFERENCES "public"."steam_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_games" ADD CONSTRAINT "owned_games_app_id_games_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."games"("app_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steam_accounts" ADD CONSTRAINT "steam_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;