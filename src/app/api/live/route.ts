import type { NextRequest } from "next/server";
import { pulse } from "@/lib/live";

export const dynamic = "force-dynamic";

/**
 * LA PREUVE VIVANTE — a Server-Sent Events stream of what the house is doing,
 * for any visitor, signed in or not.
 *
 * One frame every twenty seconds, plus one immediately on connection, plus a
 * heartbeat to keep intermediaries from closing an idle stream. It carries
 * aggregates and a city — never a name, never an order number.
 *
 * The stream is public on purpose: the numbers on it are numbers anyone could
 * obtain by counting the shelf. What it must never become is a firehose —
 * hence the interval, and hence the `Cache-Control: no-store` on the response.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const push = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const send = async () => {
        if (closed) return;
        try {
          const snapshot = await pulse();
          push(`event: pulse\ndata: ${JSON.stringify(snapshot)}\n\n`);
        } catch {
          // A failed read is not worth killing the stream over: the next
          // tick tries again, and the counters simply stay where they were.
          push(`event: pulse\ndata: ${JSON.stringify({ error: true })}\n\n`);
        }
      };

      await send();
      const timer = setInterval(() => void send(), 20_000);
      const heartbeat = setInterval(() => push(`: ping\n\n`), 25_000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(timer);
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
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      connection: "keep-alive",
      // The shop has no third-party analytics; this stream is ours alone.
      "x-robots-tag": "noindex",
    },
  });
}
