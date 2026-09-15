import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { join, normalize, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import type { SupportAttachmentMeta } from "@/db/schema";

/**
 * Conciergerie attachments — validated on the way in, stored outside the
 * public tree (data/ is gitignored), and served only through the authed
 * delivery route with their real content type.
 */
const ROOT = resolve(process.cwd(), "data", "attachments");
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

export type AttachmentError = "bad_type" | "too_big" | "empty";
export function attachmentError(e: unknown): e is AttachmentError {
  return typeof e === "object" && e !== null && "code" in e && typeof (e as { code: unknown }).code === "string";
}

export async function saveAttachment(file: File, ticketId: number): Promise<SupportAttachmentMeta> {
  const ext = ALLOWED[file.type];
  if (!ext) {
    const e = new Error("bad_type") as Error & { code: AttachmentError };
    e.code = "bad_type";
    throw e;
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.byteLength === 0) {
    const e = new Error("empty") as Error & { code: AttachmentError };
    e.code = "empty";
    throw e;
  }
  if (buf.byteLength > MAX_ATTACHMENT_BYTES) {
    const e = new Error("too_big") as Error & { code: AttachmentError };
    e.code = "too_big";
    throw e;
  }
  const fname = `${randomUUID().slice(0, 12)}.${ext}`;
  const key = `${ticketId}/${fname}`;
  await mkdir(join(ROOT, String(ticketId)), { recursive: true });
  await writeFile(join(ROOT, key), buf);
  return {
    name: (file.name ?? `fichier.${ext}`).slice(0, 120),
    mime: file.type,
    size: buf.byteLength,
    key,
  };
}

/**
 * Staging: a customer can attach a file BEFORE their conversation exists
 * (it lands under the `0/` staging folder). When the ticket is created, the
 * file is moved under the real ticket id.
 */
export async function rehomeAttachment(meta: SupportAttachmentMeta, ticketId: number): Promise<SupportAttachmentMeta> {
  if (!meta.key.startsWith("0/")) return meta;
  const file = meta.key.split("/")[1] ?? "";
  if (!FILE_RE.test(file)) return meta;
  const from = resolve(join(ROOT, "0", file));
  if (!from.startsWith(ROOT + sep)) return meta;
  const to = join(ROOT, String(ticketId), file);
  try {
    const { rename } = await import("node:fs/promises");
    await mkdir(join(ROOT, String(ticketId)), { recursive: true });
    await rename(from, to);
    return { ...meta, key: `${ticketId}/${file}` };
  } catch {
    return meta;
  }
}

const FILE_RE = /^[\w-]{4,20}\.(jpg|png|webp|gif|pdf)$/i;
const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", pdf: "application/pdf" };

/**
 * Resolve a stored attachment to an absolute path — only if the key is well
 * formed AND the file physically lives under the attachments root.
 */
export async function resolveAttachment(ticketId: number, file: string): Promise<{ path: string; mime: string } | null> {
  if (!FILE_RE.test(file)) return null;
  const ext = file.split(".").pop()!.toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;
  const candidate = resolve(join(ROOT, String(ticketId), file));
  if (!candidate.startsWith(ROOT + sep)) return null;
  return { path: candidate, mime };
}

/** Stored metadata can be anything — accept only well-formed keys. */
export function keyValid(key: string, ticketId: number): boolean {
  const parts = normalize(key).split(/[\\/]/);
  return parts.length === 2 && parts[0] === String(ticketId) && FILE_RE.test(parts[1]);
}
