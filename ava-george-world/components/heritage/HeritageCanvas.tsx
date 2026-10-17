"use client";

import { Suspense, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { CAMERA_STATIONS, PALETTE, PEDESTALS, facingRotation } from "./config";
import { CameraRig } from "./camera/CameraRig";
import type { ScrollProgress } from "./hooks/useScrollProgress";
import { Courtyard } from "./scene/Courtyard";
import { DisplayPedestal } from "./scene/DisplayPedestal";
import { InnerHall } from "./scene/InnerHall";
import { Lighting } from "./scene/Lighting";
import { PostEffects } from "./scene/PostEffects";
import { AmbientMotionContext } from "./scene/motion";
import { SkyDome } from "./scene/SkyDome";

export interface HeritageCanvasProps {
  progress: { current: ScrollProgress };
  reducedMotion: boolean;
  /**
   * Element that receives pointer events for the 3D scene. The canvas sits
   * behind the page's scrolling overlay, so events are read from the page
   * instead and the overlay never blocks hovering the displays.
   */
  eventSource: RefObject<HTMLElement | null>;
  /** Called with a pedestal index when its display is clicked. */
  onSelectLook: (pedestalIndex: number) => void;
  /**
   * Fixed full-screen layer for in-scene HTML labels. Without it drei's Html
   * would attach to the event source (the tall scrolling page) and drift.
   */
  labelLayer: RefObject<HTMLElement | null>;
}

/** Full-screen WebGL scene. Client-only; loaded via next/dynamic with ssr: false. */
export default function HeritageCanvas({
  progress,
  reducedMotion,
  eventSource,
  onSelectLook,
  labelLayer,
}: HeritageCanvasProps) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.05 }}
      camera={{ position: CAMERA_STATIONS[0].position, fov: 42, near: 0.1, far: 260 }}
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
    >
      <AmbientMotionContext.Provider value={!reducedMotion}>
        <color attach="background" args={[PALETTE.haze]} />
        <fog attach="fog" args={[PALETTE.haze, 40, 140]} />

        <Lighting />
        {/* Photographic textures stream in; the scene appears once they're ready. */}
        <Suspense fallback={null}>
          <SkyDome radius={140} />
          <Courtyard />
          <InnerHall />
          {PEDESTALS.map((p, i) => (
            <DisplayPedestal
              key={p.id}
              position={p.position}
              rotationY={facingRotation(i)}
              silhouette={p.silhouette}
              fabric={p.fabric}
              accent={p.accent}
              animate={!reducedMotion}
              label={`Look ${String(i + 1).padStart(2, "0")}`}
              onSelect={() => onSelectLook(i)}
              labelLayer={labelLayer}
            />
          ))}
        </Suspense>

        <CameraRig progress={progress} reducedMotion={reducedMotion} />
        <PostEffects />
      </AmbientMotionContext.Provider>
    </Canvas>
  );
}
