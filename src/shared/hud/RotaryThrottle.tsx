'use client';

import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, Play, Pause, Sliders, Cpu } from 'lucide-react';
import { sound } from '@/utils/audio';

interface RotaryThrottleProps {
  progress: number; // 0.0 to 1.0
  onChangeProgress: (val: number) => void;
  onTriggerActuator: () => void;
  isCycling: boolean;
}

export default function RotaryThrottle({
  progress,
  onChangeProgress,
  onTriggerActuator,
  isCycling,
}: RotaryThrottleProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastAngle = useRef(0);

  // Calculate angle from center on mouse drag
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    sound.playClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = rad * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    // Map 0-360 degrees to 0.0 - 1.0 progress
    const nextVal = Math.min(1, Math.max(0, deg / 360));
    if (Math.abs(nextVal - progress) > 0.03) {
      sound.playRotaryTick();
      onChangeProgress(nextVal);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const percentage = Math.round(progress * 100);
  const rotationDeg = progress * 360;

  return (
    <aside className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto font-mono text-xs select-none">
      {/* Interactive Actuator Trigger Button */}
      <button
        onClick={() => {
          sound.playPneumatic();
          onTriggerActuator();
        }}
        disabled={isCycling}
        className={`px-4 py-2.5 rounded-2xl border text-xs font-bold tracking-wider transition-all flex items-center gap-2.5 shadow-lg ${
          isCycling
            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
            : 'border-slate-200 bg-white/90 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-800 hover:text-emerald-900'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isCycling ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'
          }`}
        />
        <span>{isCycling ? 'ACTUATOR CYCLING...' : 'TEST 3D GRIPPER CYCLE'}</span>
      </button>

      {/* Rotary Throttle / Dial Console (Carter Ogunsola Inspired) */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-200/90 bg-white/85 backdrop-blur-xl shadow-xl flex items-center gap-4">
        {/* Physical Rotary Dial */}
        <div
          ref={dialRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border-2 border-slate-300 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md group"
          title="Drag dial to scrub exploded 3D teardown"
        >
          {/* Outer Tick Ring */}
          <div
            className="absolute inset-0 rounded-full transition-transform duration-75"
            style={{ transform: `rotate(${rotationDeg}deg)` }}
          >
            {/* Dial Notch Indicator */}
            <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-sky-600 rounded-full shadow-sm" />
          </div>

          {/* Center Hub */}
          <div className="w-8 h-8 rounded-full bg-white border border-slate-300/80 flex items-center justify-center text-[10px] text-slate-600 group-hover:text-sky-600 shadow-inner font-bold">
            ⚙
          </div>
        </div>

        {/* Dial Readout & Controls */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="font-semibold">TEARDOWN THROTTLE</span>
            <span className="text-sky-600 font-bold">{percentage}%</span>
          </div>

          <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500 transition-all duration-75"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium pt-0.5">
            <span>ASSEMBLED</span>
            <span>EXPLODED</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
