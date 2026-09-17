"use client";
import { useEffect, useRef, useState } from "react";

type Sources = { desktop: string; mobile: string };

export function CinematicVideo({ sources, poster, alt, eager }: { sources: Sources; poster?: string; alt?: string; eager?: boolean }) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);
  const src = isMobile ? sources.mobile : sources.desktop;
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video autoPlay muted loop playsInline preload={eager ? "auto" : "metadata"} poster={poster} aria-label={alt} className="h-full w-full object-cover">
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30" aria-hidden />
    </div>
  );
}

export function VideoLoader(props: any) {
  return <CinematicVideo {...props} />;
}

export default CinematicVideo;
