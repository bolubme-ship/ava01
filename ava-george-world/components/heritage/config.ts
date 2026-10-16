/**
 * Single source of truth for the Heritage experience: where the display
 * pedestals stand, where the camera stops, and the copy shown at each stop.
 *
 * The walk has two spaces joined by a real doorway:
 *   1. the sunlit courtyard (looks 1–5),
 *   2. the inner hall behind the courtyard's back wall (looks 6–10).
 *
 * Units are metres. +Z points towards the entrance gate, -Z towards the
 * back of the hall. The camera visits the stations in order as the page scrolls.
 */

export type Vec3 = [number, number, number];

export type Silhouette = "dress" | "tunic";

export type Zone = "courtyard" | "hall";

export interface PedestalConfig {
  id: string;
  zone: Zone;
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
export const COURTYARD = { halfX: 10.3, halfZ: 12.3 };

/**
 * The inner hall sits directly behind the courtyard's back wall and is
 * entered through its central archway. `front` and `back` are the inner
 * faces of its end walls; `halfX` is the inner half-width.
 */
export const HALL = {
  halfX: 7.3,
  front: -COURTYARD.halfZ - 0.3,
  back: -36.5,
  height: 6.2,
};

/** Placeholder looks, in visiting order. Looks 1–5 are outside, 6–10 inside. */
const LOOKS: Omit<PedestalConfig, "id" | "zone" | "position">[] = [
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

const OUTDOOR_COUNT = 5;

/*
 * Courtyard: looks zig-zag down either side of the central path.
 * Hall: a tighter zig-zag, ending with the finale on the centre line.
 */
function positionFor(i: number): { zone: Zone; position: Vec3 } {
  if (i < OUTDOOR_COUNT) {
    const x = i % 2 === 0 ? -3.6 : 3.6;
    return { zone: "courtyard", position: [x, 0, 6 - 3.5 * i] };
  }
  const j = i - OUTDOOR_COUNT;
  if (i === LOOKS.length - 1) {
    // Finale gets extra room so its camera stands clear of the previous look.
    return { zone: "hall", position: [0, 0, HALL.front - 4.9 - 3.4 * (j - 1) - 5.5] };
  }
  const x = j % 2 === 0 ? -3 : 3;
  return { zone: "hall", position: [x, 0, HALL.front - 4.9 - 3.4 * j] };
}

export const PEDESTALS: PedestalConfig[] = LOOKS.map((look, i) => ({
  id: `look-${String(i + 1).padStart(2, "0")}`,
  ...positionFor(i),
  ...look,
}));

/** Height (above the floor) the camera looks at when framing a garment. */
const GARMENT_FOCUS_Y = 1.3;

/**
 * The camera stands across the path from each side look and a few metres
 * back, so it crosses left/right between stops while moving forward.
 * Hall framings are a little tighter to fit the narrower room.
 */
function framingFor(p: PedestalConfig): CameraStation {
  const [x, , z] = p.position;
  const side = Math.sign(x);
  const indoor = p.zone === "hall";
  const lateral = indoor ? 2.2 : 2.4;
  const back = indoor ? 4.2 : 5.4;
  const position: Vec3 = side === 0 ? [0.8, 1.7, z + back + 0.6] : [x - side * lateral, 1.75, z + back];
  return { position, target: [x, GARMENT_FOCUS_Y, z] };
}

const PEDESTAL_STATIONS = PEDESTALS.map(framingFor);

/** Pause on the archway, looking through it into the hall, before stepping inside. */
const THRESHOLD_STATION: CameraStation = {
  position: [0, 1.75, -COURTYARD.halfZ + 5.8],
  target: [0, 1.7, HALL.front - 8],
};

const NUMBER_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function lookChapter(p: PedestalConfig, i: number): Chapter {
  return {
    eyebrow: `Look ${String(i + 1).padStart(2, "0")}`,
    title: `Display ${NUMBER_WORDS[i]}`,
    body: `Placeholder ${p.silhouette}. Heritage outfit ${NUMBER_WORDS[i]} will stand here.`,
  };
}

interface Stop {
  station: CameraStation;
  chapter: Chapter;
}

/** Every camera stop in order, each paired with the copy shown there. */
const STOPS: Stop[] = [
  {
    station: {
      position: [0, 2.4, COURTYARD.halfZ + 7],
      target: [0, 1.9, COURTYARD.halfZ - 12],
    },
    chapter: {
      eyebrow: "Ava & George World",
      title: "The Heritage Collection",
      body: "Scroll to step into the courtyard.",
    },
  },
  ...PEDESTALS.slice(0, OUTDOOR_COUNT).map((p, i) => ({
    station: PEDESTAL_STATIONS[i],
    chapter: lookChapter(p, i),
  })),
  {
    station: THRESHOLD_STATION,
    chapter: {
      eyebrow: "The Inner Hall",
      title: "Step inside",
      body: "Five more looks wait in the cool of the hall.",
    },
  },
  ...PEDESTALS.slice(OUTDOOR_COUNT).map((p, j) => ({
    station: PEDESTAL_STATIONS[OUTDOOR_COUNT + j],
    chapter: lookChapter(p, OUTDOOR_COUNT + j),
  })),
];

export const CAMERA_STATIONS: CameraStation[] = STOPS.map((s) => s.station);

/** One chapter per camera station. Placeholder copy. */
export const CHAPTERS: Chapter[] = STOPS.map((s) => s.chapter);

/** Y rotation that turns a pedestal's front (+Z) towards the camera that frames it. */
export function facingRotation(pedestalIndex: number): number {
  const p = PEDESTALS[pedestalIndex].position;
  const cam = PEDESTAL_STATIONS[pedestalIndex].position;
  return Math.atan2(cam[0] - p[0], cam[2] - p[2]);
}

/** Warm palette shared by the scene. */
export const PALETTE = {
  sky: "#f3d7ae",
  ground: "#d8b88a",
  path: "#c79f74",
  wallWarm: "#c98a57",
  wallLight: "#dcae7c",
  wallTrim: "#e9cfa6",
  timber: "#6b4428",
  clay: "#b0603a",
  foliage: "#6f7d3c",
  stone: "#eadbc2",
  brass: "#c49a52",
  indigoCloth: "#2c3f6b",
  mustard: "#d9a23a",
  hallWall: "#e3c8a2",
  hallFloor: "#a9714a",
  hallCeiling: "#5e3d24",
  lanternGlow: "#ffcf8a",
};
