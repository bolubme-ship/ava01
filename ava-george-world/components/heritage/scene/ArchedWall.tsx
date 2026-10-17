"use client";

import { useMemo } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import type { Vec3 } from "../config";
import { useHeritageTexture } from "./assets";
import { useSurfaceTexture } from "./surfaceTexture";

export interface ArchOpening {
  /** Centre of the opening along the wall (wall centre = 0). */
  x: number;
  width: number;
  /** Height of the opening at its apex. */
  height: number;
  /** Bottom of the opening; 0 makes it a doorway cut from the floor up. */
  sill?: number;
}

export interface ArchTrim {
  /** Width of the moulding band around each opening. */
  width: number;
  color: string;
  /** How far the band stands proud of the wall face. */
  depth?: number;
}

interface ArchedWallProps {
  width: number;
  height: number;
  depth?: number;
  openings?: ArchOpening[];
  color: string;
  position?: Vec3;
  rotationY?: number;
  /** Optional raised moulding framing every opening, on both faces. */
  trim?: ArchTrim;
}

/**
 * Horseshoe-shaped band around an arched opening: up the outer jamb, over
 * the outer arc, down to the opening and back under the inner arc. A single
 * simple polygon, so it extrudes cleanly.
 */
export function archBandShape(x: number, bottom: number, radius: number, spring: number, band: number): Shape {
  const s = new Shape();
  s.moveTo(x - radius - band, bottom);
  s.lineTo(x - radius - band, spring);
  s.absarc(x, spring, radius + band, Math.PI, 0, true);
  s.lineTo(x + radius + band, bottom);
  s.lineTo(x + radius, bottom);
  s.lineTo(x + radius, spring);
  s.absarc(x, spring, radius, 0, Math.PI, false);
  s.lineTo(x - radius, bottom);
  s.closePath();
  return s;
}

/**
 * A thick terracotta-plaster wall with round-topped doorways and windows, built by
 * extruding a 2D outline. Doorways are notched into the outline itself
 * (holes touching the edge would break triangulation); windows are holes.
 */
export function ArchedWall({
  width,
  height,
  depth = 0.6,
  openings = [],
  color,
  position = [0, 0, 0],
  rotationY = 0,
  trim,
}: ArchedWallProps) {
  const geometry = useMemo(() => {
    const half = width / 2;
    const shape = new Shape();
    shape.moveTo(-half, 0);

    const doors = openings.filter((o) => !o.sill).sort((a, b) => a.x - b.x);
    for (const d of doors) {
      const r = d.width / 2;
      const spring = d.height - r;
      shape.lineTo(d.x - r, 0);
      shape.lineTo(d.x - r, spring);
      shape.absarc(d.x, spring, r, Math.PI, 0, true);
      shape.lineTo(d.x + r, 0);
    }

    shape.lineTo(half, 0);
    shape.lineTo(half, height);
    shape.lineTo(-half, height);
    shape.closePath();

    for (const w of openings.filter((o) => o.sill)) {
      const r = w.width / 2;
      const sill = w.sill!;
      const spring = sill + w.height - r;
      const hole = new Path();
      hole.moveTo(w.x - r, sill);
      hole.lineTo(w.x - r, spring);
      hole.absarc(w.x, spring, r, Math.PI, 0, true);
      hole.lineTo(w.x + r, sill);
      hole.closePath();
      shape.holes.push(hole);
    }

    const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [width, height, depth, openings]);

  const trimGeometry = useMemo(() => {
    if (!trim) return null;
    const trimDepth = trim.depth ?? 0.07;
    const shapes = openings.map((o) => {
      const r = o.width / 2;
      const bottom = o.sill ?? 0;
      return archBandShape(o.x, bottom, r, bottom + o.height - r, trim.width);
    });
    const geo = new ExtrudeGeometry(shapes, { depth: trimDepth, bevelEnabled: false, curveSegments: 24 });
    return { geo, trimDepth };
  }, [trim, openings]);

  // Extrude UVs are in metres: the photographed plaster repeats every ~2.5 m.
  const plaster = useHeritageTexture("plaster", 0.4);
  const plasterNormal = useHeritageTexture("plasterNormal", 0.4);
  // Mouldings keep the pale lime-wash grain so they read as a separate finish.
  const texture = useSurfaceTexture(0.25);

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          map={plaster}
          normalMap={plasterNormal}
          normalScale={[0.9, 0.9]}
          roughness={0.92}
        />
      </mesh>
      {trim && trimGeometry && (
        <>
          {[depth / 2 - 0.005, -depth / 2 - trimGeometry.trimDepth + 0.005].map((z) => (
            <mesh key={z} geometry={trimGeometry.geo} position={[0, 0, z]} castShadow receiveShadow>
              <meshStandardMaterial color={trim.color} map={texture} bumpMap={texture} bumpScale={1.5} roughness={0.9} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
