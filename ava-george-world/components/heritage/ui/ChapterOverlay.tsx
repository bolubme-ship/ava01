"use client";

import { useEffect, useRef, useState } from "react";
import type { Chapter } from "../config";
import type { ScrollProgress } from "../hooks/useScrollProgress";
import { Hero } from "./Hero";
import { MaskedWords, revealClass, revealDelay } from "./reveal";

/*
 * Each stop's copy shows from just before the camera arrives until it
 * starts to move on; between stops the screen is left to the scene.
 * Offsets are in stops (1 = the whole journey from one stop to the next).
 */
const SHOW_BEFORE = 0.12;
const SHOW_AFTER = 0.42;

/** The chapter whose copy should show at camera progress `p`, or -1 between stops. */
function chapterAt(p: number, count: number): number {
  const scaled = p * (count - 1);
  const nearest = Math.round(scaled);
  const offset = scaled - nearest;
  return offset >= -SHOW_BEFORE && offset <= SHOW_AFTER ? nearest : -1;
}

interface ChapterOverlayProps {
  chapters: Chapter[];
  /** Camera progress (0..1), the same smoothed value that drives the camera. */
  progress: { current: ScrollProgress };
  onExplore: () => void;
}

/**
 * Fixed layer holding every stop's copy. Only the current stop's copy is
 * revealed, in step with the camera rather than sliding with the page, so
 * text arrives as the shot settles and clears before the next one.
 */
export function ChapterOverlay({ chapters, progress, onExplore }: ChapterOverlayProps) {
  // Start with nothing shown so the hero copy animates in on load.
  const [active, setActive] = useState(-1);
  const current = useRef(-1);

  useEffect(() => {
    let frame = 0;
    const watch = () => {
      const next = chapterAt(progress.current.value, chapters.length);
      if (next !== current.current) {
        current.current = next;
        setActive(next);
      }
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);
    return () => cancelAnimationFrame(frame);
  }, [progress, chapters.length]);

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {chapters.map((chapter, i) => {
        const on = active === i;
        if (i === 0) {
          return (
            <div key={i} className="absolute inset-0" aria-hidden={!on}>
              <Hero chapter={chapter} active={on} onExplore={onExplore} />
            </div>
          );
        }
        if (chapter.silent) return null;
        return (
          <div
            key={i}
            className="absolute inset-0 flex items-end px-4 pb-14 sm:px-10 sm:pb-20 lg:px-16"
            aria-hidden={!on}
          >
            {/* Local shade behind the copy, so it reads over bright floor and walls. */}
            <div
              className={`absolute bottom-0 left-0 h-2/3 w-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(42,23,12,0.6),rgba(42,23,12,0.25)_45%,transparent_70%)] transition-opacity duration-700 sm:w-3/4 ${
                on ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />
            <div className="relative max-w-md text-[#fffaf2]">
              {chapter.eyebrow && (
                <>
                  <p
                    className={`text-xs font-medium tracking-[0.34em] uppercase drop-shadow ${revealClass(on)}`}
                    style={revealDelay(on, 0)}
                  >
                    {chapter.eyebrow}
                  </p>
                  <span
                    className={`mt-4 mb-4 block h-px w-10 origin-left bg-[#fffaf2]/80 transition-[scale,opacity] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      on ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                    }`}
                    style={revealDelay(on, 120)}
                  />
                </>
              )}
              <p className="font-display text-[clamp(2.6rem,5vw,4.25rem)] leading-[0.95] font-medium drop-shadow-[0_2px_12px_rgba(42,23,12,0.4)]">
                <MaskedWords text={chapter.title} active={on} delay={chapter.eyebrow ? 180 : 60} />
              </p>
              {chapter.body && (
                <p
                  className={`mt-4 max-w-sm text-sm leading-relaxed text-[#fffaf2]/90 drop-shadow sm:text-base ${revealClass(on)}`}
                  style={revealDelay(on, 420)}
                >
                  {chapter.body}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
