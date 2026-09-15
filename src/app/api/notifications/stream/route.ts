import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { onNotify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * The house word, live — a Server-Sent Events stream, one per open tab.
 * Same architecture as the concierge line: the session says who listens,
 * and only frames addressed to that customer cross the stream.
 */
export async function GET(req: NextRequest) {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (!user) return new Response("unauthorised", { status: 401 });
  const userId = user.id;

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
      push(`data: ${JSON.stringify({ type: "hello", now: Date.now() })}\n\n`);
      const off = onNotify((toUserId, frame) => {
        if (toUserId === userId) push(`data: ${JSON.stringify(frame)}\n\n`);
      });
      const heartbeat = setInterval(() => push(`: ping\n\n`), 25_000);
      req.signal.addEventListener("abort", () => {
        closed = true;
        off();
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
