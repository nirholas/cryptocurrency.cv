CREATE TABLE "seo_article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seo_article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "seo_article_slug_idx" ON "seo_article" USING btree ("slug");