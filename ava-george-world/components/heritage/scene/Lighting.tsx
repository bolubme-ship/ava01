"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Object3D } from "three";

/**
 * Golden-hour sun, low and warm, with a blue-sky / terracotta bounce. The sun rakes in
 * from the front-right so walls and pedestals cast long soft shadows.
 * The shadow area is centred between the courtyard and the inner hall so
 * the hall's roof keeps its interior shaded.
 */
export function Lighting() {
  const isSmallScreen = useThree((s) => s.size.width < 768);
  const shadowMapSize = isSmallScreen ? 2048 : 4096;
  const sunTarget = useMemo(() => {
    const target = new Object3D();
    target.position.set(0, 0, -10);
    return target;
  }, []);

  return (
    <>
      <primitive object={sunTarget} />
      {/* Blue-sky bounce from above, warm terracotta bounce from the floor. */}
      <hemisphereLight args={["#d2e2f2", "#c27a4c", 0.95]} />
      <ambientLight color="#ffd9ad" intensity={0.12} />
      <directionalLight
        color="#ffcf94"
        intensity={3.7}
        position={[14, 9, 2]}
        target={sunTarget}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={2.5}
      />
      {/* Cool-warm fill from the opposite side to lift shadowed walls. */}
      <directionalLight color="#ffb88a" intensity={0.35} position={[-10, 6, -8]} />
    </>
  );
}

/** Frames over which the shadow map is redrawn after the scene appears or resizes. */
const SHADOW_SETTLE_FRAMES = 90;

/**
 * Nearly everything the sun lights stands still, so its shadow map is drawn
 * only while the scene settles (after it appears or the viewport resizes)
 * instead of every frame. That halves the draw calls of each frame. Mount it
 * inside the scene's Suspense boundary so it starts once the scene is in.
 */
export function BakedShadows() {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const frames = useRef(0);

  useEffect(() => {
    frames.current = 0;
  }, [width, height]);

  useFrame(({ gl }) => {
    gl.shadowMap.autoUpdate = false;
    if (frames.current < SHADOW_SETTLE_FRAMES) {
      frames.current++;
      gl.shadowMap.needsUpdate = true;
    }
  });

  return null;
}
