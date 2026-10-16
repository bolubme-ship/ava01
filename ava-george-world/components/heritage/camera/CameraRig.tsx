"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { CAMERA_STATIONS } from "../config";
import type { ScrollProgress } from "../hooks/useScrollProgress";
import { createCameraPath, snapToStation } from "./cameraPath";

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

/** Drives the default camera along the scroll-linked path every frame. */
export function CameraRig({ progress, reducedMotion }: CameraRigProps) {
  const path = useMemo(() => createCameraPath(CAMERA_STATIONS), []);
  const position = useRef(new Vector3());
  const target = useRef(new Vector3());
  const right = useRef(new Vector3());

  useFrame(({ camera, clock, size }) => {
    const lens = camera as PerspectiveCamera;
    const aspect = size.width / size.height;
    const fov = fovForAspect(aspect);
    if (lens.fov !== fov) {
      lens.fov = fov;
      lens.updateProjectionMatrix();
    }

    const raw = progress.current.value;
    const t = reducedMotion ? snapToStation(raw, path.segments) : raw;
    path.sample(t, position.current, target.current);

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
  });

  return null;
}
