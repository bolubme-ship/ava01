# Heritage scene: assets needed to match the reference

The courtyard is built entirely from code (procedural geometry and textures
drawn at load time). That keeps it light and fully interactive, but a few
things in the reference image are photographic and need real assets to match.
Each item below names the component it would replace.

## Brand

| Asset | Format | Replaces |
|---|---|---|
| Official Ava & George logo | SVG (or transparent PNG @2x) | Interim coloured wordmark in `ui/SiteHeader.tsx` (`Logo`) |
| Brand fonts, if the logo/heading faces are licensed | WOFF2 | Fredoka (logo) and Cormorant Garamond (headings) |

## Clothing (highest impact)

| Asset | Format | Replaces |
|---|---|---|
| One 3D model per outfit (10 looks), on or off a dress form | GLB with PBR textures (albedo, normal, roughness; sheen if available), < 3 MB each, Draco-compressed | `DressForm` in `scene/DisplayPedestal.tsx` (the procedural dresses with embroidered bands are stand-ins) |
| Close-up photos or flat scans of each outfit's fabric and embroidery | 2K PNG/JPG | `useFabricTexture` in `proceduralTextures.ts`, if models aren't ready yet |
| Or, if 3D isn't available yet: a clean cut-out photo per outfit, front view | Transparent PNG/WebP, ~1500 px tall | Shown on a camera-facing card on each plinth |

## Environment

| Asset | Format | Replaces |
|---|---|---|
| Golden-hour HDRI (sunny courtyard / Mediterranean) | `.hdr` 2K, from e.g. Poly Haven (CC0) | `SkyDome` + hemisphere light; gives realistic reflections and bounce light |
| Lime-plaster wall texture set | 2K PBR (albedo, normal, roughness) | `surfaceTexture.ts` |
| Limestone floor tile texture set | 2K PBR | `stoneTiles` in `proceduralTextures.ts` |
| Red runner rug design (the brand's own pattern, ideally) | 2K albedo + normal, tileable along its length | `rug` in `proceduralTextures.ts` |
| Kilim / textile artwork for the wall hangings (your fabric prints would be ideal) | 1K–2K PNG | `kilim` in `proceduralTextures.ts` |

## Planting and props

| Asset | Format | Replaces |
|---|---|---|
| Bougainvillea climber (a few variants) | GLB with alpha-cut leaf cards | `Bougainvillea` in `scene/Planting.tsx` |
| Potted olive tree | GLB, < 2 MB | `OliveTree` |
| Potted fern / palm, flowering shrub | GLB | `PottedPlant`, `FloweringShrub` |
| Carved terracotta pots (2–3 shapes) | GLB or PBR texture for the existing lathe shapes | `CarvedPot` |
| Wall lantern | GLB | `WallSconce` in `scene/Fabrics.tsx` |

Sources that license for commercial use: Poly Haven (CC0), Sketchfab
(check each licence), Quixel Megascans (Fab), or a commissioned 3D artist for
the garments.

## Performance budget

Aim for under ~25 MB total for the whole walk, with models Draco/Meshopt
compressed and textures in KTX2. Swapping one component at a time keeps the
scroll and camera code untouched.
