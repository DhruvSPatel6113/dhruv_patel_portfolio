'use client';

import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { sound } from '@/utils/audio';
import {
  getArmLayout,
  createFacetedLinkGeometry,
  TURRET_SHROUD_POINTS,
  UPPER_BOOM_POINTS,
  FOREARM_POINTS,
} from '@/sections/hero/armLayout';

interface RobotLoaderProps {
  onComplete?: () => void;
  siteRef?: React.RefObject<HTMLDivElement>;
}

type LoaderPhase = 'assembling' | 'hold' | 'docking';

const OVERHEAD_CAM_POS = new THREE.Vector3(0, 7.6, 2.2);
const FRONT_CAM_POS = new THREE.Vector3(0, 0, 5.5);

function StudioEnvironment({ intensity = 0.42 }: { intensity?: number }) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envRT = pmrem.fromScene(room, 0.04);
    scene.environment = envRT.texture;
    scene.environmentIntensity = intensity;

    return () => {
      scene.environment = null;
      envRT.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, intensity]);

  return null;
}

function smoothStep(t: number) {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

function evalPickPlace(
  progress: number,
  startP: number,
  endP: number,
  from: [number, number, number],
  to: [number, number, number],
  home: [number, number, number]
): {
  gripPos: [number, number, number];
  carryAlpha: number;
  isCarrying: boolean;
  placed: boolean;
  jawOpen: number;
} {
  if (progress <= startP) {
    return { gripPos: home, carryAlpha: 0, isCarrying: false, placed: false, jawOpen: 1 };
  }
  if (progress >= endP) {
    return { gripPos: home, carryAlpha: 1, isCarrying: false, placed: true, jawOpen: 1 };
  }

  const u = (progress - startP) / (endP - startP);
  if (u < 0.22) {
    const t = smoothStep(u / 0.22);
    return {
      gripPos: [
        THREE.MathUtils.lerp(home[0], from[0], t),
        THREE.MathUtils.lerp(home[1], from[1] + 0.16, t) + Math.sin(t * Math.PI) * 0.4,
        THREE.MathUtils.lerp(home[2], from[2], t),
      ],
      carryAlpha: 0,
      isCarrying: false,
      placed: false,
      jawOpen: u > 0.17 ? 0.1 : 1,
    };
  }
  if (u < 0.78) {
    const t = smoothStep((u - 0.22) / 0.56);
    const arcY = Math.sin(t * Math.PI) * 1.05;
    return {
      gripPos: [
        THREE.MathUtils.lerp(from[0], to[0], t),
        THREE.MathUtils.lerp(from[1], to[1], t) + arcY + 0.16,
        THREE.MathUtils.lerp(from[2], to[2], t),
      ],
      carryAlpha: t,
      isCarrying: true,
      placed: false,
      jawOpen: 0.1,
    };
  }
  const t = smoothStep((u - 0.78) / 0.22);
  return {
    gripPos: [
      THREE.MathUtils.lerp(to[0], home[0], t),
      THREE.MathUtils.lerp(to[1] + 0.16, home[1], t) + Math.sin(t * Math.PI) * 0.4,
      THREE.MathUtils.lerp(to[2], home[2], t),
    ],
    carryAlpha: 1,
    isCarrying: false,
    placed: true,
    jawOpen: 1,
  };
}

// ============================================================================
// 3dviz-pro-max SCULPTED 3-DOF PICK-AND-PLACE ASSEMBLY ARM
// ============================================================================
function PickPlaceArm({
  basePos,
  targetRef,
  scale,
  graphiteMat,
  silverMat,
  accentMat,
  darkMat,
}: {
  basePos: [number, number, number];
  targetRef: React.MutableRefObject<{ pos: [number, number, number]; jawOpen: number }>;
  scale: number;
  graphiteMat: THREE.Material;
  silverMat: THREE.Material;
  accentMat: THREE.Material;
  darkMat: THREE.Material;
}) {
  const turretRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const jawLRef = useRef<THREE.Mesh>(null);
  const jawRRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const { pos, jawOpen } = targetRef.current;
    const [tx, ty, tz] = pos;
    const dx = (tx - basePos[0]) / scale;
    const dz = (tz - basePos[2]) / scale;
    const dy = (ty - (basePos[1] + 0.44 * scale)) / scale;

    const yaw = Math.atan2(dx, dz);
    const horiz = Math.hypot(dx, dz);

    const L1 = 1.85;
    const L2 = 1.85;
    const dist = THREE.MathUtils.clamp(Math.hypot(horiz, dy), 0.45, (L1 + L2) * 0.96);
    const cosElbow = THREE.MathUtils.clamp((dist * dist - L1 * L1 - L2 * L2) / (2 * L1 * L2), -0.96, 0.96);
    const elbowAng = Math.acos(cosElbow);
    const angleToTarget = Math.atan2(horiz, dy);
    const alpha = Math.atan2(L2 * Math.sin(elbowAng), L1 + L2 * Math.cos(elbowAng));

    const goalShoulder = THREE.MathUtils.clamp(angleToTarget - alpha, -0.35, 1.5);
    const goalElbow = THREE.MathUtils.clamp(elbowAng, 0.25, 2.3);
    const goalWrist = Math.PI - goalShoulder - goalElbow;

    if (turretRef.current) turretRef.current.rotation.y = THREE.MathUtils.damp(turretRef.current.rotation.y, yaw, 9, delta);
    if (shoulderRef.current) shoulderRef.current.rotation.x = THREE.MathUtils.damp(shoulderRef.current.rotation.x, goalShoulder, 9, delta);
    if (elbowRef.current) elbowRef.current.rotation.x = THREE.MathUtils.damp(elbowRef.current.rotation.x, goalElbow, 9, delta);
    if (wristRef.current) wristRef.current.rotation.x = THREE.MathUtils.damp(wristRef.current.rotation.x, goalWrist, 11, delta);

    const jOff = 0.045 + jawOpen * 0.055;
    if (jawLRef.current) jawLRef.current.position.x = THREE.MathUtils.damp(jawLRef.current.position.x, -jOff, 12, delta);
    if (jawRRef.current) jawRRef.current.position.x = THREE.MathUtils.damp(jawRRef.current.position.x, jOff, 12, delta);
  });

  return (
    <group position={basePos} scale={scale}>
      {/* Grounded Pedestal + Bolt Collar */}
      <mesh position={[0, 0.16, 0]} material={graphiteMat} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.32, 20]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={silverMat}>
        <cylinderGeometry args={[0.25, 0.27, 0.06, 20]} />
      </mesh>
      <group ref={turretRef} position={[0, 0.44, 0]}>
        <mesh material={accentMat} castShadow>
          <cylinderGeometry args={[0.21, 0.23, 0.16, 18]} />
        </mesh>
        <group ref={shoulderRef} position={[0, 0.08, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={darkMat}>
            <cylinderGeometry args={[0.17, 0.17, 0.3, 16]} />
          </mesh>
          {/* Twin-spar upper link */}
          <mesh position={[-0.08, 0.92, 0]} material={silverMat} castShadow>
            <boxGeometry args={[0.07, 1.85, 0.2]} />
          </mesh>
          <mesh position={[0.08, 0.92, 0]} material={silverMat} castShadow>
            <boxGeometry args={[0.07, 1.85, 0.2]} />
          </mesh>
          <mesh position={[0, 0.92, 0]} material={graphiteMat}>
            <boxGeometry args={[0.1, 1.6, 0.12]} />
          </mesh>

          <group ref={elbowRef} position={[0, 1.85, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={accentMat}>
              <cylinderGeometry args={[0.14, 0.14, 0.28, 16]} />
            </mesh>
            <mesh position={[0, 0.92, 0]} material={silverMat} castShadow>
              <boxGeometry args={[0.14, 1.85, 0.16]} />
            </mesh>
            <mesh position={[0, 0.92, 0]} material={graphiteMat}>
              <boxGeometry args={[0.17, 1.2, 0.08]} />
            </mesh>

            <group ref={wristRef} position={[0, 1.85, 0]}>
              <mesh position={[0, 0.06, 0]} material={darkMat}>
                <cylinderGeometry args={[0.11, 0.13, 0.12, 14]} />
              </mesh>
              <mesh ref={jawLRef} position={[-0.08, 0.16, 0]} material={accentMat}>
                <boxGeometry args={[0.04, 0.16, 0.09]} />
              </mesh>
              <mesh ref={jawRRef} position={[0.08, 0.16, 0]} material={accentMat}>
                <boxGeometry args={[0.04, 0.16, 0.09]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ============================================================================
// 2-TABLE, 4-ARM SIMULTANEOUS ASSEMBLY CELL (ZERO NESTED OFFSET BUGS)
// ============================================================================
function TwoTableAssemblyCell({
  progress,
  dockProgress,
}: {
  progress: number;
  dockProgress: number;
}) {
  const { camera, size } = useThree();
  const perspCam = camera as THREE.PerspectiveCamera;

  const frontHeight = 2 * Math.tan((42 * Math.PI) / 360) * 5.5;
  const frontWidth = frontHeight * (size.width / Math.max(1, size.height));
  const { baseScale, homeBaseX, floorY, restPose } = getArmLayout({
    width: frontWidth,
    height: frontHeight,
  });

  const cellScale = Math.min(frontWidth * 0.095, 0.66);
  const tableX = 1.95 * cellScale;
  const armScale = cellScale * 0.58;

  const cellTablesRef = useRef<THREE.Group>(null);
  const rootArmRef = useRef<THREE.Group>(null);
  const railRef = useRef<THREE.Group>(null);

  // Independent sibling staging/transit module refs (world-space, never compounded!)
  const stgPedestalRef = useRef<THREE.Group>(null);
  const stgTurretRef = useRef<THREE.Group>(null);
  const stgBoomRef = useRef<THREE.Group>(null);
  const stgForearmRef = useRef<THREE.Group>(null);
  const stgWristRef = useRef<THREE.Group>(null);
  const stgLaserRef = useRef<THREE.Group>(null);

  // Assembled hierarchy visibility & joints inside rootArmRef (shown once placed on Table 2!)
  const asmPedestalRef = useRef<THREE.Group>(null);
  const asmTurretRef = useRef<THREE.Group>(null);
  const asmShoulderRef = useRef<THREE.Group>(null);
  const asmElbowRef = useRef<THREE.Group>(null);
  const asmWristRef = useRef<THREE.Group>(null);
  const asmLaserRef = useRef<THREE.Group>(null);
  const asmJawLRef = useRef<THREE.Mesh>(null);
  const asmJawRRef = useRef<THREE.Mesh>(null);

  // 4 Arm live target refs
  const arm1Target = useRef({ pos: [-0.65 * cellScale, 0.8 * cellScale, -1.75 * cellScale] as [number, number, number], jawOpen: 1 });
  const arm2Target = useRef({ pos: [-0.65 * cellScale, 0.8 * cellScale, 1.75 * cellScale] as [number, number, number], jawOpen: 1 });
  const arm3Target = useRef({ pos: [0.65 * cellScale, 0.8 * cellScale, -1.75 * cellScale] as [number, number, number], jawOpen: 1 });
  const arm4Target = useRef({ pos: [0.65 * cellScale, 0.8 * cellScale, 1.75 * cellScale] as [number, number, number], jawOpen: 1 });

  const silverArmor = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.58, roughness: 0.24, flatShading: true }),
    []
  );
  const lightTrim = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.4, roughness: 0.22, flatShading: true }),
    []
  );
  const graphiteChassis = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.55, roughness: 0.42, flatShading: true }),
    []
  );
  const darkRecess = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.6, roughness: 0.45 }),
    []
  );
  const reflectiveRailMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#1e293b',
        metalness: 0.85,
        roughness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 1.0,
      }),
    []
  );
  const crimsonAccent = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#b91c1c', metalness: 0.55, roughness: 0.24 }),
    []
  );
  const copperNozzle = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.85, roughness: 0.18 }),
    []
  );
  const laserEmitterMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#dc2626', emissiveIntensity: 2.6, roughness: 0.1 }),
    []
  );

  const turretShroudGeo = useMemo(() => createFacetedLinkGeometry(TURRET_SHROUD_POINTS, 0.54, 0.06), []);
  const upperBoomGeo = useMemo(() => createFacetedLinkGeometry(UPPER_BOOM_POINTS, 0.38, 0.055), []);
  const forearmGeo = useMemo(() => createFacetedLinkGeometry(FOREARM_POINTS, 0.3, 0.05), []);

  useEffect(() => {
    return () => {
      turretShroudGeo.dispose();
      upperBoomGeo.dispose();
      forearmGeo.dispose();
      silverArmor.dispose();
      lightTrim.dispose();
      graphiteChassis.dispose();
      darkRecess.dispose();
      reflectiveRailMat.dispose();
      crimsonAccent.dispose();
      copperNozzle.dispose();
      laserEmitterMat.dispose();
    };
  }, [
    turretShroudGeo,
    upperBoomGeo,
    forearmGeo,
    silverArmor,
    lightTrim,
    graphiteChassis,
    darkRecess,
    reflectiveRailMat,
    crimsonAccent,
    copperNozzle,
    laserEmitterMat,
  ]);

  const baseBolts = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);
  const gearTeeth = useMemo(() => Array.from({ length: 28 }, (_, i) => (i / 28) * Math.PI * 2), []);
  const drumSlots = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);

  useFrame((_, delta) => {
    const s = armScale;
    const trayY = 0.26 * cellScale;
    const benchArmBaseZ = 1.38 * cellScale;

    // 6 Staging Tray coordinates on Table 1 (Left)
    const trayPedestal: [number, number, number] = [-tableX - 0.42 * cellScale, trayY, 0.95 * cellScale];
    const trayTurret: [number, number, number] = [-tableX + 0.42 * cellScale, trayY, 0.95 * cellScale];
    const trayBoom: [number, number, number] = [-tableX - 0.42 * cellScale, trayY, 0];
    const trayForearm: [number, number, number] = [-tableX + 0.42 * cellScale, trayY, 0];
    const trayWrist: [number, number, number] = [-tableX - 0.42 * cellScale, trayY, -0.95 * cellScale];
    const trayLaser: [number, number, number] = [-tableX + 0.42 * cellScale, trayY, -0.95 * cellScale];

    // 6 Assembly target coordinates on Table 2 (Right, along -Z)
    const dstPedestal: [number, number, number] = [tableX, trayY + 0.24 * s, benchArmBaseZ];
    const dstTurret: [number, number, number] = [tableX, trayY + 0.24 * s, benchArmBaseZ - 0.58 * s];
    const dstBoom: [number, number, number] = [tableX, trayY + 0.24 * s, benchArmBaseZ - 1.36 * s];
    const dstForearm: [number, number, number] = [tableX, trayY + 0.24 * s, benchArmBaseZ - 2.88 * s];
    const dstWrist: [number, number, number] = [tableX, trayY + 0.24 * s, benchArmBaseZ - 4.18 * s];
    const dstLaser: [number, number, number] = [tableX, trayY + 0.24 * s, benchArmBaseZ - 4.58 * s];

    const home1: [number, number, number] = [-0.62 * cellScale, 0.85 * cellScale, -1.85 * cellScale];
    const home2: [number, number, number] = [-0.62 * cellScale, 0.85 * cellScale, 1.85 * cellScale];
    const home3: [number, number, number] = [0.62 * cellScale, 0.85 * cellScale, -1.85 * cellScale];
    const home4: [number, number, number] = [0.62 * cellScale, 0.85 * cellScale, 1.85 * cellScale];

    // 4 Arms working simultaneously in staggered parallel windows
    const pedJob = evalPickPlace(progress, 2, 42, trayPedestal, dstPedestal, home1);
    const turJob = evalPickPlace(progress, 44, 88, trayTurret, dstTurret, home1);
    arm1Target.current = progress < 43
      ? { pos: pedJob.gripPos, jawOpen: pedJob.jawOpen }
      : { pos: turJob.gripPos, jawOpen: turJob.jawOpen };

    const boomJob = evalPickPlace(progress, 8, 62, trayBoom, dstBoom, home2);
    arm2Target.current = { pos: boomJob.gripPos, jawOpen: boomJob.jawOpen };

    const foreJob = evalPickPlace(progress, 16, 74, trayForearm, dstForearm, home3);
    arm3Target.current = { pos: foreJob.gripPos, jawOpen: foreJob.jawOpen };

    const wristJob = evalPickPlace(progress, 22, 66, trayWrist, dstWrist, home4);
    const laserJob = evalPickPlace(progress, 68, 98, trayLaser, dstLaser, home4);
    arm4Target.current = progress < 67
      ? { pos: wristJob.gripPos, jawOpen: wristJob.jawOpen }
      : { pos: laserJob.gripPos, jawOpen: laserJob.jawOpen };

    // Sync independent world-space staging/transit modules vs assembled hierarchy
    const syncModule = (
      stgRef: React.RefObject<THREE.Group>,
      asmRef: React.RefObject<THREE.Group>,
      job: ReturnType<typeof evalPickPlace>,
      tray: [number, number, number]
    ) => {
      const placed = dockProgress > 0 || job.placed;
      if (stgRef.current) {
        stgRef.current.visible = !placed;
        if (!placed) {
          const wx = job.isCarrying ? job.gripPos[0] : tray[0];
          const wy = job.isCarrying ? job.gripPos[1] - 0.14 : tray[1];
          const wz = job.isCarrying ? job.gripPos[2] : tray[2];
          stgRef.current.position.set(wx, wy, wz);
          stgRef.current.rotation.set(-Math.PI / 2 * (0.4 + 0.6 * job.carryAlpha), 0, 0);
        }
      }
      if (asmRef.current) {
        asmRef.current.visible = placed;
      }
    };

    syncModule(stgPedestalRef, asmPedestalRef, pedJob, trayPedestal);
    syncModule(stgTurretRef, asmTurretRef, turJob, trayTurret);
    syncModule(stgBoomRef, asmShoulderRef, boomJob, trayBoom);
    syncModule(stgForearmRef, asmElbowRef, foreJob, trayForearm);
    syncModule(stgWristRef, asmWristRef, wristJob, trayWrist);
    syncModule(stgLaserRef, asmLaserRef, laserJob, trayLaser);

    const dockEase = smoothStep(dockProgress);

    if (rootArmRef.current) {
      rootArmRef.current.position.set(
        THREE.MathUtils.lerp(tableX, homeBaseX, dockEase),
        THREE.MathUtils.lerp(trayY + 0.24 * s, floorY, dockEase),
        THREE.MathUtils.lerp(benchArmBaseZ, 0, dockEase)
      );
      rootArmRef.current.rotation.set(THREE.MathUtils.lerp(-Math.PI / 2, 0, dockEase), 0, 0);
      rootArmRef.current.scale.setScalar(THREE.MathUtils.lerp(s, baseScale, dockEase));
    }

    if (asmTurretRef.current) asmTurretRef.current.rotation.y = restPose.turretYaw * dockEase;
    if (asmShoulderRef.current) asmShoulderRef.current.rotation.z = restPose.shoulderPitch * dockEase;
    if (asmElbowRef.current) asmElbowRef.current.rotation.z = restPose.elbowPitch * dockEase;
    if (asmWristRef.current) asmWristRef.current.rotation.z = restPose.wristPitch * dockEase;

    const jawOpen = THREE.MathUtils.lerp(1.0, restPose.gripperOpen, laserJob.placed ? 1 : laserJob.carryAlpha);
    const jawOffset = 0.085 + jawOpen * 0.04;
    if (asmJawLRef.current && asmJawRRef.current) {
      asmJawLRef.current.position.z = THREE.MathUtils.damp(asmJawLRef.current.position.z, jawOffset, 12, delta);
      asmJawRRef.current.position.z = THREE.MathUtils.damp(asmJawRRef.current.position.z, -jawOffset, 12, delta);
    }

    if (cellTablesRef.current) {
      cellTablesRef.current.position.y = THREE.MathUtils.lerp(0, -5.0, dockEase);
    }

    if (railRef.current) {
      railRef.current.position.set(0, THREE.MathUtils.lerp(floorY - 1.2, floorY + 0.04, dockEase), -0.05);
      railRef.current.visible = dockProgress > 0.02;
    }

    // Smooth camera swoop: Overhead Top View -> Hero Front View
    perspCam.position.lerpVectors(OVERHEAD_CAM_POS, FRONT_CAM_POS, dockEase);
    perspCam.fov = THREE.MathUtils.lerp(40, 42, dockEase);
    perspCam.lookAt(0, 0, 0);
    perspCam.updateProjectionMatrix();
  });

  const tableW = 2.05 * cellScale;
  const tableD = 3.25 * cellScale;

  return (
    <>
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.28}
        scale={14}
        blur={2.4}
        far={5}
        resolution={256}
        frames={1}
        color="#0f172a"
      />

      {/* 2 WORKTABLES + 4 SIMULTANEOUS PICK-AND-PLACE ARMS */}
      <group ref={cellTablesRef}>
        {/* TABLE 1: PARTS STAGING BENCH (LEFT) */}
        <group position={[-tableX, 0, 0]}>
          <mesh position={[0, 0.12 * cellScale, 0]} material={graphiteChassis} castShadow receiveShadow>
            <boxGeometry args={[tableW, 0.18 * cellScale, tableD]} />
          </mesh>
          <mesh position={[0, 0.22 * cellScale, 0]} material={darkRecess} receiveShadow>
            <boxGeometry args={[tableW * 0.9, 0.03 * cellScale, tableD * 0.92]} />
          </mesh>
          {[-0.42, 0.42].map((px) =>
            [-0.95, 0, 0.95].map((pz) => (
              <mesh
                key={`${px}_${pz}`}
                position={[px * cellScale, 0.24 * cellScale, pz * cellScale]}
                material={silverArmor}
              >
                <boxGeometry args={[0.56 * cellScale, 0.025 * cellScale, 0.68 * cellScale]} />
              </mesh>
            ))
          )}
        </group>

        {/* TABLE 2: PRECISION ASSEMBLY BENCH (RIGHT) */}
        <group position={[tableX, 0, 0]}>
          <mesh position={[0, 0.12 * cellScale, 0]} material={graphiteChassis} castShadow receiveShadow>
            <boxGeometry args={[tableW, 0.18 * cellScale, tableD]} />
          </mesh>
          <mesh position={[0, 0.22 * cellScale, 0]} material={silverArmor} receiveShadow>
            <boxGeometry args={[tableW * 0.88, 0.03 * cellScale, tableD * 0.92]} />
          </mesh>
          <mesh position={[-0.38 * cellScale, 0.24 * cellScale, 0]} material={crimsonAccent}>
            <boxGeometry args={[0.05 * cellScale, 0.04 * cellScale, tableD * 0.86]} />
          </mesh>
          <mesh position={[0.38 * cellScale, 0.24 * cellScale, 0]} material={crimsonAccent}>
            <boxGeometry args={[0.05 * cellScale, 0.04 * cellScale, tableD * 0.86]} />
          </mesh>
        </group>

        {/* 4 SPACED PICK-AND-PLACE ARMS WORKING SIMULTANEOUSLY */}
        <PickPlaceArm
          basePos={[-0.62 * cellScale, 0, -1.85 * cellScale]}
          targetRef={arm1Target}
          scale={cellScale * 0.72}
          graphiteMat={graphiteChassis}
          silverMat={silverArmor}
          accentMat={crimsonAccent}
          darkMat={darkRecess}
        />
        <PickPlaceArm
          basePos={[-0.62 * cellScale, 0, 1.85 * cellScale]}
          targetRef={arm2Target}
          scale={cellScale * 0.72}
          graphiteMat={graphiteChassis}
          silverMat={silverArmor}
          accentMat={crimsonAccent}
          darkMat={darkRecess}
        />
        <PickPlaceArm
          basePos={[0.62 * cellScale, 0, -1.85 * cellScale]}
          targetRef={arm3Target}
          scale={cellScale * 0.72}
          graphiteMat={graphiteChassis}
          silverMat={silverArmor}
          accentMat={crimsonAccent}
          darkMat={darkRecess}
        />
        <PickPlaceArm
          basePos={[0.62 * cellScale, 0, 1.85 * cellScale]}
          targetRef={arm4Target}
          scale={cellScale * 0.72}
          graphiteMat={graphiteChassis}
          silverMat={silverArmor}
          accentMat={crimsonAccent}
          darkMat={darkRecess}
        />
      </group>

      {/* INDEPENDENT WORLD-SPACE STAGING / TRANSIT PARTS (ZERO NESTING BUGS) */}
      <group ref={stgPedestalRef} scale={armScale}>
        <mesh position={[0, 0.22, 0]} material={graphiteChassis}>
          <cylinderGeometry args={[0.64, 0.72, 0.44, 32]} />
        </mesh>
        <mesh position={[0, 0.48, 0]} material={silverArmor}>
          <cylinderGeometry args={[0.63, 0.65, 0.08, 32]} />
        </mesh>
      </group>

      <group ref={stgTurretRef} scale={armScale}>
        <mesh geometry={turretShroudGeo} material={silverArmor} />
        <mesh position={[0.05, 0.42, 0]} material={graphiteChassis}>
          <boxGeometry args={[0.56, 0.72, 0.42]} />
        </mesh>
      </group>

      <group ref={stgBoomRef} scale={armScale}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={graphiteChassis}>
          <cylinderGeometry args={[0.42, 0.42, 0.68, 28]} />
        </mesh>
        <mesh geometry={upperBoomGeo} material={silverArmor} />
        <mesh position={[0, 0.72, 0]} material={graphiteChassis}>
          <boxGeometry args={[0.36, 1.25, 0.44]} />
        </mesh>
      </group>

      <group ref={stgForearmRef} scale={armScale}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={graphiteChassis}>
          <cylinderGeometry args={[0.32, 0.32, 0.5, 24]} />
        </mesh>
        <mesh geometry={forearmGeo} material={silverArmor} />
        <mesh position={[0, 0.62, 0]} material={graphiteChassis}>
          <boxGeometry args={[0.28, 1.05, 0.34]} />
        </mesh>
      </group>

      <group ref={stgWristRef} scale={armScale}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={graphiteChassis}>
          <cylinderGeometry args={[0.22, 0.22, 0.38, 22]} />
        </mesh>
        <mesh position={[0, 0.22, 0]} material={lightTrim}>
          <cylinderGeometry args={[0.24, 0.21, 0.12, 28]} />
        </mesh>
      </group>

      <group ref={stgLaserRef} scale={armScale}>
        <mesh position={[0, 0.1, 0]} material={darkRecess}>
          <cylinderGeometry args={[0.095, 0.115, 0.22, 20]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} material={crimsonAccent}>
          <cylinderGeometry args={[0.105, 0.105, 0.045, 20]} />
        </mesh>
        <mesh position={[0, 0.26, 0]} material={copperNozzle}>
          <cylinderGeometry args={[0.022, 0.075, 0.14, 18]} />
        </mesh>
        <mesh position={[0, 0.34, 0]} material={laserEmitterMat}>
          <sphereGeometry args={[0.026, 12, 12]} />
        </mesh>
      </group>

      {/* LINEAR GANTRY RAIL DEPLOYING AT BOTTOM FOR HERO HANDOFF */}
      <group ref={railRef} position={[0, floorY - 1.2, -0.05]} visible={false}>
        <mesh material={reflectiveRailMat}>
          <boxGeometry args={[frontWidth * 0.9, 0.048, 0.42]} />
        </mesh>
        <mesh position={[0, 0.03, 0.16]} material={silverArmor}>
          <boxGeometry args={[frontWidth * 0.9, 0.018, 0.045]} />
        </mesh>
        <mesh position={[0, 0.03, -0.16]} material={silverArmor}>
          <boxGeometry args={[frontWidth * 0.9, 0.018, 0.045]} />
        </mesh>
      </group>

      {/* ASSEMBLED 6-DOF HERO ARM HIERARCHY ON TABLE 2 -> RAIL DOCK */}
      <group
        ref={rootArmRef}
        position={[tableX, 0.26 * cellScale + 0.24 * armScale, 1.38 * cellScale]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={armScale}
      >
        <group ref={asmPedestalRef} visible={false}>
          <mesh position={[0, 0.22, 0]} material={graphiteChassis}>
            <cylinderGeometry args={[0.64, 0.72, 0.44, 32]} />
          </mesh>
          {baseBolts.map((a, i) => (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.65, 0.36, Math.sin(a) * 0.65]}
              rotation={[0, -a, Math.PI / 2]}
              material={darkRecess}
            >
              <cylinderGeometry args={[0.025, 0.025, 0.04, 6]} />
            </mesh>
          ))}
          <mesh position={[0, 0.48, 0]} material={silverArmor}>
            <cylinderGeometry args={[0.63, 0.65, 0.08, 32]} />
          </mesh>
          {gearTeeth.map((a, i) => (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.64, 0.48, Math.sin(a) * 0.64]}
              rotation={[0, -a, 0]}
              material={graphiteChassis}
            >
              <boxGeometry args={[0.03, 0.075, 0.028]} />
            </mesh>
          ))}
          <mesh position={[0, 0.55, 0]} material={lightTrim}>
            <cylinderGeometry args={[0.58, 0.62, 0.06, 32]} />
          </mesh>
        </group>

        <group ref={asmTurretRef} position={[0, 0.58, 0]} visible={false}>
          <mesh geometry={turretShroudGeo} material={silverArmor} />
          <mesh position={[0.05, 0.42, 0]} material={graphiteChassis}>
            <boxGeometry args={[0.56, 0.72, 0.42]} />
          </mesh>

          <group ref={asmShoulderRef} position={[0.02, 0.78, 0]} visible={false}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={graphiteChassis}>
              <cylinderGeometry args={[0.42, 0.42, 0.68, 28]} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={lightTrim}>
              <cylinderGeometry args={[0.35, 0.35, 0.72, 24]} />
            </mesh>
            {drumSlots.map((a, i) => (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.37, Math.sin(a) * 0.37, 0]}
                rotation={[0, 0, a]}
                material={darkRecess}
              >
                <boxGeometry args={[0.09, 0.07, 0.73]} />
              </mesh>
            ))}

            <mesh geometry={upperBoomGeo} material={silverArmor} />
            <mesh position={[0, 0.72, 0]} material={graphiteChassis}>
              <boxGeometry args={[0.36, 1.25, 0.44]} />
            </mesh>

            <group ref={asmElbowRef} position={[0, 1.52, 0]} visible={false}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={graphiteChassis}>
                <cylinderGeometry args={[0.32, 0.32, 0.5, 24]} />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={silverArmor}>
                <cylinderGeometry args={[0.24, 0.24, 0.54, 20]} />
              </mesh>

              <mesh geometry={forearmGeo} material={silverArmor} />
              <mesh position={[0, 0.62, 0]} material={graphiteChassis}>
                <boxGeometry args={[0.28, 1.05, 0.34]} />
              </mesh>

              <group ref={asmWristRef} position={[0, 1.3, 0]} visible={false}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={graphiteChassis}>
                  <cylinderGeometry args={[0.22, 0.22, 0.38, 22]} />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={lightTrim}>
                  <cylinderGeometry args={[0.16, 0.16, 0.42, 20]} />
                </mesh>

                <mesh position={[0, 0.22, 0]} material={lightTrim}>
                  <cylinderGeometry args={[0.24, 0.21, 0.12, 28]} />
                </mesh>
                <mesh position={[0, 0.29, 0]} material={darkRecess}>
                  <cylinderGeometry args={[0.19, 0.19, 0.04, 24]} />
                </mesh>

                <mesh ref={asmJawLRef} position={[0, 0.38, 0.11]} material={graphiteChassis}>
                  <boxGeometry args={[0.12, 0.18, 0.045]} />
                </mesh>
                <mesh ref={asmJawRRef} position={[0, 0.38, -0.11]} material={graphiteChassis}>
                  <boxGeometry args={[0.12, 0.18, 0.045]} />
                </mesh>

                <group ref={asmLaserRef} visible={false}>
                  <mesh position={[0, 0.4, 0]} material={darkRecess}>
                    <cylinderGeometry args={[0.095, 0.115, 0.22, 20]} />
                  </mesh>
                  <mesh position={[0, 0.44, 0]} material={crimsonAccent}>
                    <cylinderGeometry args={[0.105, 0.105, 0.045, 20]} />
                  </mesh>
                  <mesh position={[0, 0.56, 0]} material={copperNozzle}>
                    <cylinderGeometry args={[0.022, 0.075, 0.14, 18]} />
                  </mesh>
                  <mesh position={[0, 0.64, 0]} material={laserEmitterMat}>
                    <sphereGeometry args={[0.026, 12, 12]} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

export default function RobotLoader({ onComplete }: RobotLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pctTextRef = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoaderPhase>('assembling');
  const [dockProgress, setDockProgress] = useState(0);

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Minimum 10-second loading sequence (9.0s assembly + 0.5s hold + 1.0s swoop/dock + 0.2s fade = 10.7s)
  useEffect(() => {
    const progProxy = { val: 0 };
    const dockProxy = { val: 0 };
    let lastSoundTick = -1;

    const tl = gsap.timeline();

    tl.to(progProxy, {
      val: 100,
      duration: 9.0,
      ease: 'power1.inOut',
      onUpdate: () => {
        const p = Math.round(progProxy.val);
        setProgress(p);
        if (barRef.current) {
          gsap.set(barRef.current, { scaleX: progProxy.val / 100 });
        }
        if (pctTextRef.current) {
          pctTextRef.current.textContent = `${String(p).padStart(2, '0')}%`;
        }
        if (p !== lastSoundTick) {
          lastSoundTick = p;
          if (p === 42 || p === 62 || p === 74 || p === 88) sound.playPneumatic();
          else if (p === 98) sound.playSnap();
          else if (p % 10 === 0 && p > 0) sound.playRotaryTick();
        }
      },
    })
      .call(() => {
        setPhase('hold');
        sound.playSuccess();
      })
      .to({}, { duration: 0.5 })
      .call(() => {
        setPhase('docking');
        sound.playPneumatic();
      })
      .to(dockProxy, {
        val: 1,
        duration: 1.0,
        ease: 'power3.inOut',
        onUpdate: () => {
          setDockProgress(dockProxy.val);
        },
      })
      .to(loaderRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current?.();
          }
        },
      });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-50 bg-[#f8fafc] text-slate-900 select-none overflow-hidden studio-grid will-change-[opacity]"
    >
      <Canvas
        shadows
        camera={{ position: [0, 7.6, 2.2], fov: 40 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
        dpr={[1, 1.5]}
      >
        <StudioEnvironment intensity={0.42} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[6, 10, 6]} intensity={2.1} castShadow />
        <directionalLight position={[-6, 6, -3]} intensity={0.9} color="#cbd5e1" />
        <pointLight position={[0, 4, 2]} intensity={0.8} color="#ffffff" />

        <Suspense fallback={null}>
          <TwoTableAssemblyCell progress={progress} dockProgress={dockProgress} />
        </Suspense>
      </Canvas>

      {/* TOP-LEFT ANIMATED LOADING PERCENTAGE HUD */}
      <div
        className={`fixed top-6 left-6 z-10 w-64 p-3.5 rounded-2xl bg-white/90 border border-slate-200 shadow-md transition-opacity duration-300 ${
          phase === 'docking' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-center justify-between font-mono text-[11px] mb-2">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>{phase === 'hold' ? 'ASSEMBLY LOCKED' : '4-ARM ASSEMBLY'}</span>
          </div>
          <span ref={pctTextRef} className="font-black text-slate-950 tabular-nums text-xs">
            00%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            ref={barRef}
            className="h-full w-full bg-gradient-to-r from-slate-900 via-red-600 to-red-500 origin-left will-change-transform"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </div>
  );
}
