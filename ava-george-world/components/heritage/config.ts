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

import type { HeritageTextureName } from "./scene/assets";

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
  /**
   * Cut-out photo of the real garment (a heritage texture name). When set,
   * it is shown on the stand in place of the placeholder outfit.
   */
  image?: HeritageTextureName;
  /** The garment's name, shown as the look's only copy. */
  name?: string;
}

export interface CameraStation {
  position: Vec3;
  target: Vec3;
  /** Multiplier on the base field of view; >1 is a wider lens. Default 1. */
  lens?: number;
  /** Framing used instead on portrait (phone) screens, where the view is tall and narrow. */
  portrait?: Omit<CameraStation, "portrait">;
}

/** Aspect ratio (width / height) below which the portrait framings apply. */
export const PORTRAIT_ASPECT = 0.8;

export interface Chapter {
  eyebrow: string;
  title: string;
  body: string;
  /** Stop with no on-screen copy: the scene speaks for itself. */
  silent?: boolean;
}

/**
 * How far the visitor scrolls between camera stops, in viewport heights.
 * Higher = slower, more lingering walk.
 */
export const SCROLL_PER_STOP = 2.5;

/** Interior half-extents of the walled courtyard. */
export const COURTYARD = { halfX: 10.3, halfZ: 12.3 };

/**
 * The monumental entrance archway in the middle of the front wall: a deep
 * gatehouse block with a tall round arch, framing the opening shot.
 */
export const GATE = {
  halfWidth: 3.5,
  archHeight: 6.4,
  towerHalfWidth: 5.6,
  towerHeight: 9.4,
  depth: 1.6,
};

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
  { silhouette: "dress", fabric: "#e8812c", accent: "#f6d8b8", image: "lookOrangeDress" },
  { silhouette: "dress", fabric: "#22409b", accent: "#f2c14e" },
  { silhouette: "dress", fabric: "#e98ba1", accent: "#fff3ea" },
  { silhouette: "dress", fabric: "#17734a", accent: "#f3e2b8" },
  { silhouette: "dress", fabric: "#e5a429", accent: "#8f3b1f" },
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
    const x = i % 2 === 0 ? -3.4 : 3.4;
    return { zone: "courtyard", position: [x, 0, 8.5 - 3.5 * i] };
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

/**
 * Courtyard overview: the camera stands at the gate on the rug and looks
 * down the whole avenue of looks to the rear archway, before the close-ups.
 */
const AVENUE_STATION: CameraStation = {
  position: [0.6, 1.55, COURTYARD.halfZ + 1.1],
  target: [-1.0, 2.05, 0],
  lens: 1.3,
  // Tilted down a touch so the looks, not the canopies, fill a tall screen.
  portrait: { position: [0.4, 1.6, COURTYARD.halfZ + 1.1], target: [-0.6, 1.45, 0], lens: 1.2 },
};

/**
 * Look 01 stands only a few metres inside the gate, so the standard framing
 * would put the camera inside the gate passage. Frame it from the rug
 * instead: closer and more side-on, still clear of the passage walls.
 */
function lookOneStation(p: PedestalConfig): CameraStation {
  const [x, y, z] = p.position;
  return { position: [0.8, 1.7, z + 2.7], target: [x, y + GARMENT_FOCUS_Y, z] };
}

const PEDESTAL_STATIONS = PEDESTALS.map((p, i) => (i === 0 ? lookOneStation(p) : framingFor(p)));

/**
 * Pause in the archway, the stone arch framing the view, looking up into the
 * hall's dome and across to the finale before stepping inside.
 */
const THRESHOLD_STATION: CameraStation = {
  position: [0, 1.6, -COURTYARD.halfZ + 3.0],
  target: [0, 2.6, HALL.centerZ - 3],
  lens: 1.2,
};

const NUMBER_WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const titleCase = (word: string) => word[0].toUpperCase() + word.slice(1);

/** A look's copy is just the garment's name (a placeholder until it is named). */
function lookChapter(p: PedestalConfig, i: number): Chapter {
  return {
    eyebrow: "",
    title: p.name ?? `Display ${titleCase(NUMBER_WORDS[i])}`,
    body: "",
  };
}

interface Stop {
  station: CameraStation;
  chapter: Chapter;
}

/** Every camera stop in order, each paired with the copy shown there. */
const STOPS: Stop[] = [
  {
    // Hero: a child's-eye view through the great arch, with a wider lens.
    station: {
      position: [0, 1.45, COURTYARD.halfZ + 7.2],
      target: [0, 3.6, COURTYARD.halfZ - 19],
      lens: 1.38,
      // Further back on phones, so the whole dressed entrance fits the narrow view.
      portrait: { position: [0, 1.5, COURTYARD.halfZ + 12.5], target: [0, 4.4, COURTYARD.halfZ - 6], lens: 1.38 },
    },
    chapter: {
      eyebrow: "Ava & George World",
      title: "The Heritage Collection",
      body: "",
    },
  },
  {
    station: AVENUE_STATION,
    // No overlay copy here: the view down the courtyard is the moment.
    chapter: { eyebrow: "The Courtyard", title: "The Courtyard", body: "", silent: true },
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

/**
 * Index of the camera stop that frames pedestal `i`. Stops run: hero (0),
 * courtyard overview (1), courtyard looks, doorway, hall looks.
 */
export function stopIndexForPedestal(i: number): number {
  return i < OUTDOOR_COUNT ? i + 2 : i + 3;
}

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
  haze: "#f1d9bd",
  /*
   * Walls use a photographed terracotta plaster texture; these are tints
   * multiplied over it (white = the plaster's own colour).
   */
  wallWarm: "#ecd3c3",
  wallLight: "#ffffff",
  wallTrim: "#eec594",
  niche: "#b98d78",
  canopyTerracotta: "#c8733f",
  canopyCream: "#f3e2c4",
  canopyRed: "#c8442f",
  timber: "#6b4428",
  clay: "#b0603a",
  foliage: "#6f7d3c",
  stone: "#eadbc2",
  brass: "#c49a52",
  indigoCloth: "#2c3f6b",
  mustard: "#d9a23a",
  hallWall: "#fbe9d9",
  hallFloor: "#e8cdb0",
  hallStone: "#f1e4cc",
  iron: "#2a2420",
  lanternGlow: "#ffcf8a",
};
