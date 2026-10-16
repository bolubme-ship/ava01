"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  Color,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Object3D,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import type { Vec3 } from "../config";
import { useProceduralTexture } from "./proceduralTextures";
import { mulberry32 } from "./random";
import { useWindMaterial } from "./wind";

/*
 * Procedural planting: bougainvillea, citrus trees, carved pots and leafy
 * potted plants. Every leaf and blossom is an instance, so a few draw calls
 * cover thousands of pieces, and the wind material lets each one flutter.
 */

const BLOSSOM_COLORS = ["#e0307c", "#f0559b", "#c2185b", "#ff7fb6", "#d81b60", "#f48fb1"];
const LEAF_COLORS = ["#3d6b29", "#4f7f33", "#2f5a21", "#5b8a3a", "#456f2c"];

interface Blob {
  position: Vector3;
  scale: Vector3;
  rotation: Vector3;
  color: string;
}

const dummy = new Object3D();

/** Writes blobs into an InstancedMesh's matrices and colours. */
function useInstances(ref: React.RefObject<InstancedMesh | null>, blobs: Blob[]) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const color = new Color();
    blobs.forEach((b, i) => {
      dummy.position.copy(b.position);
      dummy.rotation.set(b.rotation.x, b.rotation.y, b.rotation.z);
      dummy.scale.copy(b.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(b.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, blobs]);
}

/** Low-poly blob (20 triangles): at leaf size the facets read as foliage. */
const blobGeometry = new IcosahedronGeometry(1, 0);

/*
 * Leaves and blossoms receive shadows but don't cast them: casting would
 * double their cost in the shadow pass. Solid stand-ins (tree crowns) cast
 * the shade instead.
 */
function BlobCloud({ blobs, wind = 0.02 }: { blobs: Blob[]; wind?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const material = useWindMaterial({ roughness: 0.75 }, wind);
  useInstances(ref, blobs);
  return <instancedMesh ref={ref} args={[blobGeometry, material, blobs.length]} receiveShadow />;
}

// ---------------------------------------------------------------------------
// Bougainvillea

interface BougainvilleaProps {
  /** Polyline the plant climbs along, in world space. */
  path: Vec3[];
  /** Direction the wall faces; foliage bulges this way. */
  normal: Vec3;
  /** Radius of foliage around the path. */
  spread?: number;
  /** Blossom/leaf clusters per metre of path. */
  density?: number;
  /** How many hanging strands drop below the path. */
  strands?: number;
  seed?: number;
}

/**
 * Climbing bougainvillea: dense leaves along a path on a wall face, heavy
 * with magenta bracts, plus loose strands that hang and sway.
 */
export function Bougainvillea({
  path,
  normal,
  spread = 0.55,
  density = 40,
  strands = 6,
  seed = 1,
}: BougainvilleaProps) {
  const { leaves, blossoms } = useMemo(() => {
    const rand = mulberry32(seed);
    const n = new Vector3(...normal).normalize();
    const leaves: Blob[] = [];
    const blossoms: Blob[] = [];
    const add = (p: Vector3, bulge: number, pinkBias: number) => {
      const isBlossom = rand() < pinkBias;
      const s = isBlossom ? 0.032 + rand() * 0.034 : 0.038 + rand() * 0.04;
      const blob: Blob = {
        position: p.clone().addScaledVector(n, bulge),
        scale: new Vector3(s * (1 + rand() * 0.6), s * (0.7 + rand() * 0.5), s * 0.55),
        rotation: new Vector3(rand() * 6.28, rand() * 6.28, rand() * 6.28),
        color: isBlossom
          ? BLOSSOM_COLORS[Math.floor(rand() * BLOSSOM_COLORS.length)]
          : LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
      };
      (isBlossom ? blossoms : leaves).push(blob);
    };

    const pts = path.map((p) => new Vector3(...p));
    const segPoint = new Vector3();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const count = Math.ceil(a.distanceTo(b) * density);
      for (let k = 0; k < count; k++) {
        segPoint.lerpVectors(a, b, rand());
        for (let j = 0; j < 9; j++) {
          const offset = new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(spread * 2);
          offset.addScaledVector(n, -offset.dot(n)); // flatten onto the wall plane
          add(segPoint.clone().add(offset), 0.05 + rand() * spread * 0.6, 0.48);
        }
      }
    }

    // Hanging strands.
    for (let s = 0; s < strands; s++) {
      const i = Math.floor(rand() * (pts.length - 1));
      const start = new Vector3().lerpVectors(pts[i], pts[i + 1], rand());
      const length = 0.6 + rand() * 1.3;
      const drift = (rand() - 0.5) * 0.4;
      for (let t = 0; t < length; t += 0.03) {
        const p = start.clone().add(new Vector3(drift * t + (rand() - 0.5) * 0.12, -t, (rand() - 0.5) * 0.08));
        add(p, 0.12 + rand() * 0.12, 0.62);
      }
    }
    return { leaves, blossoms };
  }, [path, normal, spread, density, strands, seed]);

  return (
    <group>
      <BlobCloud blobs={leaves} wind={0.012} />
      <BlobCloud blobs={blossoms} wind={0.02} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Pots

const POT_PROFILES = {
  /** Wide-bellied carved urn. */
  urn: [
    [0, 0],
    [0.24, 0],
    [0.4, 0.14],
    [0.5, 0.4],
    [0.46, 0.66],
    [0.33, 0.84],
    [0.3, 0.9],
    [0.36, 0.96],
    [0.3, 0.96],
  ],
  /** Straighter planter for trees and shrubs. */
  planter: [
    [0, 0],
    [0.3, 0],
    [0.36, 0.06],
    [0.44, 0.62],
    [0.5, 0.68],
    [0.44, 0.7],
  ],
} as const;

export type PotShape = keyof typeof POT_PROFILES;

const potGeometries = new Map<PotShape, LatheGeometry>();
function potGeometry(shape: PotShape) {
  let g = potGeometries.get(shape);
  if (!g) {
    g = new LatheGeometry(
      POT_PROFILES[shape].map(([x, y]) => new Vector2(x, y)),
      40,
    );
    potGeometries.set(shape, g);
  }
  return g;
}

/** Top-of-soil height for a pot shape at scale 1. */
export const POT_RIM: Record<PotShape, number> = { urn: 0.92, planter: 0.66 };

export function CarvedPot({ position, scale = 1, shape = "urn" }: { position: Vec3; scale?: number; shape?: PotShape }) {
  const texture = useProceduralTexture("carvedClay", 3, 1);
  const rim = POT_RIM[shape];
  const soilRadius = shape === "urn" ? 0.3 : 0.44;
  return (
    <group position={position} scale={scale}>
      <mesh geometry={potGeometry(shape)} castShadow receiveShadow>
        <meshStandardMaterial color="#ffffff" map={texture} bumpMap={texture} bumpScale={1.5} roughness={0.85} />
      </mesh>
      <mesh position={[0, rim - 0.04, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[soilRadius, 24]} />
        <meshStandardMaterial color="#4a2e1c" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Leafy potted plant

const bladeGeometry = (() => {
  const g = new SphereGeometry(1, 8, 6);
  g.translate(0, 1, 0);
  return g;
})();

/** Arching, fern-like leaves in a carved pot. */
export function PottedPlant({ position, scale = 1, seed = 3 }: { position: Vec3; scale?: number; seed?: number }) {
  const ref = useRef<InstancedMesh>(null);
  const material = useWindMaterial({ roughness: 0.7 }, 0.01);
  const blades = useMemo(() => {
    const rand = mulberry32(seed);
    const out: Blob[] = [];
    for (let i = 0; i < 26; i++) {
      out.push({
        position: new Vector3(0, POT_RIM.urn - 0.05, 0),
        scale: new Vector3(0.07 + rand() * 0.03, 0.28 + rand() * 0.18, 0.014),
        rotation: new Vector3(0.35 + rand() * 0.9, rand() * 6.28, 0),
        color: LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
      });
    }
    return out;
  }, [seed]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const color = new Color();
    blades.forEach((b, i) => {
      // Spin around the stem first, then tilt outwards.
      dummy.position.copy(b.position);
      dummy.rotation.set(0, b.rotation.y, 0);
      dummy.rotateX(b.rotation.x);
      dummy.scale.copy(b.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(b.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [blades]);

  return (
    <group position={position} scale={scale}>
      <CarvedPot position={[0, 0, 0]} />
      <instancedMesh ref={ref} args={[bladeGeometry, material, blades.length]} castShadow />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Citrus tree

/** Small round-crowned citrus tree in a planter, dotted with oranges. */
export function CitrusTree({ position, scale = 1, seed = 5 }: { position: Vec3; scale?: number; seed?: number }) {
  const { leaves, fruit } = useMemo(() => {
    const rand = mulberry32(seed);
    const center = new Vector3(0, 2.55, 0);
    const leaves: Blob[] = [];
    const fruit: Blob[] = [];
    for (let i = 0; i < 600; i++) {
      // Points on a slightly squashed sphere shell, biased outward.
      const dir = new Vector3(rand() * 2 - 1, (rand() * 2 - 1) * 0.85, rand() * 2 - 1).normalize();
      const r = 0.95 * (0.75 + rand() * 0.3);
      const s = 0.085 + rand() * 0.055;
      leaves.push({
        position: center.clone().addScaledVector(dir, r),
        scale: new Vector3(s * 1.4, s * 0.8, s * 0.45),
        rotation: new Vector3(rand() * 6.28, rand() * 6.28, rand() * 6.28),
        color: LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
      });
    }
    for (let i = 0; i < 26; i++) {
      const dir = new Vector3(rand() * 2 - 1, (rand() * 2 - 1) * 0.8, rand() * 2 - 1).normalize();
      fruit.push({
        position: center.clone().addScaledVector(dir, 0.98),
        scale: new Vector3(0.075, 0.075, 0.075),
        rotation: new Vector3(),
        color: rand() > 0.3 ? "#f29a1f" : "#f6c03a",
      });
    }
    return { leaves, fruit };
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      <CarvedPot position={[0, 0, 0]} shape="planter" scale={1.4} />
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 1.8, 8]} />
        <meshStandardMaterial color="#5a3a24" roughness={0.9} />
      </mesh>
      {/* Dark inner crown so gaps between leaves read as depth, not sky. */}
      <mesh position={[0, 2.55, 0]} scale={[0.82, 0.72, 0.82]} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color="#2c4a1c" roughness={0.9} />
      </mesh>
      <BlobCloud blobs={leaves} wind={0.008} />
      <BlobCloud blobs={fruit} wind={0.006} />
    </group>
  );
}

/** Low flowering shrub (pink and red) in a carved pot. */
export function FloweringShrub({ position, scale = 1, seed = 9 }: { position: Vec3; scale?: number; seed?: number }) {
  const { leaves, blossoms } = useMemo(() => {
    const rand = mulberry32(seed);
    const leaves: Blob[] = [];
    const blossoms: Blob[] = [];
    const center = new Vector3(0, POT_RIM.urn + 0.28, 0);
    for (let i = 0; i < 260; i++) {
      const dir = new Vector3(rand() * 2 - 1, rand() * 1.2 - 0.3, rand() * 2 - 1).normalize();
      const p = center.clone().addScaledVector(dir, 0.5 * (0.6 + rand() * 0.45));
      const isBlossom = dir.y > -0.1 && rand() < 0.42;
      const s = isBlossom ? 0.045 + rand() * 0.03 : 0.05 + rand() * 0.04;
      (isBlossom ? blossoms : leaves).push({
        position: p,
        scale: new Vector3(s * 1.3, s, s * 0.6),
        rotation: new Vector3(rand() * 6.28, rand() * 6.28, rand() * 6.28),
        color: isBlossom
          ? BLOSSOM_COLORS[Math.floor(rand() * BLOSSOM_COLORS.length)]
          : LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
      });
    }
    return { leaves, blossoms };
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      <CarvedPot position={[0, 0, 0]} />
      <BlobCloud blobs={leaves} wind={0.008} />
      <BlobCloud blobs={blossoms} wind={0.014} />
    </group>
  );
}
