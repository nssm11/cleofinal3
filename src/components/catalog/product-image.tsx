"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { PRODUCT_BLUR_DATA_URL, PRODUCT_PLACEHOLDER_SRC, resolveProductImage } from "@/lib/media";

/**
 * LE CADRE — the one frame the house hangs product photographs in.
 *
 * A `fill` photograph with the shelf's marble breath behind it while it
 * develops, and the house plate if the file is missing or unreachable. The
 * frame never renders an empty box and never throws on a broken address:
 * a missing photograph degrades to the monogram, not to a grey hole.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  style,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const wanted = resolveProductImage(src) ?? PRODUCT_PLACEHOLDER_SRC;
  const [prevSrc, setPrevSrc] = useState(src);
  const [current, setCurrent] = useState(wanted);
  // A new address resets the frame — including recovering from the fallback.
  if (src !== prevSrc) {
    setPrevSrc(src);
    setCurrent(wanted);
  }
  return (
    <Image
      src={current}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
      placeholder="blur"
      blurDataURL={PRODUCT_BLUR_DATA_URL}
      onError={() => setCurrent((c) => (c === PRODUCT_PLACEHOLDER_SRC ? c : PRODUCT_PLACEHOLDER_SRC))}
    />
  );
}
