"use client";

import { Vector3 } from "three";
import { PALETTE } from "../config";
import { useHeritageTexture } from "./assets";
import { SUN } from "./Lighting";

/** The low sun's direction across the ground; leaf shadows stretch along it. */
const SUN_GROUND = new Vector3(...SUN.position).sub(new Vector3(...SUN.target)).setY(0).normalize();
const SUN_AZIMUTH = Math.atan2(-SUN_GROUND.z, SUN_GROUND.x);

/**
 * Patches of leaf shade on the floor, as if trees beyond the walls stood
 * between them and the sun: across the runner and the open stone. `size`
 * is the patch width in metres.
 */
const SHADE_PATCHES: { at: [number, number]; size: number; turn: number }[] = [
  { at: [0.2, 11.4], size: 5.2, turn: 0.2 },
  { at: [-6.2, 12.6], size: 4.6, turn: 1.7 },
  { at: [6.0, 12.8], size: 4.2, turn: 2.6 },
  { at: [-1.2, 4.2], size: 4.4, turn: 2.1 },
  { at: [-6.6, 3.0], size: 4.0, turn: 3.4 },
  { at: [1.0, -3.6], size: 4.2, turn: 4.0 },
  { at: [-6.4, -6.8], size: 4.2, turn: 5.2 },
  { at: [-2.6, 16.2], size: 4.6, turn: 3.0 },
  { at: [3.4, 17.4], size: 4.2, turn: 0.9 },
];

/**
 * Dappled sunlight: soft olive-leaf shadow patches laid just above the
 * floor and rugs, stretched along the low sun like real leaf shadows.
 * Painted rather than cast, so the pattern stays crisp and costs no
 * shadow-map resolution.
 */
export function DappledShade() {
  const mask = useHeritageTexture("leafShadow");
  return (
    <group>
      {SHADE_PATCHES.map(({ at, size, turn }) => (
        <group key={`${at[0]},${at[1]}`} position={[at[0], 0.03, at[1]]} rotation-y={SUN_AZIMUTH}>
          <mesh rotation-x={-Math.PI / 2} rotation-z={turn * 0.15} scale={[size * 1.7, size, 1]} renderOrder={1}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              color={PALETTE.leafShade}
              alphaMap={mask}
              transparent
              opacity={0.8}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
