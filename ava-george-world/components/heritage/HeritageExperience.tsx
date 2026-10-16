"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { CHAPTERS } from "./config";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { useScrollProgress } from "./hooks/useScrollProgress";

// WebGL needs the browser, so the canvas is never server-rendered.
const HeritageCanvas = dynamic(() => import("./HeritageCanvas"), { ssr: false });

/**
 * The Heritage courtyard: a fixed full-screen 3D canvas behind a tall scroll
 * track. Each chapter section is one viewport tall and lines up with one
 * camera station, so the copy and the camera arrive together.
 */
export function HeritageExperience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useScrollProgress(trackRef, { reducedMotion });

  return (
    <main className="relative">
      <div className="fixed inset-0" aria-hidden="true">
        <HeritageCanvas progress={progress} reducedMotion={reducedMotion} />
      </div>
      {/* Soft scrim so overlay copy stays legible over bright walls. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#2a170c]/55 to-transparent"
        aria-hidden="true"
      />

      <div ref={trackRef} className="relative">
        {CHAPTERS.map((chapter, i) => (
          <section
            key={chapter.eyebrow}
            className="flex h-svh items-end px-4 pb-12 sm:px-10 sm:pb-16 lg:px-16"
          >
            <div className="max-w-md text-[#fbf1e1]">
              <p className="text-xs tracking-[0.3em] uppercase opacity-80">{chapter.eyebrow}</p>
              {i === 0 ? (
                <h1 className="mt-3 font-display text-5xl leading-none sm:text-7xl">{chapter.title}</h1>
              ) : (
                <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{chapter.title}</h2>
              )}
              <p className="mt-4 text-sm leading-relaxed opacity-90 sm:text-base">{chapter.body}</p>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
