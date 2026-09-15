import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { SUPPORT_EVENT, routesMatch, supportBus, teamPresence } from "@/lib/support/bus";
import { isStaff } from "@/lib/support/chat";
import type { RoutedEvent } from "@/lib/support/types";

export const dynamic = "force-dynamic";

/**
 * The concierge line — a Server-Sent Events stream, one per open tab.
 *
 * The viewer's identity comes from the session cookie, and the routes
 * carried over the line are filtered by it: a customer only ever receives
 * events addressed to their own conversations, the team receives the staff
 * channel. Internal notes are never routed to a customer, because the bus
 * itself never puts them on a customer route.
 */
export async function GET(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return new Response("unauthorised", { status: 401 });
  const viewer = { isStaff: isStaff(user), userId: user.id };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const push = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };
      push(`data: ${JSON.stringify({ type: "hello", agents: teamPresence(), now: Date.now() })}\n\n`);
      const onEvent = (evt: RoutedEvent) => {
        if (routesMatch(evt.routes, viewer)) push(`data: ${JSON.stringify(evt.data)}\n\n`);
      };
      supportBus.on(SUPPORT_EVENT, onEvent);
      const heartbeat = setInterval(() => push(`: ping\n\n`), 25_000);
      req.signal.addEventListener("abort", () => {
        closed = true;
        supportBus.off(SUPPORT_EVENT, onEvent);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
