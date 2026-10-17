"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Object3D, PerspectiveCamera, SpotLight, Vector3 } from "three";
import { CAMERA_STATIONS, PORTRAIT_ASPECT, type CameraStation } from "../config";
import type { ScrollProgress } from "../hooks/useScrollProgress";
import { createCameraPath, snapToStation } from "./cameraPath";

/** Widest lens we ever use, so stacked multipliers can't fisheye on tall phones. */
const MAX_FOV = 74;

/** Wider lens on narrow / portrait screens so the courtyard doesn't feel cramped. */
function fovForAspect(aspect: number): number {
  if (aspect >= 1.3) return 40;
  if (aspect >= 1) return 46;
  if (aspect >= 0.7) return 52;
  return 58;
}

/**
 * On landscape screens the camera looks slightly left of the subject so the
 * garment sits right of centre, leaving the left side for overlay copy.
 */
const LANDSCAPE_FRAMING_OFFSET = 0.8;
const UP = new Vector3(0, 1, 0);

interface CameraRigProps {
  progress: { current: ScrollProgress };
  reducedMotion: boolean;
}

/**
 * Drives the default camera along the scroll-linked path every frame, and
 * carries a soft "exhibition" spotlight that hangs above and in front of
 * whatever the camera is framing. It fades out for wide shots (the hero),
 * so only close framings of a look are lit. One light for the whole walk.
 */
export function CameraRig({ progress, reducedMotion }: CameraRigProps) {
  const paths = useMemo(
    () => ({
      landscape: createCameraPath(CAMERA_STATIONS),
      portrait: createCameraPath(CAMERA_STATIONS.map((s): CameraStation => ({ ...s, ...s.portrait }))),
    }),
    [],
  );
  const position = useRef(new Vector3());
  const target = useRef(new Vector3());
  const right = useRef(new Vector3());
  const spot = useRef<SpotLight>(null);
  const spotTarget = useMemo(() => new Object3D(), []);
  const subject = useRef(new Vector3());
  const toCamera = useRef(new Vector3());

  useFrame(({ camera, clock, size }) => {
    const lens = camera as PerspectiveCamera;
    const aspect = size.width / size.height;
    const path = aspect < PORTRAIT_ASPECT ? paths.portrait : paths.landscape;
    const raw = progress.current.value;
    const t = reducedMotion ? snapToStation(raw, path.segments) : raw;
    const lensScale = path.sample(t, position.current, target.current);
    subject.current.copy(target.current);

    const fov = Math.min(fovForAspect(aspect) * lensScale, MAX_FOV);
    if (Math.abs(lens.fov - fov) > 1e-3) {
      lens.fov = fov;
      lens.updateProjectionMatrix();
    }

    if (aspect > 1.1) {
      right.current.subVectors(target.current, position.current).cross(UP).normalize();
      target.current.addScaledVector(right.current, -LANDSCAPE_FRAMING_OFFSET);
    }

    if (!reducedMotion) {
      // Barely-there handheld breathing so still frames feel alive.
      position.current.y += Math.sin(clock.elapsedTime * 0.6) * 0.012;
    }

    lens.position.copy(position.current);
    lens.lookAt(target.current);

    const light = spot.current;
    if (light) {
      const distance = subject.current.distanceTo(position.current);
      toCamera.current.subVectors(position.current, subject.current).setY(0).normalize();
      light.position.copy(subject.current).addScaledVector(toCamera.current, 1.6).setY(subject.current.y + 2.6);
      spotTarget.position.copy(subject.current).setY(subject.current.y - 0.2);
      spotTarget.updateMatrixWorld();
      light.intensity = 26 * (1 - MathUtils.smoothstep(distance, 6.5, 9));
    }
  });

  return (
    <>
      <primitive object={spotTarget} />
      <spotLight
        ref={spot}
        target={spotTarget}
        color="#ffe3bd"
        intensity={0}
        distance={8}
        angle={0.42}
        penumbra={0.85}
        decay={2}
      />
    </>
  );
}
