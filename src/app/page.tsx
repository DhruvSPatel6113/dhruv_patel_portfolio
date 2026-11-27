'use client';

import React, { useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { portfolioData as defaultPortfolioData } from '@/data/portfolioData';
import { PortfolioData } from '@/types';
import { sound } from '@/utils/audio';

// Shared HUD & Full-Site CMS
import CommandPalette from '@/shared/hud/CommandPalette';
import SecretCMSModal from '@/shared/admin/SecretCMSModal';

// Independent Modular Sections
import RobotLoader from '@/sections/loading';
import HeroSection from '@/sections/hero';
import StorySection from '@/sections/story';
import ResearchSection from '@/sections/research';
import ExperienceSection from '@/sections/experience';
import ProjectsSection from '@/sections/projects';
import BeyondSection from '@/sections/beyond';
import ContactSection from '@/sections/contact';

const STORAGE_KEY = 'dhruv_portfolio_v2_content';

export default function Home() {
  const siteWrapperRef = useRef<HTMLDivElement>(null);
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [isEngravingDone, setIsEngravingDone] = useState(false);
  const [isEngravingDark, setIsEngravingDark] = useState(false);
  const [activeAct, setActiveAct] = useState(0);
  const activeActRef = useRef(0);
  const [isGripperCycling, setIsGripperCycling] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSecretCMSOpen, setIsSecretCMSOpen] = useState(false);
  const [siteContent, setSiteContent] = useState<PortfolioData>(defaultPortfolioData);

  // Hydrate persisted CMS edits if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PortfolioData;
        if (parsed && parsed.hero && parsed.projects) {
          setSiteContent(parsed);
        }
      }
    } catch {}
  }, []);

  const handleUpdateSiteContent = (updated: PortfolioData) => {
    setSiteContent(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Lock page scroll while dismantled arm assembly loader OR Hero engraving (+1s) is active
  useEffect(() => {
    if (isLoadingScreen || !isEngravingDone) {
      window.scrollTo(0, 0);
      activeActRef.current = 0;
      setActiveAct(0);
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      if (siteWrapperRef.current) {
        gsap.set(siteWrapperRef.current, { y: 0, clearProps: 'transform' });
      }
      return;
    }

    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.8,
    });

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / totalScroll)) : 0;
      const act = Math.min(7, Math.floor(progress * 8));
      if (act !== activeActRef.current) {
        activeActRef.current = act;
        setActiveAct(act);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
    };
  }, [isLoadingScreen, isEngravingDone]);

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
      {isLoadingScreen && (
        <RobotLoader
          siteRef={siteWrapperRef}
          onComplete={() => setIsLoadingScreen(false)}
        />
      )}

      <div
        ref={siteWrapperRef}
        aria-hidden={isLoadingScreen}
        className={
          isLoadingScreen
            ? 'fixed inset-0 z-10 min-h-screen bg-[#f8fafc] text-slate-900 studio-grid font-sans antialiased overflow-hidden pointer-events-none select-none will-change-transform transition-colors duration-500'
            : `relative min-h-screen ${
                isEngravingDark ? 'bg-[#020617] text-slate-50' : 'bg-[#f8fafc] text-slate-900'
              } selection:bg-sky-500 selection:text-white studio-grid font-sans antialiased overflow-x-hidden transition-colors duration-500`
        }
      >
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigateSection={handleNavigateSection}
          onSecretTrigger={() => setIsSecretCMSOpen(true)}
        />

        {/* MAIN MODULAR SECTIONS (100% Data-Driven & CMS Editable) */}
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 pt-0 pb-16 sm:pb-20 space-y-20 sm:space-y-28">
          <HeroSection
            content={siteContent.hero}
            isActive={!isLoadingScreen}
            onEngravingComplete={() => setIsEngravingDone(true)}
            onEngravingThemeChange={setIsEngravingDark}
            onNavigateSection={handleNavigateSection}
          />
          <StorySection chapters={siteContent.chapters} onTriggerActuator={handleTriggerActuator} />
          <ResearchSection items={siteContent.research} />
          <ExperienceSection items={siteContent.experiences} />
          <ProjectsSection projects={siteContent.projects} />
          <BeyondSection items={siteContent.beyond} />
          <ContactSection content={siteContent.contact} onSecretTrigger={() => setIsSecretCMSOpen(true)} />
        </main>

        {/* Full-Site Stealth 2FA CMS Modal */}
        <SecretCMSModal
          isOpen={isSecretCMSOpen}
          onClose={() => setIsSecretCMSOpen(false)}
          content={siteContent}
          onUpdateContent={handleUpdateSiteContent}
        />
      </div>
    </>
  );
}
