-- ────────────────────────────────────────────────────────────────────────
-- 0003 — THE CONCIERGERIE, MADE LIVE
--
-- The ticket IS the conversation: we evolve support_tickets + ticket_messages
-- in place (no competing table) to carry a real support chat —
-- lifecycle states, assignment, order context, read tracking, internal
-- notes, attachments, delivery status.
--
-- NOTE: the two ALTER TYPE statements must run OUTSIDE a transaction
-- (Postgres restriction). This project applies migrations as plain exec.
-- ────────────────────────────────────────────────────────────────────────

-- Lifecycle: open → in_progress → resolved → closed.
-- 'answered' stays in the type for legacy rows (migrated below, never written again).
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'answered';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'resolved' AFTER 'in_progress';

-- The conversation: who is on it, where the thread is, who read it.
ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS assigned_support_id integer REFERENCES users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_id integer REFERENCES orders (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_message_body text,
  ADD COLUMN IF NOT EXISTS last_message_author varchar(160),
  ADD COLUMN IF NOT EXISTS customer_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS support_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rating smallint,
  ADD COLUMN IF NOT EXISTS rated_at timestamptz;

CREATE INDEX IF NOT EXISTS support_tickets_user_status_idx ON support_tickets (user_id, status);
CREATE INDEX IF NOT EXISTS support_tickets_assigned_idx ON support_tickets (assigned_support_id);
CREATE INDEX IF NOT EXISTS support_tickets_last_message_idx ON support_tickets (last_message_at DESC);

-- The message: who wrote it, what kind (internal notes are server-side,
-- never sent to the customer), what it carries, whether it was read.
ALTER TABLE ticket_messages
  ADD COLUMN IF NOT EXISTS kind varchar(12) NOT NULL DEFAULT 'message', -- message | note | system
  ADD COLUMN IF NOT EXISTS sender_id integer REFERENCES users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment jsonb,
  ADD COLUMN IF NOT EXISTS status varchar(12) NOT NULL DEFAULT 'sent'; -- sent | read

CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx ON ticket_messages (ticket_id, id);

-- ── Backfill: make legacy rows honest ───────────────────────────────────
-- Bot messages are system notices; customer messages carry their author.
UPDATE ticket_messages SET kind = 'system' WHERE is_bot = true AND kind = 'message';
UPDATE ticket_messages SET sender_id = user_id WHERE user_id IS NOT NULL AND sender_id IS NULL;

-- 'answered' meant an agent had engaged → in_progress.
UPDATE support_tickets SET status = 'in_progress', support_read_at = read_at WHERE status = 'answered';

-- Seed the conversation cursors from the existing threads.
UPDATE support_tickets t
SET
  last_message_at = m.max_at,
  last_message_body = m.body,
  last_message_author = m.author,
  customer_read_at = COALESCE(t.read_at, m.max_at)
FROM (
  SELECT
    ticket_id,
    max(created_at) AS max_at,
    (array_agg(body ORDER BY id DESC))[1] AS body,
    (array_agg(author_name ORDER BY id DESC))[1] AS author
  FROM ticket_messages
  GROUP BY ticket_id
) m
WHERE t.id = m.ticket_id;
