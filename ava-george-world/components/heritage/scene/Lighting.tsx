"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Object3D } from "three";

/**
 * Low, warm late-afternoon sun with a sky/ground bounce. The sun rakes in
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
      <hemisphereLight args={["#ffe4bd", "#8c5a38", 0.85]} />
      <ambientLight color="#ffd9ad" intensity={0.12} />
      <directionalLight
        color="#ffd29a"
        intensity={2.8}
        position={[14, 12, 0]}
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
      />
      {/* Cool-warm fill from the opposite side to lift shadowed walls. */}
      <directionalLight color="#ffb88a" intensity={0.35} position={[-10, 6, -8]} />
    </>
  );
}
