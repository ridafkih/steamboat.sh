ALTER TABLE "games" ADD COLUMN "price_currency" text;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "price_initial" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "price_final" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "price_discount_percent" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "price_last_fetched_at" timestamp;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "price_fetch_attempts" integer DEFAULT 0;