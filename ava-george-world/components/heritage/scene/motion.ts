"use client";

import { createContext, useContext } from "react";

/**
 * Whether ambient scene motion (wind in flowers, swaying fabric, drifting
 * clouds) should run. False when the visitor prefers reduced motion.
 */
export const AmbientMotionContext = createContext(true);

export function useAmbientMotion(): boolean {
  return useContext(AmbientMotionContext);
}
