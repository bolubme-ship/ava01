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
      {/*
        Colour grade, done in CSS: a warm golden-hour wash and a soft vignette
        over the 3D scene. Plain alpha layers (no blend modes), so the browser
        composites them over the canvas without re-blending every frame.
      */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(60,25,8,0.35)_100%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 bg-[#ffb36b]/[0.04]" aria-hidden="true" />
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
            key={i}
            id={`stop-${i}`}
            style={{ height: i === CHAPTERS.length - 1 ? "100svh" : `${SCROLL_PER_STOP * 100}svh` }}
          >
            {i === 0 ? (
              <div className="sticky top-0">
                <Hero chapter={chapter} onExplore={() => scrollToStop(1)} />
              </div>
            ) : chapter.silent ? (
              <h2 className="sr-only">{chapter.title}</h2>
            ) : (
              <div className="sticky top-0 flex h-svh items-end px-4 pb-14 sm:px-10 sm:pb-20 lg:px-16">
                {/* Local shade behind the copy, so it reads over bright floor and walls. */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 h-2/3 w-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(42,23,12,0.6),rgba(42,23,12,0.25)_45%,transparent_70%)] sm:w-3/4"
                  aria-hidden="true"
                />
                <div className="relative max-w-md text-[#fffaf2]">
                  {chapter.eyebrow && (
                    <>
                      <p className="text-xs font-medium tracking-[0.34em] uppercase drop-shadow">{chapter.eyebrow}</p>
                      <span className="mt-4 mb-4 block h-px w-10 bg-[#fffaf2]/80" aria-hidden="true" />
                    </>
                  )}
                  <h2 className="font-display text-[clamp(2.6rem,5vw,4.25rem)] leading-[0.95] font-medium drop-shadow-[0_2px_12px_rgba(42,23,12,0.4)]">
                    {chapter.title}
                  </h2>
                  {chapter.body && (
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#fffaf2]/90 drop-shadow sm:text-base">
                      {chapter.body}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
