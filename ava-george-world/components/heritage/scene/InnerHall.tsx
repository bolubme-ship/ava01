"use client";

import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import { AdditiveBlending, DoubleSide, ExtrudeGeometry, Path, Shape, ShapeGeometry } from "three";
import { ALCOVE_ANGLES, ALCOVE_RADIUS, HALL, PALETTE, onHallRing, type Vec3 } from "../config";
import { useHeritageTexture } from "./assets";

/*
 * The inner hall: a round, domed room behind the courtyard's back wall,
 * entered through its central archway. Four looks stand in arched alcoves
 * around the curved wall under hanging lanterns; the finale stands on a
 * stepped central dais beneath an open oculus, lit by a soft shaft of light.
 * Timber beams radiate from the oculus like the spokes of a wheel.
 */

const R = HALL.radius;
const H = HALL.height;
const CZ = HALL.centerZ;
const WALL_THICKNESS = 0.6;
/** Half-angle of the gap in the curved wall where the entrance arch meets it. */
const DOOR_GAP = Math.asin((HALL.doorHalfWidth + 0.15) / R);

const TEXTILE_BANDS = [
  PALETTE.indigoCloth,
  PALETTE.mustard,
  PALETTE.clay,
  "#efe3cc",
  PALETTE.clay,
  PALETTE.mustard,
  PALETTE.indigoCloth,
];

function CurvedWall() {
  // Same photographed terracotta plaster as the courtyard, softened by a warm tint.
  const texture = useHeritageTexture("plaster", 22, 2.4);
  const normalMap = useHeritageTexture("plasterNormal", 22, 2.4);
  return (
    <group>
      <mesh position={[0, H / 2, CZ]} castShadow receiveShadow>
        <cylinderGeometry args={[R, R, H, 96, 1, true, DOOR_GAP, Math.PI * 2 - DOOR_GAP * 2]} />
        <meshStandardMaterial
          color={PALETTE.hallWall}
          map={texture}
          normalMap={normalMap}
          roughness={0.95}
          side={DoubleSide}
        />
      </mesh>
      {/* Short jambs closing the seam between the courtyard wall and the curve. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (HALL.doorHalfWidth + 0.35), H / 2, CZ + R - 0.05]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.7, H, WALL_THICKNESS]} />
          <meshStandardMaterial color={PALETTE.hallWall} map={texture} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Ceiling() {
  const geometry = useMemo(() => {
    const ring = new Shape();
    ring.absarc(0, 0, R + WALL_THICKNESS, 0, Math.PI * 2, false);
    const oculus = new Path();
    oculus.absarc(0, 0, HALL.oculusRadius, 0, Math.PI * 2, true);
    ring.holes.push(oculus);
    const geo = new ExtrudeGeometry(ring, { depth: 0.36, bevelEnabled: false, curveSegments: 64 });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const beamLength = R - HALL.oculusRadius;
  const midRadius = HALL.oculusRadius + beamLength / 2;
  const beamAngles = Array.from({ length: 16 }, (_, i) => i * 22.5 + 11.25);

  return (
    <group>
      <mesh geometry={geometry} position={[0, H, CZ]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.hallCeiling} roughness={0.9} />
      </mesh>
      <Instances castShadow receiveShadow limit={16}>
        <boxGeometry args={[0.2, 0.26, beamLength]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.85} />
        {beamAngles.map((deg) => (
          <Instance key={deg} position={onHallRing(midRadius, deg, H - 0.13)} rotation-y={(deg * Math.PI) / 180} />
        ))}
      </Instances>
      {/*
        Invisible disc that only casts shadow: it stops raw sun through the
        oculus from striping the wall, leaving the soft light shaft as the
        oculus's only light.
      */}
      <mesh position={[0, H + 0.4, CZ]} rotation-x={-Math.PI / 2} castShadow>
        <circleGeometry args={[HALL.oculusRadius + 0.1, 48]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} side={DoubleSide} />
      </mesh>
      <mesh position={[0, H - 0.02, CZ]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[HALL.oculusRadius, 0.08, 12, 64]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Floor() {
  // Limestone flags, warmed by the lantern light.
  const texture = useHeritageTexture("limestone", 4.5, 4.5);
  const normalMap = useHeritageTexture("limestoneNormal", 4.5, 4.5);
  return (
    <group>
      <mesh position={[0, 0.006, CZ]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[R, 96]} />
        <meshStandardMaterial color={PALETTE.hallFloor} map={texture} normalMap={normalMap} roughness={0.55} />
      </mesh>
      {(
        [
          [3.3, 3.5, PALETTE.indigoCloth],
          [5.55, 5.7, PALETTE.mustard],
        ] as const
      ).map(([inner, outer, color]) => (
        <mesh key={inner} position={[0, 0.011, CZ]} rotation-x={-Math.PI / 2} receiveShadow>
          <ringGeometry args={[inner, outer, 96]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      {/* Two-step dais for the finale. */}
      <mesh position={[0, 0.075, CZ]} castShadow receiveShadow>
        <cylinderGeometry args={[2.05, 2.1, 0.15, 64]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.225, CZ]} castShadow receiveShadow>
        <cylinderGeometry args={[1.6, 1.65, 0.15, 64]} />
        <meshStandardMaterial color="#f2e6d2" roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Soft column of light falling from the oculus onto the dais. */
function LightShaft() {
  const height = H - HALL.daisHeight;
  return (
    <group>
      <mesh position={[0, HALL.daisHeight + height / 2, CZ]}>
        <cylinderGeometry args={[HALL.oculusRadius * 0.95, 1.5, height, 48, 1, true]} />
        <meshBasicMaterial
          color="#fff0d2"
          transparent
          opacity={0.045}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          fog={false}
        />
      </mesh>
      <pointLight color="#ffe8c8" intensity={22} distance={10} decay={2} position={[0, 4.6, CZ]} />
    </group>
  );
}

/** Arched, slightly darker recess behind an alcove look. */
function Alcove({ degrees }: { degrees: number }) {
  const geometry = useMemo(() => {
    const w = 1.25;
    const spring = 2.6;
    const s = new Shape();
    s.moveTo(-w, 0);
    s.lineTo(-w, spring);
    s.absarc(0, spring, w, Math.PI, 0, true);
    s.lineTo(w, 0);
    s.closePath();
    return new ShapeGeometry(s, 24);
  }, []);
  const rotation = ((degrees + 180) * Math.PI) / 180;
  return (
    <mesh geometry={geometry} position={onHallRing(R - 0.1, degrees)} rotation-y={rotation} receiveShadow>
      <meshStandardMaterial color="#c79f74" roughness={0.95} />
    </mesh>
  );
}

/** Hanging lantern with a warm point light, placed above a look. */
function Lantern({ position }: { position: Vec3 }) {
  const [x, , z] = position;
  const y = 3.9;
  const drop = H - y;
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

/** Striped wall hanging on the far wall, behind the finale. */
function Textile() {
  const bandWidth = 0.62;
  const width = bandWidth * TEXTILE_BANDS.length;
  return (
    <group position={onHallRing(R - 0.35, 180, 3.2)}>
      {TEXTILE_BANDS.map((color, i) => (
        <mesh key={i} position={[(i - (TEXTILE_BANDS.length - 1) / 2) * bandWidth, 0, 0]} receiveShadow>
          <boxGeometry args={[bandWidth, 3.6, 0.03]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 1.88, 0.05]} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.05, 0.05, width + 0.5, 12]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function InnerHall() {
  return (
    <group>
      <CurvedWall />
      <Ceiling />
      <Floor />
      <LightShaft />
      <Textile />
      {ALCOVE_ANGLES.map((deg) => (
        <group key={deg}>
          <Alcove degrees={deg} />
          <Lantern position={onHallRing(ALCOVE_RADIUS, deg)} />
        </group>
      ))}
    </group>
  );
}
