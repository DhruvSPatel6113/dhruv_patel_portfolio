'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Cpu, ShieldCheck, Activity, Terminal, Sparkles, Layers, Box } from 'lucide-react';
import { sound } from '@/utils/audio';

interface MemoryBlock {
  id: string;
  size: number;
  address: string;
  allocated: boolean;
  tag: string;
}

interface PhysicsBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export default function DeveloperPlayground() {
  const [activeTab, setActiveTab] = useState<'memory' | 'physics' | 'ota'>('physics');

  // ==========================================
  // TAB 1: INTERACTIVE PHYSICS SANDBOX (Matter.js style)
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [balls, setBalls] = useState<PhysicsBall[]>([]);
  const [gravity, setGravity] = useState<number>(0.35);
  const [elasticity, setElasticity] = useState<number>(0.75);
  const [physicsStats, setPhysicsStats] = useState({ fps: 60, collisions: 0 });
  const animFrameRef = useRef<number>();

  useEffect(() => {
    // Initial balls
    const initialBalls: PhysicsBall[] = [
      { x: 100, y: 50, vx: 3, vy: 1, radius: 14, color: '#0284c7' },
      { x: 220, y: 40, vx: -2.5, vy: 2, radius: 18, color: '#38bdf8' },
      { x: 340, y: 70, vx: 2, vy: -1, radius: 12, color: '#6366f1' },
      { x: 180, y: 30, vx: -1.5, vy: 0, radius: 16, color: '#10b981' },
    ];
    setBalls(initialBalls);
  }, []);

  useEffect(() => {
    if (activeTab !== 'physics') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localBalls = [...balls];
    let collisionCount = 0;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const currentFps = Math.round(1 / Math.max(dt, 0.001));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update & render balls
      for (let i = 0; i < localBalls.length; i++) {
        const b = localBalls[i];

        // Apply gravity & velocity
        b.vy += gravity;
        b.x += b.vx;
        b.y += b.vy;

        // Floor collision
        if (b.y + b.radius >= canvas.height) {
          b.y = canvas.height - b.radius;
          b.vy = -b.vy * elasticity;
          b.vx *= 0.98;
          collisionCount++;
        }
        // Wall collisions
        if (b.x - b.radius <= 0) {
          b.x = b.radius;
          b.vx = -b.vx * elasticity;
          collisionCount++;
        } else if (b.x + b.radius >= canvas.width) {
          b.x = canvas.width - b.radius;
          b.vx = -b.vx * elasticity;
          collisionCount++;
        }

        // Ball vs Ball collisions
        for (let j = i + 1; j < localBalls.length; j++) {
          const b2 = localBalls[j];
          const dx = b2.x - b.x;
          const dy = b2.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < b.radius + b2.radius) {
            // Elastic collision bounce
            const normalX = dx / dist;
            const normalY = dy / dist;
            const kx = b.vx - b2.vx;
            const ky = b.vy - b2.vy;
            const p = 2 * (normalX * kx + normalY * ky) / 2;
            b.vx -= p * normalX * elasticity;
            b.vy -= p * normalY * elasticity;
            b2.vx += p * normalX * elasticity;
            b2.vy += p * normalY * elasticity;
            collisionCount++;
          }
        }

        // Render ball with glossy studio gradient
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
      }

      setPhysicsStats({ fps: Math.min(60, currentFps), collisions: collisionCount });
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTab, balls, gravity, elasticity]);

  const handleSpawnBall = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    sound.playClick();
    const colors = ['#0284c7', '#38bdf8', '#6366f1', '#10b981', '#f59e0b', '#ec4899'];
    const newBall: PhysicsBall = {
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 4,
      radius: Math.floor(Math.random() * 10) + 12,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setBalls((prev) => [...prev.slice(-14), newBall]);
  };

  // ==========================================
  // TAB 2: C++ MEMORY ALLOCATOR ENGINE
  // ==========================================
  const [memoryPool, setMemoryPool] = useState<MemoryBlock[]>([
    { id: '1', size: 64, address: '0x7ffe0000', allocated: true, tag: 'std::vector<int>' },
    { id: '2', size: 128, address: '0x7ffe0040', allocated: true, tag: 'Node* [Graph]' },
    { id: '3', size: 64, address: '0x7ffe00c0', allocated: false, tag: '[FREE CHUNK]' },
    { id: '4', size: 256, address: '0x7ffe0100', allocated: true, tag: 'PhysicsBuffer' },
    { id: '5', size: 64, address: '0x7ffe0200', allocated: false, tag: '[FREE CHUNK]' },
  ]);

  const handleMalloc = (size: number, tag: string) => {
    sound.playClick();
    // Find first free block that fits
    const freeIndex = memoryPool.findIndex((b) => !b.allocated && b.size >= size);
    if (freeIndex !== -1) {
      const updated = [...memoryPool];
      updated[freeIndex] = {
        ...updated[freeIndex],
        allocated: true,
        tag,
      };
      setMemoryPool(updated);
    } else {
      // Append new allocated block
      const last = memoryPool[memoryPool.length - 1];
      const nextAddr = '0x' + (parseInt(last.address, 16) + last.size).toString(16);
      setMemoryPool([
        ...memoryPool,
        { id: Math.random().toString(), size, address: nextAddr, allocated: true, tag },
      ]);
    }
  };

  const handleFree = () => {
    sound.playPneumatic();
    const allocatedIndices = memoryPool
      .map((b, i) => (b.allocated ? i : -1))
      .filter((i) => i !== -1);
    if (allocatedIndices.length > 0) {
      const randIdx = allocatedIndices[Math.floor(Math.random() * allocatedIndices.length)];
      const updated = [...memoryPool];
      updated[randIdx].allocated = false;
      updated[randIdx].tag = '[FREE CHUNK]';
      setMemoryPool(updated);
    }
  };

  const handleDefrag = () => {
    sound.playSuccess();
    // Coalesce all free blocks to the end
    const allocated = memoryPool.filter((b) => b.allocated);
    const totalFreeSize = memoryPool
      .filter((b) => !b.allocated)
      .reduce((acc, curr) => acc + curr.size, 0);

    const result: MemoryBlock[] = [];
    let curAddr = 0x7ffe0000;
    allocated.forEach((b) => {
      result.push({
        ...b,
        address: '0x' + curAddr.toString(16),
      });
      curAddr += b.size;
    });

    if (totalFreeSize > 0) {
      result.push({
        id: Math.random().toString(),
        size: totalFreeSize,
        address: '0x' + curAddr.toString(16),
        allocated: false,
        tag: `[COALESCED FREE: ${totalFreeSize}B]`,
      });
    }
    setMemoryPool(result);
  };

  // ==========================================
  // TAB 3: AEGIS-OTA CRYPTOGRAPHIC PIPELINE
  // ==========================================
  const [otaState, setOtaState] = useState({
    version: 'v2.4.1-rc',
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    isTampered: false,
    signatureValid: true,
    rollbackCounter: 42,
    log: 'Cluster payload synced. All cryptographic signatures verified.',
  });

  const handleTamperPayload = () => {
    sound.playRotaryTick();
    setOtaState((prev) => ({
      ...prev,
      isTampered: true,
      signatureValid: false,
      payloadHash: prev.payloadHash.substring(0, 58) + 'deadbeef',
      log: 'ALERT: Checksum mismatch detected! Signature rejected. Rollback protection triggered.',
    }));
  };

  const handleVerifyPayload = () => {
    sound.playSuccess();
    setOtaState({
      version: 'v2.4.2-stable',
      payloadHash: '4a6b2c89f01e7d32aa9c812ef4b5120938f42018ea69b148fa8120b0019284cf',
      isTampered: false,
      signatureValid: true,
      rollbackCounter: 43,
      log: 'Cryptographic SHA-256 signature verified. Firmware broadcast to cluster approved.',
    });
  };

  const totalBytes = memoryPool.reduce((acc, b) => acc + b.size, 0);
  const allocatedBytes = memoryPool.filter((b) => b.allocated).reduce((acc, b) => acc + b.size, 0);
  const memUsagePercent = Math.round((allocatedBytes / totalBytes) * 100);

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden font-sans">
      {/* Console Top Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 tracking-wider">
            INTERACTIVE DEVELOPER PLAYGROUND // LIVE SIMULATORS
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-200/60 font-mono text-xs">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('physics');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'physics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity size={13} className="text-sky-600" />
            <span>2D Physics Engine</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('memory');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'memory'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu size={13} className="text-indigo-600" />
            <span>C++ Memory Allocator</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('ota');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-semibold ${
              activeTab === 'ota'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>OTA Firmware Crypto</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 2D PHYSICS SIMULATOR */}
      {/* ======================================================== */}
      {activeTab === 'physics' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Real-Time 2D Impulse Mechanics & Collision Simulator
              </h3>
              <p className="text-slate-500 font-sans text-xs">
                Click anywhere on the canvas below to spawn dynamic rigid bodies with sub-pixel collision physics.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <span className="text-emerald-700 font-bold">FPS: {physicsStats.fps}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600 font-medium">BODIES: {balls.length}</span>
              <span className="text-slate-300">|</span>
              <span className="text-sky-700 font-medium">COLLISIONS: {physicsStats.collisions}</span>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-inner cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={800}
              height={320}
              onClick={handleSpawnBall}
              className="w-full h-[320px] block"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md border border-slate-200 text-[10px] font-mono text-slate-500">
              CLICK TO SPAWN RIGID BODY
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs pt-1">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">GRAVITY:</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={gravity}
                  onChange={(e) => setGravity(parseFloat(e.target.value))}
                  className="w-24 accent-sky-600"
                />
                <span className="text-slate-800 font-bold w-8">{gravity.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">ELASTICITY:</span>
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={elasticity}
                  onChange={(e) => setElasticity(parseFloat(e.target.value))}
                  className="w-24 accent-sky-600"
                />
                <span className="text-slate-800 font-bold w-8">{elasticity.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setBalls([
                  { x: 120, y: 50, vx: 3, vy: 1, radius: 15, color: '#0284c7' },
                  { x: 240, y: 40, vx: -2.5, vy: 2, radius: 18, color: '#38bdf8' },
                  { x: 380, y: 70, vx: 2, vy: -1, radius: 14, color: '#6366f1' },
                ]);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 font-semibold text-xs"
            >
              <RotateCcw size={12} />
              <span>RESET FIELD</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: C++ MEMORY ALLOCATOR ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'memory' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Dynamic Heap Allocator &amp; Fragmentation Debugger
              </h3>
              <p className="text-slate-500 font-sans text-xs">
                Visualizing runtime pointer bounds, memory padding, and coalesced heap fragmentation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500">UTILIZATION:</span>
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${memUsagePercent}%` }}
                />
              </div>
              <span className="font-bold text-indigo-700">{memUsagePercent}%</span>
            </div>
          </div>

          {/* Visual Memory Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>0x7ffe0000 [HEAP START]</span>
              <span>TOTAL MANAGED HEAP: {totalBytes} BYTES</span>
            </div>

            <div className="flex gap-1 p-2 rounded-2xl bg-slate-100 border border-slate-200 min-h-[90px] overflow-x-auto">
              {memoryPool.map((b) => (
                <div
                  key={b.id}
                  style={{ flexGrow: b.size }}
                  className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between select-none ${
                    b.allocated
                      ? 'bg-white border-indigo-200 shadow-sm'
                      : 'bg-slate-200/50 border-dashed border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className={b.allocated ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
                      {b.size}B
                    </span>
                    <span className="text-slate-400 text-[9px]">{b.address}</span>
                  </div>
                  <span
                    className={`font-mono text-xs truncate mt-2 font-semibold ${
                      b.allocated ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {b.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <button
              onClick={() => handleMalloc(64, 'std::string [64B]')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-sm"
            >
              + MALLOC(64B)
            </button>
            <button
              onClick={() => handleMalloc(128, 'AudioBuffer [128B]')}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold transition-all"
            >
              + MALLOC(128B)
            </button>
            <button
              onClick={handleFree}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all"
            >
              FREE RANDOM POINTER
            </button>
            <button
              onClick={handleDefrag}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold transition-all flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>COALESCE &amp; DEFRAGMENT</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: OTA FIRMWARE CRYPTOGRAPHY */}
      {/* ======================================================== */}
      {activeTab === 'ota' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Cryptographically Signed OTA Firmware Distribution (AEGIS)
              </h3>
              <p className="text-slate-500 font-sans text-xs">
                Simulating remote microcontroller firmware flashing with rollback immunity and SHA-256 verification.
              </p>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border flex items-center gap-2 ${
                otaState.signatureValid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  otaState.signatureValid ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span>{otaState.signatureValid ? 'SIGNATURE VALID: VERIFIED' : 'SECURITY BREACH: REJECTED'}</span>
            </div>
          </div>

          {/* Firmware Details Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">TARGET VERSION</span>
                <span className="font-bold text-slate-800">{otaState.version}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">ROLLBACK COUNTER</span>
                <span className="font-bold text-slate-800">SEQ #{otaState.rollbackCounter}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">INTEGRITY CHECK</span>
                <span className={otaState.signatureValid ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                  {otaState.isTampered ? 'TAMPERED IN TRANSIT' : 'SHA-256 MATCH'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-1">PAYLOAD SHA-256 DIGEST</span>
              <p className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] break-all select-all">
                {otaState.payloadHash}
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-600 flex items-center gap-2">
              <Terminal size={14} className="text-slate-400 shrink-0" />
              <span>{otaState.log}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <button
              onClick={handleVerifyPayload}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-sm"
            >
              VERIFY &amp; DEPLOY VALID FIRMWARE
            </button>
            <button
              onClick={handleTamperPayload}
              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold transition-all"
            >
              SIMULATE MAN-IN-THE-MIDDLE TAMPER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
