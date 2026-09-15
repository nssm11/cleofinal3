import type { ReactElement } from "react";
import { emailLocale, type EmailLocale } from "./theme";
import { OrderEmail, orderEmailSubject, type OrderEmailKind, type OrderEmailData } from "./templates/orders";
import { WelcomeEmail, PasswordResetEmail, welcomeEmailSubject, passwordEmailSubject, type WelcomeData, type PasswordResetData } from "./templates/letters";
import { TicketEmail, ticketEmailSubject, type TicketEmailKind, type TicketEmailData } from "./templates/tickets";
import {ExperienceEmail, experienceEmailSubject, type ExperienceEmailKind, type RestockData, type CareFeedbackData, type CareFollowupData, type RitualData, type SubscriptionOrderData, type ReturnUpdateData} from "./templates/experience";
import { OtpEmail, otpEmailSubject, type OtpData } from "./templates/otp";
import { SecurityChangeEmail, securityEmailSubject, type SecurityChangeData } from "./templates/security";
import { ReviewRequestEmail, reviewRequestSubject, type ReviewRequestData } from "./templates/reviews";
import { PaymentConfirmedEmail, paymentConfirmedSubject, type PaymentConfirmedData } from "./templates/payment";
import { SubscriptionCancelledEmail, subscriptionCancelledSubject, type SubscriptionCancelledData } from "./templates/subscription";

/**
 * The switchboard: every kind of transactional letter the house sends, its
 * subject line per locale, and the component that renders it. Payloads are
 * plain JSON so they can sleep in the outbox table until their send time —
 * except the OTP letter, whose payload carries the OTP row id and never the
 * code itself (see ./otp and sendImmediateEmail).
 */
export type EmailKind =
  | "welcome"
  | "password_reset"
  | "email_otp"
  | "security_change"
  | "payment_confirmed"
  | "review_request"
  | "subscription_cancelled"
  | OrderEmailKind
  | TicketEmailKind
  | ExperienceEmailKind;

export const EMAIL_KINDS = [
  "welcome",
  "password_reset",
  "email_otp",
  "security_change",
  "payment_confirmed",
  "review_request",
  "subscription_cancelled",
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
  "ticket_incoming",
  "restock_available",
  "care_feedback",
  "care_followup",
  "ritual_reminder",
  "subscription_order",
  "return_update",
] as const satisfies readonly EmailKind[];

export type EmailPayload =
  | (WelcomeData & { kind: "welcome" })
  | (PasswordResetData & { kind: "password_reset" })
  | (OtpData & { kind: "email_otp" })
  | (SecurityChangeData & { kind: "security_change" })
  | (PaymentConfirmedData & { kind: "payment_confirmed" })
  | (ReviewRequestData & { kind: "review_request" })
  | (SubscriptionCancelledData & { kind: "subscription_cancelled" })
  | (OrderEmailData & { kind: OrderEmailKind })
  | (TicketEmailData & { kind: TicketEmailKind })
  | ({ kind: "restock_available" } & RestockData)
  | ({ kind: "care_feedback" } & CareFeedbackData)
  | ({ kind: "care_followup" } & CareFollowupData)
  | ({ kind: "ritual_reminder" } & RitualData)
  | ({ kind: "subscription_order" } & SubscriptionOrderData)
  | ({ kind: "return_update" } & ReturnUpdateData);

export function emailSubject(kind: EmailKind, payload: Record<string, unknown>, siteLocale: string): string {
  const locale = emailLocale(siteLocale);
  if (kind === "welcome") return welcomeEmailSubject(locale);
  if (kind === "password_reset") return passwordEmailSubject(locale);
  if (kind === "email_otp") return otpEmailSubject(locale);
  if (kind === "security_change") return securityEmailSubject(locale);
  if (kind === "payment_confirmed") return paymentConfirmedSubject(locale, String(payload.orderNumber ?? ""));
  if (kind === "review_request") return reviewRequestSubject(locale, String(payload.productName ?? ""));
  if (kind === "subscription_cancelled") return subscriptionCancelledSubject(locale);
  if (kind === "order_refunded" || kind === "order_delivered" || kind === "order_cancelled" || kind === "order_confirmed" || kind === "order_preparing" || kind === "order_shipped" || kind === "order_out_for_delivery") {
    return orderEmailSubject(locale, kind as OrderEmailKind, String(payload.orderNumber ?? ""));
  }
  if (kind === "ticket_created" || kind === "ticket_reply" || kind === "ticket_resolved" || kind === "ticket_incoming") {
    const num = payload.ticketId ?? (typeof payload.ticketNumber === "string" ? Number(payload.ticketNumber.replace(/\D/g, "")) : payload.ticketNumber) ?? "0";
    return ticketEmailSubject(locale, kind as TicketEmailKind, Number(num));
  }
  if (kind === "restock_available") return experienceEmailSubject(locale, "restock_available", { productName: String(payload.productName ?? "") });
  if (kind === "care_feedback") return experienceEmailSubject(locale, "care_feedback", { orderNumber: String(payload.orderNumber ?? "") });
  if (kind === "care_followup") return experienceEmailSubject(locale, "care_followup", { orderNumber: String(payload.orderNumber ?? "") });
  if (kind === "ritual_reminder") return experienceEmailSubject(locale, "ritual_reminder", { moment: String(payload.moment ?? "") });
  if (kind === "return_update") return experienceEmailSubject(locale, "return_update", { retNumber: String(payload.returnNumber ?? ""), status: String(payload.status ?? "") });
  return experienceEmailSubject(locale, "subscription_order", { orderNumber: String(payload.orderNumber ?? "") });
}

export function renderEmailElement(kind: EmailKind, payload: EmailPayload, locale: EmailLocale): ReactElement {
  if (kind === "welcome") return <WelcomeEmail data={payload as WelcomeData & { kind: "welcome" }} locale={locale} />;
  if (kind === "password_reset") return <PasswordResetEmail data={payload as PasswordResetData & { kind: "password_reset" }} locale={locale} />;
  if (kind === "email_otp") return <OtpEmail data={payload as OtpData & { kind: "email_otp" }} locale={locale} />;
  if (kind === "security_change") return <SecurityChangeEmail data={payload as SecurityChangeData & { kind: "security_change" }} locale={locale} />;
  if (kind === "payment_confirmed") return <PaymentConfirmedEmail data={payload as PaymentConfirmedData & { kind: "payment_confirmed" }} locale={locale} />;
  if (kind === "review_request") return <ReviewRequestEmail data={payload as ReviewRequestData & { kind: "review_request" }} locale={locale} />;
  if (kind === "subscription_cancelled") return <SubscriptionCancelledEmail data={payload as SubscriptionCancelledData & { kind: "subscription_cancelled" }} locale={locale} />;
  if (kind.startsWith("order_")) return <OrderEmail data={payload as OrderEmailData & { kind: OrderEmailKind }} locale={locale} />;
  if (kind.startsWith("ticket_")) return <TicketEmail data={payload as TicketEmailData & { kind: TicketEmailKind }} locale={locale} />;
  return <ExperienceEmail kind={kind as ExperienceEmailKind} data={payload as never} locale={locale} />;
}
