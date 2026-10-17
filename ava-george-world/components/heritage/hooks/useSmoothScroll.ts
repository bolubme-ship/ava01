"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Inertial smooth scrolling (Lenis): wheel and trackpad input glide to rest
 * instead of jumping in steps, which keeps the scroll-driven camera fluid.
 * Lenis is driven from GSAP's ticker so ScrollTrigger reads the smoothed
 * position on the same frame. Touch keeps the device's native scrolling.
 * Disabled (null) when the visitor prefers reduced motion.
 */
export function useSmoothScroll(enabled: boolean) {
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const instance = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9 });
    lenis.current = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis.current = null;
    };
  }, [enabled]);

  return lenis;
}
