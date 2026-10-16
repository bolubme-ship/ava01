"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, type MeshStandardMaterialParameters } from "three";
import { useAmbientMotion } from "./motion";

interface WindUniforms {
  uTime: { value: number };
  uStrength: { value: number };
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
 */
export function useWindMaterial(params: MeshStandardMaterialParameters, strength = 0.02) {
  const animate = useAmbientMotion();

  const { material, uniforms } = useMemo(() => {
    const uniforms: WindUniforms = { uTime: { value: 0 }, uStrength: { value: strength } };
    const material = new MeshStandardMaterial(params);
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uStrength = uniforms.uStrength;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform float uStrength;")
        .replace(
          "#include <project_vertex>",
          `vec4 mvPosition = vec4( transformed, 1.0 );
          #ifdef USE_INSTANCING
            mvPosition = instanceMatrix * mvPosition;
            vec3 anchor = instanceMatrix[3].xyz;
            float phase = anchor.x * 1.7 + anchor.y * 2.3 + anchor.z * 1.1;
            mvPosition.x += sin(uTime * 1.6 + phase) * uStrength;
            mvPosition.y += sin(uTime * 2.1 + phase * 1.3) * uStrength * 0.5;
            mvPosition.z += cos(uTime * 1.3 + phase) * uStrength;
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
