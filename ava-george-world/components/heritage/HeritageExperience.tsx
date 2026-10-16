"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import { CHAPTERS, SCROLL_PER_STOP, stopIndexForPedestal } from "./config";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { Hero, ScrollCue } from "./ui/Hero";
import { SiteHeader } from "./ui/SiteHeader";

// WebGL needs the browser, so the canvas is never server-rendered.
const HeritageCanvas = dynamic(() => import("./HeritageCanvas"), { ssr: false });

/**
 * The Heritage courtyard: a fixed full-screen 3D canvas behind a tall scroll
 * track. Each chapter section spans the scroll distance of one camera stop
 * (the last is a single screen), so section i starts exactly when the camera
 * reaches station i. Its copy is pinned while the camera lingers there.
 * Chapter 0 is the homepage hero.
 */
export function HeritageExperience() {
  const mainRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useScrollProgress(trackRef, { reducedMotion });

  const scrollToStop = useCallback(
    (stop: number) => {
      const section = document.getElementById(`stop-${stop}`);
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [reducedMotion],
  );

  const selectLook = useCallback((pedestal: number) => scrollToStop(stopIndexForPedestal(pedestal)), [scrollToStop]);

  return (
    <main ref={mainRef} id="top" className="relative">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <HeritageCanvas
          progress={progress}
          reducedMotion={reducedMotion}
          eventSource={mainRef}
          onSelectLook={selectLook}
          labelLayer={labelLayerRef}
        />
      </div>
      <div ref={labelLayerRef} className="pointer-events-none fixed inset-0 z-20 overflow-hidden" />
      {/* Soft scrim so overlay copy stays legible over bright walls. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#2a170c]/50 to-transparent"
        aria-hidden="true"
      />

      <SiteHeader />
      <ScrollCue />

      <div ref={trackRef} className="relative">
        {CHAPTERS.map((chapter, i) => (
          <section
            key={chapter.eyebrow}
            id={`stop-${i}`}
            style={{ height: i === CHAPTERS.length - 1 ? "100svh" : `${SCROLL_PER_STOP * 100}svh` }}
          >
            {i === 0 ? (
              <div className="sticky top-0">
                <Hero chapter={chapter} onExplore={() => scrollToStop(1)} />
              </div>
            ) : (
              <div className="sticky top-0 flex h-svh items-end px-4 pb-12 sm:px-10 sm:pb-16 lg:px-16">
                <div className="max-w-md text-[#fbf1e1]">
                  <p className="text-xs tracking-[0.3em] uppercase opacity-80">{chapter.eyebrow}</p>
                  <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{chapter.title}</h2>
                  <p className="mt-4 text-sm leading-relaxed opacity-90 sm:text-base">{chapter.body}</p>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
