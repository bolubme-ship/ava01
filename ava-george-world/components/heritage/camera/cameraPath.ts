import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import type { CameraStation } from "../config";

/**
 * Remaps linear scroll progress so the camera slows as it reaches each
 * station and glides between them. `strength` 0 = linear, 1 = full stop.
 */
export function dwellAtStations(progress: number, segments: number, strength = 0.8): number {
  const scaled = MathUtils.clamp(progress, 0, 1) * segments;
  const index = Math.min(Math.floor(scaled), segments - 1);
  const local = scaled - index;
  const smooth = local * local * (3 - 2 * local);
  return (index + MathUtils.lerp(local, smooth, strength)) / segments;
}

/** Snaps progress to the nearest station (used for reduced motion: cuts, not travel). */
export function snapToStation(progress: number, segments: number): number {
  return Math.round(MathUtils.clamp(progress, 0, 1) * segments) / segments;
}

export interface CameraPath {
  segments: number;
  /**
   * Writes the camera position and look-at target for `progress` (0..1) and
   * returns the lens multiplier (field-of-view scale) at that point.
   */
  sample(progress: number, outPosition: Vector3, outTarget: Vector3): number;
}

/**
 * Smooth spline through the station positions plus a second spline through
 * their targets. CatmullRomCurve3.getPoint is index-uniform, so station i
 * lands exactly at t = i / segments. Lens multipliers ease linearly between
 * neighbouring stations on the same timing.
 */
export function createCameraPath(stations: CameraStation[]): CameraPath {
  const toCurve = (pick: (s: CameraStation) => [number, number, number]) =>
    new CatmullRomCurve3(
      stations.map((s) => new Vector3(...pick(s))),
      false,
      "centripetal",
    );

  const positionCurve = toCurve((s) => s.position);
  const targetCurve = toCurve((s) => s.target);
  const segments = stations.length - 1;
  const lenses = stations.map((s) => s.lens ?? 1);

  return {
    segments,
    sample(progress, outPosition, outTarget) {
      const t = dwellAtStations(progress, segments);
      positionCurve.getPoint(t, outPosition);
      targetCurve.getPoint(t, outTarget);
      const scaled = t * segments;
      const i = Math.min(Math.floor(scaled), segments - 1);
      return MathUtils.lerp(lenses[i], lenses[i + 1], scaled - i);
    },
  };
}
