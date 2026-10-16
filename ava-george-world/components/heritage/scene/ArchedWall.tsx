"use client";

import { useMemo } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import type { Vec3 } from "../config";
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

interface ArchedWallProps {
  width: number;
  height: number;
  depth?: number;
  openings?: ArchOpening[];
  color: string;
  position?: Vec3;
  rotationY?: number;
}

/**
 * A thick plaster wall with round-topped doorways and windows, built by
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

  // Extrude UVs are in metres, so this tiles the grain every ~4m.
  const texture = useSurfaceTexture(0.25);

  return (
    <mesh geometry={geometry} position={position} rotation-y={rotationY} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        map={texture}
        bumpMap={texture}
        bumpScale={2}
        roughness={0.95}
      />
    </mesh>
  );
}
