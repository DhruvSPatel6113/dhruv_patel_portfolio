'use client';

import React from 'react';
import { ResearchItem } from '@/types';
import GsapTextReveal from '@/shared/animations/GsapTextReveal';
import TiltCard from '@/shared/animations/TiltCard';
import { BookOpen, Cpu, ExternalLink, Code2, CheckCircle2 } from 'lucide-react';

interface ResearchSectionProps {
  items: ResearchItem[];
}

export default function ResearchSection({ items }: ResearchSectionProps) {
  return (
    <section id="act-3" className="space-y-10 scroll-mt-28 border-t border-slate-200 pt-20">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-mono font-bold tracking-wider">
          <BookOpen size={13} />
          <span>PUBLISHED &amp; ACCEPTED RESEARCH</span>
        </div>
        <GsapTextReveal className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
          Research &amp; Conference Publications.
        </GsapTextReveal>
        <p className="text-sm text-slate-600 max-w-2xl">
          Applied edge-AI and computer vision research validated on physical hardware under real-world field conditions.
        </p>
      </div>

      <div className="space-y-8">
        {items.map((paper) => (
          <TiltCard
            key={paper.id}
            className="bg-white/95 p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-md space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold">
                <CheckCircle2 size={13} />
                <span>{paper.status.toUpperCase()} &bull; {paper.venue}</span>
              </div>
              <span className="font-mono text-xs text-slate-400">{paper.date}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {paper.title}
              </h3>
              <p className="font-mono text-xs text-slate-500">
                Authors: {paper.authors.join(', ')}
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {paper.abstract}
            </p>

            {/* Key Quantitative Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {paper.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-slate-800"
                >
                  {metric}
                </div>
              ))}
            </div>

            {/* Hardware & Software Stacks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div className="space-y-2">
                <span className="font-mono text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                  <Cpu size={12} className="text-sky-600" />
                  HARDWARE STACK
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {paper.hardwareStack.map((hw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-mono text-[11px] font-medium"
                    >
                      {hw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                  <Code2 size={12} className="text-indigo-600" />
                  AI &amp; SOFTWARE STACK
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {paper.softwareStack.map((sw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-mono text-[11px] font-medium"
                    >
                      {sw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {(paper.paperUrl || paper.codeUrl) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {paper.paperUrl && (
                  <a
                    href={paper.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>READ PAPER</span>
                  </a>
                )}
                {paper.codeUrl && (
                  <a
                    href={paper.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-mono text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors"
                  >
                    <Code2 size={13} />
                    <span>VIEW REPOSITORY</span>
                  </a>
                )}
              </div>
            )}
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
