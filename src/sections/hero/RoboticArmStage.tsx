'use client';

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {
  getArmLayout,
  createFacetedLinkGeometry,
  TURRET_SHROUD_POINTS,
  UPPER_BOOM_POINTS,
  FOREARM_POINTS,
} from './armLayout';

export interface ArmPoseState {
  turretYaw: number;
  shoulderPitch: number;
  elbowPitch: number;
  wristPitch: number;
  gripperOpen: number;
}

export interface LaserEngraveTarget {
  active: boolean;
  fireLaser?: boolean;
  screenX: number;
  screenY: number;
  baseBiasX: number;
}

interface RoboticArmProps {
  armPoseRef: React.MutableRefObject<ArmPoseState>;
  laserTargetRef: React.MutableRefObject<LaserEngraveTarget>;
  isIdleTracking: boolean;
  onGripperScreenPos?: (x: number, y: number) => void;
}

// ============================================================================
// 1. STUDIO PMREM ENVIRONMENT (Reflections on Metallic Arm & Rail)
// ============================================================================
function StudioEnvironment({ intensity = 0.38 }: { intensity?: number }) {
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

// ============================================================================
// 2. ALPHA-PRESERVING CINEMATIC BLOOM + FILM GRADE POST STACK
// ============================================================================
const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uIntensity: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uIntensity;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));
      vec4 base = texture2D(tDiffuse, vUv);

      // Subtle anamorphic edge chromatic dispersion during active cinematic engraving
      vec2 dir = vUv - 0.5;
      float disp = length(dir) * 0.0028 * uIntensity;
      float rCh = texture2D(tDiffuse, vUv + dir * disp).r;
      float bCh = texture2D(tDiffuse, vUv - dir * disp).b;
      vec3 color = vec3(mix(base.r, rCh, uIntensity), base.g, mix(base.b, bCh, uIntensity));

      // 8-tap wide bloom on high-luminance laser & welding sparks (preserving alpha!)
      vec3 bloom = vec3(0.0);
      float bloomAlpha = 0.0;
      float radius = 4.5 + uIntensity * 3.5;
      for (int i = 0; i < 8; i++) {
        float ang = float(i) * 0.78539816;
        vec2 off = vec2(cos(ang), sin(ang)) * texel * radius;
        vec4 s = texture2D(tDiffuse, vUv + off);
        float lum = dot(s.rgb, vec3(0.299, 0.587, 0.114));
        float w = smoothstep(0.72, 1.35, lum) * s.a;
        bloom += s.rgb * w;
        bloomAlpha += w;
      }
      bloom /= 8.0;
      bloomAlpha /= 8.0;

      color += bloom * (0.55 + 0.55 * uIntensity);

      // Subtle filmic contrast & 35mm grain during engraving
      float grain = (rand(vUv * uTime) - 0.5) * 0.032 * uIntensity;
      color += grain * base.a;

      float outAlpha = clamp(base.a + bloomAlpha * 0.65, 0.0, 1.0);
      gl_FragColor = vec4(color, outAlpha);
    }
  `,
};

function CinematicPostStack({ laserTargetRef }: { laserTargetRef: React.MutableRefObject<LaserEngraveTarget> }) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const passRef = useRef<ShaderPass | null>(null);

  useEffect(() => {
    const rt = new THREE.WebGLRenderTarget(size.width, size.height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: 0,
    });
    const composer = new EffectComposer(gl, rt);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(size.width, size.height);

    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    const cinePass = new ShaderPass(CinematicShader);
    cinePass.uniforms.uResolution.value.set(size.width, size.height);
    composer.addPass(cinePass);

    composerRef.current = composer;
    passRef.current = cinePass;

    return () => {
      composer.dispose();
      rt.dispose();
      composerRef.current = null;
      passRef.current = null;
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    if (composerRef.current && passRef.current) {
      composerRef.current.setSize(size.width, size.height);
      passRef.current.uniforms.uResolution.value.set(size.width, size.height);
    }
  }, [size.width, size.height]);

  useFrame((state, delta) => {
    if (!composerRef.current || !passRef.current) return;
    const isFiring = laserTargetRef.current.active && laserTargetRef.current.fireLaser !== false;
    const nextIntensity = THREE.MathUtils.damp(
      passRef.current.uniforms.uIntensity.value,
      isFiring ? 1.0 : 0.0,
      6,
      delta
    );
    passRef.current.uniforms.uIntensity.value = nextIntensity;

    // Bypass post-processing composer when idle so cursor tracking runs at full 60fps
    if (!isFiring && nextIntensity <= 0.002) {
      gl.render(scene, camera);
      return;
    }

    passRef.current.uniforms.uTime.value = state.clock.elapsedTime + 1.0;
    composerRef.current.render(delta);
  }, 1);

  return null;
}

// ============================================================================
// 3. BALLISTIC WELDING SPARKS (48-INSTANCE INSTANCED MESH)
// ============================================================================
const SPARK_COUNT = 48;

interface SparkParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

function WeldingSparks({
  activeRef,
  originRef,
  floorY,
}: {
  activeRef: React.MutableRefObject<boolean>;
  originRef: React.MutableRefObject<THREE.Vector3>;
  floorY: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const sparks = useMemo<SparkParticle[]>(
    () =>
      Array.from({ length: SPARK_COUNT }, () => ({
        pos: new THREE.Vector3(0, -99, 0),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.4,
      })),
    []
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const hotGold = useMemo(() => new THREE.Color('#fef08a'), []);
  const bloodRed = useMemo(() => new THREE.Color('#ef4444'), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.033);
    const emitting = activeRef.current;
    const origin = originRef.current;
    const railFloor = floorY + 0.065;

    for (let i = 0; i < SPARK_COUNT; i++) {
      const s = sparks[i];
      s.life -= dt;

      if (s.life <= 0) {
        if (emitting && Math.random() < 0.55) {
          s.pos.copy(origin);
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.6 + Math.random() * 3.8;
          s.vel.set(
            Math.cos(angle) * speed * 0.9,
            Math.sin(angle) * speed * 0.75 + 0.9,
            (Math.random() - 0.5) * 1.4
          );
          s.maxLife = 0.22 + Math.random() * 0.34;
          s.life = s.maxLife;
        } else {
          dummy.position.set(0, -99, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }

      // Gravity + air drag + floor bounce
      s.vel.y -= 13.5 * dt;
      s.vel.multiplyScalar(1 - 1.4 * dt);
      s.pos.addScaledVector(s.vel, dt);

      if (s.pos.y <= railFloor) {
        s.pos.y = railFloor;
        s.vel.y = Math.abs(s.vel.y) * 0.45;
        s.vel.x *= 0.78;
      }

      const lifeRatio = Math.max(0, s.life / s.maxLife);
      const speed = Math.max(0.1, s.vel.length());
      dir.copy(s.vel).divideScalar(speed);

      dummy.position.copy(s.pos);
      dummy.quaternion.setFromUnitVectors(up, dir);
      dummy.scale.set(0.8 * lifeRatio, Math.min(2.6, 0.6 + speed * 0.42) * lifeRatio, 0.8 * lifeRatio);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      tempColor.lerpColors(bloodRed, hotGold, lifeRatio);
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SPARK_COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.016, 0.085, 0.016]} />
      <meshBasicMaterial transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

function FacetedIndustrialArm({
  armPoseRef,
  laserTargetRef,
  isIdleTracking,
  onGripperScreenPos,
}: RoboticArmProps) {
  const { viewport, camera, size } = useThree();

  const { baseScale, homeBaseX, floorY } = getArmLayout(viewport);

  const baseGroupRef = useRef<THREE.Group>(null);
  const currentBaseXRef = useRef(homeBaseX);

  const turretRef = useRef<THREE.Group>(null);
  const shoulderRef = useRef<THREE.Group>(null);
  const elbowRef = useRef<THREE.Group>(null);
  const wristRef = useRef<THREE.Group>(null);
  const leftJawRef = useRef<THREE.Mesh>(null);
  const rightJawRef = useRef<THREE.Mesh>(null);
  const laserNozzleRef = useRef<THREE.Group>(null);

  const laserBeamGroupRef = useRef<THREE.Group>(null);
  const laserCoreRef = useRef<THREE.Mesh>(null);
  const laserGlowRef = useRef<THREE.Mesh>(null);
  const sparkClusterRef = useRef<THREE.Group>(null);
  const arcLightRef = useRef<THREE.PointLight>(null);

  const isFiringRef = useRef(false);
  const projVec = useMemo(() => new THREE.Vector3(), []);
  const nozzleWorldPos = useMemo(() => new THREE.Vector3(), []);
  const targetWorldPos = useRef(new THREE.Vector3());
  const beamDir = useMemo(() => new THREE.Vector3(), []);
  const beamMid = useMemo(() => new THREE.Vector3(), []);
  const upAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const beamQuat = useMemo(() => new THREE.Quaternion(), []);
  const arcLightOffset = useMemo(() => new THREE.Vector3(0, 0, 0.35), []);

  const silverArmor = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        metalness: 0.58,
        roughness: 0.24,
        flatShading: true,
      }),
    []
  );
  const lightTrim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.4,
        roughness: 0.22,
        flatShading: true,
      }),
    []
  );
  const graphiteChassis = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155',
        metalness: 0.55,
        roughness: 0.42,
        flatShading: true,
      }),
    []
  );
  const darkRecess = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        metalness: 0.6,
        roughness: 0.45,
      }),
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
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b91c1c',
        metalness: 0.55,
        roughness: 0.24,
      }),
    []
  );
  const copperNozzle = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        metalness: 0.85,
        roughness: 0.18,
      }),
    []
  );
  const laserEmitterMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#dc2626',
        emissiveIntensity: 3.2,
        roughness: 0.1,
      }),
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

  useFrame((state, delta) => {
    const pose = armPoseRef.current;
    const laser = laserTargetRef.current;
    const elapsed = state.clock.elapsedTime;
    const perspCam = camera as THREE.PerspectiveCamera;

    let targetBaseX = homeBaseX;
    let targetYaw = pose.turretYaw;
    let targetShoulder = pose.shoulderPitch;
    let targetElbow = pose.elbowPitch;
    let targetWrist = pose.wristPitch;

    const activeFiring = laser.active && laser.fireLaser !== false;
    isFiringRef.current = activeFiring;

    if (laser.active && size.width > 0 && size.height > 0) {
      const worldTx = (laser.screenX / size.width - 0.5) * viewport.width;
      const worldTy = -(laser.screenY / size.height - 0.5) * viewport.height;
      targetWorldPos.current.set(worldTx, worldTy, 0.02);

      const minRailX = -viewport.width * 0.34;
      const maxRailX = viewport.width * 0.32;
      targetBaseX = THREE.MathUtils.clamp(worldTx + viewport.width * 0.16, minRailX, maxRailX);
      currentBaseXRef.current = THREE.MathUtils.damp(currentBaseXRef.current, targetBaseX, 6.5, delta);

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

      // Cinematic camera zoom-in tracking the character being engraved
      if (activeFiring) {
        const camGoalX = THREE.MathUtils.clamp(worldTx * 0.38, -1.2, 1.2);
        const camGoalY = THREE.MathUtils.clamp(worldTy * 0.35, -0.7, 0.7);
        perspCam.position.x = THREE.MathUtils.damp(perspCam.position.x, camGoalX, 3.8, delta);
        perspCam.position.y = THREE.MathUtils.damp(perspCam.position.y, camGoalY, 3.8, delta);
        perspCam.position.z = THREE.MathUtils.damp(perspCam.position.z, 3.95, 3.5, delta);
        perspCam.fov = THREE.MathUtils.damp(perspCam.fov, 35, 3.5, delta);
        perspCam.updateProjectionMatrix();
      }
    } else {
      // Return camera smoothly to wide resting framing
      perspCam.position.x = THREE.MathUtils.damp(perspCam.position.x, 0, 4.0, delta);
      perspCam.position.y = THREE.MathUtils.damp(perspCam.position.y, 0, 4.0, delta);
      perspCam.position.z = THREE.MathUtils.damp(perspCam.position.z, 5.5, 4.0, delta);
      perspCam.fov = THREE.MathUtils.damp(perspCam.fov, 42, 4.0, delta);
      perspCam.updateProjectionMatrix();

      if (isIdleTracking) {
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

    // Dynamic blood-red PointLight for environment reflections on arm & rail
    if (arcLightRef.current) {
      arcLightRef.current.position.copy(targetWorldPos.current).add(arcLightOffset);
      const targetInt = activeFiring ? 5.5 + Math.sin(elapsed * 52) * 1.4 : 0;
      arcLightRef.current.intensity = THREE.MathUtils.damp(arcLightRef.current.intensity, targetInt, 18, delta);
    }

    // Update blood-red laser beam & contact flare
    if (laserBeamGroupRef.current && laserNozzleRef.current) {
      if (activeFiring) {
        laserNozzleRef.current.updateWorldMatrix(true, false);
        laserNozzleRef.current.getWorldPosition(nozzleWorldPos);

        beamDir.subVectors(targetWorldPos.current, nozzleWorldPos);
        const beamLen = Math.max(0.05, beamDir.length());
        beamDir.normalize();
        beamMid.addVectors(nozzleWorldPos, targetWorldPos.current).multiplyScalar(0.5);
        beamQuat.setFromUnitVectors(upAxis, beamDir);

        laserBeamGroupRef.current.visible = true;

        if (laserCoreRef.current && laserGlowRef.current) {
          laserCoreRef.current.position.copy(beamMid);
          laserCoreRef.current.quaternion.copy(beamQuat);
          laserCoreRef.current.scale.set(1, beamLen, 1);

          laserGlowRef.current.position.copy(beamMid);
          laserGlowRef.current.quaternion.copy(beamQuat);
          const pulse = 1 + Math.sin(elapsed * 55) * 0.24;
          laserGlowRef.current.scale.set(pulse, beamLen, pulse);
        }

        if (sparkClusterRef.current) {
          sparkClusterRef.current.position.copy(targetWorldPos.current);
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
      {/* Dynamic Blood-Red Arc Light casting reflections onto arm & rail */}
      <pointLight ref={arcLightRef} color="#ef4444" intensity={0} distance={8} decay={1.6} />

      {/* REFLECTIVE LINEAR GANTRY RAIL ALONG BOTTOM EDGE */}
      <group position={[0, floorY + 0.04, -0.05]}>
        <mesh material={reflectiveRailMat}>
          <boxGeometry args={[viewport.width * 0.9, 0.048, 0.42]} />
        </mesh>
        <mesh position={[0, 0.03, 0.16]} material={silverArmor}>
          <boxGeometry args={[viewport.width * 0.9, 0.018, 0.045]} />
        </mesh>
        <mesh position={[0, 0.03, -0.16]} material={silverArmor}>
          <boxGeometry args={[viewport.width * 0.9, 0.018, 0.045]} />
        </mesh>
      </group>

      {/* SLIDING ROBOTIC ARM CARRIAGE + 6-DOF FACETED ARM */}
      <group ref={baseGroupRef} position={[homeBaseX, floorY, 0]} scale={baseScale}>
        {/* 1. HEAVY GRAPHITE PEDESTAL BASE */}
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

              {/* 4. WRIST ROTARY FLANGE + BLOOD-RED LASER ENGRAVING HEAD */}
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

                <mesh ref={leftJawRef} position={[0, 0.38, 0.11]} material={graphiteChassis}>
                  <boxGeometry args={[0.12, 0.18, 0.045]} />
                </mesh>
                <mesh ref={rightJawRef} position={[0, 0.38, -0.11]} material={graphiteChassis}>
                  <boxGeometry args={[0.12, 0.18, 0.045]} />
                </mesh>

                {/* Optical Collimator + Crimson Cooling Fins + Copper Focusing Nozzle */}
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

                <group ref={laserNozzleRef} position={[0, 0.65, 0]} />
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* VOLUMETRIC BLOOD-RED LASER BEAM + HOT CONTACT FLARE */}
      <group ref={laserBeamGroupRef} visible={false}>
        <mesh ref={laserCoreRef}>
          <cylinderGeometry args={[0.015, 0.015, 1, 10]} />
          <meshBasicMaterial color="#fee2e2" />
        </mesh>
        <mesh ref={laserGlowRef}>
          <cylinderGeometry args={[0.055, 0.055, 1, 12]} />
          <meshBasicMaterial color="#dc2626" transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <group ref={sparkClusterRef}>
          <mesh>
            <sphereGeometry args={[0.065, 14, 14]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.15, 14, 14]} />
            <meshBasicMaterial color="#dc2626" transparent opacity={0.48} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      </group>

      {/* 48-INSTANCE BALLISTIC WELDING SPARKS */}
      <WeldingSparks activeRef={isFiringRef} originRef={targetWorldPos} floorY={floorY} />
    </>
  );
}

export default function RoboticArmStage({
  armPoseRef,
  laserTargetRef,
  isIdleTracking,
  isInView = true,
  onGripperScreenPos,
}: {
  armPoseRef: React.MutableRefObject<ArmPoseState>;
  laserTargetRef: React.MutableRefObject<LaserEngraveTarget>;
  isIdleTracking: boolean;
  isInView?: boolean;
  onGripperScreenPos?: (x: number, y: number) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <Canvas
        frameloop={isInView ? 'always' : 'demand'}
        camera={{ position: [0, 0.0, 5.5], fov: 42 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
        dpr={[1, 1.5]}
      >
        <StudioEnvironment intensity={0.38} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[6, 9, 6]} intensity={2.1} />
        <directionalLight position={[-6, 4, -3]} intensity={0.85} color="#cbd5e1" />
        <pointLight position={[1, 2, 4]} intensity={0.8} color="#ffffff" />

        <Suspense fallback={null}>
          <FacetedIndustrialArm
            armPoseRef={armPoseRef}
            laserTargetRef={laserTargetRef}
            isIdleTracking={isIdleTracking}
            onGripperScreenPos={onGripperScreenPos}
          />
          <CinematicPostStack laserTargetRef={laserTargetRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
