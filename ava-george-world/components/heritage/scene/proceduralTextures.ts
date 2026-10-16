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

/** Pale limestone floor: a 4×4 grid of slightly varied tiles with grout. */
const stoneTiles: Painter = (ctx, w, h, rand) => {
  const n = 4;
  const s = w / n;
  ctx.fillStyle = "#d7b892";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const l = 85 + rand() * 6;
      ctx.fillStyle = `hsl(${30 + rand() * 6}, ${52 + rand() * 12}%, ${l}%)`;
      ctx.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
    }
  }
  speckle(ctx, w, h, rand, 9000, 0.12);
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
  ctx.fillStyle = "#9c2b22";
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
  stoneTiles: [512, 512, stoneTiles],
  rug: [256, 1024, rug],
  kilim: [256, 512, kilim],
  carvedClay: [512, 256, carvedClay],
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
