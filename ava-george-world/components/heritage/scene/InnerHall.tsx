"use client";

import { Instance, Instances } from "@react-three/drei";
import { HALL, PALETTE, type Vec3 } from "../config";
import { ArchedWall, type ArchOpening } from "./ArchedWall";
import { useSurfaceTexture } from "./surfaceTexture";

/*
 * The inner hall behind the courtyard's back wall, entered through its
 * central archway. Lime-washed walls, a dark timber beam ceiling, a woven
 * runner down the middle and a striped textile hanging behind the finale.
 * The ceiling and walls cast shadows, so sunlight only reaches inside
 * through the doorways and high windows; lanterns light each look.
 */

const WALL_DEPTH = 0.6;
const LENGTH = HALL.front - HALL.back;
const MID_Z = (HALL.front + HALL.back) / 2;

const SIDE_WINDOWS: ArchOpening[] = [-6, 0, 6].map((x) => ({
  x,
  width: 1.2,
  height: 1.8,
  sill: 3.4,
}));

const TEXTILE_BANDS = [
  PALETTE.indigoCloth,
  PALETTE.mustard,
  PALETTE.clay,
  "#efe3cc",
  PALETTE.clay,
  PALETTE.mustard,
  PALETTE.indigoCloth,
];

function Shell() {
  const floorTexture = useSurfaceTexture(4, 6);
  const runnerTexture = useSurfaceTexture(1, 10);
  const ceilingTexture = useSurfaceTexture(3, 6);
  const beams = [];
  for (let z = HALL.front - 0.6; z > HALL.back; z -= 1.3) beams.push(z);

  return (
    <group>
      {[-1, 1].map((side) => (
        <ArchedWall
          key={side}
          width={LENGTH + WALL_DEPTH * 2}
          height={HALL.height}
          depth={WALL_DEPTH}
          openings={SIDE_WINDOWS}
          color={PALETTE.hallWall}
          position={[side * (HALL.halfX + WALL_DEPTH / 2), 0, MID_Z]}
          rotationY={Math.PI / 2}
        />
      ))}
      <ArchedWall
        width={HALL.halfX * 2 + WALL_DEPTH * 2}
        height={HALL.height}
        depth={WALL_DEPTH}
        color={PALETTE.hallWall}
        position={[0, 0, HALL.back - WALL_DEPTH / 2]}
      />

      {/* Ceiling slab and exposed beams. */}
      <mesh position={[0, HALL.height + 0.18, MID_Z]} castShadow receiveShadow>
        <boxGeometry args={[HALL.halfX * 2 + WALL_DEPTH * 2, 0.36, LENGTH + WALL_DEPTH * 2]} />
        <meshStandardMaterial color={PALETTE.hallCeiling} map={ceilingTexture} roughness={0.9} />
      </mesh>
      <Instances castShadow receiveShadow limit={32}>
        <boxGeometry args={[HALL.halfX * 2, 0.24, 0.2]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.85} />
        {beams.map((z) => (
          <Instance key={z} position={[0, HALL.height - 0.12, z]} />
        ))}
      </Instances>

      {/* Burnished clay floor with a woven runner. */}
      <mesh position={[0, 0.006, MID_Z]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[HALL.halfX * 2, LENGTH]} />
        <meshStandardMaterial color={PALETTE.hallFloor} map={floorTexture} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.012, MID_Z + 0.4]} receiveShadow>
        <boxGeometry args={[2.2, 0.012, LENGTH - 2.2]} />
        <meshStandardMaterial color="#c99a5c" map={runnerTexture} roughness={0.95} />
      </mesh>
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.02, MID_Z + 0.4]} receiveShadow>
          <boxGeometry args={[0.12, 0.012, LENGTH - 2.2]} />
          <meshStandardMaterial color={PALETTE.indigoCloth} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Striped wall hanging behind the finale look. */
function Textile() {
  const bandWidth = 0.66;
  const width = bandWidth * TEXTILE_BANDS.length;
  const z = HALL.back + 0.06;
  return (
    <group position={[0, 3.2, z]}>
      {TEXTILE_BANDS.map((color, i) => (
        <mesh key={i} position={[(i - (TEXTILE_BANDS.length - 1) / 2) * bandWidth, 0, 0]} receiveShadow>
          <boxGeometry args={[bandWidth, 3.8, 0.03]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 1.98, 0.05]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.05, 0.05, width + 0.5, 12]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Hanging lantern with a warm point light, placed above a look. */
function Lantern({ position }: { position: Vec3 }) {
  const [x, , z] = position;
  const y = 3.9;
  const drop = HALL.height - y;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, drop / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, drop, 6]} />
        <meshStandardMaterial color={PALETTE.timber} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.15, 0.12, 0.34, 16]} />
        <meshStandardMaterial
          color={PALETTE.lanternGlow}
          emissive={PALETTE.lanternGlow}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#ffc78a" intensity={14} distance={9} decay={2} position={[0, -0.3, 0]} />
    </group>
  );
}

export function InnerHall({ lanterns }: { lanterns: Vec3[] }) {
  return (
    <group>
      <Shell />
      <Textile />
      {lanterns.map((p) => (
        <Lantern key={`${p[0]},${p[2]}`} position={p} />
      ))}
    </group>
  );
}
