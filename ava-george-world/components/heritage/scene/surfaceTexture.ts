"use client";

import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";

/** Small deterministic PRNG so the texture is identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let baseTexture: CanvasTexture | null = null;

/**
 * Procedural lime-plaster / packed-earth grain: near-white with soft blotches
 * and speckles. Used as a colour multiplier and bump map so flat geometry
 * reads as a hand-finished surface, without loading any image files.
 */
function getBaseTexture(): CanvasTexture {
  if (baseTexture) return baseTexture;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(7);

  ctx.fillStyle = "#ece6dc";
  ctx.fillRect(0, 0, size, size);

  // Soft trowel blotches (drawn 3x3 so they tile seamlessly).
  for (let i = 0; i < 70; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 10 + rand() * 38;
    const light = rand() > 0.5;
    const alpha = 0.04 + rand() * 0.07;
    for (let ox = -size; ox <= size; ox += size) {
      for (let oy = -size; oy <= size; oy += size) {
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
        g.addColorStop(0, light ? `rgba(255,252,245,${alpha})` : `rgba(120,95,70,${alpha})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
      }
    }
  }

  // Fine grit.
  for (let i = 0; i < 5000; i++) {
    const v = rand() > 0.5 ? 255 : 90;
    ctx.fillStyle = `rgba(${v},${v * 0.9},${v * 0.8},${0.05 + rand() * 0.08})`;
    ctx.fillRect(rand() * size, rand() * size, 1, 1);
  }

  baseTexture = new CanvasTexture(canvas);
  baseTexture.colorSpace = SRGBColorSpace;
  baseTexture.wrapS = baseTexture.wrapT = RepeatWrapping;
  baseTexture.anisotropy = 4;
  return baseTexture;
}

/** Plaster texture repeated `repeatX` x `repeatY` times across a surface's UVs. */
export function useSurfaceTexture(repeatX: number, repeatY = repeatX): Texture {
  return useMemo(() => {
    const tex = getBaseTexture().clone();
    tex.repeat.set(repeatX, repeatY);
    return tex;
  }, [repeatX, repeatY]);
}
