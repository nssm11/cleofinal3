"use client";

import { useEffect, useRef, useState } from "react";
import "./targo.css";

const HERO_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260823_050407_500d0339-ab28-41c1-9688-132a74a3b5aa.mp4";
const ABOUT_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260823_063501_2e2c8971-de1e-473a-8611-a0c9ae7ee186.mp4";

const NAV_LINKS = [
  { label: "HOME", href: "#home" },
  { label: "ABOUT", href: "#about" },
  { label: "CONTACT US", href: "#contact" },
] as const;

/**
 * Browsers throttle `autoplay` until the video is muted AND the user has
 * interacted — so we set `muted` before every attempt, retry `play()` every
 * second until it takes, and nudge once on the first click/touchstart.
 * Rejections are swallowed on purpose: a blocked start is not an error.
 *
 * A `prefers-reduced-motion` user gets a still frame instead of a loop:
 * we never auto-start, and we stop the moment the preference turns on.
 */
function useAutoplayRetry(ref: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stopped = false;

    const tryPlay = () => {
      if (stopped || reducedMotion.matches) return;
      video.muted = true;
      const attempt = video.play();
      if (attempt !== undefined) {
        attempt
          .then(() => {
            stopped = true;
          })
          .catch(() => {
            /* not allowed yet — the interval keeps trying */
          });
      }
    };

    const timer = window.setInterval(() => {
      if (!video.paused) {
        stopped = true;
        window.clearInterval(timer);
        return;
      }
      tryPlay();
    }, 1000);

    const onFirstGesture = () => {
      tryPlay();
      window.removeEventListener("click", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
    };
    window.addEventListener("click", onFirstGesture);
    window.addEventListener("touchstart", onFirstGesture);

    const onMotionPreference = (event: MediaQueryListEvent) => {
      if (event.matches) {
        video.pause();
      } else {
        stopped = false;
        tryPlay();
      }
    };
    reducedMotion.addEventListener("change", onMotionPreference);

    if (reducedMotion.matches) {
      video.pause();
    } else {
      tryPlay();
    }

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("click", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      reducedMotion.removeEventListener("change", onMotionPreference);
    };
  }, [ref]);
}

/**
 * The CloudFront host is external and can fail (DNS, block, expiry). A
 * broken media frame is worse than the flat #F2F1F0 ground behind it, so a
 * failed video simply steps aside.
 */
const hideFailedVideo = (event: React.SyntheticEvent<HTMLVideoElement>) => {
  console.warn("[targo] video failed to load:", event.currentTarget.src);
  event.currentTarget.style.display = "none";
};

function MailIcon() {
  return (
    <svg
      width="17"
      height="13"
      viewBox="0 0 17 13"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0.7" y="0.7" width="15.6" height="11.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M1.4 1.7 L8.5 7.3 L15.6 1.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TargoPage() {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const aboutVideoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useAutoplayRetry(heroVideoRef);
  useAutoplayRetry(aboutVideoRef);

  /* The hamburger only exists at ≤700px — close the menu on grow-back. */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 700) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <main className="targo" lang="en">
      {/* ————— Section 1 — Hero ————— */}
      <section className="targo-hero" id="home" aria-label="Targo introduction">
        <video
          ref={heroVideoRef}
          className="targo-hero__video"
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={hideFailedVideo}
        />
        <div className="targo-hero__scrim" aria-hidden="true" />

        <header className="targo-nav">
          <a className="targo-logo" href="#home" aria-label="Targo — home">
            <span className="targo-logo__mark" aria-hidden="true">
              <span className="targo-logo__ellipse" />
            </span>
            <span className="targo-logo__word">targo</span>
          </a>

          <nav className="targo-nav__links" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a key={link.label} className="targo-nav__link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <span className="targo-nav__contact-glow">
            <a className="targo-nav__contact" href="#contact">
              <MailIcon />
              <span>Contact us</span>
            </a>
          </span>

          <button
            type="button"
            className="targo-nav__burger"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="targo-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>

        {menuOpen && (
          <nav
            id="targo-mobile-menu"
            className="targo-mobile-menu"
            aria-label="Mobile"
          >
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <h1 className="targo-headline">
          <span className="targo-line">SCALING</span>
          <span className="targo-line">THE</span>
          <span className="targo-line">PLATFORM</span>
          <span className="targo-line targo-line--indent">FOR</span>
          <span className="targo-line targo-line--indent">YOUR</span>
          <span className="targo-line targo-line--indent targo-line--accent">
            BUSINESS
          </span>
        </h1>

        <div className="targo-cta">
          <span className="targo-btn-glow">
            <a className="targo-btn" href="#about">
              GET STARTED
            </a>
          </span>
          <span className="targo-cta__line" aria-hidden="true" />
        </div>
      </section>

      {/* ————— Section 2 — About ————— */}
      <section className="targo-about" id="about" aria-label="About Targo">
        <div className="targo-about__left">
          <h2 className="targo-about__title">
            <span className="targo-line">ABOUT</span>
            <span className="targo-line targo-line--indent-about targo-line--accent">
              BUSINESS
            </span>
          </h2>
          <p className="targo-about__text">
            Targo builds the testing infrastructure modern teams rely on. From
            automated pipelines to full-scale QA audits, we make sure your
            software ships fast and breaks nothing. Hundreds of releases, zero
            surprises.
          </p>
          <span className="targo-btn-glow targo-about__more">
            <a className="targo-btn" href="#contact">
              LEARN MORE
            </a>
          </span>
        </div>

        <div className="targo-about__right">
          <video
            ref={aboutVideoRef}
            className="targo-about__video"
            src={ABOUT_VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={hideFailedVideo}
          />
          <div className="targo-about__tint" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}
