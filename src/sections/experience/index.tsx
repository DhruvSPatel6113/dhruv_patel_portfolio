'use client';

import React, { useState, useMemo } from 'react';
import { ExperienceItem } from '@/types';
import { Briefcase, Award, Users } from 'lucide-react';
import { sound } from '@/utils/audio';

interface ExperienceSectionProps {
  items: ExperienceItem[];
}

export default function ExperienceSection({ items }: ExperienceSectionProps) {
  const [filter, setFilter] = useState<'all' | 'work' | 'achievement' | 'club'>('all');

  // Always prioritize work/internships at the top, then achievements, then clubs
  const sortedItems = useMemo(() => {
    const priority: Record<ExperienceItem['type'], number> = {
      work: 0,
      achievement: 1,
      club: 2,
    };
    const filtered = filter === 'all' ? items : items.filter((item) => item.type === filter);
    return [...filtered].sort((a, b) => priority[a.type] - priority[b.type]);
  }, [items, filter]);

  const typeMeta = {
    work: { label: 'Work & Internships', icon: Briefcase, badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' },
    achievement: { label: 'Hackathons & Builds', icon: Award, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    club: { label: 'Clubs & Leadership', icon: Users, badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  };

  return (
    <section id="act-4" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-mono font-bold tracking-wider">
            <Briefcase size={13} />
            <span>EXPERIENCE, WINS &amp; CAMPUS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Experience &amp; Leadership.
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Production hardware deployments, national hackathon wins, and technical leadership across VIT Vellore clubs.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {(
            [
              { id: 'all', label: 'ALL' },
              { id: 'work', label: 'WORK' },
              { id: 'achievement', label: 'WINS & BUILDS' },
              { id: 'club', label: 'CLUBS' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                filter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-sky-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedItems.map((item) => {
          const meta = typeMeta[item.type];
          const Icon = meta.icon;
          return (
            <div
              key={item.id}
              className="bg-white/95 p-7 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[10px] font-bold uppercase ${meta.badgeClass}`}
                  >
                    <Icon size={11} />
                    <span>{item.badge || meta.label}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">{item.period}</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900">{item.role}</h3>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">
                    {item.organization} &bull; {item.location}
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>
              </div>

              {item.highlights.length > 0 && (
                <ul className="space-y-1.5 pt-4 border-t border-slate-100 text-xs text-slate-700 font-mono">
                  {item.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold">▹</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
