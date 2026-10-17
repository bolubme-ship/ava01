"use client";

import type { Chapter } from "../config";
import { MaskedWords, revealClass, revealDelay } from "./reveal";

interface HeroProps {
  chapter: Chapter;
  /** Whether the camera is at the hero shot; the copy reveals and hides with it. */
  active: boolean;
  onExplore: () => void;
}

/**
 * Opening overlay: eyebrow, serif title and the primary call to action, set
 * over the left side of the hero archway shot. It reveals line by line on
 * load and fades away as the camera sets off into the courtyard.
 */
export function Hero({ chapter, active, onExplore }: HeroProps) {
  return (
    <div className="relative flex h-svh items-end px-4 pt-24 pb-28 sm:px-10 md:items-center md:pb-0 lg:px-16">
      {/* Soft shade on the left so the copy stays legible over sunlit walls. */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#2a170c]/55 via-[#2a170c]/20 to-transparent transition-opacity duration-700 md:w-[60%] ${
          active ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <div className="relative max-w-xl text-[#fffaf2]">
        <p
          className={`text-xs font-medium tracking-[0.34em] uppercase drop-shadow sm:text-sm ${revealClass(active)}`}
          style={revealDelay(active, 0)}
        >
          {chapter.eyebrow}
        </p>
        <span
          className={`mt-5 block h-px w-12 origin-left bg-[#fffaf2]/80 transition-[scale,opacity] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
          }`}
          style={revealDelay(active, 150)}
          aria-hidden="true"
        />
        <h1 className="mt-6 font-display text-[clamp(3.1rem,7.2vw,6.6rem)] leading-[0.95] font-medium text-balance drop-shadow-[0_2px_12px_rgba(42,23,12,0.35)]">
          <MaskedWords text={chapter.title} active={active} delay={200} stagger={110} blockWords />
        </h1>
        {chapter.body && (
          <p
            className={`mt-6 max-w-[24rem] text-base leading-relaxed text-[#fffaf2]/95 drop-shadow sm:text-lg ${revealClass(active)}`}
            style={revealDelay(active, 520)}
          >
            {chapter.body}
          </p>
        )}
        <div className={`mt-9 ${revealClass(active)}`} style={revealDelay(active, 650)}>
          <button
            type="button"
            onClick={onExplore}
            tabIndex={active ? 0 : -1}
            aria-label="Scroll to explore the courtyard"
            className={`group inline-flex items-center gap-3 rounded-full bg-[#a9472b] py-1.5 pr-1.5 pl-6 text-sm font-medium tracking-[0.2em] text-white uppercase shadow-[0_10px_30px_-10px_rgba(80,25,10,0.7)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#93391f] focus-visible:ring-2 focus-visible:ring-[#fffaf2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#a9472b] focus-visible:outline-none active:translate-y-0 ${
              active ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            Scroll
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fffaf2] text-[#a9472b]">
              <svg
                viewBox="0 0 12 16"
                className="h-4 w-3 motion-safe:animate-bounce"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                aria-hidden="true"
              >
                <path d="M6 1v13M1.5 9.5 6 14l4.5-4.5" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
