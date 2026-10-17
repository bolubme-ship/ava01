"use client";

import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from "three";

/*
 * Photographic texture assets (generated with Higgsfield, optimised to WebP)
 * live in public/textures/heritage. The base path is configurable so the
 * same scene works when the site is served from a sub-path or a preview.
 */
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "/";

export const HERITAGE_TEXTURES = {
  plaster: "textures/heritage/plaster.webp",
  plasterNormal: "textures/heritage/plaster-normal.webp",
  limestone: "textures/heritage/limestone.webp",
  limestoneNormal: "textures/heritage/limestone-normal.webp",
  rug: "textures/heritage/rug.webp",
  oliveBranch: "textures/heritage/olive-branch.webp",
  bougainvillea: "textures/heritage/bougainvillea.webp",
  agave: "textures/heritage/agave.webp",
  carvedClay: "textures/heritage/carved-clay.webp",
  carvedClayNormal: "textures/heritage/carved-clay-normal.webp",
  kilim: "textures/heritage/kilim.webp",
  sky: "textures/heritage/sky.webp",
  ivy: "textures/heritage/ivy.webp",
  lemonTree: "textures/heritage/lemon-tree.webp",
  palm: "textures/heritage/palm.webp",
  geranium: "textures/heritage/geranium.webp",
  fern: "textures/heritage/fern.webp",
  monstera: "textures/heritage/monstera.webp",
  birdOfParadise: "textures/heritage/bird-of-paradise.webp",
  leafShadow: "textures/heritage/leaf-shadow.webp",
} as const;

export type HeritageTextureName = keyof typeof HERITAGE_TEXTURES;

/**
 * Loads a heritage texture (suspends until ready) and returns a copy with
 * its own repeat. Colour maps are sRGB; maps whose name ends in "Normal"
 * stay linear, as normal data must.
 */
export function useHeritageTexture(name: HeritageTextureName, repeatX = 1, repeatY = repeatX): Texture {
  const base = useLoader(TextureLoader, ASSET_BASE + HERITAGE_TEXTURES[name]);
  return useMemo(() => {
    const tex = base.clone();
    if (!name.endsWith("Normal")) tex.colorSpace = SRGBColorSpace;
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.anisotropy = 8;
    tex.repeat.set(repeatX, repeatY);
    tex.needsUpdate = true;
    return tex;
  }, [base, name, repeatX, repeatY]);
}
