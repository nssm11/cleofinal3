/**
 * Wire types of the conciergerie — pure types only, safe to import from
 * client components (no server-only module, no runtime code).
 */

export type AttachmentMeta = { name: string; mime: string; size: number; key: string };

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
  attachment: AttachmentMeta | null;
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
  unread: number;
  typingBy: "customer" | "support" | null;
};

export type PresenceStatus = "online" | "away" | "offline";
export type PresenceOut = { id: number; name: string; status: PresenceStatus; since: number };

/** Everything the SSE line can carry. */
export type SupportData =
  | { type: "hello"; agents: PresenceOut[]; now: number }
  | { type: "message"; message: MessageOut; ticket: ConversationOut }
  | { type: "typing"; ticketId: number; who: "customer" | "support"; name: string }
  | { type: "read"; ticketId: number; who: "customer" | "support"; upToId: number; at: string }
  | { type: "conversation"; ticket: ConversationOut }
  | { type: "presence"; agent: PresenceOut };
