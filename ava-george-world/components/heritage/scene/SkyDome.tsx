"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, type Mesh } from "three";
import { useHeritageTexture } from "./assets";
import { useAmbientMotion } from "./motion";

interface SkyDomeProps {
  radius?: number;
}

/**
 * Photographed golden-hour sky (blue overhead, warm haze at the horizon,
 * sunlit clouds) wrapped around an upper hemisphere. The image is stored
 * side by side with its mirror image, so it wraps all the way round
 * without a seam. The dome
 * turns very slowly, so the clouds drift.
 */
export function SkyDome({ radius = 140 }: SkyDomeProps) {
  const sky = useHeritageTexture("sky");
  const dome = useRef<Mesh>(null);
  const animate = useAmbientMotion();

  useFrame((_, delta) => {
    if (dome.current && animate) dome.current.rotation.y += delta * 0.004;
  });

  return (
    // Hemisphere dipped a few degrees below the horizon so no gap shows.
    <mesh ref={dome} renderOrder={-1} position={[0, -radius * 0.06, 0]}>
      <sphereGeometry args={[radius, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial map={sky} side={BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
