'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ExternalLink, Command } from 'lucide-react';
import { sound } from '@/utils/audio';

interface TelemetryHUDProps {
  onOpenCommandPalette: () => void;
  onSecretTrigger: () => void;
}

export default function TelemetryHUD({
  onOpenCommandPalette,
  onSecretTrigger,
}: TelemetryHUDProps) {
  const [soundActive, setSoundActive] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [currentTime, setCurrentTime] = useState('');

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundActive;
    sound.enabled = next;
    setSoundActive(next);
    if (next) sound.playClick();
  };

  const handleLedClick = () => {
    sound.playClick();
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setClickCount(0);
      onSecretTrigger();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between font-mono text-[11px] text-slate-500 border border-slate-200/80 pb-3 pt-3 px-5 pointer-events-auto bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm">
        {/* Left: Identity & Production Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLedClick}
            className="flex items-center gap-2 text-slate-800 hover:text-sky-600 transition-colors focus:outline-none group"
            title="Production Hardware State"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold tracking-widest text-slate-900 group-hover:text-sky-600">
              DHRUV PATEL
            </span>
          </button>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-600 hidden sm:inline">CSE &apos;29 &bull; VIT VELLORE</span>
          <span className="text-slate-300 hidden md:inline">|</span>
          <span className="text-emerald-700 font-semibold hidden md:inline">GRIPPER UPTIME: 2.1Y+ (99.9%)</span>
        </div>

        {/* Center: Coordinates & Real-time Clock */}
        <div className="hidden lg:flex items-center gap-3 text-slate-400">
          <span>LAT: 12.9692&deg;N // LNG: 79.1559&deg;E</span>
          <span className="text-slate-300">&bull;</span>
          <span className="text-slate-800 font-bold">{currentTime || '12:26:00 IST'}</span>
        </div>

        {/* Right: Command Palette, Audio Toggle, Socials */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onOpenCommandPalette();
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-950 transition-all flex items-center gap-1.5"
            title="Open Command Palette (⌘K)"
          >
            <Command size={11} className="text-sky-600" />
            <span className="hidden sm:inline font-semibold">COMMAND</span>
            <kbd className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-bold">⌘K</kbd>
          </button>

          <button
            onClick={toggleSound}
            className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
            title={soundActive ? 'Mute Interface Sound' : 'Enable Interface Sound'}
          >
            {soundActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <a
            href="https://github.com/DhruvSPatel6113"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-950 text-slate-500 transition-colors hidden sm:flex items-center gap-1"
          >
            <span>GH</span>
            <ExternalLink size={10} />
          </a>

          <a
            href="https://linkedin.com/in/dhruvpatel6113"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-950 text-slate-500 transition-colors hidden sm:flex items-center gap-1"
          >
            <span>LI</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </header>
  );
}
