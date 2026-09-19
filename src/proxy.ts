import { NextResponse, type NextRequest } from "next/server";

/**
 * LA PORTE — the door, before anything is rendered.
 *
 * File convention: Next 16 renamed `middleware` to `proxy`. The old file name
 * still loads, but it is deprecated and its matcher is not honoured — this is
 * the file the framework actually runs.
 *
 * `/admin` already answered 307 for an anonymous visitor: its guard lives in
 * the topmost layout of that branch, so nothing is rendered before it runs.
 * `/compte` did not — its guard lives in a nested layout, under the public
 * site shell, and Next flushes that shell (and a 200) before the guard gets a
 * chance to redirect. The private room handed out a 200 and a rendered
 * document to a visitor who is not signed in.
 *
 * The proxy closes the door earlier: it runs before rendering, looks at the
 * session cookie only, and redirects to `connexion?next=…` when that cookie
 * is absent.
 *
 * It is deliberately NOT an authorisation check — it cannot be: the Edge has
 * no database, and a stale or forged cookie is a real possibility. It only
 * answers the one question that can be answered cheaply and safely here:
 * "is there anything that looks like a session at all?" Every page still
 * performs its own real check (`getCurrentUser`, `requireStaff`,
 * `requireAdmin`). The rule of a hotel corridor: the door keeps the street
 * out, the key still opens the room.
 */

const SESSION_COOKIE = "cleo_session";

/** Branches that exist only for a signed-in visitor. */
const PRIVATE = ["/compte", "/admin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The branch check lives here as well as in `config.matcher` below: the
  // matcher is a build-time filter, and a proxy that ever runs on the wrong
  // branch turns the whole shop into a redirect loop. Cheap, and it makes
  // the behaviour impossible to get wrong by configuration alone.
  if (!PRIVATE.some((base) => pathname === base || pathname.startsWith(`${base}/`))) {
    return NextResponse.next();
  }

  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/connexion";
  url.search = "";
  // Keep the whole destination, query included, so the visitor lands where
  // they were going after signing in.
  url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(url, 307);
}

export const config = {
  /**
   * Only the two private branches — never `/`, never `/_next`, never an
   * asset. A matcher that is too broad turns every anonymous visit into a
   * redirect loop.
   *
   * These patterns must be **string literals**. Next reads them out of the
   * file's syntax tree at build time; it does not evaluate the module. A
   * computed matcher — `PRIVATE.map((p) => \`${p}/:path*\`)` — is silently
   * ignored, the proxy then runs on *every* route, and the whole shop
   * answers 500. The branch test inside the function is the safety net for
   * exactly that failure.
   */
  matcher: ["/compte", "/compte/:path*", "/admin", "/admin/:path*"],
};

export default proxy;
