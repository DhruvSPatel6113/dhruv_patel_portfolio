import * as THREE from 'three';

export interface ArmPose {
  turretYaw: number;
  shoulderPitch: number;
  elbowPitch: number;
  wristPitch: number;
  gripperOpen: number;
}

export function getArmLayout(viewport: { width: number; height: number }) {
  return {
    baseScale: Math.min(viewport.height * 0.23, viewport.width * 0.145),
    homeBaseX: viewport.width * 0.27,
    floorY: -viewport.height * 0.5,
    restPose: {
      turretYaw: 0,
      shoulderPitch: -0.15,
      elbowPitch: 1.05,
      wristPitch: -0.35,
      gripperOpen: 0.35,
    } as ArmPose,
  };
}

export function createFacetedLinkGeometry(points: [number, number][], depth: number, bevel = 0.05) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], idx) => {
    if (idx === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

export const TURRET_SHROUD_POINTS: [number, number][] = [
  [-0.42, 0.0],
  [0.36, 0.0],
  [0.44, 0.35],
  [0.24, 0.92],
  [-0.18, 0.96],
  [-0.46, 0.42],
];

export const UPPER_BOOM_POINTS: [number, number][] = [
  [-0.26, -0.15],
  [0.26, -0.15],
  [0.34, 0.6],
  [0.2, 1.56],
  [-0.2, 1.56],
  [-0.32, 0.66],
];

export const FOREARM_POINTS: [number, number][] = [
  [-0.24, -0.12],
  [0.24, -0.12],
  [0.28, 0.5],
  [0.18, 1.32],
  [-0.18, 1.32],
  [-0.26, 0.52],
];
