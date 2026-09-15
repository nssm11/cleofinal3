CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" varchar(24) NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" varchar(400),
	"href" varchar(300),
	"priority" varchar(12) DEFAULT 'normal' NOT NULL,
	"dedupe_key" varchar(128),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"code_prefix" varchar(8) NOT NULL,
	"initial_millimes" integer NOT NULL,
	"balance_millimes" integer NOT NULL,
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"issued_by" integer,
	"note" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_cards_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift_card_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"gift_card_id" integer NOT NULL,
	"order_id" integer,
	"amount_millimes" integer NOT NULL,
	"kind" varchar(16) NOT NULL,
	"reason" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_card_transactions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "gift_card_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_dedupe_idx" ON "notifications" USING btree ("user_id","dedupe_key") WHERE "notifications"."dedupe_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_code_idx" ON "gift_cards" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_cards_status_idx" ON "gift_cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_tx_card_idx" ON "gift_card_transactions" USING btree ("gift_card_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_tx_order_idx" ON "gift_card_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gift_tx_order_kind_idx" ON "gift_card_transactions" USING btree ("order_id","kind") WHERE "gift_card_transactions"."order_id" IS NOT NULL;
