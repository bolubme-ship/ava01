"use client";

import { Instance, Instances } from "@react-three/drei";
import { COURTYARD, GATE, HALL, PALETTE, type Vec3 } from "../config";
import { ArchedWall, type ArchOpening } from "./ArchedWall";
import { CanopySail, Kilim, WallSconce } from "./Fabrics";
import { Bougainvillea, CarvedPot, CitrusTree, FloweringShrub, PottedPlant } from "./Planting";
import { useProceduralTexture } from "./proceduralTextures";
import { useSurfaceTexture } from "./surfaceTexture";

/*
 * The Heritage courtyard, inspired by earthen Sahelian architecture and
 * dressed like a sunlit garden: a monumental bougainvillea-draped gate,
 * pale limestone floor with a red runner rug, cream and red canopy sails,
 * kilim hangings, wall lanterns, citrus trees and carved terracotta pots.
 * Everything is procedural geometry so pieces can be swapped for modelled
 * assets later without touching the camera or scroll code.
 *
 * Courtyard interior spans x ∈ [-10, 10], z ∈ [-12, 12]. The central back
 * archway opens into the inner hall (see InnerHall); the front gate is the
 * hero archway the visitor first looks through.
 */

const HALF_X = COURTYARD.halfX;
const HALF_Z = COURTYARD.halfZ;
const WALL_DEPTH = 0.6;
const SIDE_HEIGHT = 5;
const BACK_HEIGHT = 7.2;
const GATE_FACE_Z = HALF_Z + GATE.depth / 2;

const GATE_OPENINGS: ArchOpening[] = [{ x: 0, width: GATE.halfWidth * 2, height: GATE.archHeight }];
const BACK_OPENINGS: ArchOpening[] = [
  { x: -5, width: 2, height: 3.2 },
  { x: 0, width: HALL.doorHalfWidth * 2, height: 4.6 },
  { x: 5, width: 2, height: 3.2 },
  { x: -5, width: 1, height: 1.5, sill: 4.4 },
  { x: 0, width: 1.2, height: 1.4, sill: 5.2 },
  { x: 5, width: 1, height: 1.5, sill: 4.4 },
];
const SIDE_OPENINGS: ArchOpening[] = [-6, 6].map((x) => ({
  x,
  width: 1.1,
  height: 1.6,
  sill: 2.2,
}));

/** Front wall runs either side of the gatehouse. */
const FRONT_SEGMENT_WIDTH = HALF_X + WALL_DEPTH / 2 - GATE.towerHalfWidth;
const FRONT_SEGMENT_X = GATE.towerHalfWidth + FRONT_SEGMENT_WIDTH / 2;

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-6; v += step) out.push(v);
  return out;
}

/** Point on a circle in the gate's wall plane (degrees, 0 = right, 90 = top). */
function onGateArch(radius: number, degrees: number, z = GATE_FACE_Z + 0.02): Vec3 {
  const a = (degrees * Math.PI) / 180;
  const springY = GATE.archHeight - GATE.halfWidth;
  return [radius * Math.cos(a), springY + radius * Math.sin(a), z];
}

function Ground() {
  const tiles = useProceduralTexture("stoneTiles", 48, 48);
  const rug = useProceduralTexture("rug", 1, 2.6);
  const rugStart = GATE_FACE_Z + 1.4;
  const rugEnd = -HALF_Z + 0.4;
  const rugLength = rugStart - rugEnd;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial map={tiles} roughness={0.7} />
      </mesh>
      {/* Red runner from just outside the gate to the hall doorway. */}
      <mesh position={[0, 0.012, (rugStart + rugEnd) / 2]} receiveShadow>
        <boxGeometry args={[3, 0.02, rugLength]} />
        <meshStandardMaterial map={rug} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Walls() {
  const trim = useSurfaceTexture(4, 0.5);
  return (
    <group>
      {/* Gatehouse: deep, tall block with the hero archway. */}
      <ArchedWall
        width={GATE.towerHalfWidth * 2}
        height={GATE.towerHeight}
        depth={GATE.depth}
        openings={GATE_OPENINGS}
        color={PALETTE.wallLight}
        position={[0, 0, HALF_Z]}
      />
      {[-1, 1].map((side) => (
        <ArchedWall
          key={`front${side}`}
          width={FRONT_SEGMENT_WIDTH}
          height={SIDE_HEIGHT}
          color={PALETTE.wallLight}
          position={[side * FRONT_SEGMENT_X, 0, HALF_Z]}
        />
      ))}
      <ArchedWall
        width={HALF_X * 2 + WALL_DEPTH}
        height={BACK_HEIGHT}
        openings={BACK_OPENINGS}
        color={PALETTE.wallWarm}
        position={[0, 0, -HALF_Z]}
      />
      {[-1, 1].map((side) => (
        <ArchedWall
          key={side}
          width={HALF_Z * 2}
          height={SIDE_HEIGHT}
          openings={SIDE_OPENINGS}
          color={PALETTE.wallLight}
          position={[side * HALF_X, 0, 0]}
          rotationY={Math.PI / 2}
        />
      ))}

      {/* Parapet cornices. */}
      {(
        [
          [[0, GATE.towerHeight, HALF_Z], [GATE.towerHalfWidth * 2 + 0.4, 0.26, GATE.depth + 0.3]],
          [[-FRONT_SEGMENT_X, SIDE_HEIGHT, HALF_Z], [FRONT_SEGMENT_WIDTH + 0.4, 0.2, 0.85]],
          [[FRONT_SEGMENT_X, SIDE_HEIGHT, HALF_Z], [FRONT_SEGMENT_WIDTH + 0.4, 0.2, 0.85]],
          [[0, BACK_HEIGHT, -HALF_Z], [HALF_X * 2 + 1, 0.2, 0.85]],
          [[-HALF_X, SIDE_HEIGHT, 0], [0.85, 0.2, HALF_Z * 2]],
          [[HALF_X, SIDE_HEIGHT, 0], [0.85, 0.2, HALF_Z * 2]],
        ] as [Vec3, Vec3][]
      ).map(([position, size], i) => (
        <mesh key={i} position={position} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial color={PALETTE.wallTrim} map={trim} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Tapered corner buttresses and parapet pinnacles. */
function Silhouette() {
  const corners: Vec3[] = [
    [-HALF_X, 0, HALF_Z],
    [HALF_X, 0, HALF_Z],
    [-HALF_X, 0, -HALF_Z],
    [HALF_X, 0, -HALF_Z],
  ];
  const backPinnacles = range(-9, 9, 1.8);
  const frontPinnacles = range(-9, 9, 2.25).filter((x) => Math.abs(x) > GATE.towerHalfWidth + 0.4);
  const gatePinnacles = range(-4.8, 4.8, 1.6);

  return (
    <group>
      {corners.map(([x, , z], i) => {
        const h = z < 0 ? BACK_HEIGHT + 0.9 : SIDE_HEIGHT + 0.9;
        return (
          <mesh key={i} position={[x, h / 2, z]} rotation-y={Math.PI / 4} castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.95, h, 4]} />
            <meshStandardMaterial color={PALETTE.wallWarm} roughness={0.95} flatShading />
          </mesh>
        );
      })}

      <Instances castShadow receiveShadow limit={48}>
        <cylinderGeometry args={[0.06, 0.26, 0.9, 4]} />
        <meshStandardMaterial color={PALETTE.wallTrim} roughness={0.95} flatShading />
        {backPinnacles.map((x) => (
          <Instance key={`b${x}`} position={[x, BACK_HEIGHT + 0.55, -HALF_Z]} rotation-y={Math.PI / 4} />
        ))}
        {frontPinnacles.map((x) => (
          <Instance key={`f${x}`} position={[x, SIDE_HEIGHT + 0.45, HALF_Z]} rotation-y={Math.PI / 4} scale={0.8} />
        ))}
        {gatePinnacles.map((x) => (
          <Instance key={`g${x}`} position={[x, GATE.towerHeight + 0.6, HALF_Z]} rotation-y={Math.PI / 4} scale={1.1} />
        ))}
      </Instances>
    </group>
  );
}

/** Protruding timber beams (toron) on the inner wall faces. */
function Toron() {
  const inner = WALL_DEPTH / 2;
  const reach = 0.3;
  const back = range(-9, 9, 1.5).map((x): Vec3 => [x, 5.8, -HALF_Z + inner + reach]);
  const sides = [-1, 1].flatMap((side) =>
    range(-HALF_Z + 1.9, HALF_Z - 1.9, 1.6).map((z): Vec3 => [side * (HALF_X - inner - reach), 4.3, z]),
  );

  return (
    <Instances castShadow limit={64}>
      <cylinderGeometry args={[0.045, 0.055, reach * 2 + 0.2, 6]} />
      <meshStandardMaterial color={PALETTE.timber} roughness={0.85} />
      {back.map((p, i) => (
        <Instance key={`z${i}`} position={p} rotation-x={Math.PI / 2} />
      ))}
      {sides.map((p, i) => (
        <Instance key={`x${i}`} position={p} rotation-z={Math.PI / 2} />
      ))}
    </Instances>
  );
}

/** Built-in plaster benches (banco) along the side walls. */
function Benches() {
  const texture = useSurfaceTexture(2, 0.5);
  const benches: Vec3[] = [
    [-HALF_X + 0.55, 0.22, -4],
    [HALF_X - 0.55, 0.22, 7],
  ];
  return (
    <group>
      {benches.map((p, i) => (
        <mesh key={i} position={p} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.44, 5]} />
          <meshStandardMaterial color={PALETTE.wallTrim} map={texture} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/*
 * Climber paths are module constants so the instanced foliage is generated
 * once, not on every render.
 */
const GATE_Z = GATE_FACE_Z + 0.02;
const CLIMBERS: {
  path: Vec3[];
  normal: Vec3;
  spread: number;
  density: number;
  strands: number;
  seed: number;
}[] = [
  // Over the gate: heavy on the left, lighter on the right, as in the reference.
  {
    path: [
      [-4.3, 0.7, GATE_Z],
      [-4.1, 2.0, GATE_Z],
      onGateArch(4.0, 180),
      onGateArch(4.0, 160),
      onGateArch(4.05, 135),
      onGateArch(4.1, 110),
      onGateArch(4.1, 88),
    ],
    normal: [0, 0, 1],
    spread: 0.6,
    density: 46,
    strands: 14,
    seed: 11,
  },
  {
    path: [
      [-5.3, 3.5, GATE_Z],
      [-5.2, 6.5, GATE_Z],
      [-4.6, 8.6, GATE_Z],
    ],
    normal: [0, 0, 1],
    spread: 0.45,
    density: 26,
    strands: 3,
    seed: 12,
  },
  {
    path: [onGateArch(4.05, 62), onGateArch(4.0, 38), onGateArch(4.0, 14), [4.15, 1.9, GATE_Z]],
    normal: [0, 0, 1],
    spread: 0.48,
    density: 30,
    strands: 4,
    seed: 13,
  },
  // Inside the courtyard.
  {
    path: [
      [5.8, 7.1, -HALF_Z + 0.32],
      [8.2, 6.8, -HALF_Z + 0.32],
      [9.6, 5.6, -HALF_Z + 0.32],
    ],
    normal: [0, 0, 1],
    spread: 0.5,
    density: 30,
    strands: 6,
    seed: 14,
  },
  {
    path: [
      [-HALF_X + 0.32, 5.0, 10.5],
      [-HALF_X + 0.32, 4.8, 6.5],
    ],
    normal: [1, 0, 0],
    spread: 0.5,
    density: 30,
    strands: 6,
    seed: 15,
  },
  {
    path: [
      [HALF_X - 0.32, 5.0, -3.5],
      [HALF_X - 0.32, 4.8, -8],
    ],
    normal: [-1, 0, 0],
    spread: 0.5,
    density: 30,
    strands: 6,
    seed: 16,
  },
];

function Climbers() {
  return (
    <group>
      {CLIMBERS.map((c) => (
        <Bougainvillea key={c.seed} {...c} />
      ))}
    </group>
  );
}

/** Trees, shrubs and carved pots placed clear of the looks and camera sightlines. */
function Garden() {
  return (
    <group>
      {/* Foreground, just outside the gate (framing the hero shot). */}
      <PottedPlant position={[-3.2, 0, 15.9]} scale={1.7} seed={21} />
      <PottedPlant position={[-4.7, 0, 14.4]} scale={1.05} seed={22} />
      <CarvedPot position={[3.4, 0, 15.5]} scale={1.5} />
      <PottedPlant position={[4.6, 0, 14.3]} scale={1.15} seed={23} />

      {/* Citrus trees down both sides and flanking the back wall. */}
      <CitrusTree position={[-7.1, 0, -9.6]} seed={31} />
      <CitrusTree position={[7.1, 0, -9.6]} seed={32} />
      <CitrusTree position={[-7.7, 0, 3.6]} scale={0.95} seed={33} />
      <CitrusTree position={[7.7, 0, 0.4]} scale={0.95} seed={34} />

      {/* Flowering shrubs and urns. */}
      <FloweringShrub position={[-2.75, 0, -11.2]} scale={0.85} seed={41} />
      <FloweringShrub position={[2.75, 0, -11.2]} scale={0.85} seed={42} />
      <FloweringShrub position={[-8.8, 0, 10.6]} seed={43} />
      <FloweringShrub position={[8.9, 0, -5.8]} scale={0.9} seed={44} />
      <CarvedPot position={[-9.1, 0, -11.2]} scale={1.3} />
      <CarvedPot position={[-8.3, 0, -11.5]} scale={0.9} />
      <CarvedPot position={[9.1, 0, 10.7]} scale={1.2} />
      <CarvedPot position={[-9.1, 0, -1]} scale={1.1} />
      <PottedPlant position={[9.0, 0, 3.2]} scale={1.1} seed={45} />
      <PottedPlant position={[-9.0, 0, -7.2]} scale={1.1} seed={46} />
    </group>
  );
}

/** Canopy sails across the back half of the courtyard, hangings and lanterns. */
function Furnishings() {
  const backFace = -HALF_Z + WALL_DEPTH / 2 + 0.01;
  const sideFace = HALF_X - WALL_DEPTH / 2 - 0.01;
  return (
    <group>
      <CanopySail position={[0, 5.55, -2.6]} width={HALF_X * 2} depth={3.4} sag={1.05} color={PALETTE.canopyCream} rotationY={0.05} />
      <CanopySail position={[0, 5.75, -5.7]} width={HALF_X * 2} depth={2.2} sag={0.8} color={PALETTE.canopyRed} rotationY={-0.06} phase={1.3} />
      <CanopySail position={[0, 5.6, -8.5]} width={HALF_X * 2} depth={2.8} sag={0.95} color={PALETTE.canopyCream} rotationY={0.04} phase={2.4} />

      {/* Kilims flank the hall doorway; more hang on the side walls. */}
      <Kilim position={[-3.1, 5.0, backFace]} phase={0.4} />
      <Kilim position={[3.1, 5.0, backFace]} phase={1.7} />
      <Kilim position={[-sideFace, 4.7, 0.5]} rotationY={Math.PI / 2} width={1.2} height={2.5} phase={2.2} />
      <Kilim position={[sideFace, 4.7, -1.8]} rotationY={-Math.PI / 2} width={1.2} height={2.5} phase={0.9} />

      <WallSconce position={[-2.25, 3.0, backFace]} />
      <WallSconce position={[2.25, 3.0, backFace]} />
      <WallSconce position={[-sideFace, 3.0, 3.6]} rotationY={Math.PI / 2} />
      <WallSconce position={[sideFace, 3.0, 4.2]} rotationY={-Math.PI / 2} />
    </group>
  );
}

export function Courtyard() {
  return (
    <group>
      <Ground />
      <Walls />
      <Silhouette />
      <Toron />
      <Benches />
      <Climbers />
      <Garden />
      <Furnishings />
    </group>
  );
}
