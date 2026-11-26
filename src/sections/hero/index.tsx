'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { HeroContent } from '@/types';
import MagneticButton from '@/shared/animations/MagneticButton';
import { sound } from '@/utils/audio';
import { Github, ArrowRight } from 'lucide-react';
import type { ArmPoseState } from './RoboticArmStage';

const RoboticArmStage = dynamic(() => import('./RoboticArmStage'), {
  ssr: false,
  loading: () => null,
});

interface HeroSectionProps {
  content: HeroContent;
  isActive: boolean;
  onNavigateSection: (sectionId: string) => void;
}

export default function HeroSection({ content, isActive, onNavigateSection }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const heroShakeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const hasPlayedDropRef = useRef(false);
  const isCarryingRef = useRef(false);
  const restCenterRef = useRef<{ x: number; y: number } | null>(null);
  const [isIdleTracking, setIsIdleTracking] = useState(false);

  // Bent resting pose inside screen; starts reaching out off-screen top-right
  const armPoseRef = useRef<ArmPoseState>({
    turretYaw: -0.2,
    shoulderPitch: -0.65,
    elbowPitch: 0.45,
    wristPitch: 0.2,
    gripperOpen: 1,
  });

  // Lock title directly to the 3D gripper jaws while carrying
  const handleGripperScreenPos = useCallback((sx: number, sy: number) => {
    if (!isCarryingRef.current || !titleRef.current || !restCenterRef.current) return;
    const dx = sx - restCenterRef.current.x;
    const dy = sy - restCenterRef.current.y;
    gsap.set(titleRef.current, {
      x: dx,
      y: dy,
      rotation: -2,
      opacity: 1,
    });
  }, []);

  useEffect(() => {
    if (!isActive) {
      hasPlayedDropRef.current = false;
      isCarryingRef.current = false;
      setIsIdleTracking(false);
      if (titleRef.current) {
        gsap.set(titleRef.current, { opacity: 0, x: 0, y: 0, rotation: 0 });
      }
      if (detailsRef.current) {
        gsap.set(detailsRef.current, { y: 16, opacity: 0 });
      }
      armPoseRef.current = {
        turretYaw: -0.2,
        shoulderPitch: -0.65,
        elbowPitch: 0.45,
        wristPitch: 0.2,
        gripperOpen: 1,
      };
      return;
    }

    if (hasPlayedDropRef.current) return;
    hasPlayedDropRef.current = true;

    // Measure the exact resting center of DHRUV PATEL. relative to the Hero section
    if (titleRef.current && sectionRef.current) {
      gsap.set(titleRef.current, { x: 0, y: 0, rotation: 0 });
      const titleRect = titleRef.current.getBoundingClientRect();
      const secRect = sectionRef.current.getBoundingClientRect();
      restCenterRef.current = {
        x: titleRect.left - secRect.left + titleRect.width * 0.5,
        y: titleRect.top - secRect.top + titleRect.height * 0.35,
      };
    }

    const tl = gsap.timeline();

    // 1. Arm reaches out past top-right edge, clamps onto title
    tl.to(armPoseRef.current, {
      turretYaw: -0.2,
      shoulderPitch: -0.78,
      elbowPitch: 0.32,
      wristPitch: 0.25,
      gripperOpen: 0,
      duration: 0.4,
      ease: 'power2.inOut',
    })
      .call(() => {
        isCarryingRef.current = true;
        sound.playPneumatic();
      })
      // 2. Massive bent arm swings all the way over so gripper sits directly ABOVE the title's resting spot!
      .to(armPoseRef.current, {
        turretYaw: 0.05,
        shoulderPitch: 0.62,
        elbowPitch: 0.92,
        wristPitch: -0.45,
        duration: 0.95,
        ease: 'power3.inOut',
      })
      // 3. Gripper jaws open directly above the title & release!
      .call(() => {
        isCarryingRef.current = false;
      })
      .to(armPoseRef.current, {
        gripperOpen: 1,
        duration: 0.1,
      })
      // 4. Title falls straight down from the open jaws into its resting spot!
      .to(
        titleRef.current,
        {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.24,
          ease: 'power3.in',
        },
        '<'
      )
      // 5. Impact Shake Effect!
      .call(() => {
        sound.playSnap();
      })
      .to(heroShakeRef.current, { y: 12, x: -5, duration: 0.05, ease: 'power1.out' })
      .to(heroShakeRef.current, { y: -8, x: 5, duration: 0.06 })
      .to(heroShakeRef.current, { y: 5, x: -3, duration: 0.06 })
      .to(heroShakeRef.current, { y: 0, x: 0, duration: 0.14, ease: 'elastic.out(1, 0.4)' })
      // 6. Arm stays bent cleanly inside screen & immediately tracks cursor tip
      .to(
        armPoseRef.current,
        {
          turretYaw: 0,
          shoulderPitch: -0.15,
          elbowPitch: 1.05,
          wristPitch: -0.35,
          gripperOpen: 0.35,
          duration: 0.55,
          ease: 'power2.out',
        },
        '-=0.15'
      )
      .to(
        detailsRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.45,
          ease: 'power2.out',
          onComplete: () => setIsIdleTracking(true),
        },
        '-=0.45'
      );

    return () => {
      tl.kill();
    };
  }, [isActive]);

  return (
    <section
      id="act-0"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center overflow-visible"
    >
      {/* Full-Width Open-Stage Faceted Industrial Arm Canvas */}
      <RoboticArmStage
        armPoseRef={armPoseRef}
        isIdleTracking={isIdleTracking}
        onGripperScreenPos={handleGripperScreenPos}
      />

      {/* Ultra-Clean, Focused Left-Aligned Hero Content */}
      <div ref={heroShakeRef} className="relative z-10 max-w-xl space-y-6 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-600 font-mono text-[11px] font-semibold shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{content.statusBadge}</span>
        </div>

        <h1
          ref={titleRef}
          className="inline-block text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-950 leading-[0.95] will-change-transform"
        >
          {content.name}
        </h1>

        <div ref={detailsRef} className="space-y-6">
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-lg">
            {content.headline}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <MagneticButton
              onClick={() => onNavigateSection(content.secondaryCtaTarget)}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md flex items-center gap-2"
            >
              <span>{content.secondaryCtaLabel}</span>
              <ArrowRight size={15} className="text-sky-400" />
            </MagneticButton>

            <a
              href={content.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
