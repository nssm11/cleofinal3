import type { ReactElement } from "react";
import { emailLocale, type EmailLocale } from "./theme";
import { OrderEmail, orderEmailSubject, type OrderEmailKind, type OrderEmailData } from "./templates/orders";
import { WelcomeEmail, PasswordResetEmail, welcomeEmailSubject, passwordEmailSubject, type WelcomeData, type PasswordResetData } from "./templates/letters";
import { TicketEmail, ticketEmailSubject, type TicketEmailKind, type TicketEmailData } from "./templates/tickets";
import {
  ExperienceEmail,
  experienceEmailSubject,
  type ExperienceEmailKind,
  type RestockData,
  type CareFeedbackData,
  type CareFollowupData,
  type RitualData,
  type SubscriptionOrderData,
} from "./templates/experience";

/**
 * The switchboard: every kind of transactional letter the house sends, its
 * subject line per locale, and the component that renders it. Payloads are
 * plain JSON so they can sleep in the outbox table until their send time.
 */
export type EmailKind = "welcome" | "password_reset" | OrderEmailKind | TicketEmailKind | ExperienceEmailKind;

export const EMAIL_KINDS = [
  "welcome",
  "password_reset",
  "order_confirmed",
  "order_preparing",
  "order_shipped",
  "order_out_for_delivery",
  "order_delivered",
  "order_cancelled",
  "order_refunded",
  "ticket_created",
  "ticket_reply",
  "ticket_resolved",
  "restock_available",
  "care_feedback",
  "care_followup",
  "ritual_reminder",
  "subscription_order",
  "vip_birthday",
] as const satisfies readonly EmailKind[];

export type EmailPayload =
  | (WelcomeData & { kind: "welcome" })
  | (PasswordResetData & { kind: "password_reset" })
  | (OrderEmailData & { kind: OrderEmailKind })
  | (TicketEmailData & { kind: TicketEmailKind })
  | ({ kind: "restock_available" } & RestockData)
  | ({ kind: "care_feedback" } & CareFeedbackData)
  | ({ kind: "care_followup" } & CareFollowupData)
  | ({ kind: "ritual_reminder" } & RitualData)
  | ({ kind: "subscription_order" } & SubscriptionOrderData)
  | ({ kind: "vip_birthday" } & { firstName: string });

export function emailSubject(kind: EmailKind, payload: Record<string, unknown>, siteLocale: string): string {
  const locale = emailLocale(siteLocale);
  if (kind === "welcome") return welcomeEmailSubject(locale);
  if (kind === "password_reset") return passwordEmailSubject(locale);
  if (kind === "order_refunded" || kind === "order_delivered" || kind === "order_cancelled" || kind === "order_confirmed" || kind === "order_preparing" || kind === "order_shipped" || kind === "order_out_for_delivery") {
    return orderEmailSubject(locale, kind as OrderEmailKind, String(payload.orderNumber ?? ""));
  }
  if (kind === "ticket_created" || kind === "ticket_reply" || kind === "ticket_resolved") {
    return ticketEmailSubject(locale, kind as TicketEmailKind, Number(payload.ticketId ?? payload.ticketNumber ?? "0"));
  }
  if (kind === "restock_available") return experienceEmailSubject(locale, "restock_available", { productName: String(payload.productName ?? "") });
  if (kind === "care_feedback") return experienceEmailSubject(locale, "care_feedback", { orderNumber: String(payload.orderNumber ?? "") });
  if (kind === "care_followup") return experienceEmailSubject(locale, "care_followup", { orderNumber: String(payload.orderNumber ?? "") });
  if (kind === "ritual_reminder") return experienceEmailSubject(locale, "ritual_reminder", { moment: String(payload.moment ?? "") });
  if (kind === "vip_birthday") return experienceEmailSubject(locale, "vip_birthday", { firstName: String(payload.firstName ?? "") });
  return experienceEmailSubject(locale, "subscription_order", { orderNumber: String(payload.orderNumber ?? "") });
}

export function renderEmailElement(kind: EmailKind, payload: EmailPayload, locale: EmailLocale): ReactElement {
  if (kind === "welcome") return <WelcomeEmail data={payload as WelcomeData & { kind: "welcome" }} locale={locale} />;
  if (kind === "password_reset") return <PasswordResetEmail data={payload as PasswordResetData & { kind: "password_reset" }} locale={locale} />;
  if (kind.startsWith("order_")) return <OrderEmail data={payload as OrderEmailData & { kind: OrderEmailKind }} locale={locale} />;
  if (kind.startsWith("ticket_")) return <TicketEmail data={payload as TicketEmailData & { kind: TicketEmailKind }} locale={locale} />;
  return <ExperienceEmail kind={kind as ExperienceEmailKind} data={payload as never} locale={locale} />;
}
