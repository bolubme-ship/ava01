"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, type MeshStandardMaterialParameters } from "three";
import { useAmbientMotion } from "./motion";

interface WindUniforms {
  uTime: { value: number };
  uStrength: { value: number };
  uRooted: { value: number };
}

function advance(uniforms: WindUniforms, delta: number) {
  uniforms.uTime.value += delta;
}

/**
 * A standard material whose instances flutter in a light breeze. The
 * displacement (in metres, `strength` = amplitude) is applied in the vertex
 * shader after the instance transform and phased by each instance's
 * position, so thousands of blossoms or leaves move independently for free.
 * Only meaningful on InstancedMesh.
 *
 * `rooted` pins the base of each card (geometry y = 0) and lets the sway
 * grow towards its top (y = 1), for whole trees standing on the ground.
 */
export function useWindMaterial(params: MeshStandardMaterialParameters, strength = 0.02, rooted = false) {
  const animate = useAmbientMotion();

  const { material, uniforms } = useMemo(() => {
    const uniforms: WindUniforms = { uTime: { value: 0 }, uStrength: { value: strength }, uRooted: { value: rooted ? 1 : 0 } };
    const material = new MeshStandardMaterial(params);
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uStrength = uniforms.uStrength;
      shader.uniforms.uRooted = uniforms.uRooted;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uStrength;\nuniform float uRooted;")
        .replace(
          "#include <project_vertex>",
          `vec4 mvPosition = vec4( transformed, 1.0 );
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
            vec3 anchor = instanceMatrix[3].xyz;
            float phase = anchor.x * 1.7 + anchor.y * 2.3 + anchor.z * 1.1;
            float rise = clamp(position.y, 0.0, 1.0);
            float sway = uStrength * mix(1.0, rise * rise, uRooted);
            mvPosition.x += sin(uTime * 1.6 + phase) * sway;
            mvPosition.y += sin(uTime * 2.1 + phase * 1.3) * sway * 0.5;
            mvPosition.z += cos(uTime * 1.3 + phase) * sway;
          #endif
          mvPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * mvPosition;`,
        );
    };
    return { material, uniforms };
    // Material parameters are fixed for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (animate) advance(uniforms, delta);
  });

  return material;
}
