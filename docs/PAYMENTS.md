# La caisse — ce qui est encaissé, et comment brancher le reste

The till tells the truth today: it offers what the house can actually take,
and it does not dress up the rest.

## What exists

| Method | State | Where the money is taken |
|---|---|---|
| `cod` — cash on delivery | **live** | the courier, at the door |
| `bank_transfer` | **live** | the customer, against a RIB shown at confirmation |
| `gift_card` | **live** | the card balance, verified by phone at the counter |
| `card` — bank card | **teaser, disabled** | nothing: the server refuses `card` at submission |

The list a customer sees comes from `enabledPaymentMethods()`
(`PAYMENT_METHODS_ENABLED`, default `cod,bank_transfer,gift_card`) — never
from hand-written copy, so the interface cannot promise a method the server
would reject.

Card appears greyed out with *« Bientôt disponible »*. It is a promise about
the future, written in the conditional, and the checkout refuses it if
anything bypasses the interface. No SSL or PCI claim is made anywhere in the
product (verified by grep): the house takes cash at the door, a transfer, or a
gift card checked by phone.

## Why not "just add Stripe"

Clearing a card payment in dinars requires a Tunisian acquirer and a local
entity. Stripe does not settle in TND for a Tunisian merchant, which is why
the teaser stays a teaser rather than becoming a fake button that fails at the
worst moment.

## How to enable card, when there is an acquirer

The seam is deliberately small. Work in this order:

1. **A provider** with a TND merchant account — Konnect (Konnect Networks),
   Paymee, Flouci, or the bank's own e-commerce gateway. You need: an API key
   or merchant id, a webhook signature secret, and a sandbox.
2. **New columns** on `orders`: `payment_intent_id`, `payment_provider`, and
   a `card` value already understood by the enum. Generate the migration with
   `npm run db:generate` and review it.
3. **A route** `src/app/api/payments/<provider>/webhook/route.ts`: verify the
   signature *before* reading the body, then mark the order paid through the
   same path the back office uses today
   (`PaymentControl` in `/admin/commandes/:id`) so the audit trail and the
   order timeline stay single-sourced.
4. **Server-side re-pricing stays where it is.** The checkout already
   re-computes the basket from the database at submission; a card flow adds an
   authorisation, never a trust in the client's total.
5. **Idempotency** — the schema already carries a unique `idempotency_key` on
   orders. Reuse it for the payment intent: a double-clicked button must not
   create two charges.
6. **Then, and only then**, add `card` to `PAYMENT_METHODS_ENABLED` and delete
   the teaser. The constant in `src/lib/payments.ts` that refuses `card`
   server-side is the last thing to change, never the first.

## What must not change

- **Loyalty points are credited on delivery, for every method.** One rule for
  when a purchase counts; a second rule would be a permanent argument with
  customers.
- **Cash on delivery is excluded from the admin's "mark paid" control.** The
  delivery settles it. Two clocks on the same fact is how a shop starts lying
  to itself.
- **The invoice** (`/api/orders/[number]/invoice`) renders from the order, not
  from the payment provider's idea of it.
