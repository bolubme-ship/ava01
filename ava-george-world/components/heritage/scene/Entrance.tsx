"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  LatheGeometry,
  Object3D,
  PlaneGeometry,
  Vector2,
  type Group,
  type InstancedMesh,
} from "three";
import { COURTYARD, GATE, type Vec3 } from "../config";
import { archBandShape } from "./ArchedWall";
import { useHeritageTexture } from "./assets";
import { useAmbientMotion } from "./motion";
import { useProceduralTexture } from "./proceduralTextures";
import { mulberry32 } from "./random";

/*
 * The entrance, dressed for a celebration: a cream stone surround and
 * pillars framing the gate arch, red and cream fabric swags draped across
 * it with tails down each side, banners on the pillars, pierced-brass
 * Moroccan lanterns (hanging in the arch, on the pillars and lining the
 * approach) and rose petals scattered over the ground.
 *
 * The lanterns glow through emissive cores and soft halos rather than one
 * real light each; two warm lights carry their glow onto the fabric and
 * the ground, which keeps the frame rate up.
 */

const GATE_FACE_Z = COURTYARD.halfZ + GATE.depth / 2;
const ARCH_RADIUS = GATE.halfWidth;
const ARCH_SPRING = GATE.archHeight - GATE.halfWidth;
const SURROUND_BAND = 0.75;
const SURROUND_DEPTH = 0.3;

/** Placement of the stone pillars either side of the arch (x is each pillar's centre). */
export const ENTRANCE = {
  /** Front of the stone surround, where foliage on the arch should sit. */
  surroundFrontZ: GATE_FACE_Z + SURROUND_DEPTH,
  pillarX: 5.1,
  pillarWidth: 0.9,
  pillarHeight: 7.1,
  pillarFrontZ: GATE_FACE_Z + 0.6,
};

/** Height of the drapery's top edge: low enough to hang inside the opening view. */
const DRAPE_TOP = 6.15;

const CREAM_STONE = "#f6e9d2";
const RED_CLOTH = "#a8212a";
const CREAM_CLOTH = "#f3e3c6";
const BRASS = "#b8893f";

// ---------------------------------------------------------------------------
// Stone

/** Cream stone band round the arch and a pillar either side, with capitals and bases. */
function StoneSurround() {
  const stone = useHeritageTexture("limestone", 0.3, 0.3);
  const pillarStone = useHeritageTexture("limestone", 0.25, 1.6);
  const band = useMemo(
    () =>
      new ExtrudeGeometry(archBandShape(0, 0, ARCH_RADIUS, ARCH_SPRING, SURROUND_BAND), {
        depth: SURROUND_DEPTH,
        bevelEnabled: true,
        bevelSize: 0.03,
        bevelThickness: 0.03,
        bevelSegments: 2,
        curveSegments: 40,
      }),
    [],
  );
  const { pillarX, pillarWidth, pillarHeight, pillarFrontZ } = ENTRANCE;
  const depth = pillarFrontZ - GATE_FACE_Z;
  return (
    <group>
      <mesh geometry={band} position={[0, 0, GATE_FACE_Z]} castShadow receiveShadow>
        <meshStandardMaterial color={CREAM_STONE} map={stone} roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * pillarX, 0, GATE_FACE_Z + depth / 2]}>
          <mesh position={[0, pillarHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[pillarWidth, pillarHeight, depth]} />
            <meshStandardMaterial color={CREAM_STONE} map={pillarStone} roughness={0.7} />
          </mesh>
          <mesh position={[0, pillarHeight + 0.14, 0.05]} castShadow receiveShadow>
            <boxGeometry args={[pillarWidth + 0.24, 0.28, depth + 0.2]} />
            <meshStandardMaterial color={CREAM_STONE} map={stone} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.2, 0.05]} castShadow receiveShadow>
            <boxGeometry args={[pillarWidth + 0.2, 0.4, depth + 0.16]} />
            <meshStandardMaterial color={CREAM_STONE} map={stone} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Fabric

/**
 * A swag of cloth hung between two points: it dips in the middle, hangs
 * deeper there, bellies forward and gathers into soft horizontal folds.
 */
function swagGeometry(span: number, sag: number, drop: number, belly: number) {
  const geometry = new PlaneGeometry(1, 1, 64, 12);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5;
    const v = 0.5 - pos.getY(i); // 0 along the top edge, 1 along the hem
    const mid = 1 - (2 * u - 1) ** 2;
    const y = -sag * mid - v * drop * (0.3 + 0.7 * mid);
    const z = belly * v * (1.3 - v) * mid + Math.sin(v * Math.PI * 3.5) * 0.035 * mid;
    pos.setXYZ(i, (u - 0.5) * span, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** A tail of cloth falling from a swag's end in pleats, flaring towards the hem. */
function tailGeometry(width: number, length: number, pleats: number) {
  const geometry = new PlaneGeometry(1, 1, 24, 24);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5;
    const v = 0.5 - pos.getY(i);
    const x = (u - 0.5) * width * (0.55 + 0.65 * v);
    const z = Math.sin(u * Math.PI * pleats) * 0.05 * (0.4 + v);
    pos.setXYZ(i, x, -v * length, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function Cloth({ geometry, color, position }: { geometry: PlaneGeometry; color: string; position: Vec3 }) {
  return (
    <mesh geometry={geometry} position={position} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.7} sheenColor={color} side={DoubleSide} />
    </mesh>
  );
}

/** Red and cream swags across the top of the arch, with tails down each side. */
function Drapery() {
  const animate = useAmbientMotion();
  const group = useRef<Group>(null);
  const shapes = useMemo(
    () => ({
      redSwag: swagGeometry(8.2, 0.65, 0.75, 0.45),
      creamSwag: swagGeometry(7.6, 0.95, 0.55, 0.35),
      redTail: tailGeometry(0.85, 3.9, 5),
      creamTail: tailGeometry(0.55, 3.0, 4),
    }),
    [],
  );
  useFrame(({ clock }) => {
    if (group.current && animate) group.current.rotation.x = Math.sin(clock.elapsedTime * 0.7) * 0.012;
  });

  const z = ENTRANCE.surroundFrontZ + 0.08;
  return (
    <group ref={group} position={[0, DRAPE_TOP, z]}>
      <Cloth geometry={shapes.redSwag} color={RED_CLOTH} position={[0, 0, 0]} />
      <Cloth geometry={shapes.creamSwag} color={CREAM_CLOTH} position={[0, 0.05, 0.1]} />
      {[-1, 1].map((side) => (
        <group key={side} scale={[side, 1, 1]}>
          <Cloth geometry={shapes.redTail} color={RED_CLOTH} position={[4.0, 0, -0.03]} />
          <Cloth geometry={shapes.creamTail} color={CREAM_CLOTH} position={[3.72, 0, 0.12]} />
        </group>
      ))}
    </group>
  );
}

/** Red and cream banner hanging on the front of a pillar. */
function PillarBanner({ side }: { side: number }) {
  const texture = useProceduralTexture("gateBanner");
  const length = 2.6;
  return (
    <mesh position={[side * ENTRANCE.pillarX, 6.75 - length / 2, ENTRANCE.pillarFrontZ + 0.012]} receiveShadow>
      <planeGeometry args={[0.72, length]} />
      <meshStandardMaterial map={texture} alphaTest={0.5} roughness={0.85} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Lanterns

/** Pierced dome capping a lantern: half-profile (radius, height) from the body's top. */
const lanternDome = new LatheGeometry(
  [
    [0.165, 0.39],
    [0.16, 0.45],
    [0.12, 0.52],
    [0.06, 0.58],
    [0.02, 0.63],
  ].map(([r, y]) => new Vector2(r, y)),
  12,
);

/**
 * Moroccan lantern, about 0.65 m tall at size 1: a hexagonal brass body with
 * lattice windows over a glowing core, a pierced dome and a soft halo.
 * `chain` hangs it that far below its anchor (0 = standing on the ground).
 */
function MoroccanLantern({ position, size = 1, chain = 0 }: { position: Vec3; size?: number; chain?: number }) {
  const panel = useProceduralTexture("lanternPanel", 6, 1);
  const pierce = useProceduralTexture("lanternPierce", 2, 1);
  const glow = useProceduralTexture("glowSpot");
  return (
    <group position={position}>
      {chain > 0 && (
        <mesh position={[0, 0.65 * size + chain / 2, 0]}>
          <cylinderGeometry args={[0.008, 0.008, chain, 4]} />
          <meshStandardMaterial color="#3a2a1a" metalness={0.5} roughness={0.5} />
        </mesh>
      )}
      <group scale={size}>
        <mesh position={[0, 0.03, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.17, 0.06, 6]} />
          <meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.125, 0.125, 0.32, 6]} />
          <meshStandardMaterial color="#ffd391" emissive="#ffb24f" emissiveIntensity={2.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.34, 6, 1, true]} />
          <meshStandardMaterial map={panel} alphaTest={0.5} metalness={0.65} roughness={0.38} side={DoubleSide} />
        </mesh>
        <mesh geometry={lanternDome} castShadow>
          <meshStandardMaterial map={pierce} alphaTest={0.5} metalness={0.65} roughness={0.38} side={DoubleSide} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color="#ffd391" emissive="#ffb24f" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.655, 0]}>
          <sphereGeometry args={[0.028, 8, 6]} />
          <meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.35} />
        </mesh>
        <sprite position={[0, 0.28, 0]} scale={[1.3, 1.3, 1]}>
          <spriteMaterial
            map={glow}
            color="#ffb35c"
            transparent
            opacity={0.6}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
            fog={false}
          />
        </sprite>
      </group>
    </group>
  );
}

/** A lantern hanging from an iron bracket on the front of a pillar. */
function PillarLantern({ side }: { side: number }) {
  const reach = 0.45;
  const armY = 3.7;
  const z = ENTRANCE.pillarFrontZ;
  return (
    <group position={[side * ENTRANCE.pillarX, 0, z]}>
      <mesh position={[0, armY, reach / 2]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.016, 0.016, reach, 6]} />
        <meshStandardMaterial color="#2b2420" metalness={0.5} roughness={0.55} />
      </mesh>
      <MoroccanLantern position={[0, armY - 0.2 - 0.65 * 0.9, reach]} size={0.9} chain={0.2} />
    </group>
  );
}

/** Lanterns hanging in the arch, on the pillars and standing along the approach. */
function Lanterns() {
  const passage = GATE_FACE_Z - 0.35;
  const soffitAt = (x: number) => ARCH_SPRING + Math.sqrt(ARCH_RADIUS ** 2 - x ** 2);
  return (
    <group>
      {/* Centre of the arch, in front of the swags. */}
      <MoroccanLantern position={[0, 4.15, ENTRANCE.surroundFrontZ + 0.55]} size={1.25} chain={DRAPE_TOP - 4.15 - 0.65 * 1.25} />
      {/* Either side, just inside the arch. */}
      {[-1, 1].map((side) => (
        <MoroccanLantern
          key={side}
          position={[side * 2.45, 3.75, passage]}
          size={1}
          chain={soffitAt(2.45) - 3.75 - 0.65}
        />
      ))}
      {[-1, 1].map((side) => (
        <PillarLantern key={`p${side}`} side={side} />
      ))}
      {/* Standing lanterns lining the approach to the gate. */}
      {[-1, 1].map((side) =>
        [13.7, 14.9, 16.1].map((z) => <MoroccanLantern key={`${side}${z}`} position={[side * 1.9, 0, z]} size={0.9} />),
      )}
      {/* Warm light from the lanterns onto the drapery and the ground. */}
      <pointLight color="#ffb56b" intensity={9} distance={7} decay={2} position={[0, 4.6, GATE_FACE_Z + 1.4]} />
      <pointLight color="#ffb56b" intensity={5} distance={6.5} decay={2} position={[0, 0.9, 16.2]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Petals

const PETAL_COLORS = ["#e0307c", "#c2185b", "#f0559b", "#d81b60", "#b5174f", "#f27aa8"];
const petalGeometry = new CircleGeometry(1, 6);

/** Bougainvillea petals scattered over the ground in front of the gate, thinner on the runner. */
function Petals() {
  const ref = useRef<InstancedMesh>(null);
  const count = 340;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rand = mulberry32(42);
    const dummy = new Object3D();
    const color = new Color();
    let i = 0;
    while (i < count) {
      const x = (rand() - 0.5) * 12;
      const z = GATE_FACE_Z + 0.5 + rand() * 6.5;
      if (Math.abs(x) < 1.5 && rand() < 0.7) continue;
      dummy.position.set(x, 0.016 + rand() * 0.004, z);
      dummy.rotation.set(-Math.PI / 2 + (rand() - 0.5) * 0.3, 0, rand() * Math.PI * 2);
      const s = 0.028 + rand() * 0.022;
      dummy.scale.set(s, s * (0.7 + rand() * 0.4), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(PETAL_COLORS[Math.floor(rand() * PETAL_COLORS.length)]));
      i++;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[petalGeometry, undefined, count]} receiveShadow>
      <meshStandardMaterial roughness={0.7} side={DoubleSide} />
    </instancedMesh>
  );
}

export function Entrance() {
  return (
    <group>
      <StoneSurround />
      <Drapery />
      <PillarBanner side={-1} />
      <PillarBanner side={1} />
      <Lanterns />
      <Petals />
    </group>
  );
}
