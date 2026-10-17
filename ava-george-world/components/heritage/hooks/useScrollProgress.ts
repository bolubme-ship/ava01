"use client";

import { useEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Mutable progress shared with the render loop (0 = top of track, 1 = bottom). */
export interface ScrollProgress {
  value: number;
}

/**
 * Maps scroll position over `trackRef` to a 0..1 value via GSAP ScrollTrigger.
 *
 * The value lives in a ref so scrolling never re-renders React; the 3D
 * render loop reads it every frame. Because the tween is scrubbed, scrolling
 * back up runs it in reverse automatically.
 */
export function useScrollProgress(
  trackRef: RefObject<HTMLElement | null>,
  { reducedMotion }: { reducedMotion: boolean },
) {
  const progress = useRef<ScrollProgress>({ value: 0 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        progress.current,
        { value: 0 },
        {
          value: 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            // Smooth scrolling already glides the page, so a short scrub
            // just rounds off the camera's starts and stops; reduced motion
            // ties progress directly to the scrollbar with no inertia.
            scrub: reducedMotion ? true : 1.2,
            invalidateOnRefresh: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, [trackRef, reducedMotion]);

  return progress;
}
