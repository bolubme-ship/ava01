"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { LatheGeometry, MathUtils, Vector2, type Group } from "three";
import { PALETTE, type Silhouette, type Vec3 } from "../config";

interface DisplayPedestalProps {
  position: Vec3;
  /** Y rotation so the garment's front faces the viewer. */
  rotationY?: number;
  silhouette: Silhouette;
  fabric: string;
  accent: string;
  /** Gentle idle sway of the garment; off for reduced motion. */
  animate?: boolean;
  /** Short name shown on hover, e.g. "Look 03". */
  label: string;
  /** Called when the visitor clicks or taps the display. */
  onSelect?: () => void;
  /** Fixed, screen-sized layer the hover label is rendered into. */
  labelLayer?: RefObject<HTMLElement | null>;
}

const PLINTH_TOP = 0.72;

/**
 * Round plinth with a brass collar holding a placeholder child's outfit.
 * Replace <PlaceholderGarment> with a loaded outfit model later; the plinth
 * and its placement stay the same.
 *
 * Interactive: on hover the garment lifts, turns to face the viewer and a
 * label appears; clicking selects the look (the page scrolls to its stop).
 */
export function DisplayPedestal({
  position,
  rotationY = 0,
  silhouette,
  fabric,
  accent,
  animate = true,
  label,
  onSelect,
  labelLayer,
}: DisplayPedestalProps) {
  const garment = useRef<Group>(null);
  const phase = useMemo(() => position[0] * 1.7 + position[2], [position]);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  useFrame(({ clock }, delta) => {
    const g = garment.current;
    if (!g) return;
    const sway = animate && !hovered ? Math.sin(clock.elapsedTime * 0.35 + phase) * 0.12 : 0;
    const k = animate ? 1 - Math.exp(-delta * 8) : 1;
    g.rotation.y = MathUtils.lerp(g.rotation.y, sway, k);
    g.position.y = MathUtils.lerp(g.position.y, PLINTH_TOP + (hovered ? 0.08 : 0), k);
    const s = MathUtils.lerp(g.scale.x, hovered ? 1.04 : 1, k);
    g.scale.setScalar(s);
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
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.78, 0.82, 0.12, 48]} />
        <meshStandardMaterial color="#f1ebe1" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.39, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.64, 0.54, 48]} />
        <meshStandardMaterial color="#fbf8f2" roughness={0.55} />
      </mesh>
      <mesh position={[0, PLINTH_TOP - 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.63, 0.63, 0.04, 48]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.85} roughness={0.35} />
      </mesh>

      <group ref={garment} position={[0, PLINTH_TOP, 0]}>
        <PlaceholderGarment silhouette={silhouette} fabric={fabric} accent={accent} />
      </group>

      {hovered && (
        // Sits on the plinth front so it stays in frame even on close-ups.
        <Html
          position={[0, 0.42, 0.66]}
          center
          portal={labelLayer as RefObject<HTMLElement>}
          zIndexRange={[25, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded-full bg-[#2a170c]/80 px-4 py-2 text-center text-[11px] tracking-[0.22em] text-[#fbf1e1] uppercase shadow-lg backdrop-blur-sm">
            {label} · View look
          </div>
        </Html>
      )}
    </group>
  );
}

// Half-profiles (radius, height) revolved into flattened dress-form shapes.
const DRESS_PROFILE: [number, number][] = [
  [0, 0],
  [0.44, 0],
  [0.43, 0.04],
  [0.33, 0.42],
  [0.21, 0.74],
  [0.22, 0.9],
  [0.25, 1.0],
  [0.23, 1.1],
  [0.13, 1.16],
  [0.05, 1.2],
  [0.05, 1.27],
  [0, 1.27],
];
const TUNIC_PROFILE: [number, number][] = [
  [0, 0.42],
  [0.29, 0.42],
  [0.29, 0.47],
  [0.25, 0.78],
  [0.26, 1.0],
  [0.24, 1.1],
  [0.13, 1.16],
  [0.05, 1.2],
  [0.05, 1.27],
  [0, 1.27],
];

function useLathe(profile: [number, number][]) {
  return useMemo(() => new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 48), [profile]);
}

interface PlaceholderGarmentProps {
  silhouette: Silhouette;
  fabric: string;
  accent: string;
}

function PlaceholderGarment({ silhouette, fabric, accent }: PlaceholderGarmentProps) {
  const dress = useLathe(DRESS_PROFILE);
  const tunic = useLathe(TUNIC_PROFILE);
  const isDress = silhouette === "dress";

  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
        <meshStandardMaterial color={PALETTE.brass} metalness={0.85} roughness={0.35} />
      </mesh>
      <group position={[0, 0.24, 0]} scale={[1, 1, 0.72]}>
        <mesh geometry={isDress ? dress : tunic} castShadow receiveShadow>
          <meshStandardMaterial color={fabric} roughness={0.8} />
        </mesh>
        {isDress ? (
          // Waist sash.
          <mesh position={[0, 0.76, 0]} rotation-x={Math.PI / 2} castShadow>
            <torusGeometry args={[0.215, 0.025, 12, 48]} />
            <meshStandardMaterial color={accent} roughness={0.6} />
          </mesh>
        ) : (
          <>
            {/* Collar trim and trousers. */}
            <mesh position={[0, 1.14, 0]} rotation-x={Math.PI / 2} castShadow>
              <torusGeometry args={[0.15, 0.022, 12, 48]} />
              <meshStandardMaterial color={accent} roughness={0.6} />
            </mesh>
            {[-0.1, 0.1].map((x) => (
              <mesh key={x} position={[x, 0.22, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.085, 0.075, 0.46, 20]} />
                <meshStandardMaterial color={accent} roughness={0.8} />
              </mesh>
            ))}
          </>
        )}
      </group>
    </group>
  );
}
