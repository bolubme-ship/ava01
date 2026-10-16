"use client";

import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import { DoubleSide, LatheGeometry, Vector2 } from "three";
import { PALETTE, type Vec3 } from "../config";
import { ArchedWall, type ArchOpening } from "./ArchedWall";
import { useSurfaceTexture } from "./surfaceTexture";

/*
 * Placeholder courtyard inspired by earthen Sahelian architecture:
 * thick plastered walls, round arches, tapered corner buttresses,
 * pinnacles along the parapet, and protruding timber beams (toron).
 * Everything is primitive geometry so it can be swapped for modelled
 * assets later without touching the camera or scroll code.
 *
 * Courtyard interior spans x ∈ [-10, 10], z ∈ [-12, 12].
 */

const HALF_X = 10.3;
const HALF_Z = 12.3;
const WALL_DEPTH = 0.6;
const SIDE_HEIGHT = 5;
const BACK_HEIGHT = 7.2;

const FRONT_OPENINGS: ArchOpening[] = [{ x: 0, width: 4.4, height: 4.1 }];
const BACK_OPENINGS: ArchOpening[] = [
  { x: -5, width: 2, height: 3.2 },
  { x: 0, width: 3, height: 4.2 },
  { x: 5, width: 2, height: 3.2 },
  { x: -5, width: 1, height: 1.5, sill: 4.4 },
  { x: 0, width: 1.2, height: 1.4, sill: 5.2 },
  { x: 5, width: 1, height: 1.5, sill: 4.4 },
];
const SIDE_OPENINGS: ArchOpening[] = [
  { x: -6, width: 1.1, height: 1.6, sill: 2.2 },
  { x: 6, width: 1.1, height: 1.6, sill: 2.2 },
];

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-6; v += step) out.push(v);
  return out;
}

function Ground() {
  const earth = useSurfaceTexture(20);
  const tiles = useSurfaceTexture(1, 8);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={PALETTE.ground} map={earth} roughness={1} />
      </mesh>
      {/* Stone path from the gate to the central doorway. */}
      <mesh position={[0, 0.015, 0.4]} receiveShadow>
        <boxGeometry args={[3.2, 0.03, 26]} />
        <meshStandardMaterial color={PALETTE.path} map={tiles} roughness={0.9} />
      </mesh>
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} position={[x, 0.02, 0.4]} receiveShadow>
          <boxGeometry args={[0.2, 0.04, 26]} />
          <meshStandardMaterial color={PALETTE.clay} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Walls() {
  const trim = useSurfaceTexture(4, 0.5);
  return (
    <group>
      <ArchedWall
        width={HALF_X * 2 + WALL_DEPTH}
        height={SIDE_HEIGHT}
        openings={FRONT_OPENINGS}
        color={PALETTE.wallLight}
        position={[0, 0, HALF_Z]}
      />
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
          [[0, SIDE_HEIGHT, HALF_Z], [HALF_X * 2 + 1, 0.2, 0.85]],
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

      {/* Shadowed interior seen through the back doorways. */}
      <mesh position={[0, BACK_HEIGHT / 2, -HALF_Z - 1.6]}>
        <planeGeometry args={[HALF_X * 2, BACK_HEIGHT]} />
        <meshBasicMaterial color={PALETTE.shadowInterior} />
      </mesh>
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
  const frontPinnacles = range(-9, 9, 2.25);

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

      <Instances castShadow receiveShadow limit={32}>
        <cylinderGeometry args={[0.06, 0.26, 0.9, 4]} />
        <meshStandardMaterial color={PALETTE.wallTrim} roughness={0.95} flatShading />
        {backPinnacles.map((x) => (
          <Instance key={`b${x}`} position={[x, BACK_HEIGHT + 0.55, -HALF_Z]} rotation-y={Math.PI / 4} />
        ))}
        {frontPinnacles.map((x) => (
          <Instance
            key={`f${x}`}
            position={[x, SIDE_HEIGHT + 0.45, HALF_Z]}
            rotation-y={Math.PI / 4}
            scale={0.8}
          />
        ))}
      </Instances>
    </group>
  );
}

/** Protruding timber beams (toron) on the inner wall faces. */
function Toron() {
  const inner = WALL_DEPTH / 2;
  const reach = 0.3;
  const back = [2.4, 5.8].flatMap((y) =>
    range(-9, 9, 1.5).map((x): Vec3 => [x, y, -HALF_Z + inner + reach]),
  );
  const sides = [-1, 1].flatMap((side) =>
    range(-10.4, 10.4, 1.6).map((z): Vec3 => [side * (HALF_X - inner - reach), 3.7, z]),
  );
  const front = range(-9, 9, 1.5)
    .filter((x) => Math.abs(x) > 2.6)
    .map((x): Vec3 => [x, 4.3, HALF_Z - inner - reach]);

  return (
    <Instances castShadow limit={128}>
      <cylinderGeometry args={[0.045, 0.055, reach * 2 + 0.2, 6]} />
      <meshStandardMaterial color={PALETTE.timber} roughness={0.85} />
      {[...back, ...front].map((p, i) => (
        <Instance key={`z${i}`} position={p} rotation-x={Math.PI / 2} />
      ))}
      {sides.map((p, i) => (
        <Instance key={`x${i}`} position={p} rotation-z={Math.PI / 2} />
      ))}
    </Instances>
  );
}

function Tree({ position }: { position: Vec3 }) {
  const canopy: [Vec3, number][] = [
    [[0, 4.1, 0], 1.7],
    [[1.1, 3.7, 0.4], 1.25],
    [[-0.9, 3.8, -0.3], 1.3],
    [[0.2, 4.7, -0.7], 1.1],
  ];
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.15, 1.25, 0.45, 32]} />
        <meshStandardMaterial color={PALETTE.clay} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.46, 0]} receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.04, 32]} />
        <meshStandardMaterial color="#5a3b26" roughness={1} />
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation-z={0.06} castShadow>
        <cylinderGeometry args={[0.16, 0.28, 3.2, 10]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.9} />
      </mesh>
      {canopy.map(([p, r], i) => (
        <mesh key={i} position={p} castShadow receiveShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={PALETTE.foliage} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function ClayPots() {
  const geometry = useMemo(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.17, 0],
          [0.3, 0.16],
          [0.34, 0.36],
          [0.24, 0.6],
          [0.13, 0.68],
          [0.15, 0.75],
          [0.11, 0.75],
        ].map(([x, y]) => new Vector2(x, y)),
        28,
      ),
    [],
  );
  const pots: [Vec3, number][] = [
    [[-8.9, 0, -10.8], 1.35],
    [[-8.05, 0, -11.15], 0.9],
    [[-2.3, 0, -11.3], 1],
    [[2.3, 0, -11.3], 1],
    [[8.9, 0, 10.6], 1.2],
    [[-9, 0, 4.4], 1.1],
  ];
  return (
    <group>
      {pots.map(([p, s], i) => (
        <mesh key={i} geometry={geometry} position={p} scale={s} castShadow receiveShadow>
          <meshStandardMaterial color={PALETTE.clay} roughness={0.8} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** Built-in plaster benches (banco) along the side walls. */
function Benches() {
  const texture = useSurfaceTexture(2, 0.5);
  const benches: Vec3[] = [
    [-HALF_X + 0.55, 0.22, -2],
    [HALF_X - 0.55, 0.22, 6.5],
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

/** Indigo shade cloth stretched from the right wall to two timber poles. */
function ShadeCloth() {
  const poles: Vec3[] = [
    [5.2, 2.1, -1],
    [5.2, 2.1, -6],
  ];
  return (
    <group>
      <mesh position={[7.6, 4.4, -3.5]} rotation={[-Math.PI / 2, -0.12, 0]} castShadow>
        <planeGeometry args={[4.9, 5.2]} />
        {/* Faint emissive fakes sunlight glowing through the weave from above. */}
        <meshStandardMaterial
          color={PALETTE.indigoCloth}
          emissive={PALETTE.indigoCloth}
          emissiveIntensity={0.45}
          roughness={0.9}
          side={DoubleSide}
        />
      </mesh>
      {poles.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 4.2, 8]} />
          <meshStandardMaterial color={PALETTE.timber} roughness={0.85} />
        </mesh>
      ))}
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
      <Tree position={[7, 0, -8]} />
      <ClayPots />
      <Benches />
      <ShadeCloth />
    </group>
  );
}
