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
 *   · the chapter that arrives rises — the *words*, opacity 0 → 1, y 30 → 0,
 *     ~1 s ease-out, played once per direction.
 *
 * The image itself is no longer touched. It used to be scaled to 1.03 and
 * faded to 0.8 as it left, then pushed through a parallax that forced it to
 * be 106 % of its own height — three transformations that cost sharpness and
 * bought nothing but an effect. A film shown at its real size, at its real
 * quality, is the effect.
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
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const intro = introRef.current;
    if (!section || !intro) return;

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
      });

      // Reduced motion (or first paint before the match runs): a visible frame.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(intro, { opacity: 1, y: 0 });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id={id} className="bg-petrol text-chalk" aria-label={kicker}>
      {/* The frame, exactly as it was shot: full width, full height, no crop
          by percentage, no transform for the sake of a transform. */}
      <div className="absolute inset-0">
        <CinematicVideo
          sources={{ desktop: `/videos/${video}.mp4`, mobile: `/videos/${video}-mobile.mp4` }}
          poster={`/videos/posters/${poster}.jpg`}
          alt={title}
          videoClassName="absolute inset-0 h-full w-full"
        />
      </div>
      <SectionOverlay />
      <div ref={introRef} className="absolute inset-0 will-change-[opacity,transform]">
        <CategoryIntro index={index} total={total} kicker={kicker} title={title} ctaLabel={ctaLabel} href={href} />
      </div>
    </section>
  );
}
