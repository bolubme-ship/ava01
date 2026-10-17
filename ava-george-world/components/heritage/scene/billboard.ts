"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, DoubleSide, MeshBasicMaterial, MeshDepthMaterial, RGBADepthPacking, type Texture } from "three";
import { PALETTE } from "../config";
import { useAmbientMotion } from "./motion";

/*
 * Materials for photographed trees drawn as instanced billboards: each
 * instance is one upright card that turns about its trunk to face whoever
 * is looking (the camera, or the sun when shadows are drawn), so the photo
 * is never seen edge-on or doubled up. The card is unlit, keeping the
 * photo's own golden-hour light instead of lighting it twice, and fades
 * towards the warm haze with distance so far trees sit back in the air.
 * The canopy sways while the trunk stays rooted. Expects a unit card
 * standing on its bottom edge (x in -0.5..0.5, y in 0..1).
 */

interface BillboardUniforms {
  uTime: { value: number };
  uStrength: { value: number };
  uHazeColor: { value: Color };
}

function advance(uniforms: BillboardUniforms, delta: number) {
  uniforms.uTime.value += delta;
}

/** Turns each instance's card to face the viewer and sways its top. */
const BILLBOARD_VERTEX = `
  vec3 anchor = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
  float width = length(instanceMatrix[0].xyz);
  float height = length(instanceMatrix[1].xyz);
  vec3 toEye = cameraPosition - anchor;
  toEye.y = 0.0;
  toEye = length(toEye) > 1e-4 ? normalize(toEye) : vec3(0.0, 0.0, 1.0);
  vec3 across = vec3(toEye.z, 0.0, -toEye.x);
  float rise = clamp(position.y, 0.0, 1.0);
  float phase = anchor.x * 1.7 + anchor.z * 1.1;
  float sway = uStrength * rise * rise;
  vec3 billboardPosition = anchor + across * (position.x * width) + vec3(0.0, position.y * height, 0.0);
  billboardPosition.x += sin(uTime * 1.1 + phase) * sway;
  billboardPosition.z += cos(uTime * 0.9 + phase) * sway;
  vec4 mvPosition = viewMatrix * vec4(billboardPosition, 1.0);
  gl_Position = projectionMatrix * mvPosition;
`;

/** Haze strength by view distance (metres) and its maximum. */
const HAZE_NEAR = 8;
const HAZE_FAR = 45;
const HAZE_MAX = 0.14;

export function useBillboardMaterials(map: Texture, sway = 0.12) {
  const animate = useAmbientMotion();

  const { material, depthMaterial, uniforms } = useMemo(() => {
    const uniforms: BillboardUniforms = {
      uTime: { value: 0 },
      uStrength: { value: sway },
      uHazeColor: { value: new Color(PALETTE.haze) },
    };
    const header = "#include <common>\nuniform float uTime;\nuniform float uStrength;";

    const material = new MeshBasicMaterial({
      map,
      // A firm cut-out edge: softer edges (alpha to coverage) let a pale
      // rim of the bright sky show round every leaf.
      alphaTest: 0.5,
      side: DoubleSide,
      color: "#f6eee2",
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `${header}\nvarying float vHaze;`)
        .replace(
          "#include <project_vertex>",
          `${BILLBOARD_VERTEX}\nvHaze = ${HAZE_MAX.toFixed(2)} * smoothstep(${HAZE_NEAR.toFixed(1)}, ${HAZE_FAR.toFixed(1)}, -mvPosition.z);`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uHazeColor;\nvarying float vHaze;")
        .replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uHazeColor, vHaze);");
    };

    // Shadows use the same turning card, so they match the silhouette the sun sees.
    const depthMaterial = new MeshDepthMaterial({ map, alphaTest: 0.5, depthPacking: RGBADepthPacking });
    depthMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", header)
        .replace("#include <project_vertex>", BILLBOARD_VERTEX);
    };
    return { material, depthMaterial, uniforms };
    // Created once per texture; sway is fixed for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useFrame((_, delta) => {
    if (animate) advance(uniforms, delta);
  });

  return { material, depthMaterial };
}
