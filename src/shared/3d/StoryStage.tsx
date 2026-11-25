'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

interface StoryStageProps {
  progress: number;
  activeAct: number;
}

function AmbientDepthField({ progress }: { progress: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.02 + progress * 0.4;
      pointsRef.current.rotation.x = Math.sin(t * 0.01) * 0.1;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.05;
      ringRef.current.rotation.y = t * 0.03 + progress * 0.6;
    }
  });

  const positions = React.useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 18;
      pos[i + 1] = (Math.random() - 0.5) * 18;
      pos[i + 2] = (Math.random() - 0.5) * 14;
    }
    return pos;
  }, []);

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#94a3b8" transparent opacity={0.3} />
      </points>

      {/* Floating Spatial Geometric Contour Rings */}
      <group ref={ringRef} position={[2, 0, -2]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[3.2, 0.012, 16, 100]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
          <torusGeometry args={[4.1, 0.01, 16, 100]} />
          <meshBasicMaterial color="#64748b" transparent opacity={0.18} />
        </mesh>
      </group>

      <Sparkles count={40} scale={10} size={2} speed={0.2} opacity={0.35} color="#0284c7" />
    </group>
  );
}

export default function StoryStage({ progress, activeAct }: StoryStageProps) {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={1.0} />
        <AmbientDepthField progress={progress} />
      </Canvas>
    </div>
  );
}
