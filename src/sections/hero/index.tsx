'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import GsapTextReveal from '@/shared/animations/GsapTextReveal';
import MagneticButton from '@/shared/animations/MagneticButton';
import { Github, ArrowRight, Sparkles } from 'lucide-react';

const InteractiveRobotStage = dynamic(
  () => import('./InteractiveRobotStage'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[460px] bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center font-mono text-xs text-slate-400">
        INITIALIZING 3D SPATIAL RIG...
      </div>
    ),
  }
);

interface HeroSectionProps {
  onNavigateSection: (sectionId: string) => void;
}

export default function HeroSection({ onNavigateSection }: HeroSectionProps) {
  return (
    <section id="act-0" className="min-h-[92vh] flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Narrative Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-sky-700 font-mono text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>SYSTEM ONLINE &bull; VIT VELLORE &apos;29</span>
          </div>

          <GsapTextReveal className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-950 leading-none">
            DHRUV PATEL.
          </GsapTextReveal>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-xl">
            Software engineer architecting high-performance web applications, 2D physics simulations, and low-level memory engines—backed by the physical intuition of real industrial automation.
          </p>

          {/* Magnetic Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center gap-4">
            <MagneticButton
              onClick={() => onNavigateSection('act-4')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md flex items-center gap-2"
            >
              <Sparkles size={16} className="text-sky-400" />
              <span>Launch Live Playgrounds</span>
            </MagneticButton>

            <MagneticButton
              onClick={() => onNavigateSection('act-5')}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm shadow-sm flex items-center gap-2"
            >
              <span>Featured Projects</span>
              <ArrowRight size={15} className="text-slate-400" />
            </MagneticButton>

            <a
              href="https://github.com/DhruvSPatel6113"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
          </div>

          {/* Status Bar */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ACTIVE ROBOTIC GRIPPER: 2Y+ UPTIME</span>
            </div>
            <span>&bull;</span>
            <span className="text-slate-800 font-bold">PRESS ⌘K TO NAVIGATE</span>
          </div>
        </div>

        {/* Right Interactive 3D Stage Column */}
        <div className="lg:col-span-6 w-full">
          <InteractiveRobotStage />
        </div>
      </div>
    </section>
  );
}
