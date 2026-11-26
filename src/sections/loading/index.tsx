'use client';

import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { sound } from '@/utils/audio';

interface RobotLoaderProps {
  onComplete?: () => void;
  siteRef?: React.RefObject<HTMLDivElement>;
}

type FaceExpression = 'determined' | 'surprised' | 'dizzy' | 'happy';
type LoaderStage =
  | 'pulling'
  | 'snap'
  | 'standup'
  | 'dizzy'
  | 'wave'
  | 'curtain_half'
  | 'curtain_strain'
  | 'curtain_final';

// ============================================================================
// 1. DYNAMIC ANIMATED OLED FACE TEXTURE (PIXAR "BEEP" EXPRESSIONS)
// ============================================================================
function useOledFaceTexture(expression: FaceExpression) {
  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    if (!texture || typeof window === 'undefined') return;
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createRadialGradient(256, 192, 40, 256, 192, 280);
    grad.addColorStop(0, '#0a1020');
    grad.addColorStop(1, '#030712');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 384);

    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = '#38bdf8';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (expression === 'determined') {
      // > < strained squinting eyes
      ctx.beginPath();
      ctx.moveTo(125, 145);
      ctx.lineTo(195, 185);
      ctx.lineTo(125, 225);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(387, 145);
      ctx.lineTo(317, 185);
      ctx.lineTo(387, 225);
      ctx.stroke();

      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(215, 275);
      ctx.quadraticCurveTo(256, 255, 297, 275);
      ctx.stroke();
    } else if (expression === 'surprised') {
      // O O wide shocked eyes
      ctx.beginPath();
      ctx.arc(170, 180, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(170, 180, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(342, 180, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(342, 180, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(256, 285, 18, 0, Math.PI * 2);
      ctx.stroke();
    } else if (expression === 'dizzy') {
      // Tom & Jerry style hypnotic concentric spiral eyes!
      ctx.lineWidth = 11;
      [170, 342].forEach((cx) => {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 5.2; a += 0.15) {
          const r = (a / (Math.PI * 5.2)) * 50;
          const x = cx + Math.cos(a) * r;
          const y = 182 + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(222, 285);
      ctx.quadraticCurveTo(256, 265, 290, 285);
      ctx.stroke();
    } else {
      // ^ ^ happy smiling arcs
      ctx.beginPath();
      ctx.arc(170, 205, 48, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(342, 205, 48, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(256, 235, 46, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }

    texture.needsUpdate = true;
  }, [texture, expression]);

  return texture;
}

// ============================================================================
// 2. TOM & JERRY STYLE COMIC DIZZY HALO (SWIRL RINGS, STARS & CURVED TEXT)
// ============================================================================
function CurvedComicWord({
  word,
  radius,
  startAngle,
  stepAngle,
  color,
  fontSize = 0.19,
}: {
  word: string;
  radius: number;
  startAngle: number;
  stepAngle: number;
  color: string;
  fontSize?: number;
}) {
  const letters = word.split('');
  return (
    <group>
      {letters.map((char, idx) => {
        const angle = startAngle + idx * stepAngle;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        return (
          <group key={idx} position={[x, 0.08, z]} rotation={[0, angle, 0]}>
            <Text
              fontSize={fontSize}
              color={color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.032}
              outlineColor="#0f172a"
            >
              {char}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function DizzyHalo() {
  const haloRef = useRef<THREE.Group>(null);
  const innerRingRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (haloRef.current) {
      haloRef.current.rotation.y += delta * 3.2;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.y -= delta * 2.0;
    }
  });

  const starColors = ['#fbbf24', '#38bdf8', '#fb7185', '#fde047', '#fbbf24', '#38bdf8'];

  return (
    <group position={[0, 1.38, 0]} rotation={[0.32, 0, -0.14]}>
      {/* Main Orbiting Comic Ring ("BONK!" & "DIZZY!" + Motion Swirls) */}
      <group ref={haloRef}>
        {/* Crisp Comic Ink Motion Swirl Rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 0.92, 1]}>
          <torusGeometry args={[0.72, 0.012, 8, 48]} />
          <meshBasicMaterial color="#334155" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2 + 0.08, 0.1, 0]} scale={[0.95, 1.05, 1]}>
          <torusGeometry args={[0.64, 0.009, 8, 48]} />
          <meshBasicMaterial color="#64748b" transparent opacity={0.45} />
        </mesh>

        {/* Curved Comic Words Wrapping Around His Head */}
        <CurvedComicWord
          word="BONK!"
          radius={0.76}
          startAngle={-0.45}
          stepAngle={0.22}
          color="#fb923c"
          fontSize={0.21}
        />
        <CurvedComicWord
          word="DIZZY!"
          radius={0.76}
          startAngle={Math.PI - 0.52}
          stepAngle={0.2}
          color="#fde047"
          fontSize={0.19}
        />

        {/* 6 Colorful Cartoon Stars Orbiting Along the Halo */}
        {starColors.map((col, i) => {
          const angle = (i / starColors.length) * Math.PI * 2 + 0.4;
          const r = i % 2 === 0 ? 0.72 : 0.6;
          const yOff = i % 2 === 0 ? -0.04 : 0.12;
          return (
            <group key={i} position={[Math.sin(angle) * r, yOff, Math.cos(angle) * r]}>
              <mesh rotation={[0.4, angle, 0.3]}>
                <octahedronGeometry args={[0.065, 0]} />
                <meshStandardMaterial
                  color={col}
                  emissive={col}
                  emissiveIntensity={0.85}
                  roughness={0.2}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Secondary Counter-Rotating Inner Sparkle Ring */}
      <group ref={innerRingRef} position={[0, 0.16, 0]}>
        {[0, Math.PI * 0.66, Math.PI * 1.33].map((angle, i) => (
          <mesh key={i} position={[Math.sin(angle) * 0.48, 0, Math.cos(angle) * 0.48]}>
            <octahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#fbbf24"
              emissiveIntensity={1.0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ============================================================================
// 3. PIXAR CHARACTER "BEEP" (RESPONSIVE MOTION, CORRECT WHEEL SPIN & STANDUP)
// ============================================================================
function PixarBeepRobot({
  stage,
  progress,
  onHandUpdate,
}: {
  stage: LoaderStage;
  progress: number;
  onHandUpdate: (pos: [number, number, number]) => void;
}) {
  const { viewport } = useThree();
  const floorY = -viewport.height * 0.34;
  const botScale = Math.min(0.9, Math.max(0.55, viewport.width / 8.5));

  const rootRef = useRef<THREE.Group>(null);
  const leftWheelRef = useRef<THREE.Group>(null);
  const rightWheelRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const ropeGripRef = useRef<THREE.Group>(null);
  const worldPosVec = useMemo(() => new THREE.Vector3(), []);

  const expression: FaceExpression = useMemo(() => {
    if (stage === 'pulling') return 'determined';
    if (stage === 'snap') return 'surprised';
    if (stage === 'standup' || stage === 'dizzy') return 'dizzy';
    return 'happy';
  }, [stage]);

  const faceTexture = useOledFaceTexture(expression);

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const t = state.clock.elapsedTime;

    const startX = -viewport.width * 0.04;
    const endX = viewport.width * 0.22;
    const tumbleX = viewport.width * 0.28;
    const centerRightX = viewport.width * 0.08;

    if (stage === 'pulling') {
      const targetX = THREE.MathUtils.lerp(startX, endX, progress / 100);
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, targetX, 6, delta);
      rootRef.current.position.y = floorY + Math.abs(Math.sin(t * 9)) * 0.025;
      rootRef.current.position.z = 0;

      rootRef.current.rotation.y = -Math.PI + 0.38;
      rootRef.current.rotation.z = 0.32;
      rootRef.current.rotation.x = 0;

      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = 0.15;
        leftArmRef.current.rotation.y = -0.25;
        rightArmRef.current.rotation.z = 0.15;
        rightArmRef.current.rotation.y = 0.25;
      }

      if (leftWheelRef.current && rightWheelRef.current) {
        leftWheelRef.current.rotation.z += delta * 7;
        rightWheelRef.current.rotation.z += delta * 7;
      }

      rootRef.current.updateMatrixWorld(true);
      if (ropeGripRef.current) {
        ropeGripRef.current.getWorldPosition(worldPosVec);
        onHandUpdate([worldPosVec.x, worldPosVec.y, worldPosVec.z]);
      }
    } else if (stage === 'snap') {
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, tumbleX, 7, delta);
      rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, floorY + 0.14, 7, delta);
      rootRef.current.rotation.z = THREE.MathUtils.damp(rootRef.current.rotation.z, 1.35, 8, delta);
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, -Math.PI + 0.55, 6, delta);

      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.damp(leftArmRef.current.rotation.z, 1.1, 10, delta);
        leftArmRef.current.rotation.y = THREE.MathUtils.damp(leftArmRef.current.rotation.y, 0.5, 10, delta);
        rightArmRef.current.rotation.z = THREE.MathUtils.damp(rightArmRef.current.rotation.z, 1.1, 10, delta);
        rightArmRef.current.rotation.y = THREE.MathUtils.damp(rightArmRef.current.rotation.y, -0.5, 10, delta);
      }
    } else if (stage === 'standup' || stage === 'dizzy') {
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, centerRightX, 4.5, delta);
      rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, floorY, 5.0, delta);
      rootRef.current.rotation.z = THREE.MathUtils.damp(rootRef.current.rotation.z, 0, 5.5, delta);
      rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, 0, 5.5, delta);
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, -Math.PI / 2, 4.5, delta);

      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.damp(leftArmRef.current.rotation.z, -0.7, 5, delta);
        leftArmRef.current.rotation.y = THREE.MathUtils.damp(leftArmRef.current.rotation.y, 0, 5, delta);
        const rubTargetZ = stage === 'dizzy' ? 1.45 + Math.sin(t * 10) * 0.15 : -0.7;
        rightArmRef.current.rotation.z = THREE.MathUtils.damp(rightArmRef.current.rotation.z, rubTargetZ, 6, delta);
        rightArmRef.current.rotation.y = THREE.MathUtils.damp(rightArmRef.current.rotation.y, 0, 5, delta);
      }
    } else {
      rootRef.current.position.x = THREE.MathUtils.damp(rootRef.current.position.x, centerRightX, 4, delta);
      rootRef.current.position.y = THREE.MathUtils.damp(rootRef.current.position.y, floorY, 4, delta);
      rootRef.current.rotation.z = THREE.MathUtils.damp(rootRef.current.rotation.z, 0, 4.5, delta);
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, -Math.PI / 2, 4.5, delta);

      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = THREE.MathUtils.damp(leftArmRef.current.rotation.z, -0.75, 5, delta);
        rightArmRef.current.rotation.z = 1.35 + Math.sin(t * 10) * 0.35;
        rightArmRef.current.rotation.y = 0;
      }
    }
  });

  const showHiBubble =
    stage === 'wave' ||
    stage === 'curtain_half' ||
    stage === 'curtain_strain' ||
    stage === 'curtain_final';

  return (
    <group ref={rootRef} position={[-viewport.width * 0.04, floorY, 0]} rotation={[0, -Math.PI + 0.38, 0.32]} scale={botScale}>
      {/* TANK TREADS & WHEEL DRIVE BASE */}
      <group position={[0, 0.16, 0]}>
        <group position={[0, 0, 0.27]}>
          <RoundedBox args={[0.56, 0.24, 0.15]} radius={0.08} smoothness={4}>
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </RoundedBox>
          <group ref={leftWheelRef}>
            <mesh position={[-0.17, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.165, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh position={[0.17, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.165, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.3} />
            </mesh>
          </group>
        </group>

        <group position={[0, 0, -0.27]}>
          <RoundedBox args={[0.56, 0.24, 0.15]} radius={0.08} smoothness={4}>
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </RoundedBox>
          <group ref={rightWheelRef}>
            <mesh position={[-0.17, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.165, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh position={[0.17, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.165, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.3} />
            </mesh>
          </group>
        </group>

        <mesh position={[0, 0.08, 0.18]}>
          <cylinderGeometry args={[0.05, 0.05, 0.18, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.08, -0.18]}>
          <cylinderGeometry args={[0.05, 0.05, 0.18, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.25} />
        </mesh>
        <RoundedBox args={[0.32, 0.12, 0.42]} radius={0.04} position={[0, 0.14, 0]}>
          <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.2} />
        </RoundedBox>
      </group>

      {/* TORSO & ILLUMINATED CHEST CORE */}
      <group position={[0, 0.48, 0]}>
        <RoundedBox args={[0.38, 0.36, 0.36]} radius={0.09} smoothness={4}>
          <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.05} />
        </RoundedBox>
        <RoundedBox args={[0.4, 0.06, 0.38]} radius={0.02} position={[0, -0.15, 0]}>
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </RoundedBox>
        <mesh position={[0.192, 0.03, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.065, 24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* ARTICULATED ARMS REACHING FORWARD (+X) */}
      <group ref={leftArmRef} position={[0.05, 0.54, 0.23]}>
        <mesh>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[0.16, -0.02, -0.06]} rotation={[0, 0.25, Math.PI / 2]}>
          <cylinderGeometry args={[0.038, 0.035, 0.28, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        <RoundedBox args={[0.09, 0.09, 0.09]} radius={0.025} position={[0.3, -0.04, -0.11]}>
          <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.25} />
        </RoundedBox>
      </group>

      <group ref={rightArmRef} position={[0.05, 0.54, -0.23]}>
        <mesh>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[0.16, -0.02, 0.06]} rotation={[0, -0.25, Math.PI / 2]}>
          <cylinderGeometry args={[0.038, 0.035, 0.28, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        <RoundedBox args={[0.09, 0.09, 0.09]} radius={0.025} position={[0.3, -0.04, 0.11]}>
          <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.25} />
        </RoundedBox>
      </group>

      {/* Rope Grip Anchor tucked deeper inside his hands (zero visible gap) */}
      <group ref={ropeGripRef} position={[0.25, 0.49, 0]} />

      {/* ROUNDED TV MONITOR HEAD & ANIMATED OLED SCREEN */}
      <group position={[0, 0.92, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.12, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
        </mesh>
        <RoundedBox args={[0.54, 0.44, 0.54]} radius={0.12} smoothness={5}>
          <meshStandardMaterial color="#f8fafc" roughness={0.12} metalness={0.05} />
        </RoundedBox>
        <RoundedBox args={[0.04, 0.36, 0.44]} radius={0.02} position={[0.26, 0, 0]}>
          <meshStandardMaterial color="#0284c7" roughness={0.25} />
        </RoundedBox>
        {faceTexture && (
          <mesh position={[0.282, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.4, 0.31]} />
            <meshBasicMaterial map={faceTexture} />
          </mesh>
        )}
        <mesh position={[0, 0, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 24]} />
          <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.27]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 24]} />
          <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.2} />
        </mesh>
      </group>

      {stage === 'dizzy' && <DizzyHalo />}

      {/* Casual "Hii!" Speech Bubble */}
      {showHiBubble && (
        <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.25}>
          <group position={[0, 1.45, -0.68]} rotation={[0, Math.PI / 2, 0]}>
            <RoundedBox args={[0.56, 0.32, 0.1]} radius={0.12} smoothness={4}>
              <meshStandardMaterial color="#0284c7" roughness={0.2} />
            </RoundedBox>
            <Text
              position={[0, 0, 0.06]}
              fontSize={0.18}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              Hii!
            </Text>
          </group>
        </Float>
      )}
    </group>
  );
}

// ============================================================================
// 4. RESPONSIVE PITCH-BLACK TOW ROPE WITH SLIDING PERCENTAGE
// ============================================================================
function PitchBlackRopeWithLoading({
  stage,
  progress,
  botHandPos,
}: {
  stage: LoaderStage;
  progress: number;
  botHandPos: [number, number, number];
}) {
  const { viewport } = useThree();
  const floorY = -viewport.height * 0.34;
  const anchorLeftX = -viewport.width * 0.48;
  const anchorLeftY = floorY + 0.38;

  const meshRef = useRef<THREE.Mesh>(null);
  const textGroupRef = useRef<THREE.Group>(null);

  const fallPhys = useRef({
    leftY: anchorLeftY,
    midY: anchorLeftY - 0.1,
    velY: 0,
    settled: false,
  });

  useEffect(() => {
    if (stage === 'pulling') {
      fallPhys.current = {
        leftY: anchorLeftY,
        midY: anchorLeftY - 0.1,
        velY: 0,
        settled: false,
      };
    }
  }, [stage, anchorLeftY]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    const handX = botHandPos[0];
    const handY = botHandPos[1];
    const handZ = botHandPos[2];

    let p0: THREE.Vector3;
    let p1: THREE.Vector3;
    let p2: THREE.Vector3;
    let p3: THREE.Vector3;
    let p4: THREE.Vector3;

    if (stage === 'pulling') {
      const strainVibe = Math.sin(t * 45) * (0.01 * (progress / 100));
      const naturalSag = 0.08 * (1 - (progress / 100) * 0.75);

      p0 = new THREE.Vector3(anchorLeftX, anchorLeftY, 0);
      p1 = new THREE.Vector3(
        THREE.MathUtils.lerp(anchorLeftX, handX, 0.25),
        THREE.MathUtils.lerp(anchorLeftY, handY, 0.25) - naturalSag * 0.7 + strainVibe,
        handZ * 0.25
      );
      p2 = new THREE.Vector3(
        THREE.MathUtils.lerp(anchorLeftX, handX, 0.55),
        THREE.MathUtils.lerp(anchorLeftY, handY, 0.55) - naturalSag + strainVibe,
        handZ * 0.55
      );
      p3 = new THREE.Vector3(
        THREE.MathUtils.lerp(anchorLeftX, handX, 0.85),
        THREE.MathUtils.lerp(anchorLeftY, handY, 0.85) - naturalSag * 0.4 + strainVibe,
        handZ * 0.85
      );
      p4 = new THREE.Vector3(handX + 0.08, handY, handZ);

      if (textGroupRef.current) {
        const slideAlpha = 0.28 + (progress / 100) * 0.62;
        const curX = THREE.MathUtils.lerp(anchorLeftX, handX, slideAlpha);
        const curY = THREE.MathUtils.lerp(anchorLeftY, handY, slideAlpha) - naturalSag + 0.2;
        textGroupRef.current.position.set(curX, curY, handZ * slideAlpha + 0.1);
      }
    } else {
      const phys = fallPhys.current;
      if (!phys.settled) {
        phys.velY += delta * 18.0;
        phys.leftY -= phys.velY * delta;
        phys.midY -= phys.velY * delta;

        if (phys.leftY <= floorY + 0.03) {
          phys.leftY = floorY + 0.03;
          phys.midY = floorY + 0.03;
          phys.settled = true;
        }
      }

      p0 = new THREE.Vector3(anchorLeftX + 0.1, phys.leftY, 0);
      p1 = new THREE.Vector3(anchorLeftX * 0.5, THREE.MathUtils.clamp(phys.midY + 0.02, floorY + 0.03, 2), 0.02);
      p2 = new THREE.Vector3(-viewport.width * 0.1, floorY + 0.03, 0.04);
      p3 = new THREE.Vector3(0.0, floorY + 0.03, 0.06);
      p4 = new THREE.Vector3(viewport.width * 0.05, floorY + 0.03, 0.08);
    }

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
    const newGeo = new THREE.TubeGeometry(curve, 32, 0.038, 8, false);
    meshRef.current.geometry.dispose();
    meshRef.current.geometry = newGeo;
  });

  const initialCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(anchorLeftX, anchorLeftY, 0),
      new THREE.Vector3(anchorLeftX * 0.5, anchorLeftY - 0.05, 0),
      new THREE.Vector3(-0.3, anchorLeftY, 0.05),
    ]);
  }, [anchorLeftX, anchorLeftY]);

  return (
    <group>
      <mesh ref={meshRef}>
        <tubeGeometry args={[initialCurve, 32, 0.038, 8, false]} />
        <meshStandardMaterial color="#09090b" roughness={0.78} metalness={0.22} />
      </mesh>

      <mesh position={[anchorLeftX, anchorLeftY, 0]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.065, 0.018, 8, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {stage === 'pulling' && (
        <group ref={textGroupRef} position={[anchorLeftX * 0.5, anchorLeftY + 0.25, 0.1]}>
          <Text
            fontSize={Math.min(0.45, Math.max(0.28, viewport.width / 16))}
            color="#0f172a"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.025}
            outlineColor="#f8fafc"
          >
            {`${progress}%`}
          </Text>
        </group>
      )}
    </group>
  );
}

// ============================================================================
// 5. OVERHEAD COMPANION ROBOT (PINNED TO TOP VIEWPORT SO HE'S ALWAYS VISIBLE!)
//    Phase 1 (wave / curtain_half): Peeks well into screen & pulls halfway.
//    Phase 2 (curtain_strain): Drops LOWER into screen, squints >_< & strains!
//    Phase 3 (curtain_final): Heaves upward as curtain clears!
// ============================================================================
function OverheadCurtainBot3D({ stage }: { stage: LoaderStage }) {
  const { viewport } = useThree();
  const group = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const botScale = Math.min(0.9, Math.max(0.55, viewport.width / 8.5));

  const expression: FaceExpression =
    stage === 'curtain_strain' || stage === 'curtain_final' ? 'determined' : 'happy';
  const faceTexture = useOledFaceTexture(expression);

  const topHiddenY = viewport.height * 0.5 + 1.2;
  const peekY = viewport.height * 0.5 - 0.65; // Clearly visible head & torso!
  const lowerStrainY = viewport.height * 0.5 - 1.05; // Comes noticeably lower to apply force!

  useFrame((state, delta) => {
    if (!group.current || !bodyRef.current) return;
    const t = state.clock.elapsedTime;

    let targetY = topHiddenY;
    if (stage === 'wave' || stage === 'curtain_half') {
      targetY = peekY;
    } else if (stage === 'curtain_strain') {
      targetY = lowerStrainY;
    } else if (stage === 'curtain_final') {
      targetY = peekY + 0.35;
    }

    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 5.5, delta);

    // Physical exertion shake & backward lean when applying force!
    if (stage === 'curtain_strain') {
      bodyRef.current.rotation.x = THREE.MathUtils.damp(bodyRef.current.rotation.x, 0.15, 6, delta);
      bodyRef.current.position.x = Math.sin(t * 38) * 0.025;
    } else if (stage === 'curtain_final') {
      bodyRef.current.rotation.x = THREE.MathUtils.damp(bodyRef.current.rotation.x, -0.15, 6, delta);
      bodyRef.current.position.x = 0;
    } else {
      bodyRef.current.rotation.x = THREE.MathUtils.damp(bodyRef.current.rotation.x, 0.38, 5, delta);
      bodyRef.current.position.x = 0;
    }
  });

  return (
    <group ref={group} position={[0, topHiddenY, 0]} scale={botScale}>
      <group ref={bodyRef} rotation={[0.38, 0, 0]}>
        {/* Torso peeking over the top edge */}
        <RoundedBox args={[0.42, 0.34, 0.36]} radius={0.08} position={[0, -0.05, 0]}>
          <meshStandardMaterial color="#f8fafc" roughness={0.15} />
        </RoundedBox>
        <RoundedBox args={[0.44, 0.06, 0.38]} radius={0.02} position={[0, -0.2, 0]}>
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </RoundedBox>

        {/* Rounded Head + Animated OLED Face */}
        <group position={[0, 0.3, 0.05]}>
          <RoundedBox args={[0.56, 0.44, 0.48]} radius={0.12} smoothness={5}>
            <meshStandardMaterial color="#f8fafc" roughness={0.12} />
          </RoundedBox>
          <RoundedBox args={[0.46, 0.36, 0.04]} radius={0.02} position={[0, 0, 0.23]}>
            <meshStandardMaterial color="#0284c7" roughness={0.25} />
          </RoundedBox>
          {faceTexture && (
            <mesh position={[0, 0, 0.252]}>
              <planeGeometry args={[0.4, 0.31]} />
              <meshBasicMaterial map={faceTexture} />
            </mesh>
          )}
          {/* Blue Ear Caps */}
          <mesh position={[0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.095, 0.095, 0.05, 24]} />
            <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.2} />
          </mesh>
          <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.095, 0.095, 0.05, 24]} />
            <meshStandardMaterial color="#0284c7" metalness={0.3} roughness={0.2} />
          </mesh>
        </group>

        {/* Articulated Arms Reaching Down Gripping the Curtain Hoist Cable */}
        <group position={[-0.26, -0.1, 0.14]}>
          <mesh position={[0, -0.18, 0.06]} rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.036, 0.38, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <RoundedBox args={[0.1, 0.1, 0.1]} radius={0.025} position={[0, -0.35, 0.12]}>
            <meshStandardMaterial color="#0284c7" metalness={0.4} />
          </RoundedBox>
        </group>

        <group position={[0.26, -0.1, 0.14]}>
          <mesh position={[0, -0.18, 0.06]} rotation={[0.35, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.036, 0.38, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <RoundedBox args={[0.1, 0.1, 0.1]} radius={0.025} position={[0, -0.35, 0.12]}>
            <meshStandardMaterial color="#0284c7" metalness={0.4} />
          </RoundedBox>
        </group>

        {/* Hoist Grip Bar & Vertical Pull Cables */}
        <mesh position={[0, -0.45, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.72, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 6. RESPONSIVE GROUND SHADOW WRAPPER
// ============================================================================
function ResponsiveGroundShadow() {
  const { viewport } = useThree();
  const floorY = -viewport.height * 0.34;
  return (
    <ContactShadows
      position={[0, floorY - 0.01, 0]}
      opacity={0.38}
      scale={Math.max(10, viewport.width * 1.4)}
      blur={2.4}
      far={4}
      color="#0f172a"
    />
  );
}

// ============================================================================
// 7. MASTER LOADER TIMELINE & TWO-STAGE CURTAIN HOIST CONTROLLER
// ============================================================================
export default function RobotLoader({ onComplete, siteRef }: RobotLoaderProps) {
  const curtainRef = useRef<HTMLDivElement>(null);
  const overheadLayerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<LoaderStage>('pulling');
  const [handPos, setHandPos] = useState<[number, number, number]>([-0.5, -0.9, 0.1]);
  const sequenceStartedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const siteRefCurrent = useRef(siteRef);
  siteRefCurrent.current = siteRef;

  // Loading Progress Loop (0% -> 100%)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        if (prev % 8 === 0) sound.playRotaryTick();
        return prev + 1;
      });
    }, 32);

    return () => clearInterval(interval);
  }, []);

  // Choreography Timeline
  useEffect(() => {
    if (progress >= 100 && !sequenceStartedRef.current) {
      sequenceStartedRef.current = true;

      // 1. SNAP! Percentage disappears, rope falls, BEEP tumbles backward!
      sound.playSnap();
      setStage('snap');

      // 2. STAND UP & FACE USER
      const t1 = setTimeout(() => {
        sound.playCartoonBoing();
        setStage('standup');
      }, 900);

      // 3. DIZZY STARS & HEAD RUB
      const t2 = setTimeout(() => {
        setStage('dizzy');
      }, 1750);

      // 4. WAVE + "Hii!" + OVERHEAD BOT ENTERS AT TOP
      const t3 = setTimeout(() => {
        sound.playSuccess();
        setStage('wave');
      }, 2900);

      // 5. TWO-STAGE CURTAIN HOIST (Halfway -> Lower & Strain -> Final Clear!)
      const t4 = setTimeout(() => {
        if (!curtainRef.current || !overheadLayerRef.current) return;
        const siteEl = siteRefCurrent.current?.current;

        const tl = gsap.timeline({
          onComplete: () => {
            if (siteEl) {
              gsap.set(siteEl, { clearProps: 'transform' });
            }
            if (onCompleteRef.current) onCompleteRef.current();
          },
        });

        // Beat A: Snug curtain edge to BEEP's feet (84.5vh), then pull halfway while pushing site up in 1:1 sync!
        tl.call(() => {
          sound.playPneumatic();
          setStage('curtain_half');
        })
          .to(curtainRef.current, {
            height: '84.5vh',
            duration: 0.28,
            ease: 'power2.in',
          })
          .to(
            siteEl || {},
            {
              y: '84.5vh',
              duration: 0.28,
              ease: 'power2.in',
            },
            '<'
          )
          .to(curtainRef.current, {
            y: '-40vh',
            duration: 0.8,
            ease: 'power2.out',
          })
          .to(
            siteEl || {},
            {
              y: '44.5vh',
              duration: 0.8,
              ease: 'power2.out',
            },
            '<'
          )
          // Beat B: Pause, bot comes lower & applies force (>_< strain!)
          .call(() => {
            sound.playCartoonBoing();
            setStage('curtain_strain');
          })
          .to({}, { duration: 0.65 })
          // Beat C: Final mighty heave — curtain clears top & site pushes cleanly to 0vh!
          .call(() => {
            sound.playPneumatic();
            setStage('curtain_final');
          })
          .to(curtainRef.current, {
            y: '-92vh',
            duration: 0.95,
            ease: 'power3.inOut',
          })
          .to(
            siteEl || {},
            {
              y: '0vh',
              duration: 0.95,
              ease: 'power3.inOut',
            },
            '<'
          )
          // Overhead bot retracts cleanly out the top edge
          .to(
            overheadLayerRef.current,
            {
              yPercent: -100,
              duration: 0.45,
              ease: 'power2.in',
            },
            '-=0.2'
          );
      }, 4200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [progress]);

  const showOverheadCanvas =
    stage === 'wave' ||
    stage === 'curtain_half' ||
    stage === 'curtain_strain' ||
    stage === 'curtain_final';

  return (
    <>
      {/* MAIN CURTAIN STAGE (BEEP + ROPE + GRID BACKGROUND) */}
      <div
        ref={curtainRef}
        className="fixed top-0 inset-x-0 h-screen z-50 bg-[#f8fafc] text-slate-900 select-none overflow-hidden studio-grid will-change-transform border-b-4 border-slate-300 shadow-2xl"
      >
        <div className="absolute top-0 inset-x-0 w-full h-screen flex items-center justify-center">
          <Canvas
            camera={{ position: [0, 0.0, 5.2], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={1.4} />
            <directionalLight position={[6, 9, 6]} intensity={2.2} />
            <directionalLight position={[-6, 4, -2]} intensity={0.9} color="#38bdf8" />
            <pointLight position={[0, 3, 2]} intensity={1.4} color="#e0f2fe" />

            <Suspense fallback={null}>
              <PixarBeepRobot
                stage={stage}
                progress={progress}
                onHandUpdate={(pos) => setHandPos(pos)}
              />

              <PitchBlackRopeWithLoading
                stage={stage}
                progress={progress}
                botHandPos={handPos}
              />
            </Suspense>

            <ResponsiveGroundShadow />
          </Canvas>
        </div>
      </div>

      {/* OVERHEAD COMPANION BOT LAYER (ALWAYS VISIBLE AT TOP WHILE HOISTING CURTAIN) */}
      <div
        ref={overheadLayerRef}
        className={`fixed inset-0 z-[60] pointer-events-none will-change-transform transition-opacity duration-300 ${
          showOverheadCanvas ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Canvas
          camera={{ position: [0, 0.0, 5.2], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={1.4} />
          <directionalLight position={[6, 9, 6]} intensity={2.2} />
          <directionalLight position={[-6, 4, -2]} intensity={0.9} color="#38bdf8" />
          <Suspense fallback={null}>
            <OverheadCurtainBot3D stage={stage} />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}
