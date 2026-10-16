/**
 * Single source of truth for the Heritage courtyard: where the display
 * pedestals stand, where the camera stops, and the copy shown at each stop.
 *
 * Units are metres. +Z points towards the entrance gate, -Z towards the
 * back façade. The camera visits the stations in order as the page scrolls.
 */

export type Vec3 = [number, number, number];

export interface PedestalConfig {
  id: string;
  position: Vec3;
  /** Placeholder garment colour (swap for real outfits later). */
  fabric: string;
  /** Sash / trim colour on the placeholder garment. */
  accent: string;
}

export interface CameraStation {
  position: Vec3;
  target: Vec3;
}

export interface Chapter {
  eyebrow: string;
  title: string;
  body: string;
}

export const PEDESTALS: PedestalConfig[] = [
  { id: "look-01", position: [-4, 0, 3.5], fabric: "#d9962f", accent: "#8f3b1f" },
  { id: "look-02", position: [4.2, 0, -2.5], fabric: "#2f4a80", accent: "#e0b45a" },
  { id: "look-03", position: [0, 0, -8.5], fabric: "#a8432a", accent: "#f0dcb4" },
];

/** Height (above the floor) the camera looks at when framing a garment. */
const GARMENT_FOCUS_Y = 1.3;

const focusOn = (p: PedestalConfig): Vec3 => [p.position[0], GARMENT_FOCUS_Y, p.position[2]];

/**
 * Station 0 is outside the gate; stations 1..3 frame each pedestal.
 * Alternating X offsets give the sideways drift between forward moves.
 */
export const CAMERA_STATIONS: CameraStation[] = [
  { position: [0, 2.4, 19], target: [0, 1.9, 0] },
  { position: [-1.6, 1.75, 8.9], target: focusOn(PEDESTALS[0]) },
  { position: [1.6, 1.75, 2.6], target: focusOn(PEDESTALS[1]) },
  { position: [0.9, 1.7, -2.4], target: focusOn(PEDESTALS[2]) },
];

/** Y rotation that turns a pedestal's front (+Z) towards the camera that frames it. */
export function facingRotation(pedestalIndex: number): number {
  const p = PEDESTALS[pedestalIndex].position;
  const cam = CAMERA_STATIONS[pedestalIndex + 1].position;
  return Math.atan2(cam[0] - p[0], cam[2] - p[2]);
}

/** One chapter per camera station. Placeholder copy. */
export const CHAPTERS: Chapter[] = [
  {
    eyebrow: "Ava & George World",
    title: "The Heritage Collection",
    body: "Scroll to step into the courtyard.",
  },
  {
    eyebrow: "Look 01",
    title: "Display one",
    body: "Placeholder garment. The first Heritage outfit will stand here.",
  },
  {
    eyebrow: "Look 02",
    title: "Display two",
    body: "Placeholder garment. The second Heritage outfit will stand here.",
  },
  {
    eyebrow: "Look 03",
    title: "Display three",
    body: "Placeholder garment. The third Heritage outfit will stand here.",
  },
];

/** Warm palette shared by the scene. */
export const PALETTE = {
  sky: "#f3d7ae",
  ground: "#d8b88a",
  path: "#c79f74",
  wallWarm: "#c98a57",
  wallLight: "#dcae7c",
  wallTrim: "#e9cfa6",
  shadowInterior: "#3a2216",
  timber: "#6b4428",
  clay: "#b0603a",
  foliage: "#6f7d3c",
  stone: "#eadbc2",
  brass: "#c49a52",
  indigoCloth: "#2c3f6b",
};
