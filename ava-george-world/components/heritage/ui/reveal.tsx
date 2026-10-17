import type { CSSProperties } from "react";

/*
 * Shared entrance / exit for overlay copy. Entering, each line rises a
 * little and comes into focus on a long ease-out, staggered by `delay`;
 * leaving, everything fades together, quickly and without delay, so copy
 * never lingers over the next shot. Reduced motion keeps only the fade.
 */

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/** Classes for a line of copy that reveals with its chapter. */
export function revealClass(active: boolean): string {
  return `transition-[opacity,translate,filter] ${EASE} motion-reduce:translate-y-0 motion-reduce:blur-[0px] ${
    active ? "opacity-100 translate-y-0 blur-[0px] duration-[1100ms]" : "opacity-0 translate-y-5 blur-[6px] duration-[450ms]"
  }`;
}

/** Classes for one title word rising out of its mask (see `MaskedWords`). */
export function riseClass(active: boolean): string {
  return `inline-block transition-[translate,opacity] ${EASE} motion-reduce:translate-y-0 ${
    active ? "translate-y-0 opacity-100 duration-[1200ms]" : "translate-y-[110%] opacity-0 duration-[450ms]"
  }`;
}

/** Stagger only on the way in. */
export function revealDelay(active: boolean, ms: number): CSSProperties {
  return { transitionDelay: active ? `${ms}ms` : "0ms" };
}

/**
 * A title whose words each rise out of a clipped line, one after another.
 * `blockWords` stacks the words on their own lines from md up (the hero).
 */
export function MaskedWords({
  text,
  active,
  delay,
  stagger = 80,
  blockWords = false,
}: {
  text: string;
  active: boolean;
  delay: number;
  stagger?: number;
  blockWords?: boolean;
}) {
  return text.split(" ").map((word, i) => (
    <span
      key={i}
      className={`inline-block overflow-hidden pb-[0.14em] align-bottom ${blockWords ? "md:block" : ""}`}
    >
      <span className={riseClass(active)} style={revealDelay(active, delay + i * stagger)}>
        {word}
        {" "}
      </span>
    </span>
  ));
}
