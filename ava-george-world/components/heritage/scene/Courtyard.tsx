"use client";

import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import { ExtrudeGeometry, Shape, ShapeGeometry } from "three";
import { COURTYARD, GATE, HALL, PALETTE, PEDESTALS, type Vec3 } from "../config";
import { ArchedWall, archBandShape, type ArchOpening, type ArchTrim } from "./ArchedWall";
import { Entrance, ENTRANCE } from "./Entrance";
import { CanopySail, Kilim, WallSconce } from "./Fabrics";
import { Bougainvillea, CardPlant, CarvedPot, FloweringShrub, IvyCurtain, OliveTree, PottedPlant, TallTrees } from "./Planting";
import { useHeritageTexture } from "./assets";
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
/* Only the back-half window remains; the front half has blind niches instead. */
const SIDE_OPENINGS: ArchOpening[] = [{ x: 6, width: 1.1, height: 1.6, sill: 2.2 }];

/** Raised mouldings framing every arch. */
const GATE_TRIM: ArchTrim = { width: 0.42, color: PALETTE.wallTrim, depth: 0.1 };
const WALL_TRIM: ArchTrim = { width: 0.22, color: PALETTE.wallTrim };

/** Blind arched niches down the front half of each side wall (world z). */
const NICHE_Z = [9.9, 6.9, 3.9];

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
  // Photographed limestone repeats every 4 m; the rug image covers 3 m x 4.5 m.
  const tiles = useHeritageTexture("limestone", 30, 30);
  const tilesNormal = useHeritageTexture("limestoneNormal", 30, 30);
  const rugStart = GATE_FACE_Z + 1.4;
  const rugEnd = -HALF_Z + 0.4;
  const rugLength = rugStart - rugEnd;
  const rug = useHeritageTexture("rug", 1, rugLength / 4.5);
  const sideRug = useHeritageTexture("rug", 1, 3.4 / 3.3);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial map={tiles} normalMap={tilesNormal} normalScale={[0.8, 0.8]} roughness={0.68} />
      </mesh>
      {/* Smaller rugs either side of the entrance, as in a lived-in courtyard. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 6.4, 0.01, 8.6]} rotation-y={side * 0.06} receiveShadow>
          <boxGeometry args={[2.2, 0.014, 3.4]} />
          <meshStandardMaterial map={sideRug} roughness={0.97} />
        </mesh>
      ))}
      {/* Red runner from just outside the gate to the hall doorway. */}
      <mesh position={[0, 0.012, (rugStart + rugEnd) / 2]} receiveShadow>
        <boxGeometry args={[3, 0.02, rugLength]} />
        <meshStandardMaterial map={rug} roughness={0.97} />
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
        trim={GATE_TRIM}
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
        trim={WALL_TRIM}
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
          trim={WALL_TRIM}
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
  const plaster = useHeritageTexture("plaster", 1, 3);

  return (
    <group>
      {corners.map(([x, , z], i) => {
        const h = z < 0 ? BACK_HEIGHT + 0.9 : SIDE_HEIGHT + 0.9;
        return (
          <mesh key={i} position={[x, h / 2, z]} rotation-y={Math.PI / 4} castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.95, h, 4]} />
            <meshStandardMaterial color={PALETTE.wallWarm} map={plaster} roughness={0.95} flatShading />
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
/** Climbers on the gate grow over the front of its stone surround. */
const GATE_Z = ENTRANCE.surroundFrontZ + 0.02;
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
      [-5.3, 3.5, ENTRANCE.pillarFrontZ + 0.02],
      [-5.2, 6.5, ENTRANCE.pillarFrontZ + 0.02],
      [-4.6, 8.6, GATE_FACE_Z + 0.02],
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
  // Down the jambs of the gate passage (framing the Display One view).
  {
    path: [
      [-GATE.halfWidth + 0.02, 0.5, HALF_Z + 0.5],
      [-GATE.halfWidth + 0.02, 3.2, HALF_Z + 0.1],
      [-GATE.halfWidth + 0.3, 5.4, HALF_Z + 0.4],
    ],
    normal: [1, 0, 0],
    spread: 0.45,
    density: 34,
    strands: 6,
    seed: 17,
  },
  // Cascading over the tops of the side walls.
  {
    path: [
      [-HALF_X + 0.32, 5.1, 11.6],
      [-HALF_X + 0.32, 5.0, 8.0],
      [-HALF_X + 0.32, 5.1, 4.5],
    ],
    normal: [1, 0, 0],
    spread: 0.55,
    density: 34,
    strands: 12,
    seed: 18,
  },
  {
    path: [
      [HALF_X - 0.32, 5.1, 11.6],
      [HALF_X - 0.32, 5.0, 8.4],
      [HALF_X - 0.32, 5.1, 5.6],
    ],
    normal: [-1, 0, 0],
    spread: 0.55,
    density: 34,
    strands: 12,
    seed: 19,
  },
  {
    path: [
      [-9.6, 5.6, -HALF_Z + 0.32],
      [-8.0, 6.9, -HALF_Z + 0.32],
      [-6.0, 7.1, -HALF_Z + 0.32],
    ],
    normal: [0, 0, 1],
    spread: 0.5,
    density: 30,
    strands: 6,
    seed: 20,
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

/** Ivy spilling over the wall tops between the bougainvillea. */
const IVY: { path: Vec3[]; normal: Vec3; length?: number; seed: number }[] = [
  // Left wall, from the citrus tree back towards the olive grove.
  { path: [[-HALF_X + 0.32, 5.0, 3.0], [-HALF_X + 0.32, 5.1, -3.0], [-HALF_X + 0.32, 5.0, -9.0]], normal: [1, 0, 0], seed: 71 },
  // Right wall, opposite the first two looks.
  { path: [[HALF_X - 0.32, 5.0, 4.0], [HALF_X - 0.32, 5.1, -2.5]], normal: [-1, 0, 0], seed: 72 },
  // Back wall, either side of the hall archway.
  { path: [[-5.5, 7.1, -HALF_Z + 0.32], [-2.0, 7.0, -HALF_Z + 0.32]], normal: [0, 0, 1], length: 2.2, seed: 73 },
  { path: [[2.0, 7.0, -HALF_Z + 0.32], [5.5, 7.1, -HALF_Z + 0.32]], normal: [0, 0, 1], length: 2.2, seed: 74 },
  // Outer face of the gatehouse, right of the arch.
  { path: [[4.3, 9.0, GATE_FACE_Z + 0.03], [5.4, 8.8, GATE_FACE_Z + 0.03]], normal: [0, 0, 1], length: 3.2, seed: 75 },
];

function Climbers() {
  return (
    <group>
      {CLIMBERS.map((c) => (
        <Bougainvillea key={c.seed} {...c} />
      ))}
      {IVY.map((c) => (
        <IvyCurtain key={c.seed} {...c} />
      ))}
    </group>
  );
}

/**
 * Blind arched niches on the inner face of each side wall: a shaded recess
 * panel framed by a raised moulding, with a lantern between each pair.
 */
function BlindNiches() {
  const { recess, band } = useMemo(() => {
    const r = 0.75;
    const spring = 2.35;
    const recessShape = new Shape();
    recessShape.moveTo(-r, 0.25);
    recessShape.lineTo(-r, spring);
    recessShape.absarc(0, spring, r, Math.PI, 0, true);
    recessShape.lineTo(r, 0.25);
    recessShape.closePath();
    return {
      recess: new ShapeGeometry(recessShape, 20),
      band: new ExtrudeGeometry(archBandShape(0, 0.25, r, spring, 0.16), { depth: 0.06, bevelEnabled: false, curveSegments: 20 }),
    };
  }, []);
  const face = HALF_X - WALL_DEPTH / 2;
  // The recess is the same plaster, deeper in tone as if in shade.
  const nichePlaster = useHeritageTexture("plaster", 0.6, 1.2);

  return (
    <group>
      {[-1, 1].map((side) =>
        NICHE_Z.map((z) => (
          <group key={`${side}${z}`} position={[-side * face, 0, z]} rotation-y={(side * Math.PI) / 2}>
            <mesh geometry={recess} position={[0, 0, 0.006]} receiveShadow>
              <meshStandardMaterial color={PALETTE.niche} map={nichePlaster} roughness={0.95} />
            </mesh>
            <mesh geometry={band} castShadow receiveShadow>
              <meshStandardMaterial color={PALETTE.wallTrim} roughness={0.9} />
            </mesh>
          </group>
        )),
      )}
      {[-1, 1].map((side) =>
        [8.4, 5.4].map((z) => (
          <WallSconce key={`l${side}${z}`} position={[-side * (face + 0.01), 2.9, z]} rotationY={(side * Math.PI) / 2} />
        )),
      )}
    </group>
  );
}

/*
 * Tall trees growing outside the walls: date palms, flame trees and acacias
 * whose crowns rise above the wall tops, and a few flanking the approach to
 * the gate, so the courtyard sits in a garden rather than on its own.
 */
const DATE_PALMS: { position: Vec3; scale?: number }[] = [
  { position: [-7.9, 0, 15.2] },
  { position: [8.2, 0, 15.6], scale: 0.95 },
  { position: [-13.2, 0, 8.5], scale: 1.1 },
  { position: [13.6, 0, 5.5] },
  { position: [-14.6, 0, -1.5], scale: 0.9 },
  { position: [-11.8, 0, -15.8], scale: 1.15 },
  { position: [12.4, 0, -16.2], scale: 1.05 },
  // Behind the back corners, seen through the gate arch from the first view.
  { position: [-9.6, 0, -13.8], scale: 1.1 },
  { position: [9.9, 0, -14.0], scale: 1.15 },
];
const FLAME_TREES: { position: Vec3; scale?: number }[] = [
  { position: [-10.6, 0, 18.4] },
  { position: [-13.8, 0, -7.5], scale: 1.05 },
  { position: [13.4, 0, 12.6], scale: 0.95 },
  { position: [-12.8, 0, -19.5], scale: 1.15 },
];
const ACACIAS: { position: Vec3; scale?: number }[] = [
  { position: [11.4, 0, 19.2] },
  { position: [14.2, 0, -10.5], scale: 1.1 },
  { position: [-14.4, 0, 14.6], scale: 0.9 },
  { position: [12.9, 0, -20.6], scale: 1.2 },
];

function OutsideTrees() {
  return (
    <group>
      <TallTrees kind="datePalm" trees={DATE_PALMS} />
      <TallTrees kind="flameTree" trees={FLAME_TREES} />
      <TallTrees kind="acacia" trees={ACACIAS} />
    </group>
  );
}

/** Glazed cream for the urns at the entrance. */
const CREAM_GLAZE = "#efe1c8";

/** The looks displayed in the courtyard (each gets planting beside it). */
const COURTYARD_LOOKS = PEDESTALS.filter((p) => p.zone === "courtyard");

/** A rotating mix of potted plants, so no two displays are planted alike. */
const DISPLAY_PLANTS = ["fern", "birdOfParadise", "geranium", "agave", "bougainvillea"] as const;

function DisplayPlant({ kind, position, scale, seed }: { kind: (typeof DISPLAY_PLANTS)[number]; position: Vec3; scale: number; seed: number }) {
  if (kind === "agave") return <PottedPlant position={position} scale={scale} seed={seed} />;
  if (kind === "bougainvillea") return <FloweringShrub position={position} scale={scale * 1.05} seed={seed} />;
  return <CardPlant kind={kind} position={position} scale={scale} seed={seed} />;
}

/** Trees, shrubs and carved pots placed clear of the looks and camera sightlines. */
function Garden() {
  return (
    <group>
      {/* Foreground, just outside the gate (framing the hero shot). */}
      {/* Big cream urns of bougainvillea and broad leaves either side. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <FloweringShrub position={[side * 3.05, 0, 15.7]} scale={1.65} seed={21 + side} potGlaze={CREAM_GLAZE} />
          <CardPlant
            kind="birdOfParadise"
            position={[side * 4.2, 0, 14.6]}
            scale={1.35}
            seed={26 + side}
            potGlaze={CREAM_GLAZE}
          />
        </group>
      ))}

      {/* Olive trees in front of the side doors, flanking the hall archway. */}
      <OliveTree position={[-4.8, 0, -10.6]} seed={31} />
      <OliveTree position={[4.8, 0, -10.6]} seed={32} />
      {/* Lemon trees, a palm and an olive part-way down each side. */}
      <CardPlant kind="palm" position={[-7.7, 0, 1.0]} scale={0.9} seed={33} />
      <OliveTree position={[7.7, 0, -2.6]} scale={0.85} seed={34} />
      <CardPlant kind="lemonTree" position={[-7.7, 0, -4.5]} seed={35} />
      <CardPlant kind="lemonTree" position={[7.7, 0, 4.5]} seed={36} />

      {/* Varied potted planting beside every courtyard display. */}
      {COURTYARD_LOOKS.map((p, i) => {
        const [x, , z] = p.position;
        const out = Math.sign(x);
        return (
          <group key={p.id}>
            <DisplayPlant
              kind={DISPLAY_PLANTS[i % DISPLAY_PLANTS.length]}
              position={[x + out * 1.35, 0, z - 0.55]}
              scale={0.78}
              seed={50 + i}
            />
            <DisplayPlant
              kind={DISPLAY_PLANTS[(i + 2) % DISPLAY_PLANTS.length]}
              position={[x + out * 1.2, 0, z + 0.95]}
              scale={0.72}
              seed={60 + i}
            />
          </group>
        );
      })}

      {/* Palms in the corners; shrubs, urns and ferns along the walls. */}
      <CardPlant kind="palm" position={[-8.8, 0, 11.0]} seed={43} />
      <CardPlant kind="palm" position={[9.1, 0, 11.0]} scale={0.95} seed={45} />
      <CardPlant kind="palm" position={[-9.1, 0, -11.2]} scale={1.05} seed={47} />
      <CardPlant kind="palm" position={[9.1, 0, -11.2]} seed={48} />
      <FloweringShrub position={[-2.75, 0, -11.2]} scale={0.85} seed={41} />
      <FloweringShrub position={[2.75, 0, -11.2]} scale={0.85} seed={42} />
      <FloweringShrub position={[8.9, 0, -6.6]} scale={0.9} seed={44} />
      <CarvedPot position={[-8.0, 0, -11.6]} scale={0.9} />
      <CardPlant kind="fern" position={[-9.0, 0, -7.2]} scale={1.1} seed={46} />
      <CardPlant kind="geranium" position={[9.0, 0, 8.2]} scale={1.1} seed={49} />
      <CardPlant kind="fern" position={[-9.0, 0, 8.6]} seed={40} />
      {/* Monsteras in the shade beneath the wall lanterns and by the back corner. */}
      <CardPlant kind="monstera" position={[-9.2, 0, 5.4]} scale={0.85} seed={37} />
      <CardPlant kind="monstera" position={[9.2, 0, 2.0]} scale={0.85} seed={38} />
      <CardPlant kind="monstera" position={[9.0, 0, -9.0]} scale={0.9} seed={39} />
    </group>
  );
}

/** Canopy sails across the courtyard, patterned banners and lanterns. */
function Furnishings() {
  const backFace = -HALF_Z + WALL_DEPTH / 2 + 0.01;
  const sideFace = HALF_X - WALL_DEPTH / 2 - 0.01;
  return (
    <group>
      {/* Cream and red sails crossing over the front, cream and terracotta further back. */}
      <CanopySail position={[0, 6.0, 7.2]} width={HALF_X * 2} depth={3.8} sag={1.3} color={PALETTE.canopyCream} rotationY={0.13} phase={0.6} />
      <CanopySail position={[0, 6.1, 3.9]} width={HALF_X * 2} depth={2.3} sag={1.1} color={PALETTE.canopyRed} rotationY={-0.17} phase={2.0} />
      <CanopySail position={[0, 5.6, -2.4]} width={HALF_X * 2} depth={3.4} sag={1.05} color={PALETTE.canopyCream} rotationY={0.05} />
      <CanopySail position={[0, 5.75, -6.2]} width={HALF_X * 2} depth={2.6} sag={0.9} color={PALETTE.canopyTerracotta} rotationY={-0.07} phase={1.3} />

      {/* Tall banners flank the hall doorway; more hang on the side walls. */}
      <Kilim position={[-3.1, 6.3, backFace]} width={1.25} height={3.0} phase={0.4} />
      <Kilim position={[3.1, 6.3, backFace]} width={1.25} height={3.0} phase={1.7} />
      <Kilim position={[-sideFace, 4.7, -0.6]} rotationY={Math.PI / 2} width={1.2} height={2.5} phase={2.2} />
      <Kilim position={[sideFace, 4.7, 0.6]} rotationY={-Math.PI / 2} width={1.2} height={2.5} phase={0.9} />

      <WallSconce position={[-2.35, 3.2, backFace]} />
      <WallSconce position={[2.35, 3.2, backFace]} />
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
      <BlindNiches />
      <Garden />
      <Entrance />
      <OutsideTrees />
      <Furnishings />
    </group>
  );
}
