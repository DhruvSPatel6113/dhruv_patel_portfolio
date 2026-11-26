'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface ArmPoseState {
  turretYaw: number;
  shoulderPitch: number;
  elbowPitch: number;
  wristPitch: number;
  gripperOpen: number;
}

interface RoboticArmProps {
  armPoseRef: React.MutableRefObject<ArmPoseState>;
  isIdleTracking: boolean;
  onGripperScreenPos?: (x: number, y: number) => void;
}

function createFacetedLinkGeometry(points: [number, number][], depth: number, bevel = 0.05) {
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

function FacetedIndustrialArm({ armPoseRef, isIdleTracking, onGripperScreenPos }: RoboticArmProps) {
  const { viewport, camera, size } = useThree();

  // Responsive scale guaranteed to fit inside viewport height & width with zero clipping
  const baseScale = Math.min(viewport.height * 0.23, viewport.width * 0.145);
  const baseX = viewport.width * 0.27;
  const floorY = -viewport.height * 0.5;

  const turretRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const leftJawRef = useRef<THREE.Mesh>(null);
  const rightJawRef = useRef<THREE.Mesh>(null);
  const gripperTipRef = useRef<THREE.Group>(null);
  const projVec = useMemo(() => new THREE.Vector3(), []);

  const silverArmor = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        metalness: 0.38,
        roughness: 0.34,
        flatShading: true,
      }),
    []
  );
  const lightTrim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.25,
        roughness: 0.3,
        flatShading: true,
      }),
    []
  );
  const graphiteChassis = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155',
        metalness: 0.45,
        roughness: 0.55,
        flatShading: true,
      }),
    []
  );
  const darkRecess = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        metalness: 0.5,
        roughness: 0.6,
      }),
    []
  );

  const turretShroudGeo = useMemo(
    () =>
      createFacetedLinkGeometry(
        [
          [-0.42, 0.0],
          [0.36, 0.0],
          [0.44, 0.35],
          [0.24, 0.92],
          [-0.18, 0.96],
          [-0.46, 0.42],
        ],
        0.54,
        0.06
      ),
    []
  );

  const upperBoomGeo = useMemo(
    () =>
      createFacetedLinkGeometry(
        [
          [-0.26, -0.15],
          [0.26, -0.15],
          [0.34, 0.6],
          [0.2, 1.56],
          [-0.2, 1.56],
          [-0.32, 0.66],
        ],
        0.38,
        0.055
      ),
    []
  );

  const forearmGeo = useMemo(
    () =>
      createFacetedLinkGeometry(
        [
          [-0.24, -0.12],
          [0.24, -0.12],
          [0.28, 0.5],
          [0.18, 1.32],
          [-0.18, 1.32],
          [-0.26, 0.52],
        ],
        0.3,
        0.05
      ),
    []
  );

  useFrame((state, delta) => {
    const pose = armPoseRef.current;

    let targetYaw = pose.turretYaw;
    let targetShoulder = pose.shoulderPitch;
    let targetElbow = pose.elbowPitch;
    let targetWrist = pose.wristPitch;

    // Bounded 2-Link Planar IK: after drop, gripper tip tracks cursor across the entire screen
    // while strictly clamped inside safe viewport bounds!
    if (isIdleTracking) {
      const { x, y } = state.pointer; // -1..1 across full viewport

      // Target world coordinates clamped strictly inside safe margins
      const safeMinX = -viewport.width * 0.34;
      const safeMaxX = viewport.width * 0.4;
      const safeMinY = floorY + 0.85 * baseScale;
      const safeMaxY = viewport.height * 0.34;

      const worldTx = THREE.MathUtils.clamp(x * (viewport.width * 0.45), safeMinX, safeMaxX);
      const worldTy = THREE.MathUtils.clamp(y * (viewport.height * 0.42), safeMinY, safeMaxY);

      // Convert target relative to shoulder pivot in local arm units
      const shoulderWorldY = floorY + 1.36 * baseScale;
      const dx = (worldTx - baseX) / baseScale;
      const dy = (worldTy - shoulderWorldY) / baseScale;

      const L1 = 1.52;
      const L2 = 1.75; // forearm + wrist/gripper
      const maxReach = (L1 + L2) * 0.88;
      const minReach = 0.75;
      const dist = THREE.MathUtils.clamp(Math.hypot(dx, dy), minReach, maxReach);

      // 2-Link IK elbow-up solution
      const cosElbow = THREE.MathUtils.clamp(
        (dist * dist - L1 * L1 - L2 * L2) / (2 * L1 * L2),
        -0.96,
        0.96
      );
      const elbowAngle = Math.acos(cosElbow); // bends forward/left (+Z rotation)

      // Angle from +Y axis (since links point along +Y at 0 rad, +Z rotation tilts toward -X)
      const angleToTarget = Math.atan2(-dx, dy);
      const alpha = Math.atan2(L2 * Math.sin(elbowAngle), L1 + L2 * Math.cos(elbowAngle));

      targetShoulder = THREE.MathUtils.clamp(angleToTarget - alpha, -0.55, 0.95);
      targetElbow = THREE.MathUtils.clamp(elbowAngle, 0.35, 1.95);
      targetWrist = THREE.MathUtils.clamp(0.15 - targetShoulder * 0.35, -0.7, 0.6);
      targetYaw = THREE.MathUtils.clamp(x * 0.22, -0.3, 0.3);
    }

    if (turretRef.current) {
      turretRef.current.rotation.y = THREE.MathUtils.damp(turretRef.current.rotation.y, targetYaw, 8, delta);
    }
    if (shoulderRef.current) {
      shoulderRef.current.rotation.z = THREE.MathUtils.damp(
        shoulderRef.current.rotation.z,
        targetShoulder,
        8,
        delta
      );
    }
    if (elbowRef.current) {
      elbowRef.current.rotation.z = THREE.MathUtils.damp(elbowRef.current.rotation.z, targetElbow, 8, delta);
    }
    if (wristRef.current) {
      wristRef.current.rotation.z = THREE.MathUtils.damp(wristRef.current.rotation.z, targetWrist, 9, delta);
    }

    const jawOffset = 0.055 + pose.gripperOpen * 0.085;
    if (leftJawRef.current && rightJawRef.current) {
      leftJawRef.current.position.z = THREE.MathUtils.damp(leftJawRef.current.position.z, jawOffset, 14, delta);
      rightJawRef.current.position.z = THREE.MathUtils.damp(rightJawRef.current.position.z, -jawOffset, 14, delta);
    }

    if (onGripperScreenPos && gripperTipRef.current) {
      gripperTipRef.current.updateWorldMatrix(true, false);
      gripperTipRef.current.getWorldPosition(projVec);
      projVec.project(camera);
      const sx = (projVec.x * 0.5 + 0.5) * size.width;
      const sy = (-projVec.y * 0.5 + 0.5) * size.height;
      onGripperScreenPos(sx, sy);
    }
  });

  const baseBolts = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);
  const gearTeeth = useMemo(() => Array.from({ length: 28 }, (_, i) => (i / 28) * Math.PI * 2), []);
  const drumSlots = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);

  return (
    <group position={[baseX, floorY, 0]} scale={baseScale}>
      {/* 1. HEAVY GRAPHITE PEDESTAL BASE AT BOTTOM OF SCREEN */}
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

      {/* 2. SCULPTED TURRET + SLOTTED SHOULDER SERVO DRUM */}
      <group ref={turretRef} position={[0, 0.58, 0]}>
        <mesh geometry={turretShroudGeo} material={silverArmor} />
        <mesh position={[0.05, 0.42, 0]} material={graphiteChassis}>
          <boxGeometry args={[0.56, 0.72, 0.42]} />
        </mesh>

        <group ref={shoulderRef} position={[0.02, 0.78, 0]}>
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

          {/* 3. FACETED ELBOW DRUM + SCULPTED FOREARM */}
          <group ref={elbowRef} position={[0, 1.52, 0]}>
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

            {/* 4. WRIST ROTARY FLANGE + COMPACT PARALLEL GRIPPER */}
            <group ref={wristRef} position={[0, 1.3, 0]}>
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

              <mesh ref={leftJawRef} position={[0, 0.42, 0.09]} material={graphiteChassis}>
                <boxGeometry args={[0.11, 0.24, 0.048]} />
              </mesh>
              <mesh ref={rightJawRef} position={[0, 0.42, -0.09]} material={graphiteChassis}>
                <boxGeometry args={[0.11, 0.24, 0.048]} />
              </mesh>

              <group ref={gripperTipRef} position={[0, 0.5, 0]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function RoboticArmStage({
  armPoseRef,
  isIdleTracking,
  onGripperScreenPos,
}: {
  armPoseRef: React.MutableRefObject<ArmPoseState>;
  isIdleTracking: boolean;
  onGripperScreenPos?: (x: number, y: number) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0.0, 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[6, 9, 6]} intensity={2.2} />
        <directionalLight position={[-6, 4, -3]} intensity={0.85} color="#e2e8f0" />
        <pointLight position={[1, 2, 4]} intensity={0.9} color="#ffffff" />

        <Suspense fallback={null}>
          <FacetedIndustrialArm
            armPoseRef={armPoseRef}
            isIdleTracking={isIdleTracking}
            onGripperScreenPos={onGripperScreenPos}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
