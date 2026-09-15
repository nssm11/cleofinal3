DO $$ BEGIN
  CREATE TYPE "task_priority" AS ENUM('critical', 'high', 'normal', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "task_status" AS ENUM('open', 'in_progress', 'blocked', 'done', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"detail" text,
	"priority" "task_priority" DEFAULT 'normal' NOT NULL,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"source" varchar(24) DEFAULT 'hand' NOT NULL,
	"entity" varchar(40),
	"entity_id" varchar(60),
	"href" varchar(300),
	"assignee_id" integer,
	"created_by" integer,
	"due_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(140) NOT NULL,
	"description" varchar(300),
	"trigger" varchar(40) NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"run_count" integer DEFAULT 0 NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automation_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_id" integer NOT NULL,
	"mode" varchar(12) DEFAULT 'manual' NOT NULL,
	"matched" integer DEFAULT 0 NOT NULL,
	"affected" integer DEFAULT 0 NOT NULL,
	"status" varchar(12) DEFAULT 'ok' NOT NULL,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "automations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_status_idx" ON "admin_tasks" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_priority_idx" ON "admin_tasks" ("priority");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_assignee_idx" ON "admin_tasks" ("assignee_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_due_idx" ON "admin_tasks" ("due_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automations_active_idx" ON "automations" ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automations_trigger_idx" ON "automations" ("trigger");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_automation_idx" ON "automation_runs" ("automation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_created_idx" ON "automation_runs" ("created_at");
