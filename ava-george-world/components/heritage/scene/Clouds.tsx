"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { Vec3 } from "../config";
import { useAmbientMotion } from "./motion";
import { useProceduralTexture } from "./proceduralTextures";

const CLOUDS: [Vec3, number][] = [
  [[-38, 30, -95], 26],
  [[6, 40, -110], 34],
  [[44, 27, -92], 24],
  [[-70, 24, -60], 22],
  [[66, 34, -55], 28],
  [[-12, 52, -70], 30],
  [[28, 58, -40], 22],
];

/** A few soft billboard clouds drifting slowly across the blue sky. */
export function Clouds() {
  const animate = useAmbientMotion();
  const group = useRef<Group>(null);
  const texture = useProceduralTexture("cloud");

  useFrame((_, delta) => {
    if (!group.current || !animate) return;
    group.current.position.x += delta * 0.35;
    if (group.current.position.x > 30) group.current.position.x = -30;
  });

  return (
    <group ref={group}>
      {CLOUDS.map(([p, size], i) => (
        <sprite key={i} position={p} scale={[size, size / 2, 1]}>
          <spriteMaterial map={texture} transparent depthWrite={false} fog={false} opacity={0.92} />
        </sprite>
      ))}
    </group>
  );
}
