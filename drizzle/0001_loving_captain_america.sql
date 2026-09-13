CREATE TABLE "article_products" (
	"article_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"note" varchar(200),
	CONSTRAINT "article_products_article_id_product_id_pk" PRIMARY KEY("article_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "diagnostics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"product_ids" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duos" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(140) NOT NULL,
	"name" jsonb NOT NULL,
	"note" text,
	"product_a_id" integer NOT NULL,
	"product_b_id" integer NOT NULL,
	"discount_millimes" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" varchar(48) NOT NULL,
	"to" varchar(255) NOT NULL,
	"user_id" integer,
	"locale" varchar(10) DEFAULT 'fr' NOT NULL,
	"subject" varchar(300) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"send_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"status" varchar(12) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"pair_product_id" integer NOT NULL,
	"reason" varchar(200),
	"position" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_substitutes" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"substitute_product_id" integer NOT NULL,
	"reason" jsonb,
	"position" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "query_landings" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" varchar(200) NOT NULL,
	"label" varchar(200) NOT NULL,
	"href" varchar(400) NOT NULL,
	"kind" varchar(8) DEFAULT 'zero' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restock_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" integer,
	"email" varchar(255) NOT NULL,
	"channel" varchar(12) DEFAULT 'email' NOT NULL,
	"locale" varchar(10) DEFAULT 'fr' NOT NULL,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rituals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"moment" varchar(10) DEFAULT 'morning' NOT NULL,
	"season" varchar(40),
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"reminder_hour" integer DEFAULT 8 NOT NULL,
	"reminder_days" integer DEFAULT 127 NOT NULL,
	"last_reminded_on" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routine_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"concern_id" integer NOT NULL,
	"position" integer NOT NULL,
	"product_id" integer NOT NULL,
	"label" jsonb NOT NULL,
	"reason" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" jsonb NOT NULL,
	"subtitle" jsonb,
	"start_month" integer DEFAULT 1 NOT NULL,
	"end_month" integer DEFAULT 12 NOT NULL,
	"product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"type" varchar(24) NOT NULL,
	"detail" varchar(300),
	"order_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"frequency_days" integer DEFAULT 30 NOT NULL,
	"next_due_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"user_id" integer,
	"author_name" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"label" varchar(120) DEFAULT 'Ma liste Cléopâtre' NOT NULL,
	"message" varchar(400),
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "loyalty_order_award_idx";--> statement-breakpoint
DROP INDEX "loyalty_order_reversal_idx";--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "author" varchar(120);--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "author_role" varchar(80);--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "hero_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "loyalty_transactions" ADD COLUMN "kind" varchar(16) DEFAULT 'award' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "loyalty_earned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "loyalty_spent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_alts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_counter_pick" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tolerances" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "texture" varchar(80);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "for_whom" varchar(160);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "audience" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "precautions" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "use_when" varchar(80);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "use_amount" varchar(120);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "use_order" varchar(200);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "key_actives" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "location_stock" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "launched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "search_events" ADD COLUMN "out_of_stock" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" varchar(10) DEFAULT 'fr' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_opt_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN "note" varchar(200);--> statement-breakpoint
ALTER TABLE "article_products" ADD CONSTRAINT "article_products_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_products" ADD CONSTRAINT "article_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duos" ADD CONSTRAINT "duos_product_a_id_products_id_fk" FOREIGN KEY ("product_a_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duos" ADD CONSTRAINT "duos_product_b_id_products_id_fk" FOREIGN KEY ("product_b_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_pairs" ADD CONSTRAINT "product_pairs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_pairs" ADD CONSTRAINT "product_pairs_pair_product_id_products_id_fk" FOREIGN KEY ("pair_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_substitutes" ADD CONSTRAINT "product_substitutes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_substitutes" ADD CONSTRAINT "product_substitutes_substitute_product_id_products_id_fk" FOREIGN KEY ("substitute_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_alerts" ADD CONSTRAINT "restock_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_alerts" ADD CONSTRAINT "restock_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rituals" ADD CONSTRAINT "rituals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_concern_id_concerns_id_fk" FOREIGN KEY ("concern_id") REFERENCES "public"."concerns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_shares" ADD CONSTRAINT "wishlist_shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ap_product_idx" ON "article_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "diagnostics_user_idx" ON "diagnostics" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "duos_slug_idx" ON "duos" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "outbox_due_idx" ON "email_outbox" USING btree ("status","send_at");--> statement-breakpoint
CREATE INDEX "outbox_user_idx" ON "email_outbox" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_dedupe_idx" ON "email_outbox" USING btree ("kind","to","subject") WHERE "email_outbox"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "password_resets_user_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_pair_idx" ON "product_pairs" USING btree ("product_id","pair_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "substitute_pair_idx" ON "product_substitutes" USING btree ("product_id","substitute_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "query_landings_query_kind_idx" ON "query_landings" USING btree ("query","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "restock_one_per_email_idx" ON "restock_alerts" USING btree ("product_id","email");--> statement-breakpoint
CREATE INDEX "restock_product_idx" ON "restock_alerts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "restock_pending_idx" ON "restock_alerts" USING btree ("notified_at");--> statement-breakpoint
CREATE INDEX "rituals_user_idx" ON "rituals" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "routine_step_pos_idx" ON "routine_steps" USING btree ("concern_id","position");--> statement-breakpoint
CREATE INDEX "sub_events_sub_idx" ON "subscription_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "sub_items_sub_idx" ON "subscription_items" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_due_idx" ON "subscriptions" USING btree ("next_due_at");--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_idx" ON "ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlist_shares_token_idx" ON "wishlist_shares" USING btree ("token");--> statement-breakpoint
CREATE INDEX "wishlist_shares_user_idx" ON "wishlist_shares" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_order_kind_idx" ON "loyalty_transactions" USING btree ("order_id","kind") WHERE "loyalty_transactions"."order_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "products_counter_pick_idx" ON "products" USING btree ("is_counter_pick");