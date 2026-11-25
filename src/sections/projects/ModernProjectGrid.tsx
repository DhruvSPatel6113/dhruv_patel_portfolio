'use client';

import React, { useState } from 'react';
import { ProjectItem } from '@/types';
import { ExternalLink, Github, CheckCircle, Code2, Layers, Cpu, ArrowUpRight } from 'lucide-react';
import { sound } from '@/utils/audio';

interface ModernProjectGridProps {
  projects: ProjectItem[];
}

export default function ModernProjectGrid({ projects }: ModernProjectGridProps) {
  const [activeTabs, setActiveTabs] = useState<{ [id: string]: 'overview' | 'arch' | 'metrics' }>(
    projects.reduce((acc, p) => ({ ...acc, [p.id]: 'overview' }), {})
  );

  const handleTabSwitch = (id: string, tab: 'overview' | 'arch' | 'metrics') => {
    sound.playClick();
    setActiveTabs((prev) => ({ ...prev, [id]: tab }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-sans">
      {projects.map((proj) => {
        const curTab = activeTabs[proj.id] || 'overview';

        return (
          <div
            key={proj.id}
            className="group bg-white rounded-3xl border border-slate-200/90 hover:border-sky-300 transition-all duration-300 p-7 shadow-sm hover:shadow-xl flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Category & External Links */}
              <div className="flex items-center justify-between gap-3 mb-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[10px] tracking-widest px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {proj.category}
                  </span>
                  {proj.featured && (
                    <span className="uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      FLAGSHIP
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="View GitHub Repository"
                    >
                      <Github size={16} />
                    </a>
                  )}
                  {proj.demoUrl && (
                    <a
                      href={proj.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                      title="Launch Live Demo"
                    >
                      <ArrowUpRight size={16} />
                    </a>
                  )}
                </div>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-xl sm:text-2xl font-bold text-slate-950 mb-1.5 group-hover:text-sky-600 transition-colors">
                {proj.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-5">
                {proj.subtitle}
              </p>

              {/* Interactive Tabs: Overview | Architecture | Metrics */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/60 font-mono text-[11px] mb-5">
                <button
                  onClick={() => handleTabSwitch(proj.id, 'overview')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all font-semibold ${
                    curTab === 'overview'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => handleTabSwitch(proj.id, 'arch')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all font-semibold ${
                    curTab === 'arch'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Architecture
                </button>
                <button
                  onClick={() => handleTabSwitch(proj.id, 'metrics')}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all font-semibold ${
                    curTab === 'metrics'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Key Metrics
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="min-h-[110px] text-xs text-slate-600 leading-relaxed">
                {curTab === 'overview' && (
                  <p className="animate-fade-in font-normal">
                    {proj.summary}
                  </p>
                )}

                {curTab === 'arch' && (
                  <p className="animate-fade-in font-normal text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {proj.story}
                  </p>
                )}

                {curTab === 'metrics' && (
                  <div className="space-y-2 animate-fade-in font-mono">
                    {proj.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="flex items-center gap-2 text-slate-700">
                        <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer: Tech Stack Badges & Launch CTA */}
            <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px]">
              <div className="flex flex-wrap gap-1.5">
                {proj.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {proj.demoUrl ? (
                <a
                  href={proj.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 font-bold hover:text-sky-700 underline"
                >
                  <span>LIVE DEMO</span>
                  <ExternalLink size={11} />
                </a>
              ) : proj.githubUrl ? (
                <a
                  href={proj.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-slate-700 font-bold hover:text-slate-950 underline"
                >
                  <span>VIEW CODE</span>
                  <Github size={11} />
                </a>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
