"use client";

import { useEffect, useState } from "react";
import type { Chapter } from "../config";

interface HeroProps {
  chapter: Chapter;
  onExplore: () => void;
}

/**
 * Opening overlay: eyebrow, serif title, intro and the primary call to
 * action, set over the left side of the hero archway shot.
 */
export function Hero({ chapter, onExplore }: HeroProps) {
  return (
    <div className="relative flex h-svh items-end px-4 pt-24 pb-28 sm:px-10 md:items-center md:pb-0 lg:px-16">
      {/* Soft shade on the left so the copy stays legible over sunlit walls. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#2a170c]/55 via-[#2a170c]/20 to-transparent md:w-[60%]"
        aria-hidden="true"
      />
      <div className="relative max-w-xl text-[#fffaf2]">
        <p className="text-xs font-medium tracking-[0.34em] uppercase drop-shadow sm:text-sm">{chapter.eyebrow}</p>
        <span className="mt-5 block h-px w-12 bg-[#fffaf2]/80" aria-hidden="true" />
        <h1 className="mt-6 font-display text-[clamp(3.1rem,7.2vw,6.6rem)] leading-[0.95] font-medium text-balance drop-shadow-[0_2px_12px_rgba(42,23,12,0.35)]">
          {chapter.title.split(" ").map((word, i) => (
            <span key={i} className="md:block">
              {word}{" "}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-[24rem] text-base leading-relaxed text-[#fffaf2]/95 drop-shadow sm:text-lg">
          {chapter.body}
        </p>
        <button
          type="button"
          onClick={onExplore}
          className="group mt-9 inline-flex items-center gap-4 rounded-full bg-[#a9472b] px-8 py-4 text-sm font-medium tracking-[0.18em] text-white uppercase shadow-[0_10px_30px_-10px_rgba(80,25,10,0.7)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#93391f] hover:shadow-[0_16px_36px_-12px_rgba(80,25,10,0.8)] focus-visible:ring-2 focus-visible:ring-[#fffaf2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#a9472b] focus-visible:outline-none active:translate-y-0"
        >
          Explore the courtyard
          <svg
            viewBox="0 0 20 12"
            className="h-3 w-5 transition-transform duration-300 group-hover:translate-x-1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path d="M0 6h18M13 1l5 5-5 5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** "Scroll to explore" prompt pinned bottom-centre; fades once the visitor starts scrolling. */
export function ScrollCue() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2 text-[#fffaf2] transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <span className="text-[11px] tracking-[0.32em] uppercase drop-shadow">Scroll to explore</span>
      <svg viewBox="0 0 12 16" className="h-4 w-3 motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path d="M6 0v14M1 9l5 5 5-5" />
      </svg>
    </div>
  );
}
