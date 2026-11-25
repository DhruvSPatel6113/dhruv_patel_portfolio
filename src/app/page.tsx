'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Lenis from 'lenis';
import { portfolioData } from '@/data/portfolioData';
import { ProjectItem } from '@/types';
import { sound } from '@/utils/audio';
import { Sparkles } from 'lucide-react';

// Shared HUD & Admin
import TelemetryHUD from '@/shared/hud/TelemetryHUD';
import CommandPalette from '@/shared/hud/CommandPalette';
import ChapterRail from '@/shared/hud/ChapterRail';
import RotaryThrottle from '@/shared/hud/RotaryThrottle';
import SecretCMSModal from '@/shared/admin/SecretCMSModal';

// Independent Modular Sections
import RobotLoader from '@/sections/loading';
import HeroSection from '@/sections/hero';
import StorySection from '@/sections/story';
import PlaygroundSection from '@/sections/playground';
import ProjectsSection from '@/sections/projects';
import ContactSection from '@/sections/contact';

const StoryStage = dynamic(
  () => import('@/shared/3d/StoryStage'),
  { ssr: false, loading: () => null }
);

export default function Home() {
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeAct, setActiveAct] = useState(0);
  const [isGripperCycling, setIsGripperCycling] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSecretCMSOpen, setIsSecretCMSOpen] = useState(false);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(portfolioData.projects);

  // Smooth Inertial Scroll (Lenis) with Scroll Progress Mapping
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.8,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / totalScroll)) : 0;
      setScrollProgress(progress);

      const act = Math.min(6, Math.floor(progress * 7));
      setActiveAct(act);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Global Stealth 2FA Hotkey: Ctrl + Shift + D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        sound.playSuccess();
        setIsSecretCMSOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTriggerActuator = () => {
    setIsGripperCycling(true);
    sound.playPneumatic();
    setTimeout(() => {
      setIsGripperCycling(false);
    }, 2800);
  };

  return (
    <>
      {isLoadingScreen && <RobotLoader onComplete={() => setIsLoadingScreen(false)} />}

      <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-sky-500 selection:text-white studio-grid font-sans antialiased overflow-x-hidden">
        {/* Replay Loader Button */}
        <button
          onClick={() => setIsLoadingScreen(true)}
          className="fixed bottom-6 left-6 z-40 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200 text-[11px] font-mono text-slate-700 hover:text-sky-600 shadow-md transition-all flex items-center gap-1.5 pointer-events-auto"
        >
          <Sparkles size={12} className="text-sky-500" />
          <span>REPLAY ROBOT LOADER</span>
        </button>

        {/* 3D Atmospheric Depth Stage */}
        <StoryStage progress={scrollProgress} activeAct={activeAct} />

        {/* Shared Navigation & Telemetry HUD */}
        <ChapterRail activeAct={activeAct} onSelectAct={(idx) => setActiveAct(idx)} />

        <RotaryThrottle
          progress={scrollProgress}
          onChangeProgress={(val) => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({ top: val * totalScroll, behavior: 'auto' });
          }}
          onTriggerActuator={handleTriggerActuator}
          isCycling={isGripperCycling}
        />

        <TelemetryHUD
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onSecretTrigger={() => setIsSecretCMSOpen(true)}
        />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigateSection={handleNavigateSection}
          onSecretTrigger={() => setIsSecretCMSOpen(true)}
        />

        {/* MAIN MODULAR SECTIONS */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-28 pb-20 space-y-36">
          <HeroSection onNavigateSection={handleNavigateSection} />
          <StorySection onTriggerActuator={handleTriggerActuator} />
          <PlaygroundSection />
          <ProjectsSection projects={projectsList} />
          <ContactSection onSecretTrigger={() => setIsSecretCMSOpen(true)} />
        </main>

        {/* Stealth 2FA Studio CMS Modal */}
        <SecretCMSModal
          isOpen={isSecretCMSOpen}
          onClose={() => setIsSecretCMSOpen(false)}
          projects={projectsList}
          onUpdateProjects={(updated) => setProjectsList(updated)}
        />
      </div>
    </>
  );
}
