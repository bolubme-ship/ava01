"use client";

import { useMemo } from "react";
import { BackSide, BufferAttribute, Color, SphereGeometry } from "three";

interface SkyDomeProps {
  horizon: string;
  zenith: string;
  radius?: number;
}

/** Inexpensive vertical-gradient sky: warm haze at the horizon, paler overhead. */
export function SkyDome({ horizon, zenith, radius = 90 }: SkyDomeProps) {
  const geometry = useMemo(() => {
    const geo = new SphereGeometry(radius, 32, 16);
    const low = new Color(horizon);
    const high = new Color(zenith);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(Math.max(pos.getY(i) / radius, 0), 1);
      c.copy(low).lerp(high, Math.pow(t, 0.45));
      c.toArray(colors, i * 3);
    }
    geo.setAttribute("color", new BufferAttribute(colors, 3));
    return geo;
  }, [horizon, zenith, radius]);

  return (
    <mesh geometry={geometry} renderOrder={-1}>
      <meshBasicMaterial vertexColors side={BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
