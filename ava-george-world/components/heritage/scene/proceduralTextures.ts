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

const PAINTERS = {
  stoneTiles: [1024, 1024, stoneTiles],
  rug: [256, 1024, rug],
  kilim: [256, 512, kilim],
  carvedClay: [512, 256, carvedClay],
  marble: [512, 512, marble],
  cloud: [256, 128, cloud],
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
