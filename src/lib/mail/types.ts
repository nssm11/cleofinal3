import type { OrderStatus } from "@/db/schema";
import type { OrderMailLinks } from "./copy";

/** What an e-mail is allowed to know about an order — already formatted. */
export type MailOrderLine = {
  name: string;
  brandName: string | null;
  quantity: number;
  /** Pre-formatted, e.g. `42.500 DT`. */
  lineTotal: string;
};

export type MailOrder = {
  number: string;
  /** Where the letter goes. Never printed inside it. */
  email: string;
  firstName: string;
  status: OrderStatus;
  /** Pre-formatted total. */
  total: string;
  shippingLabel: string;
  paymentLabel: string;
  /** Pre-formatted date. */
  placedAt: string;
  trackingCode?: string | null;
  /** Carrier tracking page, when the transport provides one. */
  carrierUrl?: string | null;
  /** Absolute links, resolved by the sender. */
  links: OrderMailLinks;
  lines: MailOrderLine[];
};

export type MailTicket = {
  /** Ticket reference shown to the customer (`#12`). */
  reference: string;
  /** Where the letter goes. Never printed inside it. */
  email: string;
  name: string;
  subject: string;
  /** The reply, when the message carries one. */
  reply?: string | null;
  trackingHref: string;
};

export type MailRecipient = { email: string; firstName: string };
