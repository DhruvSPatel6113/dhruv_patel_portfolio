'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ProjectItem } from '@/types';
import ModernProjectGrid from './ModernProjectGrid';

interface ProjectsSectionProps {
  projects: ProjectItem[];
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section id="act-5" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-bold tracking-wider">
            <Layers size={13} />
            <span>FLAGSHIP PORTFOLIO</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Featured Software &amp; Systems.
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Dynamic visual debuggers, physics engines, production robotics, and cryptographic firmware infrastructure authored by Dhruv Patel.
          </p>
        </div>

        <span className="font-mono text-xs text-slate-400">
          {projects.length} PRODUCTION DEPLOYMENTS
        </span>
      </div>

      <ModernProjectGrid projects={projects} />
    </section>
  );
}
