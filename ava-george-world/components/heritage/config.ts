/**
 * Single source of truth for the Heritage courtyard: where the display
 * pedestals stand, where the camera stops, and the copy shown at each stop.
 *
 * Units are metres. +Z points towards the entrance gate, -Z towards the
 * back façade. The camera visits the stations in order as the page scrolls.
 */

export type Vec3 = [number, number, number];

export type Silhouette = "dress" | "tunic";

export interface PedestalConfig {
  id: string;
  position: Vec3;
  /** Placeholder shape until the real outfit model is loaded. */
  silhouette: Silhouette;
  /** Placeholder garment colour. */
  fabric: string;
  /** Sash, collar or trouser colour on the placeholder. */
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

/**
 * How far the visitor scrolls between camera stops, in viewport heights.
 * Higher = slower, more lingering walk.
 */
export const SCROLL_PER_STOP = 2.5;

/** Interior half-extents of the walled courtyard. */
export const COURTYARD = { halfX: 10.3, halfZ: 22.3 };

/** Placeholder looks, in visiting order. The last one is the finale at the back. */
const LOOKS: Omit<PedestalConfig, "id" | "position">[] = [
  { silhouette: "dress", fabric: "#d9962f", accent: "#8f3b1f" },
  { silhouette: "tunic", fabric: "#2f4a80", accent: "#e0b45a" },
  { silhouette: "dress", fabric: "#a8432a", accent: "#f0dcb4" },
  { silhouette: "tunic", fabric: "#3f6b45", accent: "#e3b23c" },
  { silhouette: "dress", fabric: "#d9735a", accent: "#3b2a1f" },
  { silhouette: "tunic", fabric: "#efe3cc", accent: "#8f3b1f" },
  { silhouette: "dress", fabric: "#6b2f4a", accent: "#e0b45a" },
  { silhouette: "tunic", fabric: "#c4822f", accent: "#2c3f6b" },
  { silhouette: "dress", fabric: "#2f6f6f", accent: "#f0dcb4" },
  { silhouette: "dress", fabric: "#9e2b25", accent: "#e0b45a" },
];

/*
 * Layout: looks zig-zag down either side of the central path, then the
 * finale stands alone on the path in front of the main archway.
 */
const ZIGZAG_X = 3.6;
const FIRST_Z = 13;
const SPACING = 3.5;

export const PEDESTALS: PedestalConfig[] = LOOKS.map((look, i) => {
  const isFinale = i === LOOKS.length - 1;
  const position: Vec3 = isFinale
    ? [0, 0, FIRST_Z - SPACING * i]
    : [i % 2 === 0 ? -ZIGZAG_X : ZIGZAG_X, 0, FIRST_Z - SPACING * i];
  return { id: `look-${String(i + 1).padStart(2, "0")}`, position, ...look };
});

/** Height (above the floor) the camera looks at when framing a garment. */
const GARMENT_FOCUS_Y = 1.3;

/**
 * The camera stands across the path from each side look and a few metres
 * back, so it crosses left/right between stops while moving forward.
 */
function stationFor(p: PedestalConfig): CameraStation {
  const [x, , z] = p.position;
  const side = Math.sign(x);
  const position: Vec3 = side === 0 ? [0.9, 1.7, z + 6.1] : [x - side * 2.4, 1.75, z + 5.4];
  return { position, target: [x, GARMENT_FOCUS_Y, z] };
}

/** Station 0 is outside the gate; station i + 1 frames pedestal i. */
export const CAMERA_STATIONS: CameraStation[] = [
  { position: [0, 2.4, COURTYARD.halfZ + 7], target: [0, 1.9, COURTYARD.halfZ - 12] },
  ...PEDESTALS.map(stationFor),
];

/** Y rotation that turns a pedestal's front (+Z) towards the camera that frames it. */
export function facingRotation(pedestalIndex: number): number {
  const p = PEDESTALS[pedestalIndex].position;
  const cam = CAMERA_STATIONS[pedestalIndex + 1].position;
  return Math.atan2(cam[0] - p[0], cam[2] - p[2]);
}

const NUMBER_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** One chapter per camera station. Placeholder copy. */
export const CHAPTERS: Chapter[] = [
  {
    eyebrow: "Ava & George World",
    title: "The Heritage Collection",
    body: "Scroll to step into the courtyard.",
  },
  ...PEDESTALS.map((p, i) => ({
    eyebrow: `Look ${String(i + 1).padStart(2, "0")}`,
    title: `Display ${NUMBER_WORDS[i]}`,
    body: `Placeholder ${p.silhouette}. Heritage outfit ${NUMBER_WORDS[i]} will stand here.`,
  })),
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
