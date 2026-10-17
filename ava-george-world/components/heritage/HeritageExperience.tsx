"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import { CHAPTERS, SCROLL_PER_STOP, stopIndexForPedestal } from "./config";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { useScrollProgress } from "./hooks/useScrollProgress";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { ChapterOverlay } from "./ui/ChapterOverlay";
import { ScrollCue } from "./ui/Hero";
import { SiteHeader } from "./ui/SiteHeader";

// WebGL needs the browser, so the canvas is never server-rendered.
const HeritageCanvas = dynamic(() => import("./HeritageCanvas"), { ssr: false });

/**
 * The Heritage courtyard: a fixed full-screen 3D canvas behind a tall scroll
 * track. Each chapter section spans the scroll distance of one camera stop
 * (the last is a single screen), so section i starts exactly when the camera
 * reaches station i. Its copy reveals in a fixed overlay as the camera
 * arrives and clears as it moves on. Chapter 0 is the homepage hero.
 */
export function HeritageExperience() {
  const mainRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useScrollProgress(trackRef, { reducedMotion });
  const lenis = useSmoothScroll(!reducedMotion);

  const scrollToStop = useCallback(
    (stop: number) => {
      const section = document.getElementById(`stop-${stop}`);
      if (!section) return;
      if (lenis.current) {
        // A long, eased glide so the camera travels rather than cuts.
        lenis.current.scrollTo(section, { duration: 2.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
        return;
      }
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    },
    [lenis, reducedMotion],
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

      <ChapterOverlay chapters={CHAPTERS} progress={progress} onExplore={() => scrollToStop(1)} />

      {/*
        The scroll track: one section per stop, sized to its share of the
        journey. The copy itself lives in the fixed overlay above, revealed in
        step with the camera; these headings keep the page's outline.
      */}
      <div ref={trackRef} className="relative">
        {CHAPTERS.map((chapter, i) => (
          <section
            key={i}
            id={`stop-${i}`}
            style={{ height: i === CHAPTERS.length - 1 ? "100svh" : `${SCROLL_PER_STOP * 100}svh` }}
          >
            {i > 0 && <h2 className="sr-only">{chapter.title}</h2>}
          </section>
        ))}
      </div>
    </main>
  );
}
