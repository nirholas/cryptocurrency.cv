CREATE TABLE "trollbox_message" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text,
	"username" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blog_article" ALTER COLUMN "author" SET DEFAULT 'Memescope Monday Team';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "ticker" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "chain" text DEFAULT 'solana';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "coin_type" text DEFAULT 'existing';--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "contract_address" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "telegram_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "pumpfun_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "dexscreener_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "market_cap" double precision;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "ath_market_cap" double precision;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "volume_24h" double precision;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "price_usd" double precision;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "price_change_24h" double precision;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "holders" integer;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "liquidity" double precision;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "total_supply" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "launch_date_coin" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "pumpfun_data" json;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "helius_data" json;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "dexscreener_data" json;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "last_enriched_at" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "trending" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "paid_expedited" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "paid_trending" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "week_label" text;--> statement-breakpoint
ALTER TABLE "trollbox_message" ADD CONSTRAINT "trollbox_message_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trollbox_message" ADD CONSTRAINT "trollbox_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trollbox_project_idx" ON "trollbox_message" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_chain_idx" ON "project" USING btree ("chain");--> statement-breakpoint
CREATE INDEX "project_contract_idx" ON "project" USING btree ("contract_address");