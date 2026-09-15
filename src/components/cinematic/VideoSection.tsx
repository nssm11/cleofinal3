"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CinematicVideo } from "./VideoLoader";
import { SectionOverlay } from "./SectionOverlay";
import { CategoryIntro } from "./CategoryIntro";

// Idempotent — every chapter registers the plugin exactly once per process.
gsap.registerPlugin(ScrollTrigger);

/**
 * VideoSection — a chapter of the film.
 *
 * Each rayon is a full-viewport scene of 100vh. The transitions are the
 * brief, and nothing more:
 *
 *   · the chapter that leaves breathes outward — scale 1 → 1.03, opacity 1 → 0.8 —
 *     scrubbed across the last screenful, so speed is always the visitor's;
 *   · the chapter that arrives rises — opacity 0 → 1, y 30 → 0, ~1 s, ease-out —
 *     a discrete entrance, played once per direction;
 *   · a whisper of parallax on the image (±3 %) keeps the frame alive.
 *
 * With reduced motion the film becomes a gallery: every frame simply shows.
 */
export function VideoSection({
  id,
  index,
  total,
  video,
  poster,
  kicker,
  title,
  ctaLabel,
  href,
}: {
  id: string;
  index: number;
  total: number;
  /** Base file name without extension: `category-skin` becomes desktop + mobile sources. */
  video: string;
  /** Poster file name without extension, from /videos/posters. */
  poster: string;
  kicker: string;
  title: string;
  ctaLabel: string;
  href: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    const intro = introRef.current;
    if (!section || !image || !intro) return;

    const ctx = gsap.context(() => {
      // The arriving chapter begins below the fold, waiting to rise.
      gsap.set(intro, { opacity: 0, y: 30 });

      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        // 01 · THE ARRIVAL — discrete, ease-out, one beat per direction.
        const arrive = () => gsap.to(intro, { opacity: 1, y: 0, duration: 1.05, ease: "power2.out", overwrite: true });
        const withdraw = () => gsap.to(intro, { opacity: 0, y: 30, duration: 0.75, ease: "power2.in", overwrite: true });

        ScrollTrigger.create({
          trigger: section,
          start: "top 82%",
          toggleActions: "play none none reverse",
          onEnter: arrive,
          onEnterBack: arrive,
          onLeave: withdraw,
          onLeaveBack: withdraw,
        });

        // 02 · THE DEPARTURE — the previous frame breathes out as the next enters.
        gsap.fromTo(
          image,
          { scale: 1, opacity: 1 },
          {
            scale: 1.03,
            opacity: 0.8,
            ease: "power1.out",
            scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 },
          },
        );

        // 03 · THE PARALLAX — a breath of depth across the whole pass.
        gsap.fromTo(
          image,
          { yPercent: -3 },
          {
            yPercent: 3,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 },
          },
        );
      });

      // Reduced motion (or first paint before the match runs): a visible frame.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(intro, { opacity: 1, y: 0 });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id={id} className="cine-scene" aria-label={kicker}>
      <div ref={imageRef} className="absolute inset-0 will-change-transform">
        <CinematicVideo
          sources={{ desktop: `/videos/${video}.mp4`, mobile: `/videos/${video}-mobile.mp4` }}
          poster={`/videos/posters/${poster}.jpg`}
          alt={title}
          videoClassName="absolute -top-[6%] left-0 h-[112%] w-full"
        />
      </div>
      <SectionOverlay />
      <div ref={introRef} className="absolute inset-0 will-change-[opacity,transform]">
        <CategoryIntro index={index} total={total} kicker={kicker} title={title} ctaLabel={ctaLabel} href={href} />
      </div>
    </section>
  );
}
