CREATE TABLE "sponsorship" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website_url" text NOT NULL,
	"logo_url" text,
	"tier" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"stripe_session_id" text,
	"stripe_customer_email" text,
	"amount_paid" integer,
	"starts_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
