"use client";

import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * Photographic finishing pass:
 * - N8AO ambient occlusion: soft contact shadows where walls meet the
 *   floor, under pots and plinths and inside arches, tinted warm like
 *   light bounced off terracotta.
 * - Bloom on the brightest highlights only, so the lanterns glow.
 * - Filmic tone mapping (applied here because the composer renders the
 *   scene off-screen, where the renderer's own tone mapping doesn't run).
 *
 * Phones, and any device the performance monitor finds struggling, get
 * half-resolution occlusion and no multisampling to stay smooth.
 */
export function PostEffects({ lowPower = false }: { lowPower?: boolean }) {
  const isSmallScreen = useThree((s) => s.size.width < 768);
  const cheap = isSmallScreen || lowPower;

  return (
    <EffectComposer multisampling={cheap ? 0 : 4}>
      <N8AO
        aoRadius={1.1}
        distanceFalloff={0.6}
        intensity={2.2}
        color="#3d1f10"
        quality={cheap ? "performance" : "medium"}
        halfRes={cheap}
      />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.55} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
