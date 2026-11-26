'use client';

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface ArmPoseState {
  turretYaw: number;
  shoulderPitch: number;
  elbowPitch: number;
  wristPitch: number;
  gripperOpen: number;
}

export interface LaserEngraveTarget {
  active: boolean;
  screenX: number;
  screenY: number;
  baseBiasX: number; // -1..1 normalized desired base offset or target world X hint
}

interface RoboticArmProps {
  armPoseRef: React.MutableRefObject<ArmPoseState>;
  laserTargetRef: React.MutableRefObject<LaserEngraveTarget>;
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

function FacetedIndustrialArm({
  armPoseRef,
  laserTargetRef,
  isIdleTracking,
  onGripperScreenPos,
}: RoboticArmProps) {
  const { viewport, camera, size } = useThree();

  // Responsive scale guaranteed to fit inside viewport height & width with zero clipping
  const baseScale = Math.min(viewport.height * 0.23, viewport.width * 0.145);
  const homeBaseX = viewport.width * 0.27;
  const floorY = -viewport.height * 0.5;

  const baseGroupRef = useRef<THREE.Group>(null);
  const currentBaseXRef = useRef(homeBaseX);

  const turretRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const leftJawRef = useRef<THREE.Mesh>(null);
  const rightJawRef = useRef<THREE.Mesh>(null);
  const laserNozzleRef = useRef<THREE.Group>(null);

  // Laser beam & contact spark refs
  const laserBeamGroupRef = useRef<THREE.Group>(null);
  const laserCoreRef = useRef<THREE.Mesh>(null);
  const laserGlowRef = useRef<THREE.Mesh>(null);
  const sparkClusterRef = useRef<THREE.Group>(null);

  const projVec = useMemo(() => new THREE.Vector3(), []);
  const nozzleWorldPos = useMemo(() => new THREE.Vector3(), []);
  const targetWorldPos = useMemo(() => new THREE.Vector3(), []);
  const beamDir = useMemo(() => new THREE.Vector3(), []);
  const beamMid = useMemo(() => new THREE.Vector3(), []);
  const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const beamQuat = useMemo(() => new THREE.Quaternion(), []);

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
  const cobaltAccent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0284c7',
        metalness: 0.45,
        roughness: 0.25,
      }),
    []
  );
  const copperNozzle = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        metalness: 0.8,
        roughness: 0.22,
      }),
    []
  );
  const laserEmitterMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0ea5e9',
        emissiveIntensity: 2.2,
        roughness: 0.1,
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

  useEffect(() => {
    return () => {
      turretShroudGeo.dispose();
      upperBoomGeo.dispose();
      forearmGeo.dispose();
      silverArmor.dispose();
      lightTrim.dispose();
      graphiteChassis.dispose();
      darkRecess.dispose();
      cobaltAccent.dispose();
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
    cobaltAccent,
    copperNozzle,
    laserEmitterMat,
  ]);

  useFrame((state, delta) => {
    const pose = armPoseRef.current;
    const laser = laserTargetRef.current;
    const elapsed = state.clock.elapsedTime;

    let targetBaseX = homeBaseX;
    let targetYaw = pose.turretYaw;
    let targetShoulder = pose.shoulderPitch;
    let targetElbow = pose.elbowPitch;
    let targetWrist = pose.wristPitch;

    if (laser.active && size.width > 0 && size.height > 0) {
      // Convert exact engraving screen coordinates (sx, sy) to 3D world coordinates on z=0 plane
      const worldTx = (laser.screenX / size.width - 0.5) * viewport.width;
      const worldTy = -(laser.screenY / size.height - 0.5) * viewport.height;
      targetWorldPos.set(worldTx, worldTy, 0.02);

      // Slide the bottom rail carriage left/right so the arm stays comfortably positioned near the target
      const minRailX = -viewport.width * 0.34;
      const maxRailX = viewport.width * 0.32;
      targetBaseX = THREE.MathUtils.clamp(worldTx + viewport.width * 0.16, minRailX, maxRailX);

      // Smoothly move carriage first so IK solves from the live carriage position
      currentBaseXRef.current = THREE.MathUtils.damp(currentBaseXRef.current, targetBaseX, 6.5, delta);

      // Aim nozzle slightly behind/right of the target point for a natural CNC standoff
      const standoffTx = worldTx + 0.22 * baseScale;
      const standoffTy = worldTy + 0.14 * baseScale;

      const shoulderWorldY = floorY + 1.36 * baseScale;
      const dx = (standoffTx - currentBaseXRef.current) / baseScale;
      const dy = (standoffTy - shoulderWorldY) / baseScale;

      const L1 = 1.52;
      const L2 = 1.82;
      const maxReach = (L1 + L2) * 0.92;
      const minReach = 0.65;
      const dist = THREE.MathUtils.clamp(Math.hypot(dx, dy), minReach, maxReach);

      const cosElbow = THREE.MathUtils.clamp(
        (dist * dist - L1 * L1 - L2 * L2) / (2 * L1 * L2),
        -0.96,
        0.96
      );
      const elbowAngle = Math.acos(cosElbow);
      const angleToTarget = Math.atan2(-dx, dy);
      const alpha = Math.atan2(L2 * Math.sin(elbowAngle), L1 + L2 * Math.cos(elbowAngle));

      targetShoulder = THREE.MathUtils.clamp(angleToTarget - alpha, -0.75, 1.05);
      targetElbow = THREE.MathUtils.clamp(elbowAngle, 0.25, 2.05);
      targetWrist = THREE.MathUtils.clamp(0.35 - targetShoulder * 0.3, -0.8, 0.8);
      targetYaw = THREE.MathUtils.clamp((worldTx - currentBaseXRef.current) * 0.12, -0.32, 0.32);
    } else if (isIdleTracking) {
      // Return base carriage smoothly to home position while tracking cursor with bounded 2-Link IK
      currentBaseXRef.current = THREE.MathUtils.damp(currentBaseXRef.current, homeBaseX, 4.5, delta);

      const { x, y } = state.pointer;
      const safeMinX = -viewport.width * 0.34;
      const safeMaxX = viewport.width * 0.4;
      const safeMinY = floorY + 0.85 * baseScale;
      const safeMaxY = viewport.height * 0.34;

      const worldTx = THREE.MathUtils.clamp(x * (viewport.width * 0.45), safeMinX, safeMaxX);
      const worldTy = THREE.MathUtils.clamp(y * (viewport.height * 0.42), safeMinY, safeMaxY);

      const shoulderWorldY = floorY + 1.36 * baseScale;
      const dx = (worldTx - currentBaseXRef.current) / baseScale;
      const dy = (worldTy - shoulderWorldY) / baseScale;

      const L1 = 1.52;
      const L2 = 1.82;
      const maxReach = (L1 + L2) * 0.88;
      const minReach = 0.75;
      const dist = THREE.MathUtils.clamp(Math.hypot(dx, dy), minReach, maxReach);

      const cosElbow = THREE.MathUtils.clamp(
        (dist * dist - L1 * L1 - L2 * L2) / (2 * L1 * L2),
        -0.96,
        0.96
      );
      const elbowAngle = Math.acos(cosElbow);
      const angleToTarget = Math.atan2(-dx, dy);
      const alpha = Math.atan2(L2 * Math.sin(elbowAngle), L1 + L2 * Math.cos(elbowAngle));

      targetShoulder = THREE.MathUtils.clamp(angleToTarget - alpha, -0.55, 0.95);
      targetElbow = THREE.MathUtils.clamp(elbowAngle, 0.35, 1.95);
      targetWrist = THREE.MathUtils.clamp(0.15 - targetShoulder * 0.35, -0.7, 0.6);
      targetYaw = THREE.MathUtils.clamp(x * 0.22, -0.3, 0.3);
    } else {
      currentBaseXRef.current = THREE.MathUtils.damp(currentBaseXRef.current, homeBaseX, 5, delta);
    }

    if (baseGroupRef.current) {
      baseGroupRef.current.position.set(currentBaseXRef.current, floorY, 0);
    }
    if (turretRef.current) {
      turretRef.current.rotation.y = THREE.MathUtils.damp(turretRef.current.rotation.y, targetYaw, 9, delta);
    }
    if (shoulderRef.current) {
      shoulderRef.current.rotation.z = THREE.MathUtils.damp(shoulderRef.current.rotation.z, targetShoulder, 9, delta);
    }
    if (elbowRef.current) {
      elbowRef.current.rotation.z = THREE.MathUtils.damp(elbowRef.current.rotation.z, targetElbow, 9, delta);
    }
    if (wristRef.current) {
      wristRef.current.rotation.z = THREE.MathUtils.damp(wristRef.current.rotation.z, targetWrist, 10, delta);
    }

    const jawOffset = 0.085 + pose.gripperOpen * 0.04;
    if (leftJawRef.current && rightJawRef.current) {
      leftJawRef.current.position.z = THREE.MathUtils.damp(leftJawRef.current.position.z, jawOffset, 14, delta);
      rightJawRef.current.position.z = THREE.MathUtils.damp(rightJawRef.current.position.z, -jawOffset, 14, delta);
    }

    // Update laser beam geometry & contact spark cluster directly to exact targetWorldPos
    if (laserBeamGroupRef.current && laserNozzleRef.current) {
      if (laser.active) {
        laserNozzleRef.current.updateWorldMatrix(true, false);
        laserNozzleRef.current.getWorldPosition(nozzleWorldPos);

        beamDir.subVectors(targetWorldPos, nozzleWorldPos);
        const beamLen = Math.max(0.05, beamDir.length());
        beamDir.normalize();
        beamMid.addVectors(nozzleWorldPos, targetWorldPos).multiplyScalar(0.5);
        beamQuat.setFromUnitVectors(upAxis, beamDir);

        laserBeamGroupRef.current.visible = true;

        if (laserCoreRef.current && laserGlowRef.current) {
          laserCoreRef.current.position.copy(beamMid);
          laserCoreRef.current.quaternion.copy(beamQuat);
          laserCoreRef.current.scale.set(1, beamLen, 1);

          laserGlowRef.current.position.copy(beamMid);
          laserGlowRef.current.quaternion.copy(beamQuat);
          const pulse = 1 + Math.sin(elapsed * 55) * 0.22;
          laserGlowRef.current.scale.set(pulse, beamLen, pulse);
        }

        if (sparkClusterRef.current) {
          sparkClusterRef.current.position.copy(targetWorldPos);
          sparkClusterRef.current.rotation.z = elapsed * 14;
          const s = 0.85 + Math.sin(elapsed * 48) * 0.25;
          sparkClusterRef.current.scale.setScalar(s * baseScale * 0.9);
        }
      } else {
        laserBeamGroupRef.current.visible = false;
      }
    }

    if (onGripperScreenPos && laserNozzleRef.current) {
      laserNozzleRef.current.updateWorldMatrix(true, false);
      laserNozzleRef.current.getWorldPosition(projVec);
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
    <>
      {/* LINEAR GANTRY RAIL ALONG BOTTOM EDGE SO ARM SLIDES LEFT-RIGHT */}
      <group position={[0, floorY + 0.04, -0.05]}>
        <mesh material={darkRecess}>
          <boxGeometry args={[viewport.width * 0.88, 0.045, 0.36]} />
        </mesh>
        <mesh position={[0, 0.03, 0.14]} material={silverArmor}>
          <boxGeometry args={[viewport.width * 0.88, 0.018, 0.04]} />
        </mesh>
        <mesh position={[0, 0.03, -0.14]} material={silverArmor}>
          <boxGeometry args={[viewport.width * 0.88, 0.018, 0.04]} />
        </mesh>
      </group>

      {/* SLIDING ROBOTIC ARM CARRIAGE + 6-DOF FACETED ARM */}
      <group ref={baseGroupRef} position={[homeBaseX, floorY, 0]} scale={baseScale}>
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

              {/* 4. WRIST ROTARY FLANGE + LASER ENGRAVING TOOL HEAD */}
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

                {/* Clamping fingers holding the laser collimator module */}
                <mesh ref={leftJawRef} position={[0, 0.38, 0.11]} material={graphiteChassis}>
                  <boxGeometry args={[0.12, 0.18, 0.045]} />
                </mesh>
                <mesh ref={rightJawRef} position={[0, 0.38, -0.11]} material={graphiteChassis}>
                  <boxGeometry args={[0.12, 0.18, 0.045]} />
                </mesh>

                {/* Laser Optical Collimator + Cooling Fins + Copper Focusing Nozzle */}
                <mesh position={[0, 0.4, 0]} material={darkRecess}>
                  <cylinderGeometry args={[0.095, 0.115, 0.22, 20]} />
                </mesh>
                <mesh position={[0, 0.44, 0]} material={cobaltAccent}>
                  <cylinderGeometry args={[0.105, 0.105, 0.045, 20]} />
                </mesh>
                <mesh position={[0, 0.56, 0]} material={copperNozzle}>
                  <cylinderGeometry args={[0.022, 0.075, 0.14, 18]} />
                </mesh>
                <mesh position={[0, 0.64, 0]} material={laserEmitterMat}>
                  <sphereGeometry args={[0.024, 12, 12]} />
                </mesh>

                <group ref={laserNozzleRef} position={[0, 0.65, 0]} />
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* VOLUMETRIC LASER BEAM + CONTACT SPARK FLARE (WORLD SPACE) */}
      <group ref={laserBeamGroupRef} visible={false}>
        <mesh ref={laserCoreRef}>
          <cylinderGeometry args={[0.014, 0.014, 1, 10]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh ref={laserGlowRef}>
          <cylinderGeometry args={[0.048, 0.048, 1, 12]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <group ref={sparkClusterRef}>
          <mesh>
            <sphereGeometry args={[0.065, 14, 14]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.38} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {[0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((a, i) => (
            <mesh key={i} position={[Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.12, 0.018, 0.018]} />
              <meshBasicMaterial color="#bae6fd" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}

export default function RoboticArmStage({
  armPoseRef,
  laserTargetRef,
  isIdleTracking,
  onGripperScreenPos,
}: {
  armPoseRef: React.MutableRefObject<ArmPoseState>;
  laserTargetRef: React.MutableRefObject<LaserEngraveTarget>;
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
            laserTargetRef={laserTargetRef}
            isIdleTracking={isIdleTracking}
            onGripperScreenPos={onGripperScreenPos}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
