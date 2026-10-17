"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Billboard, Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  LatheGeometry,
  MathUtils,
  Vector2,
  type BufferGeometry,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from "three";
import type { Silhouette, Vec3 } from "../config";
import { useHeritageTexture, type HeritageTextureName } from "./assets";
import { useFabricTexture, useProceduralTexture } from "./proceduralTextures";

interface DisplayPedestalProps {
  position: Vec3;
  /** Y rotation so the garment's front faces the viewer. */
  rotationY?: number;
  silhouette: Silhouette;
  fabric: string;
  /** Embroidery / trim colour. */
  accent: string;
  /** Cut-out photo of the real garment; replaces the placeholder outfit when set. */
  image?: HeritageTextureName;
  /** Fade the hover glow in and out; off (instant) for reduced motion. */
  animate?: boolean;
  /** Called when the visitor clicks or taps the display. */
  onSelect?: () => void;
  /** Fixed, screen-sized layer the hover label is rendered into. */
  labelLayer?: RefObject<HTMLElement | null>;
}

const PLINTH_TOP = 0.69;
const BRASS = "#c39a52";

/**
 * A look on display: a honed marble plinth with a brass inlay, a dress form
 * on a brass stand, and the outfit. The outfit is procedural (gathered skirt,
 * puff sleeves, collar, embroidered bands) as a stand-in until each look's
 * real 3D model is supplied; the plinth, stand and interaction stay the same.
 *
 * Interactive: the garment itself stays still; on hover the plinth lights up
 * (its brass ring glows and a warm pool of light spreads over the top) and a
 * "Shop" label appears. Clicking selects the look (the page scrolls to its stop).
 */
export function DisplayPedestal({
  position,
  rotationY = 0,
  silhouette,
  fabric,
  accent,
  image,
  animate = true,
  onSelect,
  labelLayer,
}: DisplayPedestalProps) {
  const [hovered, setHovered] = useState(false);
  const ring = useRef<MeshStandardMaterial>(null);
  const pool = useRef<MeshBasicMaterial>(null);
  const glow = useRef(0);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  // Fade the plinth's glow in and out (instantly with reduced motion).
  useFrame((_, delta) => {
    const k = animate ? 1 - Math.exp(-delta * 6) : 1;
    glow.current = MathUtils.lerp(glow.current, hovered ? 1 : 0, k);
    if (ring.current) ring.current.emissiveIntensity = glow.current * 3;
    if (pool.current) pool.current.opacity = glow.current * 0.8;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  };
  const out = () => setHovered(false);
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <group position={position} rotation-y={rotationY} onPointerOver={over} onPointerOut={out} onClick={click}>
      <Plinth ringMaterial={ring} poolMaterial={pool} />
      <group position={[0, PLINTH_TOP, 0]}>
        {image ? (
          <PhotoGarment image={image} />
        ) : (
          <DressForm silhouette={silhouette} fabric={fabric} accent={accent} />
        )}
      </group>

      {hovered && (
        // Sits on the plinth front so it stays in frame even on close-ups.
        <Html
          position={[0, 0.42, 0.68]}
          center
          portal={labelLayer as RefObject<HTMLElement>}
          zIndexRange={[25, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded-full bg-[#2a170c]/80 px-4 py-2 text-center text-[11px] tracking-[0.22em] text-[#fbf1e1] uppercase shadow-lg backdrop-blur-sm">
            Shop
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Stepped plinth in honed cream marble with a brass inlay ring at the top.
 * The ring's glow and the pool of light on top are driven on hover.
 */
function Plinth({
  ringMaterial,
  poolMaterial,
}: {
  ringMaterial: RefObject<MeshStandardMaterial | null>;
  poolMaterial: RefObject<MeshBasicMaterial | null>;
}) {
  const marble = useProceduralTexture("marble", 2, 1);
  const marbleTop = useProceduralTexture("marble", 1, 1);
  const glow = useProceduralTexture("glowSpot");
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.86, 0.89, 0.1, 64]} />
        <meshStandardMaterial map={marble} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.64, 0.66, 0.52, 64]} />
        <meshStandardMaterial map={marble} roughness={0.38} />
      </mesh>
      <mesh position={[0, PLINTH_TOP - 0.035, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.07, 64]} />
        <meshStandardMaterial map={marbleTop} roughness={0.32} />
      </mesh>
      <mesh position={[0, PLINTH_TOP - 0.035, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.722, 0.012, 8, 96]} />
        <meshStandardMaterial
          ref={ringMaterial}
          color={BRASS}
          metalness={0.85}
          roughness={0.3}
          emissive="#ffc46b"
          emissiveIntensity={0}
        />
      </mesh>
      <mesh position={[0, PLINTH_TOP + 0.004, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshBasicMaterial
          ref={poolMaterial}
          map={glow}
          color="#ffcf8f"
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Garments

/** Half-profiles (radius, height) revolved into the garment body. */
const PROFILES: Record<Silhouette, { points: [number, number][]; skirtTop: number; folds: number }> = {
  dress: {
    points: [
      [0, 0],
      [0.47, 0],
      [0.47, 0.03],
      [0.43, 0.18],
      [0.34, 0.4],
      [0.22, 0.6],
      [0.2, 0.65],
      [0.215, 0.76],
      [0.235, 0.86],
      [0.22, 0.95],
      [0.16, 0.99],
      [0.07, 1.02],
      [0.07, 1.05],
      [0, 1.05],
    ],
    skirtTop: 0.62,
    folds: 0.075,
  },
  tunic: {
    points: [
      [0, 0.42],
      [0.3, 0.42],
      [0.3, 0.46],
      [0.27, 0.6],
      [0.25, 0.78],
      [0.25, 0.88],
      [0.22, 0.95],
      [0.16, 0.99],
      [0.07, 1.02],
      [0.07, 1.05],
      [0, 1.05],
    ],
    skirtTop: 0.6,
    folds: 0.03,
  },
};

const garmentGeometries = new Map<Silhouette, BufferGeometry>();

/**
 * Lathe the profile, add gathered folds to the skirt (radial ripples that
 * fade towards the waist) and re-map v to height so embroidery bands land at
 * the hem and waist regardless of point spacing.
 */
function garmentGeometry(silhouette: Silhouette): BufferGeometry {
  const cached = garmentGeometries.get(silhouette);
  if (cached) return cached;
  const { points, skirtTop, folds } = PROFILES[silhouette];
  const geo = new LatheGeometry(
    points.map(([r, y]) => new Vector2(r, y)),
    72,
  );
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const ys = points.map(([, y]) => y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y < skirtTop) {
      const theta = Math.atan2(x, z);
      const t = 1 - (y - minY) / (skirtTop - minY);
      const k = 1 + folds * t * Math.sin(theta * 12);
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
    uv.setY(i, (y - minY) / (maxY - minY));
  }
  geo.computeVertexNormals();
  garmentGeometries.set(silhouette, geo);
  return geo;
}

/** Height of a photographed garment on its stand, neckline to hem, in metres. */
const PHOTO_GARMENT_HEIGHT = 1.05;
/** Height above the plinth of the photographed garment's neckline. */
const PHOTO_GARMENT_TOP = 1.32;

/**
 * A real garment from a cut-out product photo, hung on the brass stand. The
 * photo turns about the vertical to face the viewer, so it always reads as
 * the front of the outfit; a little self-light keeps its true colours while
 * the scene's light and shadow still fall on it.
 */
function PhotoGarment({ image }: { image: HeritageTextureName }) {
  const texture = useHeritageTexture(image);
  const { width, height } = texture.image as { width: number; height: number };
  const w = PHOTO_GARMENT_HEIGHT * (width / height);
  const pole = PHOTO_GARMENT_TOP - PHOTO_GARMENT_HEIGHT * 0.5;
  return (
    <group>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.02, 24]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, pole / 2, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, pole, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      <Billboard lockX lockZ position={[0, PHOTO_GARMENT_TOP - PHOTO_GARMENT_HEIGHT / 2, 0]}>
        {/* Just in front of the stand's pole, so the pole stays hidden behind the garment. */}
        <mesh position={[0, 0, 0.04]} castShadow>
          <planeGeometry args={[w, PHOTO_GARMENT_HEIGHT]} />
          <meshStandardMaterial
            map={texture}
            emissive="#ffffff"
            emissiveMap={texture}
            emissiveIntensity={0.18}
            alphaTest={0.5}
            roughness={0.85}
            side={DoubleSide}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

interface DressFormProps {
  silhouette: Silhouette;
  fabric: string;
  accent: string;
}

/** Dress form on a brass stand wearing the look. */
function DressForm({ silhouette, fabric, accent }: DressFormProps) {
  const isDress = silhouette === "dress";
  const texture = useFabricTexture(fabric, accent, 0.05, isDress ? 0.6 : 0.58);
  const geometry = garmentGeometry(silhouette);
  const lift = 0.24;

  const fabricMaterial = (
    <meshPhysicalMaterial
      map={texture}
      roughness={0.8}
      sheen={0.9}
      sheenRoughness={0.45}
      sheenColor={fabric}
    />
  );

  return (
    <group>
      {/* Brass stand. */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.02, 24]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, lift / 2, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, lift, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
      </mesh>

      <group position={[0, lift, 0]} scale={[1, 1, 0.78]}>
        <mesh geometry={geometry} castShadow receiveShadow>
          {fabricMaterial}
        </mesh>

        {/* Puff sleeves. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.235, 0.91, 0]} scale={[0.1, 0.085, 0.11]} castShadow>
            <sphereGeometry args={[1, 20, 14]} />
            {fabricMaterial}
          </mesh>
        ))}

        {/* Rounded collar. */}
        <mesh position={[0, 1.0, 0.01]} rotation-x={Math.PI / 2} scale={[1, 1, 0.55]} castShadow>
          <torusGeometry args={[0.085, 0.03, 10, 40]} />
          <meshStandardMaterial color={isDress ? "#f6efe3" : accent} roughness={0.7} />
        </mesh>

        {isDress ? (
          // Waist sash.
          <mesh position={[0, 0.645, 0]} rotation-x={Math.PI / 2} castShadow>
            <torusGeometry args={[0.205, 0.022, 10, 64]} />
            <meshStandardMaterial color={accent} roughness={0.55} />
          </mesh>
        ) : (
          // Trousers.
          [-0.1, 0.1].map((x) => (
            <mesh key={x} position={[x, 0.22, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.085, 0.075, 0.46, 20]} />
              <meshStandardMaterial color={accent} roughness={0.8} />
            </mesh>
          ))
        )}

        {/* Dress-form neck and cap. */}
        <mesh position={[0, 1.11, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.12, 20]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.18, 0]} scale={[1, 0.45, 1]}>
          <sphereGeometry args={[0.062, 20, 12]} />
          <meshStandardMaterial color="#efe6d8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.22, 0]}>
          <sphereGeometry args={[0.018, 10, 8]} />
          <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}
