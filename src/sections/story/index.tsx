'use client';

import React from 'react';
import { ChapterStory } from '@/types';
import GsapTextReveal from '@/shared/animations/GsapTextReveal';
import TiltCard from '@/shared/animations/TiltCard';

interface StorySectionProps {
  chapters: ChapterStory[];
  onTriggerActuator: () => void;
}

export default function StorySection({ chapters, onTriggerActuator }: StorySectionProps) {
  return (
    <div id="act-1" className="space-y-28 scroll-mt-28">
      {chapters.map((chapter, idx) => (
        <section
          key={chapter.id}
          id={idx === 2 ? 'act-2' : undefined}
          className="min-h-[65vh] flex flex-col justify-center border-t border-slate-200 pt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4 font-mono">
              <span
                className="text-xs font-bold tracking-widest block"
                style={{ color: chapter.themeColor || '#0284c7' }}
              >
                {chapter.actTitle}
              </span>
              <GsapTextReveal className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-tight">
                {chapter.heading}
              </GsapTextReveal>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {chapter.location} &bull; {chapter.timeframe}
              </p>
              <p className="text-sm font-sans text-slate-600 max-w-md pt-1">{chapter.tagline}</p>
            </div>

            <div className="lg:col-span-6">
              <TiltCard className="bg-white/85 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-md space-y-5 text-slate-700 text-sm sm:text-base leading-relaxed">
                {chapter.narrativeText.map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}

                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    {chapter.milestones.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="font-semibold"
                        style={{ color: chapter.themeColor || '#0284c7' }}
                      >
                        ▹ {m}
                      </span>
                    ))}
                  </div>

                  {chapter.id === 2 && (
                    <button
                      onClick={onTriggerActuator}
                      className="text-emerald-700 hover:text-emerald-800 underline font-bold"
                    >
                      ▶ TEST PNEUMATIC ACTUATION
                    </button>
                  )}
                </div>
              </TiltCard>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
