'use client';

import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { sound } from '@/utils/audio';
import { createBeepRobot, LoaderStage } from './kits/beepRobotKit';
import { createTowCableAssembly } from './kits/towCableKit';

interface RobotLoaderProps {
  onComplete?: () => void;
  siteRef?: React.RefObject<HTMLDivElement>;
}

type FaceExpression = 'determined' | 'surprised' | 'dizzy' | 'happy';

// ============================================================================
// 1. STUDIO PMREM ENVIRONMENT (3dviz-pro-max lighting-studio pattern)
// ============================================================================
function StudioEnvironment({ intensity = 0.28 }: { intensity?: number }) {
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
// 2. DYNAMIC ANIMATED OLED FACE TEXTURE (PIXAR "BEEP" EXPRESSIONS)
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
      // Tom & Jerry style hypnotic concentric spiral eyes
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
// 3. TOM & JERRY STYLE COMIC DIZZY HALO
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
    if (haloRef.current) haloRef.current.rotation.y += delta * 3.2;
    if (innerRingRef.current) innerRingRef.current.rotation.y -= delta * 2.0;
  });

  const starColors = ['#fbbf24', '#38bdf8', '#fb7185', '#fde047', '#fbbf24', '#38bdf8'];

  return (
    <group position={[0, 0.14, 0]} rotation={[0.32, 0, -0.14]}>
      <group ref={haloRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 0.92, 1]}>
          <torusGeometry args={[0.72, 0.012, 8, 48]} />
          <meshBasicMaterial color="#334155" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2 + 0.08, 0.1, 0]} scale={[0.95, 1.05, 1]}>
          <torusGeometry args={[0.64, 0.009, 8, 48]} />
          <meshBasicMaterial color="#64748b" transparent opacity={0.45} />
        </mesh>

        <CurvedComicWord word="BONK!" radius={0.76} startAngle={-0.45} stepAngle={0.22} color="#fb923c" fontSize={0.21} />
        <CurvedComicWord word="DIZZY!" radius={0.76} startAngle={Math.PI - 0.52} stepAngle={0.2} color="#fde047" fontSize={0.19} />

        {starColors.map((col, i) => {
          const angle = (i / starColors.length) * Math.PI * 2 + 0.4;
          const r = i % 2 === 0 ? 0.72 : 0.6;
          const yOff = i % 2 === 0 ? -0.04 : 0.12;
          return (
            <group key={i} position={[Math.sin(angle) * r, yOff, Math.cos(angle) * r]}>
              <mesh rotation={[0.4, angle, 0.3]}>
                <octahedronGeometry args={[0.065, 0]} />
                <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.85} roughness={0.2} />
              </mesh>
            </group>
          );
        })}
      </group>

      <group ref={innerRingRef} position={[0, 0.16, 0]}>
        {[0, Math.PI * 0.66, Math.PI * 1.33].map((angle, i) => (
          <mesh key={i} position={[Math.sin(angle) * 0.48, 0, Math.cos(angle) * 0.48]}>
            <octahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color="#fde047" emissive="#fbbf24" emissiveIntensity={1.0} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ============================================================================
// 4. UNIFIED FLOOR SCENE (BEEP KIT + BRAIDED TOW CABLE KIT IN 1-FRAME LOCK)
// ============================================================================
function UnifiedFloorScene({
  stage,
  progress,
}: {
  stage: LoaderStage;
  progress: number;
}) {
  const { viewport } = useThree();
  const floorY = -viewport.height * 0.34;
  const anchorX = -viewport.width * 0.48;
  const anchorY = floorY + 0.38;
  const botScale = Math.min(0.9, Math.max(0.55, viewport.width / 8.5));

  const expression: FaceExpression = useMemo(() => {
    if (stage === 'pulling') return 'determined';
    if (stage === 'snap') return 'surprised';
    if (stage === 'standup' || stage === 'dizzy') return 'dizzy';
    return 'happy';
  }, [stage]);

  const faceTexture = useOledFaceTexture(expression);

  const robotKit = useMemo(() => createBeepRobot({ variant: 'floor', faceTexture }), []);
  const cableKit = useMemo(() => createTowCableAssembly({ anchorX, anchorY }), []);

  useEffect(() => {
    robotKit.setFaceTexture(faceTexture);
  }, [robotKit, faceTexture]);

  useEffect(() => {
    robotKit.group.position.set(-viewport.width * 0.04, floorY, 0);
    robotKit.group.rotation.set(0, -Math.PI + 0.38, 0.32);
    robotKit.group.scale.setScalar(botScale);
  }, [robotKit, floorY, botScale, viewport.width]);

  useEffect(() => {
    return () => {
      robotKit.dispose();
      cableKit.dispose();
    };
  }, [robotKit, cableKit]);

  const badgeGroupRef = useRef<THREE.Group>(null);
  const headSocketAnchorRef = useRef<THREE.Group>(null);
  const gripWorldPos = useMemo(() => new THREE.Vector3(), []);
  const headTopWorldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    // 1. Advance authoritative robot kinematics
    robotKit.animate?.(delta, {
      stage,
      progress,
      elapsed,
      floorY,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    });
    robotKit.group.scale.setScalar(botScale);
    robotKit.group.updateMatrixWorld(true);

    // 2. Read exact ropeGrip socket in world space & feed directly into tow cable (zero frame lag!)
    robotKit.getSocketWorldPosition('ropeGrip', gripWorldPos);
    cableKit.animate?.(delta, {
      stage,
      progress,
      elapsed,
      floorY,
      anchorX,
      anchorY,
      gripWorldPos,
    });

    // 3. Sync percentage badge to cable midpoint
    if (badgeGroupRef.current && stage === 'pulling') {
      badgeGroupRef.current.position.copy(cableKit.badgePosition);
    }

    // 4. Sync headTop overlay (DizzyHalo / "Hii!" bubble) to robot's headTop socket
    if (headSocketAnchorRef.current) {
      robotKit.getSocketWorldPosition('headTop', headTopWorldPos);
      headSocketAnchorRef.current.position.copy(headTopWorldPos);
      headSocketAnchorRef.current.scale.setScalar(botScale);
    }
  });

  const showHiBubble =
    stage === 'wave' ||
    stage === 'curtain_half' ||
    stage === 'curtain_strain' ||
    stage === 'curtain_final';

  return (
    <group>
      <primitive object={robotKit.group} />
      <primitive object={cableKit.group} />

      {stage === 'pulling' && (
        <group ref={badgeGroupRef} position={[anchorX * 0.5, anchorY + 0.25, 0.1]}>
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

      <group ref={headSocketAnchorRef}>
        {stage === 'dizzy' && <DizzyHalo />}
        {showHiBubble && (
          <Float speed={2.5} rotationIntensity={0.15} floatIntensity={0.25}>
            <group position={[0.68, 0.22, 0]}>
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

      <ContactShadows
        position={[0, floorY - 0.01, 0]}
        opacity={0.38}
        scale={Math.max(10, viewport.width * 1.4)}
        blur={2.4}
        far={4}
        color="#0f172a"
      />
    </group>
  );
}

// ============================================================================
// 5. UNIFIED OVERHEAD COMPANION BOT (SAME 3dviz-pro-max BEEP KIT)
// ============================================================================
function OverheadCurtainScene({ stage }: { stage: LoaderStage }) {
  const { viewport } = useThree();
  const botScale = Math.min(0.9, Math.max(0.55, viewport.width / 8.5));

  const expression: FaceExpression =
    stage === 'curtain_strain' || stage === 'curtain_final' ? 'determined' : 'happy';
  const faceTexture = useOledFaceTexture(expression);

  const overheadKit = useMemo(() => createBeepRobot({ variant: 'overhead', faceTexture }), []);

  useEffect(() => {
    overheadKit.setFaceTexture(faceTexture);
  }, [overheadKit, faceTexture]);

  useEffect(() => {
    overheadKit.group.position.set(0, viewport.height * 0.5 + 1.2, 0);
    overheadKit.group.scale.setScalar(botScale);
  }, [overheadKit, viewport.height, botScale]);

  useEffect(() => {
    return () => {
      overheadKit.dispose();
    };
  }, [overheadKit]);

  useFrame((state, delta) => {
    overheadKit.animate?.(delta, {
      stage,
      progress: 100,
      elapsed: state.clock.elapsedTime,
      floorY: -viewport.height * 0.34,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    });
    overheadKit.group.scale.setScalar(botScale);
  });

  return <primitive object={overheadKit.group} />;
}

// ============================================================================
// 6. MASTER DIRECTOR TIMELINE (1:1 SYNC ACROSS ROPE, BEEP, CURTAIN & SITE)
// ============================================================================
export default function RobotLoader({ onComplete, siteRef }: RobotLoaderProps) {
  const curtainRef = useRef<HTMLDivElement>(null);
  const overheadLayerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<LoaderStage>('pulling');
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

  // Single Authoritative GSAP Master Timeline
  useEffect(() => {
    if (progress < 100 || sequenceStartedRef.current) return;
    sequenceStartedRef.current = true;

    const siteEl = siteRefCurrent.current?.current;

    const master = gsap.timeline({
      onComplete: () => {
        if (siteEl) {
          gsap.set(siteEl, { clearProps: 'transform' });
        }
        onCompleteRef.current?.();
      },
    });

    // 1. SNAP! Cable detaches with Verlet whip & BEEP tumbles backward
    master
      .call(() => {
        sound.playSnap();
        setStage('snap');
      })
      .to({}, { duration: 0.9 })
      // 2. STAND UP & FACE USER
      .call(() => {
        sound.playCartoonBoing();
        setStage('standup');
      })
      .to({}, { duration: 0.85 })
      // 3. DIZZY HALO & HEAD RUB
      .call(() => {
        setStage('dizzy');
      })
      .to({}, { duration: 1.15 })
      // 4. WAVE "Hii!" + OVERHEAD BOT ENTERS AT TOP
      .call(() => {
        sound.playSuccess();
        setStage('wave');
      })
      .to({}, { duration: 1.3 })
      // 5. TWO-STAGE CURTAIN HOIST (1:1 synchronized with siteRef push-up)
      .call(() => {
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
      // Beat B: Overhead bot drops lower & applies >_< strain
      .call(() => {
        sound.playCartoonBoing();
        setStage('curtain_strain');
      })
      .to({}, { duration: 0.65 })
      // Beat C: Final heave clears curtain & brings site cleanly to 0vh
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
      .to(
        overheadLayerRef.current,
        {
          yPercent: -100,
          duration: 0.45,
          ease: 'power2.in',
        },
        '-=0.2'
      );

    return () => {
      master.kill();
    };
  }, [progress]);

  const showOverheadCanvas =
    stage === 'wave' ||
    stage === 'curtain_half' ||
    stage === 'curtain_strain' ||
    stage === 'curtain_final';

  return (
    <>
      {/* MAIN CURTAIN STAGE (UNIFIED FLOOR BEEP + BRAIDED TOW CABLE + WINCH) */}
      <div
        ref={curtainRef}
        className="fixed top-0 inset-x-0 h-screen z-50 bg-[#f8fafc] text-slate-900 select-none overflow-hidden studio-grid will-change-transform border-b-4 border-slate-300 shadow-2xl"
      >
        <div className="absolute top-0 inset-x-0 w-full h-screen flex items-center justify-center">
          <Canvas
            shadows
            camera={{ position: [0, 0.0, 5.2], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
          >
            <StudioEnvironment intensity={0.28} />
            <ambientLight intensity={1.1} />
            <directionalLight position={[6, 9, 6]} intensity={2.1} castShadow />
            <directionalLight position={[-6, 4, -2]} intensity={0.85} color="#38bdf8" />
            <pointLight position={[0, 3, 2]} intensity={1.2} color="#e0f2fe" />

            <Suspense fallback={null}>
              <UnifiedFloorScene stage={stage} progress={progress} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* OVERHEAD COMPANION BOT LAYER (SAME BEEP KIT, 1:1 HOIST SYNC) */}
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
          <StudioEnvironment intensity={0.28} />
          <ambientLight intensity={1.1} />
          <directionalLight position={[6, 9, 6]} intensity={2.1} />
          <directionalLight position={[-6, 4, -2]} intensity={0.85} color="#38bdf8" />
          <Suspense fallback={null}>
            <OverheadCurtainScene stage={stage} />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
}
