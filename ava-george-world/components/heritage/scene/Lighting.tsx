"use client";

import { useThree } from "@react-three/fiber";

/**
 * Low, warm late-afternoon sun with a sky/ground bounce. The sun rakes in
 * from the front-right so walls and pedestals cast long soft shadows.
 */
export function Lighting() {
  const isSmallScreen = useThree((s) => s.size.width < 768);
  const shadowMapSize = isSmallScreen ? 1024 : 2048;

  return (
    <>
      <hemisphereLight args={["#ffe4bd", "#8c5a38", 0.85]} />
      <ambientLight color="#ffd9ad" intensity={0.12} />
      <directionalLight
        color="#ffd29a"
        intensity={2.8}
        position={[12, 10, 9]}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      {/* Cool-warm fill from the opposite side to lift shadowed walls. */}
      <directionalLight color="#ffb88a" intensity={0.35} position={[-10, 6, -8]} />
    </>
  );
}
