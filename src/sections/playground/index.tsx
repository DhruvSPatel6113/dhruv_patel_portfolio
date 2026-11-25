'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import DeveloperPlayground from './DeveloperPlayground';

export default function PlaygroundSection() {
  return (
    <section id="act-4" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-20">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-mono font-bold tracking-wider">
          <Zap size={13} />
          <span>TESTABLE ENGINEERING PROOF</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
          Interactive Developer Playground.
        </h2>
        <p className="text-sm text-slate-600 max-w-2xl">
          Interact with the software directly. Spawn rigid bodies in the 2D physics engine, simulate dynamic heap memory coalescing in real-time, or test cryptographic firmware payload verification.
        </p>
      </div>

      <DeveloperPlayground />
    </section>
  );
}
