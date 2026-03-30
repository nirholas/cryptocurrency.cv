CREATE TABLE "blog_article" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"image" text,
	"tags" text[],
	"author" text DEFAULT 'Open Launch Team' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"published_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "blog_article_slug_idx" ON "blog_article" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_article_published_at_idx" ON "blog_article" USING btree ("published_at");