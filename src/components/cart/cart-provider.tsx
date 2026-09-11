"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { addLine, removeLine, setQtyLine, type CartLine, type CartState } from "@/lib/cart";
import { EASE_LUXE, D } from "@/lib/motion";

type Ctx = CartState & {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /**
   * Add a line. Pass the element the product was picked from to play the
   * product→cart flight; omit it for quantity changes and re-orders.
   */
  add: (line: Omit<CartLine, "quantity">, qty?: number, from?: HTMLElement | null) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  setGiftWrap: (v: boolean) => void;
  setNote: (v: string) => void;
  setPromoCode: (v: string) => void;
  count: number;
  subtotal: number;
  hydrated: boolean;
  recentlyViewed: number[];
  pushRecentlyViewed: (id: number) => void;
};

const KEY = "cleo.cart.v1";
const RV_KEY = "cleo.rv.v1";
const EMPTY: CartState = { lines: [], giftWrap: false, note: "", promoCode: "" };
// Stable server/first-render snapshot: empty AND not yet hydrated, so the client
// first render matches the server and never flashes "empty" before reading storage.
const FALLBACK = { ...EMPTY, hydrated: false };

type StoreValue = CartState & { hydrated: boolean };

// Single external source of truth, synced with localStorage and other tabs.
// `useSyncExternalStore` reads it, so the UI converges on one value.
let mounted = false;
const listeners = new Set<() => void>();
let cache: StoreValue = FALLBACK;

function read(): CartState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<CartState>) };
  } catch {
    /* corrupt entry — treat as empty rather than crash */
  }
  return EMPTY;
}

function commit(next: CartState) {
  const hydrated = cache.hydrated;
  cache = { ...next, hydrated };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full / disabled — keep in-memory state */
    }
  }
  for (const l of listeners) l();
}

function snapshot(): StoreValue {
  return mounted ? cache : FALLBACK;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) {
      cache = { ...read(), hydrated: cache.hydrated };
      for (const l of listeners) l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function withCurrent(mut: (s: CartState) => CartState) {
  commit(mut(read()));
}

const CartCtx = createContext<Ctx | null>(null);
export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}

/* ── The flight ────────────────────────────────────────────────────────────
   When a product leaves a shelf, a copy of its photograph travels to the cart.
   It is the one gesture that explains, without words, where the item went.
   Pointer-driven only: on touch devices the tray opening is the feedback. */
type Flight = { key: number; image: string; from: { x: number; y: number; w: number; h: number }; to: { x: number; y: number; w: number; h: number } };

function FlightLayer({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ x: flight.from.x, y: flight.from.y, width: flight.from.w, height: flight.from.h, opacity: 1 }}
        animate={{
          x: flight.to.x,
          y: flight.to.y,
          width: flight.to.w,
          height: flight.to.h,
          opacity: 0.15,
        }}
        transition={{ duration: 0.66, ease: EASE_LUXE }}
        onAnimationComplete={onDone}
        className="absolute left-0 top-0 overflow-hidden bg-marble shadow-float"
        style={{ willChange: "transform, width, height, opacity" }}
      >
        {/*
         * A raw <img> on purpose: this clone exists for 660 ms, is created at the
         * moment of the click, and is only drawn from an image the page has
         * already loaded. Routing it through next/image would add a request for
         * an optimised variant at the very moment the animation must start, so
         * the browser cache is the better source here.
         */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flight.image} alt="" className="h-full w-full object-cover" />
      </motion.div>
    </motion.div>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const reduce = useReducedMotion();
  const [recentlyViewed, setRV] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const rv = window.localStorage.getItem(RV_KEY);
      if (rv) return JSON.parse(rv) as number[];
    } catch {
      /* ignore */
    }
    return [];
  });

  const state = useSyncExternalStore(subscribe, snapshot, () => FALLBACK);

  useEffect(() => {
    mounted = true;
    cache = { ...read(), hydrated: true };
    for (const l of listeners) l();
    const onFocus = () => {
      cache = { ...read(), hydrated: cache.hydrated };
      for (const l of listeners) l();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.hydrated) {
      try {
        window.localStorage.setItem(RV_KEY, JSON.stringify(recentlyViewed));
      } catch {
        /* ignore */
      }
    }
  }, [recentlyViewed, state.hydrated]);

  const fly = useCallback(
    (image: string | null, from: HTMLElement | null | undefined) => {
      if (!image || !from || reduce || typeof window === "undefined") return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const anchor = document.querySelector<HTMLElement>("[data-cart-anchor]");
      if (!anchor) return;
      const a = from.getBoundingClientRect();
      const b = anchor.getBoundingClientRect();
      if (!a.width || !b.width) return;
      setFlight({
        key: Date.now(),
        image,
        from: { x: a.left, y: a.top, w: a.width, h: a.height },
        to: { x: b.left + b.width / 2 - 14, y: b.top + b.height / 2 - 14, w: 28, h: 28 },
      });
    },
    [reduce],
  );

  const add = useCallback(
    (line: Omit<CartLine, "quantity">, qty = 1, from?: HTMLElement | null) => {
      withCurrent((s) => ({ ...s, lines: addLine(s.lines, line, qty) }));
      fly(line.image, from);
    },
    [fly],
  );
  const setQty = useCallback((productId: number, qty: number) => withCurrent((s) => ({ ...s, lines: setQtyLine(s.lines, productId, qty) })), []);
  const remove = useCallback((productId: number) => withCurrent((s) => ({ ...s, lines: removeLine(s.lines, productId) })), []);
  const clear = useCallback(() => withCurrent(() => ({ lines: [], giftWrap: false, note: "", promoCode: "" })), []);
  const setGiftWrap = useCallback((giftWrap: boolean) => withCurrent((s) => ({ ...s, giftWrap })), []);
  const setNote = useCallback((note: string) => withCurrent((s) => ({ ...s, note })), []);
  const setPromoCode = useCallback((promoCode: string) => withCurrent((s) => ({ ...s, promoCode })), []);
  const pushRecentlyViewed = useCallback((id: number) => setRV((r) => [id, ...r.filter((x) => x !== id)].slice(0, 8)), []);

  // Until the store has mounted and read localStorage we must not present the
  // cart as empty — we simply don't know yet.
  const count = state.hydrated ? state.lines.reduce((a, l) => a + l.quantity, 0) : 0;
  const subtotal = state.hydrated ? state.lines.reduce((a, l) => a + l.priceMillimes * l.quantity, 0) : 0;

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQty,
      remove,
      clear,
      setGiftWrap,
      setNote,
      setPromoCode,
      count,
      subtotal,
      hydrated: state.hydrated,
      recentlyViewed,
      pushRecentlyViewed,
    }),
    [state, isOpen, add, setQty, remove, clear, setGiftWrap, setNote, setPromoCode, count, subtotal, recentlyViewed, pushRecentlyViewed],
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <AnimatePresence>
        {flight && (
          <motion.div key={flight.key} exit={{ opacity: 0 }} transition={{ duration: D.instant, ease: EASE_LUXE }}>
            <FlightLayer flight={flight} onDone={() => setFlight(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </CartCtx.Provider>
  );
}
