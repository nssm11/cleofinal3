"use client";
import { useActionState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SendIcon } from "@/components/icons";
import { useCopy } from "@/lib/i18n/client";
import { replyOwnTicketAction } from "@/actions/experience";

/** Continue one's own ticket: the thread that the staff answers in the back-office. */
export function ContinueTicket({ ticketId }: { ticketId: number }) {
  const copy = useCopy();
  const [state, action, pending] = useActionState(async (_p: { ok: boolean } | null, form: FormData) => {
    const r = await replyOwnTicketAction({ ticketId, text: String(form.get("text") ?? "") });
    return r;
  }, null);
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (state?.ok && !done.current) {
      done.current = true;
      router.refresh();
      setTimeout(() => (done.current = false), 1500);
    }
  }, [state, router]);
  return (
    <form action={action} className="mt-4 flex items-center gap-2">
      <label htmlFor={`sup-${ticketId}`} className="sr-only">{copy.chat.placeholder}</label>
      <input id={`sup-${ticketId}`} name="text" required minLength={3} maxLength={2000} placeholder={copy.chat.placeholder} className="field !min-h-11 flex-1 text-[13px]" />
      <button disabled={pending} aria-label={copy.chat.send} className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink text-paper transition-colors hover:bg-champagne-2 disabled:opacity-40">
        <SendIcon size={15} className="rtl-mirror" />
      </button>
    </form>
  );
}
