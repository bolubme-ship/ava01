"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, PlaneGeometry, type Group } from "three";
import type { Vec3 } from "../config";
import { useAmbientMotion } from "./motion";
import { useHeritageTexture } from "./assets";

/*
 * Soft furnishings: canopy sails strung across the courtyard and kilim
 * hangings on the walls. Both move gently in the breeze unless the visitor
 * prefers reduced motion.
 */

interface CanopySailProps {
  /** Centre of the span at its anchor height. */
  position: Vec3;
  /** Span across the courtyard (x) and depth (z). */
  width: number;
  depth: number;
  /** How far the middle sags below the anchors. */
  sag?: number;
  color: string;
  /** Slight twist around the vertical axis so sails cross each other. */
  rotationY?: number;
  phase?: number;
}

/** Drapes a flat sail: parabolic sag across the span plus a travelling billow. */
function drape(geometry: PlaneGeometry, base: Float32Array, width: number, depth: number, sag: number, time: number, phase: number) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    const u = (2 * x) / width;
    const v = (2 * z) / depth;
    const droop = -sag * (1 - u * u) - 0.12 * (1 - v * v);
    const billow = Math.sin(time * 0.9 + x * 0.45 + phase) * 0.06 * (1 - u * u);
    // Soft folds running across the span, strongest mid-sail.
    const folds = Math.sin(x * 1.4 + phase * 2) * 0.07 * (1 - u * u) * (1 - 0.5 * v * v);
    pos.setY(i, droop + billow + folds);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

/** A fabric sail tied to the wall tops, sagging in the middle and billowing slightly. */
export function CanopySail({ position, width, depth, sag = 0.9, color, rotationY = 0, phase = 0 }: CanopySailProps) {
  const animate = useAmbientMotion();
  const { geometry, base } = useMemo(() => {
    const geometry = new PlaneGeometry(width, depth, 48, 8);
    geometry.rotateX(-Math.PI / 2);
    const base = Float32Array.from(geometry.attributes.position.array);
    drape(geometry, base, width, depth, sag, 0, phase);
    return { geometry, base };
  }, [width, depth, sag, phase]);

  useFrame(({ clock }) => {
    if (animate) drape(geometry, base, width, depth, sag, clock.elapsedTime, phase);
  });

  return (
    <mesh geometry={geometry} position={position} rotation-y={rotationY} castShadow receiveShadow>
      {/* Faint self-glow fakes sunlight filtering through the fabric from above. */}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.9} side={DoubleSide} />
    </mesh>
  );
}

interface KilimProps {
  /** Top-centre of the hanging. */
  position: Vec3;
  rotationY?: number;
  width?: number;
  height?: number;
  phase?: number;
}

/** Woven kilim hanging from a timber rod; sways a touch from its top edge. */
export function Kilim({ position, rotationY = 0, width = 1.1, height = 2.4, phase = 0 }: KilimProps) {
  const animate = useAmbientMotion();
  const cloth = useRef<Group>(null);
  const texture = useHeritageTexture("kilim");

  useFrame(({ clock }) => {
    if (cloth.current && animate) cloth.current.rotation.x = Math.sin(clock.elapsedTime * 0.8 + phase) * 0.025 + 0.02;
  });

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.02, 0.06]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.035, 0.035, width + 0.3, 10]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.8} />
      </mesh>
      <group ref={cloth} position={[0, 0, 0.06]}>
        <mesh position={[0, -height / 2, 0]} castShadow receiveShadow>
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial map={texture} roughness={0.95} side={DoubleSide} />
        </mesh>
        {/* Fringe. */}
        <mesh position={[0, -height - 0.07, 0]}>
          <planeGeometry args={[width * 0.94, 0.14]} />
          <meshStandardMaterial color="#e7cfa2" roughness={1} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

const IRON = "#2e2119";

/**
 * Moroccan-style lantern hanging from a scrolled iron bracket: hexagonal
 * glowing body with dark frame rings, domed cap and finial. Emissive only,
 * so any number can be placed without adding lights.
 */
export function WallSconce({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  const reach = 0.42;
  return (
    <group position={position} rotation-y={rotationY}>
      {/* Wall plate, arm and scroll. */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.1, 0.18, 0.04]} />
        <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, reach / 2]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.014, 0.014, reach, 6]} />
        <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.12, 0.16]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.12, 0.011, 6, 16, Math.PI * 0.75]} />
        <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.55} />
      </mesh>
      {/* Chain drop. */}
      <mesh position={[0, -0.09, reach]}>
        <cylinderGeometry args={[0.006, 0.006, 0.18, 4]} />
        <meshStandardMaterial color={IRON} />
      </mesh>
      <group position={[0, -0.42, reach]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.34, 6]} />
          <meshStandardMaterial color="#ffd796" emissive="#ffae4f" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {[0.17, -0.17].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[y > 0 ? 0.125 : 0.105, 0.016, 6, 6]} />
            <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.45} />
          </mesh>
        ))}
        <mesh position={[0, 0.26, 0]}>
          <coneGeometry args={[0.15, 0.16, 6]} />
          <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.37, 0]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshStandardMaterial color="#b8893f" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh position={[0, -0.22, 0]} rotation-x={Math.PI}>
          <coneGeometry args={[0.07, 0.1, 6]} />
          <meshStandardMaterial color={IRON} metalness={0.6} roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
}
