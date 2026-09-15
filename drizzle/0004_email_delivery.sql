-- 0004 — The postal ledger grows, and the door learns to verify.
--
-- email_outbox gains the delivery telemetry Brevo reports back through the
-- webhook (sent / delivered / opened / clicked / bounced), the provider's
-- message id used to correlate the letter with its events, and the event
-- history itself. The OTP table backs the signup verification: only the
-- SHA-256 hash of the 6-digit code is ever stored — a database leak can
-- never be replayed as a valid code, the same discipline as password resets.
-- users.email_verified_at marks accounts whose address the owner proved
-- their own; legacy accounts are backfilled as verified.

ALTER TABLE "email_outbox" ADD COLUMN "provider_message_id" varchar(255);
ALTER TABLE "email_outbox" ADD COLUMN "delivered_at" timestamp with time zone;
ALTER TABLE "email_outbox" ADD COLUMN "opened_at" timestamp with time zone;
ALTER TABLE "email_outbox" ADD COLUMN "clicked_at" timestamp with time zone;
ALTER TABLE "email_outbox" ADD COLUMN "failed_at" timestamp with time zone;
ALTER TABLE "email_outbox" ADD COLUMN "webhook_events" jsonb DEFAULT '[]'::jsonb NOT NULL;
CREATE INDEX IF NOT EXISTS "outbox_provider_msg_idx" ON "email_outbox" USING btree ("provider_message_id");

CREATE TABLE "email_otps" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "code_hash" varchar(64) NOT NULL,
  "purpose" varchar(24) DEFAULT 'signup' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "failed_attempts" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "email_otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_otps_user_idx" ON "email_otps" USING btree ("user_id");

ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;
UPDATE "users" SET "email_verified_at" = "created_at";
