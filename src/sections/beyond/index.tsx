'use client';

import React from 'react';
import { BeyondItem } from '@/types';
import { Trophy, Activity, Music, Compass, Sparkles, LucideIcon } from 'lucide-react';

interface BeyondSectionProps {
  items: BeyondItem[];
}

const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Activity,
  Music,
  Compass,
  Sparkles,
};

export default function BeyondSection({ items }: BeyondSectionProps) {
  return (
    <section id="act-6" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-20">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-mono font-bold tracking-wider">
          <Sparkles size={13} />
          <span>OFF THE KEYBOARD</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
          Sports, Music &amp; Horizons.
        </h2>
        <p className="text-sm text-slate-600 max-w-2xl">
          Discipline on the court, rhythm on the drums and synth, and curiosity on the road.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || Sparkles;
          return (
            <div
              key={item.id}
              className="bg-white/95 p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="font-mono text-[11px] text-sky-700 font-semibold">{item.tagline}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
