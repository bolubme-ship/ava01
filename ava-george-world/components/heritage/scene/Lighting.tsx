"use client";

import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Object3D } from "three";
import type { Vec3 } from "../config";

/**
 * Golden-hour sun, low and warm, with a blue-sky / terracotta bounce. The sun rakes in
 * from the front-right so walls and pedestals cast long soft shadows.
 * The shadow area is centred between the courtyard and the inner hall so
 * the hall's roof keeps its interior shaded.
 */
/** The sun's placement; DappledShade stretches its leaf shadows along it. */
export const SUN = { position: [28, 18, 14] as Vec3, target: [0, 0, -10] as Vec3 };

export function Lighting() {
  const isSmallScreen = useThree((s) => s.size.width < 768);
  const shadowMapSize = isSmallScreen ? 2048 : 4096;
  const sunTarget = useMemo(() => {
    const target = new Object3D();
    target.position.set(...SUN.target);
    return target;
  }, []);

  return (
    <>
      <primitive object={sunTarget} />
      {/* Blue-sky bounce from above, warm terracotta bounce from the floor. */}
      <hemisphereLight args={["#e6dccd", "#d27a3e", 1.0]} />
      <ambientLight color="#ffd9ad" intensity={0.12} />
      <directionalLight
        color="#ffbd86"
        intensity={4.3}
        position={SUN.position}
        target={sunTarget}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-32}
        shadow-camera-right={32}
        shadow-camera-top={32}
        shadow-camera-bottom={-32}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={2.5}
      />
      {/* Cool-warm fill from the opposite side to lift shadowed walls. */}
      <directionalLight color="#ffb88a" intensity={0.35} position={[-10, 6, -8]} />
    </>
  );
}
