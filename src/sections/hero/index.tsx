'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { HeroContent } from '@/types';
import MagneticButton from '@/shared/animations/MagneticButton';
import { sound } from '@/utils/audio';
import { Github, ArrowRight } from 'lucide-react';
import type { ArmPoseState, LaserEngraveTarget } from './RoboticArmStage';
import { getGlyphStrokes } from './glyphPaths';

gsap.registerPlugin(SplitText, DrawSVGPlugin);

const RoboticArmStage = dynamic(() => import('./RoboticArmStage'), {
  ssr: false,
  loading: () => null,
});

interface HeroSectionProps {
  content: HeroContent;
  isActive: boolean;
  onNavigateSection: (sectionId: string) => void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export default function HeroSection({ content, isActive, onNavigateSection }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const headlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const hasPlayedEngraveRef = useRef(false);
  const [isIdleTracking, setIsIdleTracking] = useState(false);

  const nameParts = useMemo(() => {
    const parts = content.name.trim().split(/\s+/);
    if (parts.length <= 1) return [content.name, ''];
    return [parts[0], parts.slice(1).join(' ')];
  }, [content.name]);

  const armPoseRef = useRef<ArmPoseState>({
    turretYaw: 0,
    shoulderPitch: -0.15,
    elbowPitch: 1.05,
    wristPitch: -0.35,
    gripperOpen: 0.35,
  });

  const laserTargetRef = useRef<LaserEngraveTarget>({
    active: false,
    screenX: 0,
    screenY: 0,
    baseBiasX: 0,
  });

  useEffect(() => {
    if (!isActive) {
      hasPlayedEngraveRef.current = false;
      setIsIdleTracking(false);
      laserTargetRef.current.active = false;

      if (titleRef.current) gsap.set(titleRef.current, { opacity: 0 });
      if (headlineRef.current) gsap.set(headlineRef.current, { opacity: 0 });
      if (badgeRef.current) gsap.set(badgeRef.current, { opacity: 0, y: 10 });
      if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 0, y: 12 });

      armPoseRef.current = {
        turretYaw: 0,
        shoulderPitch: -0.15,
        elbowPitch: 1.05,
        wristPitch: -0.35,
        gripperOpen: 0.35,
      };
      return;
    }

    if (hasPlayedEngraveRef.current) return;
    hasPlayedEngraveRef.current = true;

    const secEl = sectionRef.current;
    const titleEl = titleRef.current;
    const headEl = headlineRef.current;
    if (!secEl || !titleEl || !headEl) return;

    gsap.set(titleEl, { opacity: 1 });
    gsap.set(headEl, { opacity: 1 });

    // Split title & headline using GSAP SplitText
    const splitTitle = SplitText.create(titleEl, {
      type: 'words, chars',
      tag: 'span',
    });
    const splitHead = SplitText.create(headEl, {
      type: 'words, chars',
      tag: 'span',
    });

    const secRect = secEl.getBoundingClientRect();
    const createdSvgs: SVGSVGElement[] = [];

    // Prepare each title character with transparent text + exact glyph stroke SVG overlay
    const charJobs: Array<{
      charEl: HTMLElement;
      svgEl: SVGSVGElement;
      paths: SVGPathElement[];
      startX: number;
      startY: number;
    }> = [];

    splitTitle.chars.forEach((node) => {
      const charEl = node as HTMLElement;
      const ch = (charEl.textContent || '').trim();
      charEl.style.position = 'relative';
      charEl.style.display = 'inline-block';
      charEl.style.color = 'transparent';

      if (!ch) return;

      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.position = 'absolute';
      svg.style.inset = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.overflow = 'visible';
      svg.style.pointerEvents = 'none';
      svg.style.opacity = '0';

      const strokes = getGlyphStrokes(ch);
      const paths: SVGPathElement[] = strokes.map((d) => {
        const p = document.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', '#0ea5e9');
        p.setAttribute('stroke-width', '8');
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
        p.style.filter = 'drop-shadow(0 0 4px rgba(14,165,233,0.7))';
        svg.appendChild(p);
        return p;
      });

      charEl.appendChild(svg);
      createdSvgs.push(svg);
      gsap.set(paths, { drawSVG: '0%' });

      const cRect = charEl.getBoundingClientRect();
      charJobs.push({
        charEl,
        svgEl: svg,
        paths,
        startX: cRect.left - secRect.left + cRect.width * 0.25,
        startY: cRect.top - secRect.top + cRect.height * 0.25,
      });
    });

    // Hide headline chars initially
    gsap.set(splitHead.chars, { opacity: 0, color: '#0ea5e9' });

    const tl = gsap.timeline();

    // 1. Move robotic arm carriage to first character start point
    if (charJobs.length > 0) {
      tl.call(() => {
        laserTargetRef.current = {
          active: true,
          screenX: charJobs[0].startX,
          screenY: charJobs[0].startY,
          baseBiasX: -0.25,
        };
        sound.playPneumatic();
      }).to({}, { duration: 0.42 });
    }

    // 2. Trace each character stroke-by-stroke along its actual shape!
    charJobs.forEach((job) => {
      job.paths.forEach((pathEl, strokeIdx) => {
        const totalLen = Math.max(1, pathEl.getTotalLength());
        const strokeDuration = Math.min(0.16, Math.max(0.08, totalLen / 950));

        tl.fromTo(
          pathEl,
          { drawSVG: '0%' },
          {
            drawSVG: '100%',
            duration: strokeDuration,
            ease: 'none',
            onStart: () => {
              if (strokeIdx === 0) job.svgEl.style.opacity = '1';
            },
            onUpdate: function () {
              const prog = this.progress();
              const pt = pathEl.getPointAtLength(totalLen * prog);
              const ctm = pathEl.getScreenCTM();
              if (ctm && sectionRef.current) {
                const liveSec = sectionRef.current.getBoundingClientRect();
                const sx = pt.x * ctm.a + pt.y * ctm.c + ctm.e - liveSec.left;
                const sy = pt.x * ctm.b + pt.y * ctm.d + ctm.f - liveSec.top;
                laserTargetRef.current.screenX = sx;
                laserTargetRef.current.screenY = sy;
              }
            },
          }
        );
      });

      // Solidify engraved character with thermal sky-blue -> slate-950 flash & fade vector trace
      tl.fromTo(
        job.charEl,
        { color: '#0ea5e9' },
        { color: '#020617', duration: 0.14, ease: 'power2.out', immediateRender: false }
      ).to(job.svgEl, { opacity: 0, duration: 0.12 }, '<');
    });

    // 3. Engrave headline character-by-character with laser pointer tracking each char
    splitHead.chars.forEach((node) => {
      const charEl = node as HTMLElement;
      tl.to(charEl, {
        opacity: 1,
        color: '#475569',
        duration: 0.025,
        ease: 'none',
        onStart: () => {
          if (!sectionRef.current) return;
          const liveSec = sectionRef.current.getBoundingClientRect();
          const r = charEl.getBoundingClientRect();
          laserTargetRef.current.screenX = r.left - liveSec.left + r.width * 0.5;
          laserTargetRef.current.screenY = r.top - liveSec.top + r.height * 0.5;
        },
      });
    });

    // 4. Turn off laser, reveal badge + CTAs, return carriage to home & enable cursor tracking
    tl.call(() => {
      laserTargetRef.current.active = false;
      sound.playSuccess();
    })
      .to(badgeRef.current, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
      .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '<')
      .call(() => {
        setIsIdleTracking(true);
      });

    return () => {
      tl.kill();
      createdSvgs.forEach((s) => s.remove());
      splitTitle.revert();
      splitHead.revert();
    };
  }, [isActive]);

  return (
    <section
      id="act-0"
      ref={sectionRef}
      className="relative min-h-screen flex flex-col justify-center overflow-visible"
    >
      {/* Full-Width Open-Stage Faceted Industrial Arm + Laser Engraver Canvas */}
      <RoboticArmStage
        armPoseRef={armPoseRef}
        laserTargetRef={laserTargetRef}
        isIdleTracking={isIdleTracking}
      />

      {/* Ultra-Clean, Focused Left-Aligned Hero Content */}
      <div className="relative z-10 max-w-xl space-y-6 pointer-events-auto">
        <div
          ref={badgeRef}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-slate-200 text-slate-600 font-mono text-[11px] font-semibold shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{content.statusBadge}</span>
        </div>

        <h1
          ref={titleRef}
          style={{ fontKerning: 'none', textRendering: 'optimizeSpeed' }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-950 leading-[0.95] flex flex-col items-start"
        >
          <span className="block">{nameParts[0]}</span>
          {nameParts[1] && <span className="block">{nameParts[1]}</span>}
        </h1>

        <p
          ref={headlineRef}
          style={{ fontKerning: 'none', textRendering: 'optimizeSpeed' }}
          className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal max-w-lg"
        >
          {content.headline}
        </p>

        <div ref={ctaRef} className="flex flex-wrap items-center gap-3">
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
    </section>
  );
}
