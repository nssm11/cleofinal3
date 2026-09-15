import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/support/chat";
import { customerConversations, supportInbox, type InboxFilter } from "@/lib/support/queries";
import { asString, unauthorised } from "@/lib/support/api";

export const dynamic = "force-dynamic";

const FILTERS: InboxFilter[] = ["all", "waiting", "mine", "unread", "active", "resolved", "closed"];

/**
 * The list view. A customer gets their own conversations; staff get the
 * team inbox with real filters (waiting / mine / unread / active / resolved /
 * closed) and a search that reaches into the message threads.
 */
export async function GET(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return unauthorised();

  if (!isStaff(user)) {
    const tickets = await customerConversations(user);
    return NextResponse.json({ tickets });
  }

  const p = req.nextUrl.searchParams;
  const filterParam = asString(p.get("filter"), 16) || "all";
  const filter: InboxFilter = (FILTERS as string[]).includes(filterParam) ? (filterParam as InboxFilter) : "all";
  const q = asString(p.get("q"), 80) || undefined;
  const priorityParam = asString(p.get("priority"), 8);
  const priority = priorityParam === "high" || priorityParam === "urgent" ? priorityParam : null;
  const tickets = await supportInbox({ me: user, filter, q, priority });
  return NextResponse.json({ tickets });
}
