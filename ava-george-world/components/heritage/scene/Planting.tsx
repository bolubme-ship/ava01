"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CircleGeometry,
  PlaneGeometry,
  Color,
  DoubleSide,
  InstancedMesh,
  LatheGeometry,
  Object3D,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Vec3 } from "../config";
import { useHeritageTexture, type HeritageTextureName } from "./assets";
import { mulberry32 } from "./random";
import { useWindMaterial } from "./wind";

/*
 * Planting: bougainvillea, trees, carved pots and photographed
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
      dummy.rotation.set(b.rotation.x, b.rotation.y, b.rotation.z, "YXZ");
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

/** Pointed leaf card (≈8 triangles), 2 units long on y, double-sided. */
const leafGeometry = (() => {
  const shape = new Shape();
  shape.moveTo(0, -1);
  shape.quadraticCurveTo(0.5, -0.1, 0, 1);
  shape.quadraticCurveTo(-0.5, -0.1, 0, -1);
  return new ShapeGeometry(shape, 3);
})();

/** Unit card for photographed foliage cut-outs (centred). */
const cardGeometry = new PlaneGeometry(1, 1);
/** Card pivoting at its top edge, for sprays that hang from a stem. */
const hangingCardGeometry = new PlaneGeometry(1, 1).translate(0, -0.5, 0);
/**
 * Three unit cards standing on their bottom edges, crossed at 60° so a
 * photographed plant reads as full from any angle, merged into one draw.
 */
const crossedCardGeometry = mergeGeometries(
  [0, 1, 2].map((k) => new PlaneGeometry(1, 1).translate(0, 0.5, 0).rotateY((k * Math.PI) / 3)),
);

/** Rounded bract / petal (6 triangles) for bougainvillea and flowers. */
const bractGeometry = new CircleGeometry(1, 6);

/*
 * Leaves and blossoms receive shadows but don't cast them: casting would
 * double their cost in the shadow pass. Solid stand-ins (tree crowns) cast
 * the shade instead.
 */
function BlobCloud({
  blobs,
  wind = 0.02,
  geometry = leafGeometry,
}: {
  blobs: Blob[];
  wind?: number;
  geometry?: BufferGeometry;
}) {
  const ref = useRef<InstancedMesh>(null);
  const material = useWindMaterial({ roughness: 0.7, side: DoubleSide }, wind);
  useInstances(ref, blobs);
  return <instancedMesh ref={ref} args={[geometry, material, blobs.length]} receiveShadow />;
}

/** Instance scale for a leaf card of overall size `s`. */
const leafScale = (s: number, rand: () => number) => new Vector3(s * (0.75 + rand() * 0.3), s * 1.5, 1);
/** Instance scale for a bract of overall size `s`. */
const bractScale = (s: number, rand: () => number) => new Vector3(s, s * (0.8 + rand() * 0.3), 1);

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
 * Climbing bougainvillea: photographed flower sprays (alpha cut-out cards)
 * hang along a path on a wall face over a backing of small leaves, with
 * longer sprays dropping below. Everything sways in the breeze.
 */
export function Bougainvillea({
  path,
  normal,
  spread = 0.55,
  density = 40,
  strands = 6,
  seed = 1,
}: BougainvilleaProps) {
  const spray = useHeritageTexture("bougainvillea");
  const cardsRef = useRef<InstancedMesh>(null);
  const cardMaterial = useWindMaterial({ map: spray, alphaTest: 0.5, side: DoubleSide, roughness: 0.75 }, 0.02);

  const { leaves, blossoms, cards } = useMemo(() => {
    const rand = mulberry32(seed);
    const n = new Vector3(...normal).normalize();
    const facing = Math.atan2(n.x, n.z);
    const cards: Blob[] = [];
    const addCard = (p: Vector3, size: number) => {
      const s = size * (0.8 + rand() * 0.45);
      cards.push({
        position: p.clone().addScaledVector(n, 0.05 + rand() * spread * 0.45),
        scale: new Vector3(s, s, 1),
        rotation: new Vector3(-0.1 + rand() * 0.35, facing + (rand() - 0.5) * 0.9, (rand() - 0.5) * 0.7),
        color: "#ffffff",
      });
    };
    const leaves: Blob[] = [];
    const blossoms: Blob[] = [];
    const add = (p: Vector3, bulge: number, pinkBias: number) => {
      const isBlossom = rand() < pinkBias;
      const s = isBlossom ? 0.032 + rand() * 0.034 : 0.038 + rand() * 0.04;
      const blob: Blob = {
        position: p.clone().addScaledVector(n, bulge),
        scale: isBlossom ? bractScale(s * 1.1, rand) : leafScale(s, rand),
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
        for (let j = 0; j < 4; j++) {
          const offset = new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(spread * 2);
          offset.addScaledVector(n, -offset.dot(n)); // flatten onto the wall plane
          add(segPoint.clone().add(offset), 0.02 + rand() * spread * 0.3, 0.12);
        }
      }
      // Flower sprays every ~20 cm, in two loose layers.
      const sprays = Math.ceil(a.distanceTo(b) / 0.2);
      for (let k = 0; k < sprays; k++) {
        segPoint.lerpVectors(a, b, (k + rand()) / sprays);
        const offset = new Vector3(rand() - 0.5, rand() - 0.3, rand() - 0.5).multiplyScalar(spread * 1.4);
        offset.addScaledVector(n, -offset.dot(n));
        addCard(segPoint.clone().add(offset), 0.62);
      }
    }

    // Hanging strands.
    for (let s = 0; s < strands; s++) {
      const i = Math.floor(rand() * (pts.length - 1));
      const start = new Vector3().lerpVectors(pts[i], pts[i + 1], rand());
      const length = 0.6 + rand() * 1.3;
      const drift = (rand() - 0.5) * 0.4;
      for (let t = 0; t < length; t += 0.45) {
        const p = start.clone().add(new Vector3(drift * t, -t, 0));
        addCard(p, 0.7);
      }
    }
    return { leaves, blossoms, cards };
  }, [path, normal, spread, density, strands, seed]);
  useInstances(cardsRef, cards);

  return (
    <group>
      <BlobCloud blobs={leaves} wind={0.012} />
      <BlobCloud blobs={blossoms} wind={0.02} geometry={bractGeometry} />
      <instancedMesh ref={cardsRef} args={[hangingCardGeometry, cardMaterial, cards.length]} castShadow receiveShadow />
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
  const texture = useHeritageTexture("carvedClay", 3, 1);
  const normalMap = useHeritageTexture("carvedClayNormal", 3, 1);
  const rim = POT_RIM[shape];
  const soilRadius = shape === "urn" ? 0.3 : 0.44;
  return (
    <group position={position} scale={scale}>
      <mesh geometry={potGeometry(shape)} castShadow receiveShadow>
        <meshStandardMaterial map={texture} normalMap={normalMap} normalScale={[1.2, 1.2]} roughness={0.88} />
      </mesh>
      <mesh position={[0, rim - 0.04, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[soilRadius, 24]} />
        <meshStandardMaterial color="#4a2e1c" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Potted agave

/**
 * A photographed agave in a carved pot, shown on three crossed cards so it
 * reads as a full plant from any angle the camera passes.
 */
export function PottedPlant({ position, scale = 1, seed = 3 }: { position: Vec3; scale?: number; seed?: number }) {
  const agave = useHeritageTexture("agave");
  const turn = useMemo(() => mulberry32(seed)() * Math.PI, [seed]);
  return (
    <group position={position} scale={scale}>
      <CarvedPot position={[0, 0, 0]} />
      <mesh
        geometry={crossedCardGeometry}
        position={[0, POT_RIM.urn - 0.12, 0]}
        rotation-y={turn}
        scale={[0.95, 0.8, 0.95]}
        castShadow
      >
        <meshStandardMaterial map={agave} alphaTest={0.5} side={DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A potted bougainvillea bush: photographed sprays arching out over a leafy dome. */
export function FloweringShrub({ position, scale = 1, seed = 9 }: { position: Vec3; scale?: number; seed?: number }) {
  const spray = useHeritageTexture("bougainvillea");
  const cardsRef = useRef<InstancedMesh>(null);
  const cardMaterial = useWindMaterial({ map: spray, alphaTest: 0.5, side: DoubleSide, roughness: 0.75 }, 0.012);

  const { leaves, cards } = useMemo(() => {
    const rand = mulberry32(seed);
    const leaves: Blob[] = [];
    const center = new Vector3(0, POT_RIM.urn + 0.22, 0);
    for (let i = 0; i < 220; i++) {
      const dir = new Vector3(rand() * 2 - 1, rand() * 1.1 - 0.2, rand() * 2 - 1).normalize();
      const s = 0.045 + rand() * 0.03;
      leaves.push({
        position: center.clone().addScaledVector(dir, 0.38 * (0.6 + rand() * 0.4)),
        scale: leafScale(s, rand),
        rotation: new Vector3(rand() * 6.28, rand() * 6.28, rand() * 6.28),
        color: LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
      });
    }
    // Sprays hang from the crown and lean outwards all the way round.
    const cards: Blob[] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.4;
      const s = 0.5 + rand() * 0.25;
      cards.push({
        position: center.clone().add(new Vector3(Math.sin(a) * 0.12, 0.28 + rand() * 0.12, Math.cos(a) * 0.12)),
        scale: new Vector3(s, s, 1),
        rotation: new Vector3(-0.45 - rand() * 0.45, a, (rand() - 0.5) * 0.5),
        color: "#ffffff",
      });
    }
    return { leaves, cards };
  }, [seed]);
  useInstances(cardsRef, cards);

  return (
    <group position={position} scale={scale}>
      <CarvedPot position={[0, 0, 0]} />
      <BlobCloud blobs={leaves} wind={0.008} />
      <instancedMesh ref={cardsRef} args={[hangingCardGeometry, cardMaterial, cards.length]} castShadow receiveShadow />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Olive tree

/**
 * Multi-stemmed olive in a planter. The crown is built from cards of a
 * photographed olive branch (alpha cut-out), turned every which way around
 * three lobes, so it reads as real foliage and casts real dappled shade.
 */
export function OliveTree({ position, scale = 1, seed = 7 }: { position: Vec3; scale?: number; seed?: number }) {
  const branch = useHeritageTexture("oliveBranch");
  const ref = useRef<InstancedMesh>(null);
  const material = useWindMaterial({ map: branch, alphaTest: 0.5, side: DoubleSide, roughness: 0.8 }, 0.015);

  const cards = useMemo(() => {
    const rand = mulberry32(seed);
    const lobes = [
      new Vector3(-0.35, 2.3, 0.1),
      new Vector3(0.4, 2.5, -0.15),
      new Vector3(0.05, 2.95, 0.2),
    ];
    const out: Blob[] = [];
    for (let i = 0; i < 54; i++) {
      const lobe = lobes[i % lobes.length];
      const dir = new Vector3(rand() * 2 - 1, (rand() * 2 - 1) * 0.7, rand() * 2 - 1).normalize();
      const s = 0.75 + rand() * 0.45;
      out.push({
        position: lobe.clone().addScaledVector(dir, 0.35 + rand() * 0.3),
        scale: new Vector3(s, s, 1),
        rotation: new Vector3((rand() - 0.5) * 1.6, rand() * Math.PI * 2, (rand() - 0.5) * 1.2),
        color: "#ffffff",
      });
    }
    return out;
  }, [seed]);
  useInstances(ref, cards);

  return (
    <group position={position} scale={scale}>
      <CarvedPot position={[0, 0, 0]} shape="planter" scale={1.35} />
      {(
        [
          [-0.12, 1.5, 0.02, 0.22],
          [0.14, 1.6, -0.05, -0.2],
          [0.0, 1.8, 0.06, 0.05],
        ] as const
      ).map(([x, h, z, tilt], i) => (
        <mesh key={i} position={[x, 0.9 + h / 2 - 0.2, z]} rotation-z={tilt} castShadow>
          <cylinderGeometry args={[0.035, 0.06, h, 7]} />
          <meshStandardMaterial color="#6b5a46" roughness={0.95} />
        </mesh>
      ))}
      <instancedMesh ref={ref} args={[cardGeometry, material, cards.length]} castShadow receiveShadow />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Photo-card plants

/** The photographed plants that can stand in a pot. Sizes in metres at scale 1. */
const CARD_PLANTS = {
  fern: { texture: "fern", height: 1.15, aspect: 1, sink: 0.38, pot: "urn", potScale: 1 },
  geranium: { texture: "geranium", height: 0.85, aspect: 1, sink: 0.14, pot: "urn", potScale: 0.95 },
  palm: { texture: "palm", height: 2.9, aspect: 0.67, sink: 0.08, pot: "planter", potScale: 1.5 },
  lemonTree: { texture: "lemonTree", height: 3.0, aspect: 0.67, sink: 0.05, pot: "planter", potScale: 1.45 },
  monstera: { texture: "monstera", height: 1.05, aspect: 2, sink: 0.3, pot: "urn", potScale: 1.1 },
  birdOfParadise: { texture: "birdOfParadise", height: 1.9, aspect: 0.67, sink: 0.12, pot: "planter", potScale: 1.15 },
} as const satisfies Record<
  string,
  { texture: HeritageTextureName; height: number; aspect: number; sink: number; pot: PotShape; potScale: number }
>;

export type CardPlantKind = keyof typeof CARD_PLANTS;

/**
 * A photographed plant in a carved pot, shown on three crossed cards so it
 * reads as a full plant from any angle the camera passes. `sink` lowers the
 * cards into the pot so trailing fronds spill over the rim.
 */
export function CardPlant({
  kind,
  position,
  scale = 1,
  seed = 1,
}: {
  kind: CardPlantKind;
  position: Vec3;
  scale?: number;
  seed?: number;
}) {
  const spec = CARD_PLANTS[kind];
  const texture = useHeritageTexture(spec.texture);
  const turn = useMemo(() => mulberry32(seed)() * Math.PI, [seed]);
  const rim = POT_RIM[spec.pot] * spec.potScale;
  return (
    <group position={position} scale={scale}>
      <CarvedPot position={[0, 0, 0]} shape={spec.pot} scale={spec.potScale} />
      <mesh
        geometry={crossedCardGeometry}
        position={[0, rim - spec.sink, 0]}
        rotation-y={turn}
        scale={[spec.height * spec.aspect, spec.height, spec.height * spec.aspect]}
        castShadow
      >
        <meshStandardMaterial map={texture} alphaTest={0.5} side={DoubleSide} roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * Curtains of trailing ivy hanging from a line along a wall top or arch,
 * each strand a photographed vine card of varied length, swaying gently.
 */
export function IvyCurtain({
  path,
  normal,
  spacing = 0.32,
  length = 1.6,
  seed = 1,
}: {
  path: Vec3[];
  normal: Vec3;
  spacing?: number;
  length?: number;
  seed?: number;
}) {
  const ivy = useHeritageTexture("ivy");
  const ref = useRef<InstancedMesh>(null);
  const material = useWindMaterial({ map: ivy, alphaTest: 0.5, side: DoubleSide, roughness: 0.65 }, 0.02);

  const strands = useMemo(() => {
    const rand = mulberry32(seed);
    const n = new Vector3(...normal).normalize();
    const facing = Math.atan2(n.x, n.z);
    const pts = path.map((p) => new Vector3(...p));
    const out: Blob[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const count = Math.ceil(pts[i].distanceTo(pts[i + 1]) / spacing);
      for (let k = 0; k < count; k++) {
        const p = new Vector3().lerpVectors(pts[i], pts[i + 1], (k + rand()) / count);
        const h = length * (0.55 + rand() * 0.7);
        out.push({
          position: p.addScaledVector(n, 0.03 + rand() * 0.08),
          scale: new Vector3(h * 0.67, h, 1),
          rotation: new Vector3(0.04 + rand() * 0.1, facing + (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.15),
          color: "#ffffff",
        });
      }
    }
    return out;
  }, [path, normal, spacing, length, seed]);
  useInstances(ref, strands);

  return <instancedMesh ref={ref} args={[hangingCardGeometry, material, strands.length]} castShadow receiveShadow />;
}

// ---------------------------------------------------------------------------
// Tall trees

/** Photographed trees that stand in the ground. Sizes in metres at scale 1. */
const TALL_TREES = {
  datePalm: { texture: "datePalm", height: 11, aspect: 0.6 },
  flameTree: { texture: "flameTree", height: 9.5, aspect: 0.684 },
  acacia: { texture: "acacia", height: 9, aspect: 0.715 },
} as const satisfies Record<string, { texture: HeritageTextureName; height: number; aspect: number }>;

export type TallTreeKind = keyof typeof TALL_TREES;

/**
 * Every tree of one kind, each on three crossed cards, drawn together as one
 * instanced mesh. The canopy sways in the breeze while the trunk stays rooted.
 */
export function TallTrees({ kind, trees }: { kind: TallTreeKind; trees: { position: Vec3; scale?: number }[] }) {
  const spec = TALL_TREES[kind];
  const texture = useHeritageTexture(spec.texture);
  const ref = useRef<InstancedMesh>(null);
  const material = useWindMaterial({ map: texture, alphaTest: 0.5, side: DoubleSide, roughness: 0.8 }, 0.12, true);

  const blobs = useMemo(() => {
    const rand = mulberry32(trees.length * 31 + spec.height * 7);
    return trees.map(({ position, scale = 1 }): Blob => {
      const s = scale * (0.92 + rand() * 0.16);
      return {
        position: new Vector3(...position),
        scale: new Vector3(spec.height * spec.aspect * s, spec.height * s, spec.height * spec.aspect * s),
        rotation: new Vector3(0, rand() * Math.PI, 0),
        color: "#ffffff",
      };
    });
  }, [trees, spec]);
  useInstances(ref, blobs);

  return <instancedMesh ref={ref} args={[crossedCardGeometry, material, blobs.length]} castShadow receiveShadow />;
}
