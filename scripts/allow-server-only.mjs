/**
 * Neutralise the `server-only` guard for the offline maintenance scripts
 * (`scripts/smoke.ts`).
 *
 * The business modules deliberately start with `import "server-only"`, which is
 * the right guard inside Next — but that package throws unconditionally when it
 * is loaded outside a Server Component, so `tsx scripts/smoke.ts` died on its
 * very first import before reaching a single line of real logic.
 *
 * `tsx` transpiles those ESM imports down to `require()`, so the asynchronous
 * `module.register()` hooks never see the specifier. `module.registerHooks()`
 * patches the synchronous CommonJS resolution path as well, which is the one
 * that matters here. Only this process is affected: nothing in `next build` or
 * `next dev` loads this file.
 *
 * Usage: node --import ./scripts/allow-server-only.mjs --import tsx scripts/smoke.ts
 */
import { registerHooks } from "node:module";

const STUB = new URL("./server-only-stub.mjs", import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: STUB, shortCircuit: true, format: "module" };
    return nextResolve(specifier, context);
  },
});
