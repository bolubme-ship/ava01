/**
 * Single source of truth for the Heritage experience: where the display
 * pedestals stand, where the camera stops, and the copy shown at each stop.
 *
 * The walk has two spaces joined by a real doorway:
 *   1. the sunlit courtyard (looks 1–5),
 *   2. a round, domed inner hall behind the courtyard's back wall (looks 6–10).
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
 * The inner hall is a rotunda directly behind the courtyard's back wall,
 * entered through its central archway (which sits at the rotunda's front,
 * angle 0). `radius` is the inner face of the curved wall; the ceiling has
 * an open oculus of `oculusRadius` above the central dais.
 */
const HALL_RADIUS = 9;
export const HALL = {
  radius: HALL_RADIUS,
  centerZ: -COURTYARD.halfZ - 0.3 - HALL_RADIUS,
  height: 6.2,
  oculusRadius: 2.1,
  daisHeight: 0.3,
  /** Half-width of the entrance archway in the courtyard's back wall. */
  doorHalfWidth: 1.8,
};

/** Point on a circle around the rotunda centre. Angle in degrees, 0 = towards the entrance. */
export function onHallRing(radius: number, degrees: number, y = 0): Vec3 {
  const a = (degrees * Math.PI) / 180;
  return [radius * Math.sin(a), y, HALL.centerZ + radius * Math.cos(a)];
}

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
 * Courtyard: looks zig-zag down either side of the central path and the
 * camera walks forward between them.
 * Hall: looks stand in alcoves around the curved wall and the camera
 * circles the room facing outwards; the finale stands on the central dais.
 */
export const ALCOVE_RADIUS = 7;
const ORBIT_RADIUS = 2.6;
/** Alcove angles in visiting order: left-front, left-back, right-back, right-front. */
export const ALCOVE_ANGLES = [-70, -140, 140, 70];

function positionFor(i: number): { zone: Zone; position: Vec3 } {
  if (i < OUTDOOR_COUNT) {
    const x = i % 2 === 0 ? -3.6 : 3.6;
    return { zone: "courtyard", position: [x, 0, 6 - 3.5 * i] };
  }
  if (i === LOOKS.length - 1) {
    return { zone: "hall", position: [0, HALL.daisHeight, HALL.centerZ] };
  }
  return { zone: "hall", position: onHallRing(ALCOVE_RADIUS, ALCOVE_ANGLES[i - OUTDOOR_COUNT]) };
}

export const PEDESTALS: PedestalConfig[] = LOOKS.map((look, i) => ({
  id: `look-${String(i + 1).padStart(2, "0")}`,
  ...positionFor(i),
  ...look,
}));

/** Height (above the floor) the camera looks at when framing a garment. */
const GARMENT_FOCUS_Y = 1.3;

/**
 * Courtyard: the camera stands across the path from each look and a few
 * metres back, so it crosses left/right between stops while moving forward.
 * Hall alcoves: the camera stands on an inner orbit at the alcove's angle,
 * looking straight out at it. Finale: the camera faces the dais from the
 * entrance side, with the textile on the far wall behind it.
 */
function framingFor(p: PedestalConfig): CameraStation {
  const [x, y, z] = p.position;
  const target: Vec3 = [x, y + GARMENT_FOCUS_Y, z];
  if (p.zone === "courtyard") {
    const side = Math.sign(x);
    return { position: [x - side * 2.4, 1.75, z + 5.4], target };
  }
  const radial = Math.hypot(x, z - HALL.centerZ);
  if (radial < 0.01) {
    return { position: [0.8, 1.9, HALL.centerZ + 4.8], target };
  }
  const degrees = (Math.atan2(x, z - HALL.centerZ) * 180) / Math.PI;
  return { position: onHallRing(ORBIT_RADIUS, degrees, 1.75), target };
}

const PEDESTAL_STATIONS = PEDESTALS.map(framingFor);

/** Pause on the archway, looking through it into the hall, before stepping inside. */
const THRESHOLD_STATION: CameraStation = {
  position: [0, 1.75, -COURTYARD.halfZ + 5.8],
  target: [0, 1.7, HALL.centerZ],
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
      body: "Five more looks wait in the cool of the round hall.",
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
