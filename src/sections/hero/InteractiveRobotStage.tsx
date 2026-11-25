'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, ContactShadows, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { sound } from '@/utils/audio';
import { Play, RotateCw, Sparkles, Eye, Cpu, Zap, Activity } from 'lucide-react';

interface RobotModelProps {
  currentAction: string;
  wireframe: boolean;
}

function RobotModel({ currentAction, wireframe }: RobotModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/RobotExpressive.glb');
  const { actions } = useAnimations(animations, group);

  // Play animation when currentAction changes
  useEffect(() => {
    if (!actions) return;
    const action = actions[currentAction] || actions['Idle'];
    if (action) {
      action.reset().fadeIn(0.3).play();
      return () => {
        action.fadeOut(0.3);
      };
    }
  }, [actions, currentAction]);

  // Wireframe / material tweak
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m) {
          m.wireframe = wireframe;
        }
      }
    });
  }, [scene, wireframe]);

  return (
    <group ref={group} position={[0, -1.8, 0]} scale={0.75}>
      <primitive object={scene} />

      {/* Interactive 3D Hotspot 1: Head / Vision System */}
      <Html position={[0, 3.6, 0.4]} center distanceFactor={8}>
        <div className="group relative">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-sky-300 text-[10px] font-mono text-sky-800 shadow-md cursor-pointer hover:bg-sky-50 transition-all select-none">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span className="font-bold">VISION LOGIC</span>
          </div>
          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2.5 bg-slate-900 text-white text-[10px] font-mono rounded-xl shadow-xl z-50 pointer-events-none">
            Edge object detection &amp; trajectory alignment at 60 FPS.
          </div>
        </div>
      </Html>

      {/* Interactive 3D Hotspot 2: Arm / Pick-and-Place Gripper */}
      <Html position={[-1.2, 2.2, 0.2]} center distanceFactor={8}>
        <div className="group relative">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-emerald-300 text-[10px] font-mono text-emerald-800 shadow-md cursor-pointer hover:bg-emerald-50 transition-all select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">2Y+ PROD GRIPPER</span>
          </div>
          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] font-mono rounded-xl shadow-xl z-50 pointer-events-none">
            Pneumatic 1-axis actuator fixture running continuously on active factory line.
          </div>
        </div>
      </Html>

      {/* Interactive 3D Hotspot 3: Core / Firmware */}
      <Html position={[0.9, 1.6, 0.2]} center distanceFactor={8}>
        <div className="group relative">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-indigo-300 text-[10px] font-mono text-indigo-800 shadow-md cursor-pointer hover:bg-indigo-50 transition-all select-none">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-bold">C++ FIRMWARE</span>
          </div>
          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2.5 bg-slate-900 text-white text-[10px] font-mono rounded-xl shadow-xl z-50 pointer-events-none">
            Low-level memory-safe microcontroller routines with OTA rollback protection.
          </div>
        </div>
      </Html>
    </group>
  );
}

// Fallback Khronos Damaged Helmet model
function HelmetModel({ wireframe }: { wireframe: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/DamagedHelmet.glb');

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.4;
    }
  });

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m) {
          m.wireframe = wireframe;
        }
      }
    });
  }, [scene, wireframe]);

  return (
    <group ref={group} position={[0, 0, 0]} scale={1.8}>
      <primitive object={scene} />
    </group>
  );
}

export default function InteractiveRobotStage() {
  const [modelType, setModelType] = useState<'robot' | 'helmet'>('robot');
  const [animation, setAnimation] = useState<string>('Wave');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const animationsList = ['Wave', 'ThumbsUp', 'Jump', 'Dance', 'Punch', 'Walking', 'Idle'];

  const handleSelectAnimation = (anim: string) => {
    sound.playClick();
    setAnimation(anim);
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden font-sans">
      {/* 3D Stage Top Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
          </span>
          <span className="font-bold text-slate-800 tracking-wider">
            3D SPATIAL KINEMATICS LAB // REAL-TIME WEBGL RIG
          </span>
        </div>

        {/* Model Switcher & Wireframe Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-200/60 font-semibold text-[11px]">
            <button
              onClick={() => {
                sound.playClick();
                setModelType('robot');
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'robot' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Articulated Robot
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setModelType('helmet');
              }}
              className={`px-3 py-1 rounded-lg transition-all ${
                modelType === 'helmet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PBR Cyber Helmet
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setWireframe(!wireframe);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
              wireframe
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {wireframe ? 'Shaded' : 'Wireframe'}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setAutoRotate(!autoRotate);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
              autoRotate
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {autoRotate ? 'Rotate: On' : 'Rotate: Off'}
          </button>
        </div>
      </div>

      {/* Interactive 3D Canvas Viewport */}
      <div className="relative w-full h-[460px] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] select-none cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 1.2, 4.8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[6, 9, 6]} intensity={2.2} castShadow />
          <directionalLight position={[-6, 4, -2]} intensity={0.8} color="#38bdf8" />
          <pointLight position={[0, 3, 2]} intensity={1.5} color="#e0f2fe" />

          <Suspense fallback={null}>
            {modelType === 'robot' ? (
              <RobotModel currentAction={animation} wireframe={wireframe} />
            ) : (
              <HelmetModel wireframe={wireframe} />
            )}
          </Suspense>

          {/* Interactive Camera OrbitControls: user can click and drag to rotate 360 degrees */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={1.2}
            minDistance={2.5}
            maxDistance={7.5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.9}
          />

          {/* Contact Shadows for studio grounding */}
          <ContactShadows
            position={[0, -1.82, 0]}
            opacity={0.4}
            scale={8}
            blur={2.4}
            far={4}
            color="#0f172a"
          />
        </Canvas>

        {/* Orbit Helper Pill */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-[10px] font-mono text-slate-500 shadow-sm pointer-events-none">
          DRAG TO ROTATE 360&deg; &bull; SCROLL TO ZOOM
        </div>
      </div>

      {/* Animation Controls Bar (only active for Robot) */}
      {modelType === 'robot' && (
        <div className="p-4 border-t border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-sky-600" />
            <span className="text-slate-500 font-bold">TRIGGER RIG ACTIONS:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {animationsList.map((anim) => (
              <button
                key={anim}
                onClick={() => handleSelectAnimation(anim)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  animation === anim
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {anim}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/RobotExpressive.glb');
useGLTF.preload('/models/DamagedHelmet.glb');
