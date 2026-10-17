"use client";

import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import {
  AdditiveBlending,
  DoubleSide,
  ExtrudeGeometry,
  Matrix4,
  Object3D,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ALCOVE_ANGLES, HALL, PALETTE, onHallRing } from "../config";
import { archBandShape } from "./ArchedWall";
import { useHeritageTexture } from "./assets";
import { OliveTree } from "./Planting";
import { useProceduralTexture } from "./proceduralTextures";
import { mulberry32 } from "./random";

/*
 * The inner hall: a round room behind the courtyard's back wall, entered
 * through its central archway. Terracotta walls are divided by cream stone
 * pilasters; four looks stand before warmly lit arched niches, the finale
 * on a stepped marble dais. Above, a timber dome of radiating boards and
 * beams rises from a glowing cove to a glazed skylight, and soft shafts of
 * sun fall through it onto an inlaid marble floor.
 */

const R = HALL.radius;
const H = HALL.height;
const CZ = HALL.centerZ;
const OCULUS = HALL.oculusRadius;
/** How far the timber dome rises from the wall top to the skylight. */
const RISE = 1.5;
/** Length of the dome's slope, wall top to skylight. */
const SLOPE = Math.hypot(R - OCULUS, RISE);
const WALL_THICKNESS = 0.6;
/** Half-angle of the gap in the curved wall where the entrance arch meets it. */
const DOOR_GAP = Math.asin((HALL.doorHalfWidth + 0.15) / R);

/** Angles (0 = entrance) of the stone pilasters, banners, lanterns and potted olives. */
const PILASTER_ANGLES = [-162, -105, -40, 40, 105, 162];
const BANNER_ANGLES = [-122, 122];
const LANTERN_ANGLES = [-162, -105, 105, 162];
const OLIVE_ANGLES = [-156, -88, -52, 52, 88, 156];

const TEXTILE_BANDS = [
  PALETTE.indigoCloth,
  PALETTE.mustard,
  PALETTE.clay,
  "#efe3cc",
  PALETTE.clay,
  PALETTE.mustard,
  PALETTE.indigoCloth,
];

/** Height of the dome's underside above the floor at a given distance from the centre. */
const ceilingHeightAt = (radius: number) => H + (RISE * (R - radius)) / (R - OCULUS);

/** Yaw that turns an object at `degrees` on the ring to face the centre. */
const facingCentre = (degrees: number) => ((degrees + 180) * Math.PI) / 180;

function CurvedWall() {
  // Same photographed terracotta plaster as the courtyard, softened by a warm tint.
  const texture = useHeritageTexture("plaster", 22, 2.4);
  const normalMap = useHeritageTexture("plasterNormal", 22, 2.4);
  const stone = useHeritageTexture("limestone", 24, 0.4);
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
      {/* Cream stone skirting and cornice running round the room. */}
      {(
        [
          [R - 0.04, 0.32, 0.16],
          [R - 0.12, 0.44, H - 0.22],
        ] as const
      ).map(([radius, height, y]) => (
        <mesh key={y} position={[0, y, CZ]} receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 96, 1, true, DOOR_GAP, Math.PI * 2 - DOOR_GAP * 2]} />
          <meshStandardMaterial color={PALETTE.hallStone} map={stone} roughness={0.7} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** Cream stone pilasters dividing the wall into bays, with simple capitals and bases. */
function Pilasters() {
  const stone = useHeritageTexture("limestone", 0.6, 2.5);
  const parts = [
    { size: [0.56, H - 0.44, 0.24], y: H / 2 - 0.22, inset: 0.12 },
    { size: [0.78, 0.26, 0.36], y: H - 0.57, inset: 0.18 },
    { size: [0.74, 0.34, 0.34], y: 0.17, inset: 0.17 },
  ] as const;
  return (
    <group>
      {parts.map(({ size, y, inset }) => (
        <Instances key={y} castShadow receiveShadow limit={PILASTER_ANGLES.length}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={PALETTE.hallStone} map={stone} roughness={0.65} />
          {PILASTER_ANGLES.map((deg) => (
            <Instance key={deg} position={onHallRing(R - inset, deg, y)} rotation-y={facingCentre(deg)} />
          ))}
        </Instances>
      ))}
    </group>
  );
}

/**
 * Timber dome: radiating boards on a shallow cone with heavy beams beneath,
 * a glowing cove where it meets the wall, and a glazed skylight at the top.
 */
function Dome() {
  const boards = useProceduralTexture("timberBoards", 14, 1);
  const cove = useProceduralTexture("coveGlow");
  const beamAngles = Array.from({ length: 32 }, (_, i) => i * 11.25 + 5.625);
  const tilt = Math.atan2(RISE, R - OCULUS);
  const midRadius = (R + OCULUS) / 2;
  /** The glow washes 1.4 m up the dome's slope from the cove. */
  const glowRun = 1.4;
  const glowTop = R - 0.15 - (glowRun * (R - OCULUS)) / SLOPE;

  return (
    <group>
      <mesh position={[0, H + RISE / 2, CZ]} castShadow receiveShadow>
        <cylinderGeometry args={[OCULUS, R + 0.05, RISE, 96, 1, true]} />
        <meshStandardMaterial map={boards} roughness={0.75} side={DoubleSide} />
      </mesh>
      <Instances castShadow receiveShadow limit={beamAngles.length}>
        <boxGeometry args={[0.16, 0.22, SLOPE]} />
        <meshStandardMaterial color={PALETTE.timber} roughness={0.8} />
        {beamAngles.map((deg) => (
          <Instance
            key={deg}
            position={onHallRing(midRadius, deg, H + RISE / 2 - 0.13)}
            rotation={[tilt, (deg * Math.PI) / 180, 0]}
            rotation-order="YXZ"
          />
        ))}
      </Instances>

      {/* Cove: a warm line of light along the cornice, washing up the boards. */}
      <mesh position={[0, H - 0.01, CZ]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[R - 0.22, 0.035, 8, 128]} />
        <meshBasicMaterial color={PALETTE.lanternGlow} toneMapped={false} />
      </mesh>
      <mesh position={[0, H + (RISE * (R - 0.15 - glowTop)) / (R - OCULUS) / 2 - 0.04, CZ]}>
        <cylinderGeometry
          args={[glowTop, R - 0.15, (RISE * (R - 0.15 - glowTop)) / (R - OCULUS), 96, 1, true]}
        />
        <meshBasicMaterial
          map={cove}
          transparent
          opacity={0.75}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          fog={false}
        />
      </mesh>

      {/* Glazed skylight: bright glass, iron glazing bars, a brass rim. */}
      <mesh position={[0, H + RISE + 0.06, CZ]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[OCULUS, 48]} />
        <meshBasicMaterial color="#fbf4e6" toneMapped={false} side={DoubleSide} />
      </mesh>
      <Instances limit={4}>
        <boxGeometry args={[OCULUS * 2, 0.07, 0.07]} />
        <meshStandardMaterial color={PALETTE.iron} roughness={0.5} />
        {[0, 45, 90, 135].map((deg) => (
          <Instance key={deg} position={[0, H + RISE + 0.02, CZ]} rotation-y={(deg * Math.PI) / 180} />
        ))}
      </Instances>
      <mesh position={[0, H + RISE + 0.02, CZ]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[OCULUS * 0.55, 0.035, 8, 48]} />
        <meshStandardMaterial color={PALETTE.iron} roughness={0.5} />
      </mesh>
      <mesh position={[0, H + RISE, CZ]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[OCULUS, 0.1, 12, 64]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.7} roughness={0.4} />
      </mesh>
      {/*
        Invisible disc that only casts shadow: it stops raw sun through the
        skylight from striping the wall, leaving the soft shafts as its light.
      */}
      <mesh position={[0, H + RISE + 0.4, CZ]} rotation-x={-Math.PI / 2} castShadow>
        <circleGeometry args={[OCULUS + 0.1, 48]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} side={DoubleSide} />
      </mesh>
    </group>
  );
}

/** Polished cream marble with the compass inlay, and the stepped marble dais. */
function Floor() {
  const inlay = useProceduralTexture("hallFloor");
  const marble = useProceduralTexture("marble", 2, 0.4);
  return (
    <group>
      <mesh position={[0, 0.006, CZ]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[R, 96]} />
        <meshStandardMaterial map={inlay} roughness={0.32} />
      </mesh>
      {(
        [
          [2.05, 2.1, 0.075],
          [1.6, 1.65, 0.225],
        ] as const
      ).map(([top, bottom, y]) => (
        <group key={y}>
          <mesh position={[0, y, CZ]} castShadow receiveShadow>
            <cylinderGeometry args={[top, bottom, 0.15, 64]} />
            <meshStandardMaterial color="#f6ecdc" map={marble} roughness={0.35} />
          </mesh>
          {/* Brass nosing along the step's edge. */}
          <mesh position={[0, y + 0.07, CZ]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[top, 0.022, 8, 96]} />
            <meshStandardMaterial color={PALETTE.brass} metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Where the skylight's shafts converge: the finale look on the dais, at chest height. */
const SHAFT_FOCUS = new Vector3(0, HALL.daisHeight + 1.15, CZ);

/**
 * Shafts of sunlight falling through the skylight onto the finale look:
 * soft additive cards in crossed pairs, merged into one draw, a warm pool on
 * the dais, and a spotlight from the skylight that lights the cloth itself.
 */
function SunShafts() {
  const ray = useProceduralTexture("lightRay");
  const pool = useProceduralTexture("glowSpot");
  const geometry = useMemo(() => {
    const rand = mulberry32(17);
    const top = H + RISE;
    const cards = [];
    for (let i = 0; i < 10; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * OCULUS * 0.8;
      const origin = new Vector3(Math.cos(a) * r, top, CZ + Math.sin(a) * r);
      // Aim at the look, spread a little so the shafts wrap around it.
      const aim = SHAFT_FOCUS.clone().add(new Vector3((rand() - 0.5) * 0.9, -0.6, (rand() - 0.5) * 0.9));
      const direction = aim.sub(origin).normalize();
      const length = (top - HALL.daisHeight) / -direction.y;
      const up = direction.negate();
      const across = new Vector3().crossVectors(up, new Vector3(0, 0, 1)).normalize();
      const facing = new Vector3().crossVectors(across, up);
      const width = 0.35 + rand() * 0.5;
      for (const [x, z] of [
        [across, facing],
        [facing, across.clone().negate()],
      ]) {
        const card = new PlaneGeometry(width, length).translate(0, -length / 2, 0);
        card.applyMatrix4(new Matrix4().makeBasis(x, up, z).setPosition(origin));
        cards.push(card);
      }
    }
    return mergeGeometries(cards);
  }, []);
  const target = useMemo(() => {
    const t = new Object3D();
    t.position.copy(SHAFT_FOCUS);
    return t;
  }, []);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          map={ray}
          transparent
          opacity={0.16}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <mesh position={[0, HALL.daisHeight + 0.008, CZ]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial
          map={pool}
          transparent
          opacity={0.38}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          fog={false}
        />
      </mesh>
      <primitive object={target} />
      <spotLight
        color="#ffe6c0"
        intensity={240}
        distance={12}
        decay={2}
        angle={0.36}
        penumbra={0.7}
        position={[0, H + RISE, CZ]}
        target={target}
      />
    </group>
  );
}

/** Cream stone arch framing a warmly lit niche behind an alcove look. */
function Alcove({ degrees }: { degrees: number }) {
  const glow = useProceduralTexture("nicheGlow");
  const stone = useHeritageTexture("limestone", 0.5, 1);
  const { recess, frame } = useMemo(() => {
    const w = 1.3;
    const spring = 2.7;
    const s = new Shape();
    s.moveTo(-w, 0);
    s.lineTo(-w, spring);
    s.absarc(0, spring, w, Math.PI, 0, true);
    s.lineTo(w, 0);
    s.closePath();
    // Shape UVs are in metres; normalise them so the glow spans the niche once.
    const recess = new ShapeGeometry(s, 24);
    const pos = recess.attributes.position;
    const uv = recess.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w) / (2 * w), pos.getY(i) / (spring + w));
    return {
      recess,
      frame: new ExtrudeGeometry(archBandShape(0, 0, w, spring, 0.24), {
        depth: 0.24,
        bevelEnabled: false,
        curveSegments: 24,
      }),
    };
  }, []);
  // Set slightly off the wall so the flat niche stays in front of the curve at its edges.
  return (
    <group position={onHallRing(R - 0.16, degrees)} rotation-y={facingCentre(degrees)}>
      <mesh geometry={recess} receiveShadow>
        <meshStandardMaterial map={glow} emissive="#ffffff" emissiveMap={glow} emissiveIntensity={0.55} roughness={0.9} />
      </mesh>
      <mesh geometry={frame} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.hallStone} map={stone} roughness={0.65} />
      </mesh>
    </group>
  );
}

/** Black iron lantern with a glowing glass body, hanging on a rod from the dome. */
function Lantern({ degrees }: { degrees: number }) {
  const radius = 7.4;
  const y = 3.9;
  const [x, , z] = onHallRing(radius, degrees);
  const rod = ceilingHeightAt(radius) - (y + 0.38);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.38 + rod / 2, 0]}>
        <cylinderGeometry args={[0.014, 0.014, rod, 6]} />
        <meshStandardMaterial color={PALETTE.iron} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.03, 0.19, 0.16, 6]} />
        <meshStandardMaterial color={PALETTE.iron} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.15, 0.12, 0.44, 6]} />
        <meshStandardMaterial
          color={PALETTE.lanternGlow}
          emissive={PALETTE.lanternGlow}
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.26, 0]}>
        <cylinderGeometry args={[0.13, 0.05, 0.1, 6]} />
        <meshStandardMaterial color={PALETTE.iron} roughness={0.5} metalness={0.4} />
      </mesh>
      <pointLight color="#ffc78a" intensity={14} distance={9} decay={2} position={[0, -0.3, 0]} />
    </group>
  );
}

/** Red and gold banner hanging from an iron rod on the wall. */
function Banner({ degrees }: { degrees: number }) {
  const texture = useProceduralTexture("hallBanner");
  const width = 0.9;
  const length = 2.7;
  return (
    <group position={onHallRing(R - 0.2, degrees, 5.0)} rotation-y={facingCentre(degrees)}>
      <mesh position={[0, -length / 2, 0]} castShadow receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial map={texture} alphaTest={0.5} roughness={0.85} side={DoubleSide} />
      </mesh>
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.025, 0.025, width + 0.25, 8]} />
        <meshStandardMaterial color={PALETTE.iron} roughness={0.5} metalness={0.4} />
      </mesh>
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
      <Pilasters />
      <Dome />
      <Floor />
      <SunShafts />
      <Textile />
      {ALCOVE_ANGLES.map((deg) => (
        <Alcove key={deg} degrees={deg} />
      ))}
      {LANTERN_ANGLES.map((deg) => (
        <Lantern key={deg} degrees={deg} />
      ))}
      {BANNER_ANGLES.map((deg) => (
        <Banner key={deg} degrees={deg} />
      ))}
      {OLIVE_ANGLES.map((deg, i) => (
        <OliveTree key={deg} position={onHallRing(8.1, deg)} scale={0.6} seed={80 + i} />
      ))}
    </group>
  );
}
