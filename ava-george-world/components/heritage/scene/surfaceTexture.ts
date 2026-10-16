"use client";

import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { mulberry32 } from "./random";

let baseTexture: CanvasTexture | null = null;

/**
 * Procedural lime-wash over earth plaster: a near-white base (tinted by each
 * material's colour) with broad warm/cool mottling, trowel sweeps, hairline
 * cracks and fine grit. Used as colour and bump map so flat geometry reads
 * as a hand-finished terracotta surface, without loading any image files.
 */
function getBaseTexture(): CanvasTexture {
  if (baseTexture) return baseTexture;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(7);

  ctx.fillStyle = "#efe6da";
  ctx.fillRect(0, 0, size, size);

  /** Draws `fn` at the 9 tile offsets so marks wrap seamlessly. */
  const tiled = (fn: (ox: number, oy: number) => void) => {
    for (let ox = -size; ox <= size; ox += size) for (let oy = -size; oy <= size; oy += size) fn(ox, oy);
  };

  // Broad mottling: sun-bleached and damp-darkened patches.
  for (let i = 0; i < 110; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 20 + rand() * 90;
    const light = rand() > 0.45;
    const alpha = 0.05 + rand() * 0.1;
    tiled((ox, oy) => {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, light ? `rgba(255,250,240,${alpha})` : `rgba(120,70,40,${alpha})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    });
  }

  // Trowel sweeps: long, faint arcs.
  ctx.lineCap = "round";
  for (let i = 0; i < 60; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 30 + rand() * 70;
    const a = rand() * Math.PI * 2;
    const light = rand() > 0.5;
    ctx.strokeStyle = light ? "rgba(255,248,236,0.12)" : "rgba(110,65,35,0.08)";
    ctx.lineWidth = 6 + rand() * 14;
    tiled((ox, oy) => {
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, r, a, a + 0.6 + rand() * 0.6);
      ctx.stroke();
    });
  }

  // Hairline cracks.
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    let x = rand() * size;
    let y = rand() * size;
    ctx.strokeStyle = `rgba(80,45,25,${0.18 + rand() * 0.15})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      x += (rand() - 0.5) * 22;
      y += 4 + rand() * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Fine grit.
  for (let i = 0; i < 16000; i++) {
    const v = rand() > 0.5 ? 255 : 90;
    ctx.fillStyle = `rgba(${v},${v * 0.9},${v * 0.8},${0.04 + rand() * 0.08})`;
    ctx.fillRect(rand() * size, rand() * size, 1, 1);
  }

  baseTexture = new CanvasTexture(canvas);
  baseTexture.colorSpace = SRGBColorSpace;
  baseTexture.wrapS = baseTexture.wrapT = RepeatWrapping;
  baseTexture.anisotropy = 8;
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
