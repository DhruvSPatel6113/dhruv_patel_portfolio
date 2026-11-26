'use client';

import React from 'react';
import { sound } from '@/utils/audio';

interface ChapterRailProps {
  activeAct: number;
  onSelectAct: (actIndex: number) => void;
}

export default function ChapterRail({ activeAct, onSelectAct }: ChapterRailProps) {
  const chapters = [
    { index: 0, id: 'act-0', label: '00 // HERO', title: 'Dhruv Patel' },
    { index: 1, id: 'act-1', label: '01 // ORIGIN', title: 'Factory & Code' },
    { index: 2, id: 'act-2', label: '02 // STEEL', title: '2Y+ Gripper & PCBs' },
    { index: 3, id: 'act-3', label: '03 // RESEARCH', title: "ICRTAC'26 Paper" },
    { index: 4, id: 'act-4', label: '04 // EXPERIENCE', title: 'Wins & Clubs' },
    { index: 5, id: 'act-5', label: '05 // PROJECTS', title: 'Top Engineering' },
    { index: 6, id: 'act-6', label: '06 // BEYOND', title: 'Sports & Music' },
    { index: 7, id: 'act-7', label: '07 // CONTACT', title: 'Direct Pipeline' },
  ];

  const handleSelect = (idx: number, id: string) => {
    sound.playClick();
    onSelectAct(idx);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className="fixed left-6 top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col gap-3 font-mono text-[10px] select-none pointer-events-auto">
      <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/90 shadow-md space-y-2">
        <span className="text-[9px] uppercase text-slate-400 font-bold px-1 block mb-1">
          SPATIAL TIMELINE
        </span>

        {chapters.map((ch) => {
          const isActive = activeAct === ch.index;
          return (
            <button
              key={ch.id}
              onClick={() => handleSelect(ch.index, ch.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-slate-900 text-white font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isActive ? 'bg-sky-400 scale-125' : 'bg-slate-300'
                }`}
              />
              <span className="tracking-wider">{ch.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
