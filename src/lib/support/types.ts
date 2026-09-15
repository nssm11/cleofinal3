import "server-only";
import type { SupportAttachmentMeta } from "@/db/schema";

/** The wire + page-facing shapes of the conciergerie. */

export type MessageKind = "message" | "note" | "system";
export type SenderType = "customer" | "support" | "system";

export type MessageOut = {
  id: number;
  ticketId: number;
  kind: MessageKind;
  senderType: SenderType;
  senderId: number | null;
  senderName: string;
  body: string;
  attachment: SupportAttachmentMeta | null;
  /** sent — delivered to the channel; read — the other party read it. */
  status: "sent" | "read";
  readAt: string | null;
  createdAt: string;
};

export type ConversationOut = {
  id: number;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  type: string;
  createdAt: string;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  lastMessageAuthor: string | null;
  customerId: number | null;
  customerName: string;
  customerEmail: string;
  orderId: number | null;
  orderNumber: string | null;
  assignedSupportId: number | null;
  assignedSupportName: string | null;
  rating: number | null;
  ratedAt: string | null;
  /** Unread count for the viewer (null = not computed). */
  unread: number;
  /** True when a staff member is actively typing (transient, not persisted). */
  typingBy: "customer" | "support" | null;
};

/** One payload carried over the SSE line, tagged for its audience. */
export type SupportData =
  | { type: "hello"; agents: PresenceOut[]; now: number }
  | { type: "message"; message: MessageOut; ticket: ConversationOut }
  | { type: "typing"; ticketId: number; who: "customer" | "support"; name: string }
  | { type: "read"; ticketId: number; who: "customer" | "support"; upToId: number; at: string }
  | { type: "conversation"; ticket: ConversationOut }
  | { type: "presence"; agent: PresenceOut };

export type PresenceStatus = "online" | "away" | "offline";
export type PresenceOut = { id: number; name: string; status: PresenceStatus; since: number };

export type Routing = { to: "staff" } | { to: "customer"; userId: number };
export type RoutedEvent = { routes: Routing[]; data: SupportData };
