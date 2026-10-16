"use client";

import { Canvas } from "@react-three/fiber";
import { CAMERA_STATIONS, PALETTE, PEDESTALS, facingRotation } from "./config";
import { CameraRig } from "./camera/CameraRig";
import type { ScrollProgress } from "./hooks/useScrollProgress";
import { Courtyard } from "./scene/Courtyard";
import { DisplayPedestal } from "./scene/DisplayPedestal";
import { Lighting } from "./scene/Lighting";
import { SkyDome } from "./scene/SkyDome";

export interface HeritageCanvasProps {
  progress: { current: ScrollProgress };
  reducedMotion: boolean;
}

/** Full-screen WebGL scene. Client-only; loaded via next/dynamic with ssr: false. */
export default function HeritageCanvas({ progress, reducedMotion }: HeritageCanvasProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: CAMERA_STATIONS[0].position, fov: 42, near: 0.1, far: 260 }}
    >
      <color attach="background" args={[PALETTE.sky]} />
      <fog attach="fog" args={[PALETTE.sky, 32, 100]} />
      <SkyDome horizon="#f6d3a2" zenith="#f3e6d0" radius={140} />

      <Lighting />
      <Courtyard />
      {PEDESTALS.map((p, i) => (
        <DisplayPedestal
          key={p.id}
          position={p.position}
          rotationY={facingRotation(i)}
          silhouette={p.silhouette}
          fabric={p.fabric}
          accent={p.accent}
          animate={!reducedMotion}
        />
      ))}

      <CameraRig progress={progress} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
