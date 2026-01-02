-- Drop existing foreign key constraints first
ALTER TABLE "discord_server_members" DROP CONSTRAINT IF EXISTS "discord_server_members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "steam_accounts" DROP CONSTRAINT IF EXISTS "steam_accounts_user_id_users_id_fk";
--> statement-breakpoint
-- Drop unique constraint on discord_id
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_discord_id_unique";
--> statement-breakpoint
-- Change users.id from serial to text (need to drop the default and change type)
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE text USING "id"::text;
--> statement-breakpoint
-- Change foreign key columns to text
ALTER TABLE "discord_server_members" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;
--> statement-breakpoint
ALTER TABLE "steam_accounts" ALTER COLUMN "user_id" SET DATA TYPE text USING "user_id"::text;
--> statement-breakpoint
-- Add new columns to users
ALTER TABLE "users" ADD COLUMN "name" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;
--> statement-breakpoint
-- Migrate existing data: use discord_username as name, generate placeholder email
UPDATE "users" SET "name" = "discord_username" WHERE "name" IS NULL;
--> statement-breakpoint
UPDATE "users" SET "email" = "discord_id" || '@discord.placeholder' WHERE "email" IS NULL;
--> statement-breakpoint
-- Now make columns NOT NULL
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
--> statement-breakpoint
-- Drop old discord columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "discord_id";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "discord_username";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "discord_avatar";
--> statement-breakpoint
-- Add unique constraint on email
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
--> statement-breakpoint
-- Recreate foreign key constraints
ALTER TABLE "discord_server_members" ADD CONSTRAINT "discord_server_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "steam_accounts" ADD CONSTRAINT "steam_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Create new better-auth tables
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add foreign keys for new tables
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;