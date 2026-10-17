"use client";

import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { mulberry32 } from "./random";

/*
 * Textures drawn on a 2D canvas at load time, so the scene needs no image
 * files. Each is a stand-in for a photographed / PBR texture that can be
 * swapped in later (see components/heritage/ASSETS.md).
 */

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) => void;

const cache = new Map<string, CanvasTexture>();

function paint(key: string, w: number, h: number, painter: Painter): CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  painter(ctx, w, h, mulberry32(key.length * 97 + w));
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const v = rand() > 0.5 ? 255 : 70;
    ctx.fillStyle = `rgba(${v},${v * 0.92},${v * 0.82},${alpha * rand()})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
}

/**
 * Limestone flags in running-bond courses: uneven widths, per-stone tint,
 * worn centres, darker bevelled joints with a sunlit top edge, and stains.
 * Tiles seamlessly (course lengths are chosen to fill the width exactly).
 */
const stoneTiles: Painter = (ctx, w, h, rand) => {
  ctx.fillStyle = "#b99a76"; // joints
  ctx.fillRect(0, 0, w, h);
  const courses = 6;
  const ch = h / courses;
  for (let c = 0; c < courses; c++) {
    const y = c * ch;
    // Split the course into 3–5 stones that exactly span the width.
    const n = 3 + Math.floor(rand() * 3);
    const weights = Array.from({ length: n }, () => 0.6 + rand());
    const total = weights.reduce((a, b) => a + b, 0);
    let x = (rand() * w) / n; // stagger; stones wrap around the edge
    for (const wt of weights) {
      const sw = (wt / total) * w;
      const hue = 30 + rand() * 8;
      const sat = 32 + rand() * 18;
      const lit = 80 + rand() * 9;
      const draw = (ox: number) => {
        const x0 = x + ox + 3;
        const y0 = y + 3;
        const ww = sw - 6;
        const hh = ch - 6;
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
        ctx.fillRect(x0, y0, ww, hh);
        // Worn, slightly lighter centre.
        const g = ctx.createRadialGradient(x0 + ww / 2, y0 + hh / 2, 0, x0 + ww / 2, y0 + hh / 2, Math.max(ww, hh) * 0.6);
        g.addColorStop(0, "rgba(255,248,236,0.18)");
        g.addColorStop(1, "rgba(120,80,50,0.12)");
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, ww, hh);
        // Bevel: lit top-left edge, shaded bottom-right edge.
        ctx.fillStyle = "rgba(255,250,240,0.35)";
        ctx.fillRect(x0, y0, ww, 2);
        ctx.fillRect(x0, y0, 2, hh);
        ctx.fillStyle = "rgba(90,55,30,0.28)";
        ctx.fillRect(x0, y0 + hh - 2, ww, 2);
        ctx.fillRect(x0 + ww - 2, y0, 2, hh);
      };
      draw(0);
      draw(-w); // wrap the stone that crosses the right edge
      x += sw;
    }
  }
  // Stains and patina.
  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 8 + rand() * 40;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rand() > 0.5 ? "120,80,50" : "255,245,230"},${0.05 + rand() * 0.08})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  speckle(ctx, w, h, rand, 30000, 0.14);
};

/** Honed cream marble with faint grey-gold veining, for display plinths. */
const marble: Painter = (ctx, w, h, rand) => {
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) {
    const g = ctx.createRadialGradient(rand() * w, rand() * h, 0, rand() * w, rand() * h, 40 + rand() * 120);
    g.addColorStop(0, "rgba(230,215,195,0.25)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  for (let v = 0; v < 9; v++) {
    let x = rand() * w;
    let y = 0;
    ctx.strokeStyle = `rgba(${rand() > 0.5 ? "160,145,130" : "190,160,110"},${0.18 + rand() * 0.2})`;
    ctx.lineWidth = 0.6 + rand() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (y < h) {
      x += (rand() - 0.5) * 26;
      y += 6 + rand() * 18;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  speckle(ctx, w, h, rand, 6000, 0.08);
};

/** Red runner rug with cream / dark borders and a column of diamond medallions. */
const rug: Painter = (ctx, w, h, rand) => {
  ctx.fillStyle = "#b8402d";
  ctx.fillRect(0, 0, w, h);
  // Woven grain.
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = `rgba(90,20,10,${0.05 + rand() * 0.06})`;
    ctx.fillRect(0, y, w, 1);
  }
  const band = (x: number, width: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, 0, width, h);
    ctx.fillRect(w - x - width, 0, width, h);
  };
  band(0, 10, "#7d2416");
  band(10, 18, "#e9cfa4");
  band(28, 4, "#d9822f");
  band(32, 6, "#7d2416");
  // Small triangles along the cream border.
  ctx.fillStyle = "#b8402d";
  for (let y = 0; y < h; y += 16) {
    for (const x0 of [10, w - 28]) {
      ctx.beginPath();
      ctx.moveTo(x0 + 2, y);
      ctx.lineTo(x0 + 16, y + 8);
      ctx.lineTo(x0 + 2, y + 16);
      ctx.fill();
    }
  }
  // All-over field of small stepped diamonds, quieter than the border.
  for (let y = 24; y < h; y += 48) {
    for (let x = 64; x <= w - 64; x += 64) {
      const ox = (Math.round(y / 48) % 2) * 32;
      const cx0 = x + ox - 16;
      if (cx0 < 52 || cx0 > w - 52) continue;
      ctx.fillStyle = "rgba(233,207,164,0.55)";
      ctx.beginPath();
      ctx.moveTo(cx0, y - 9);
      ctx.lineTo(cx0 + 7, y);
      ctx.lineTo(cx0, y + 9);
      ctx.lineTo(cx0 - 7, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  // Occasional medallions down the centre.
  const cx = w / 2;
  for (let y = 256; y < h; y += 512) {
    for (const [r, color] of [
      [56, "#7d2416"],
      [44, "#d9822f"],
      [30, "#b8402d"],
      [18, "#e9cfa4"],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, y - r);
      ctx.lineTo(cx + r * 0.62, y);
      ctx.lineTo(cx, y + r);
      ctx.lineTo(cx - r * 0.62, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  speckle(ctx, w, h, rand, 4000, 0.15);
};

/** Kilim-style wall hanging: deep red field with a lattice of stepped diamonds. */
const kilim: Painter = (ctx, w, h, rand) => {
  ctx.fillStyle = "#b3261e";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#e7cfa2";
  ctx.fillRect(0, 0, w, 14);
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillRect(0, 0, 12, h);
  ctx.fillRect(w - 12, 0, 12, h);
  ctx.fillStyle = "#2b1712";
  ctx.fillRect(16, 18, w - 32, 4);
  ctx.fillRect(16, h - 22, w - 32, 4);
  const cell = (w - 40) / 2;
  for (let y = 40; y + cell <= h - 30; y += cell) {
    for (let x = 20; x + cell <= w - 18; x += cell) {
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      for (const [r, color] of [
        [cell * 0.48, "#e7cfa2"],
        [cell * 0.38, "#2b1712"],
        [cell * 0.3, "#d9822f"],
        [cell * 0.18, "#e7cfa2"],
        [cell * 0.08, "#2b1712"],
      ] as const) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r, cy);
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  speckle(ctx, w, h, rand, 3000, 0.2);
};

/** Terracotta with incised zig-zag and dot bands, for carved pots. */
const carvedClay: Painter = (ctx, w, h, rand) => {
  ctx.fillStyle = "#b9673d";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const g = ctx.createRadialGradient(rand() * w, rand() * h, 0, rand() * w, rand() * h, 30 + rand() * 60);
    g.addColorStop(0, `rgba(${rand() > 0.5 ? "230,150,100" : "120,55,30"},0.15)`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.strokeStyle = "rgba(95,40,20,0.75)";
  ctx.lineWidth = 3;
  for (const y0 of [0.32, 0.5, 0.68]) {
    const y = y0 * h;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + ((x / 16) % 2 === 0 ? -8 : 8));
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(95,40,20,0.7)";
  for (const y0 of [0.41, 0.59]) {
    for (let x = 6; x < w; x += 14) {
      ctx.beginPath();
      ctx.arc(x, y0 * h, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillRect(0, 0.24 * h, w, 3);
  ctx.fillRect(0, 0.76 * h, w, 3);
  speckle(ctx, w, h, rand, 3000, 0.2);
};

/** Soft, sunlit cumulus puff on a transparent background. */
const cloud: Painter = (ctx, w, h, rand) => {
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) {
    const x = w * (0.2 + rand() * 0.6);
    const y = h * (0.45 + rand() * 0.25);
    const r = w * (0.08 + rand() * 0.14);
    const g = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.6, "rgba(255,250,244,0.6)");
    g.addColorStop(1, "rgba(255,245,235,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
};

// ---------------------------------------------------------------------------
// Inner hall

const HALL_GOLD = "#c99a45";
const HALL_NAVY = "#1f2d4f";

/**
 * The hall's polished floor, painted as one disc (the canvas spans the
 * rotunda's diameter, 18 m): cream marble slabs with fine joints and faint
 * veining, a navy-and-gold ring and compass star around the dais, and a
 * band of diamonds around the edge.
 */
const hallFloor: Painter = (ctx, w, h, rand) => {
  const k = w / 18; // pixels per metre
  const cx = w / 2;
  const cy = h / 2;
  ctx.fillStyle = "#efe2cb";
  ctx.fillRect(0, 0, w, h);
  // Slabs: 1.5 m squares, each a slightly different cream.
  const slab = 1.5 * k;
  for (let y = 0; y < h; y += slab) {
    for (let x = 0; x < w; x += slab) {
      const t = rand();
      ctx.fillStyle = `rgba(${236 + t * 12},${222 + t * 12},${198 + t * 14},1)`;
      ctx.fillRect(x, y, slab, slab);
    }
  }
  for (let i = 0; i < 60; i++) {
    const g = ctx.createRadialGradient(rand() * w, rand() * h, 0, rand() * w, rand() * h, 60 + rand() * 200);
    g.addColorStop(0, "rgba(214,190,150,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  for (let v = 0; v < 40; v++) {
    let x = rand() * w;
    let y = rand() * h;
    ctx.strokeStyle = `rgba(170,150,125,${0.08 + rand() * 0.12})`;
    ctx.lineWidth = 0.6 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 30; s++) {
      x += (rand() - 0.3) * 30;
      y += (rand() - 0.5) * 30;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(150,125,95,0.35)";
  ctx.lineWidth = 1.2;
  for (let p = 0; p <= w; p += slab) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, h);
    ctx.moveTo(0, p);
    ctx.lineTo(w, p);
    ctx.stroke();
  }

  const ring = (r: number, width: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width * k;
    ctx.beginPath();
    ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
    ctx.stroke();
  };
  // Compass star radiating from beneath the dais.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const long = i % 2 === 0;
    const tip = (long ? 3.9 : 3.0) * k;
    const half = (Math.PI / 16) * 0.9;
    for (const side of [-1, 1]) {
      ctx.fillStyle = side < 0 ? (long ? HALL_NAVY : "#a77a35") : long ? "#33456e" : HALL_GOLD;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * tip, cy + Math.sin(a) * tip);
      ctx.lineTo(cx + Math.cos(a + side * half) * 1.9 * k, cy + Math.sin(a + side * half) * 1.9 * k);
      ctx.closePath();
      ctx.fill();
    }
  }
  ring(4.65, 0.5, HALL_NAVY);
  ring(4.36, 0.06, HALL_GOLD);
  ring(4.94, 0.06, HALL_GOLD);
  ring(5.5, 0.04, HALL_GOLD);

  // Diamond band around the edge.
  ring(8.4, 0.62, HALL_NAVY);
  ring(8.07, 0.05, HALL_GOLD);
  ring(8.73, 0.05, HALL_GOLD);
  const count = 72;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 8.4 * k;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = i % 2 === 0 ? HALL_GOLD : "#e9d9b8";
    ctx.beginPath();
    ctx.moveTo(-0.26 * k, 0);
    ctx.lineTo(0, -0.33 * k);
    ctx.lineTo(0.26 * k, 0);
    ctx.lineTo(0, 0.33 * k);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  speckle(ctx, w, h, rand, 20000, 0.05);
};

/** Deep red banner with a gold border, a gold wheat sprig and a swallowtail hem. */
const hallBanner: Painter = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  const notch = h * 0.07;
  const body = new Path2D();
  body.moveTo(0, 0);
  body.lineTo(w, 0);
  body.lineTo(w, h);
  body.lineTo(w / 2, h - notch);
  body.lineTo(0, h);
  body.closePath();
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#5e0f12");
  g.addColorStop(0.5, "#8c1d1f");
  g.addColorStop(1, "#5e0f12");
  ctx.fillStyle = g;
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  ctx.strokeStyle = HALL_GOLD;
  ctx.lineWidth = w * 0.025;
  const inset = w * 0.08;
  ctx.beginPath();
  ctx.moveTo(inset, 0);
  ctx.lineTo(inset, h - notch * 0.6 - inset * 0.5);
  ctx.moveTo(w - inset, 0);
  ctx.lineTo(w - inset, h - notch * 0.6 - inset * 0.5);
  ctx.stroke();
  // Wheat sprig: a stem with paired grains.
  ctx.strokeStyle = "#d9ae5a";
  ctx.fillStyle = "#d9ae5a";
  ctx.lineWidth = w * 0.022;
  const top = h * 0.24;
  const bottom = h * 0.72;
  ctx.beginPath();
  ctx.moveTo(w / 2, top);
  ctx.lineTo(w / 2, bottom);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const y = top + (i / 7) * (bottom - top) * 0.8;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(w / 2 + side * w * 0.07, y + w * 0.05);
      ctx.rotate(side * 0.55);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.05, w * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.beginPath();
  ctx.ellipse(w / 2, top - w * 0.06, w * 0.045, w * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

/** Warm wash inside a lit niche: brightest beneath the arch, falling off towards the floor. */
const nicheGlow: Painter = (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#ffd88e");
  g.addColorStop(0.45, "#f0b765");
  g.addColorStop(1, "#b97a3f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const r = ctx.createRadialGradient(w / 2, h * 0.12, 0, w / 2, h * 0.12, h * 0.6);
  r.addColorStop(0, "rgba(255,240,200,0.75)");
  r.addColorStop(1, "rgba(255,240,200,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, w, h);
};

/** Radial timber boarding for the hall's ceiling: boards run along v. */
const timberBoards: Painter = (ctx, w, h, rand) => {
  const boards = 8;
  const bw = w / boards;
  for (let i = 0; i < boards; i++) {
    const t = rand();
    ctx.fillStyle = `rgb(${120 + t * 40},${76 + t * 26},${42 + t * 16})`;
    ctx.fillRect(i * bw, 0, bw, h);
    for (let g = 0; g < 14; g++) {
      ctx.strokeStyle = `rgba(${rand() > 0.5 ? "70,40,20" : "190,140,90"},${0.12 + rand() * 0.18})`;
      ctx.lineWidth = 0.6 + rand();
      const x = i * bw + rand() * bw;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + (rand() - 0.5) * 6, h / 3, x + (rand() - 0.5) * 6, (2 * h) / 3, x, h);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(40,22,10,0.55)";
    ctx.fillRect(i * bw, 0, 1.5, h);
  }
};

/** Soft beam of light: brightest at the top, holding its strength, then dissolving at the end; soft at both edges. */
const lightRay: Painter = (ctx, w, h) => {
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const along = (1 - 0.5 * Math.pow(t, 1.5)) * Math.min(1, (1 - t) / 0.3);
    for (let x = 0; x < w; x++) {
      const across = Math.exp(-Math.pow((x / w - 0.5) * 4.2, 2));
      const i = (y * w + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 236;
      img.data[i + 2] = 196;
      img.data[i + 3] = Math.round(255 * along * across);
    }
  }
  ctx.putImageData(img, 0, 0);
};

/** Soft round pool of light, for sunlight landing on the floor. */
const glowSpot: Painter = (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(255,226,170,1)");
  g.addColorStop(0.5, "rgba(255,214,150,0.45)");
  g.addColorStop(1, "rgba(255,214,150,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
};

/** Glow washing up from a hidden cove light: bright along the bottom edge. */
const coveGlow: Painter = (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, h, 0, 0);
  g.addColorStop(0, "rgba(255,214,140,1)");
  g.addColorStop(0.35, "rgba(255,190,110,0.35)");
  g.addColorStop(1, "rgba(255,190,110,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
};

// ---------------------------------------------------------------------------
// Entrance

/** Red banner for the gate pillars: cream edge stripes, a cream chevron band and a pointed hem. */
const gateBanner: Painter = (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  const point = h * 0.09;
  const body = new Path2D();
  body.moveTo(0, 0);
  body.lineTo(w, 0);
  body.lineTo(w, h - point);
  body.lineTo(w / 2, h);
  body.lineTo(0, h - point);
  body.closePath();
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#7e1418");
  g.addColorStop(0.5, "#b0232a");
  g.addColorStop(1, "#7e1418");
  ctx.fillStyle = g;
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = "#f2e2c4";
  ctx.fillRect(w * 0.08, 0, w * 0.07, h);
  ctx.fillRect(w * 0.85, 0, w * 0.07, h);
  // Cream chevron band above the hem, following its point.
  const band = h * 0.07;
  const top = h * 0.72;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(w / 2, top + point);
  ctx.lineTo(w, top);
  ctx.lineTo(w, top + band);
  ctx.lineTo(w / 2, top + point + band);
  ctx.lineTo(0, top + band);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

/**
 * One glass panel of a Moroccan lantern's body: a brass frame round a
 * pointed-arch window (transparent, so the glowing core shows) crossed by a
 * fine brass lattice. Repeated once per face round the hexagonal body.
 */
const lanternPanel: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#b5893f";
  ctx.fillRect(0, 0, w, h);
  const inset = w * 0.12;
  const spring = h * 0.32;
  const window = new Path2D();
  window.moveTo(inset, h - inset);
  window.lineTo(inset, spring);
  window.quadraticCurveTo(inset, inset, w / 2, inset * 0.8);
  window.quadraticCurveTo(w - inset, inset, w - inset, spring);
  window.lineTo(w - inset, h - inset);
  window.closePath();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fill(window);
  ctx.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.clip(window);
  ctx.strokeStyle = "#a07330";
  ctx.lineWidth = w * 0.035;
  for (let k = -4; k <= 8; k++) {
    const x = (k / 4) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h * 0.6, h);
    ctx.moveTo(x, 0);
    ctx.lineTo(x - h * 0.6, h);
    ctx.stroke();
  }
  ctx.restore();
};

/**
 * Pierced brass for Moroccan lanterns: an opaque brass sheet cut with rows of
 * eight-point stars and drops (transparent), wrapping round the body (u).
 */
const lanternPierce: Painter = (ctx, w, h) => {
  ctx.fillStyle = "#b5893f";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(90,60,20,0.6)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= h; y += h / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "destination-out";
  const cols = 8;
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = ((c + (r % 2) * 0.5 + 0.25) / cols) * w;
      const cy = ((r + 0.5) / rows) * h;
      const rad = (w / cols) * 0.3;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const rr = k % 2 === 0 ? rad : rad * 0.55;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 1.2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + w / cols / 2, cy + (h / rows) * 0.42, rad * 0.22, rad * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";
};

const PAINTERS = {
  stoneTiles: [1024, 1024, stoneTiles],
  rug: [256, 1024, rug],
  kilim: [256, 512, kilim],
  carvedClay: [512, 256, carvedClay],
  marble: [512, 512, marble],
  cloud: [256, 128, cloud],
  hallFloor: [2048, 2048, hallFloor],
  hallBanner: [256, 768, hallBanner],
  nicheGlow: [128, 256, nicheGlow],
  timberBoards: [512, 256, timberBoards],
  lightRay: [64, 256, lightRay],
  coveGlow: [16, 128, coveGlow],
  glowSpot: [128, 128, glowSpot],
  gateBanner: [256, 1024, gateBanner],
  lanternPierce: [512, 256, lanternPierce],
  lanternPanel: [128, 256, lanternPanel],
} as const;

export type ProceduralTextureName = keyof typeof PAINTERS;

/** A procedural texture, cloned so each surface can set its own repeat. */
export function useProceduralTexture(name: ProceduralTextureName, repeatX = 1, repeatY = 1): Texture {
  return useMemo(() => {
    const [w, h, painter] = PAINTERS[name];
    const tex = paint(name, w, h, painter).clone();
    tex.repeat.set(repeatX, repeatY);
    return tex;
  }, [name, repeatX, repeatY]);
}

// ---------------------------------------------------------------------------
// Embroidered fabric (one texture per colourway)

/**
 * Woven fabric in `base` with embroidery in `thread`: a scalloped hem band of
 * stepped diamonds and dots, a vine of small flowers above it, a beaded
 * waist band and a scatter of tiny motifs over the skirt. The texture is laid
 * out for LatheGeometry UVs: u runs around the garment, v from hem (0) to
 * neck (1). `hemV`/`waistV` place the bands.
 */
function paintEmbroidery(base: string, thread: string, hemV: number, waistV: number): CanvasTexture {
  const key = `fabric:${base}:${thread}:${hemV}:${waistV}`;
  return paint(key, 1024, 512, (ctx, w, h, rand) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Weave: fine cross-hatch.
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = `rgba(0,0,0,${0.03 + rand() * 0.03})`;
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.02 + rand() * 0.02})`;
      ctx.fillRect(x, 0, 1, h);
    }
    const Y = (v: number) => h - v * h; // canvas y for a v coordinate
    ctx.fillStyle = thread;
    ctx.strokeStyle = thread;

    // Hem band: two rules with stepped diamonds between.
    const hemY = Y(hemV);
    ctx.fillRect(0, hemY - 4, w, 3);
    ctx.fillRect(0, hemY - 30, w, 2);
    for (let x = 12; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, hemY - 26);
      ctx.lineTo(x + 8, hemY - 17);
      ctx.lineTo(x, hemY - 8);
      ctx.lineTo(x - 8, hemY - 17);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 14, hemY - 17, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Flower vine above the hem.
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) ctx.lineTo(x, hemY - 52 + Math.sin(x / 18) * 6);
    ctx.stroke();
    for (let x = 18; x < w; x += 36) {
      const y = hemY - 52 + Math.sin(x / 18) * 6 - 10;
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Beaded waist band.
    const waistY = Y(waistV);
    ctx.fillRect(0, waistY - 2, w, 2);
    ctx.fillRect(0, waistY + 8, w, 2);
    for (let x = 6; x < w; x += 10) {
      ctx.beginPath();
      ctx.arc(x, waistY + 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    // Scattered motifs on the skirt.
    for (let i = 0; i < 70; i++) {
      const x = rand() * w;
      const y = waistY + 24 + rand() * (hemY - 90 - waistY - 24);
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + 3, y);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x - 3, y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });
}

/** Embroidered fabric texture for a garment colourway. */
export function useFabricTexture(base: string, thread: string, hemV = 0.06, waistV = 0.58): Texture {
  return useMemo(() => paintEmbroidery(base, thread, hemV, waistV), [base, thread, hemV, waistV]);
}
