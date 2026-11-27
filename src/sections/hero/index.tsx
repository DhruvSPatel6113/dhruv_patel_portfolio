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
  onEngravingComplete?: () => void;
  onEngravingThemeChange?: (isDark: boolean) => void;
  onNavigateSection: (sectionId: string) => void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export default function HeroSection({
  content,
  isActive,
  onEngravingComplete,
  onEngravingThemeChange,
  onNavigateSection,
}: HeroSectionProps) {
  const onEngravingCompleteRef = useRef(onEngravingComplete);
  onEngravingCompleteRef.current = onEngravingComplete;
  const onEngravingThemeChangeRef = useRef(onEngravingThemeChange);
  onEngravingThemeChangeRef.current = onEngravingThemeChange;
  const sectionRef = useRef<HTMLElement>(null);
  const contentZoomRef = useRef<HTMLDivElement>(null);
  const spotlightOverlayRef = useRef<HTMLDivElement>(null);
  const topCinemaBarRef = useRef<HTMLDivElement>(null);
  const bottomCinemaBarRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const headlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const hasPlayedEngraveRef = useRef(false);
  const [isIdleTracking, setIsIdleTracking] = useState(false);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.02 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
    fireLaser: false,
    screenX: 0,
    screenY: 0,
    baseBiasX: 0,
  });

  useEffect(() => {
    if (!isActive) {
      hasPlayedEngraveRef.current = false;
      setIsIdleTracking(false);
      onEngravingThemeChangeRef.current?.(false);
      laserTargetRef.current.active = false;
      laserTargetRef.current.fireLaser = false;

      if (spotlightOverlayRef.current) gsap.set(spotlightOverlayRef.current, { opacity: 0 });
      if (topCinemaBarRef.current) gsap.set(topCinemaBarRef.current, { yPercent: -100 });
      if (bottomCinemaBarRef.current) gsap.set(bottomCinemaBarRef.current, { yPercent: 100 });
      if (contentZoomRef.current) gsap.set(contentZoomRef.current, { scale: 1 });
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
    const overlayEl = spotlightOverlayRef.current;
    if (!secEl || !titleEl || !headEl || !overlayEl) return;

    gsap.set(titleEl, { opacity: 1 });
    gsap.set(headEl, { opacity: 1 });
    gsap.set(overlayEl, { opacity: 0 });

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
        p.setAttribute('stroke', '#ef4444');
        p.setAttribute('stroke-width', '8');
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
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
        startX: cRect.left + cRect.width * 0.25,
        startY: cRect.top + cRect.height * 0.25,
      });
    });

    gsap.set(splitHead.chars, { opacity: 0, color: '#ef4444' });

    // Pre-cache headline character client coordinates once to avoid layout thrashing during engraving
    const isNarrow = window.innerWidth < 640;
    const zoomScale = isNarrow ? 1.04 : 1.12;
    const zoomRect = contentZoomRef.current?.getBoundingClientRect();
    const zoomOriginX = zoomRect ? zoomRect.left + zoomRect.width * 0.2 : secRect.left;
    const zoomOriginY = zoomRect ? zoomRect.top + zoomRect.height * 0.42 : secRect.top;
    const headCharCoords = splitHead.chars.map((node) => {
      const r = (node as HTMLElement).getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.5;
      return {
        el: node as HTMLElement,
        sx: zoomOriginX + (cx - zoomOriginX) * zoomScale,
        sy: zoomOriginY + (cy - zoomOriginY) * zoomScale,
      };
    });

    const setSpotlight = (cx: number, cy: number) => {
      if (!overlayEl) return;
      overlayEl.style.setProperty('--lx', `${cx}px`);
      overlayEl.style.setProperty('--ly', `${cy}px`);
    };

    const tl = gsap.timeline();

    // 1. Slide in cinema letterbox bars, invert site background, fade in dark diffusion layer & zoom in onto characters
    if (charJobs.length > 0) {
      setSpotlight(charJobs[0].startX, charJobs[0].startY);
      tl.call(() => {
        onEngravingThemeChangeRef.current?.(true);
        laserTargetRef.current = {
          active: true,
          fireLaser: true,
          screenX: charJobs[0].startX,
          screenY: charJobs[0].startY,
          baseBiasX: -0.25,
        };
        sound.playPneumatic();
      })
        .to(overlayEl, { opacity: 1, duration: 0.45, ease: 'power2.out' })
        .to(topCinemaBarRef.current, { yPercent: 0, duration: 0.45, ease: 'power3.out' }, '<')
        .to(bottomCinemaBarRef.current, { yPercent: 0, duration: 0.45, ease: 'power3.out' }, '<')
        .to(
          contentZoomRef.current,
          { scale: zoomScale, duration: 0.6, ease: 'power2.out', transformOrigin: '20% 42%' },
          '<'
        );
    }

    // 2. Trace each title character stroke-by-stroke with blood-red laser & sparks
    charJobs.forEach((job) => {
      job.paths.forEach((pathEl, strokeIdx) => {
        const totalLen = Math.max(1, pathEl.getTotalLength());
        const strokeDuration = Math.min(0.15, Math.max(0.075, totalLen / 980));

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
              if (ctm) {
                const cx = pt.x * ctm.a + pt.y * ctm.c + ctm.e;
                const cy = pt.x * ctm.b + pt.y * ctm.d + ctm.f;
                laserTargetRef.current.screenX = cx;
                laserTargetRef.current.screenY = cy;
                setSpotlight(cx, cy);
              }
            },
          }
        );
      });

      // Molten white-hot contact -> stays glowing hot red-orange until arm finishes and cools
      tl.to(job.svgEl, { opacity: 0, duration: 0.14, ease: 'power1.out' })
        .fromTo(
          job.charEl,
          {
            color: '#fef08a',
            textShadow: '0 0 22px rgba(254, 240, 138, 0.95), 0 0 10px rgba(249, 115, 22, 0.9)',
          },
          {
            color: '#ef4444',
            textShadow: '0 0 14px rgba(239, 68, 68, 0.85), 0 0 6px rgba(249, 115, 22, 0.7)',
            duration: 0.16,
            ease: 'power1.out',
            immediateRender: false,
          },
          '<'
        );
    });

    // 3. Engrave headline character-by-character, keeping letters hot until post-engraving cooling
    headCharCoords.forEach(({ el: charEl, sx, sy }) => {
      tl.to(charEl, {
        opacity: 1,
        color: '#fb923c',
        textShadow: '0 0 10px rgba(249, 115, 22, 0.75)',
        duration: 0.024,
        ease: 'none',
        onStart: () => {
          laserTargetRef.current.screenX = sx;
          laserTargetRef.current.screenY = sy;
          setSpotlight(sx, sy);
        },
        onComplete: () => {
          gsap.to(charEl, {
            color: '#ef4444',
            textShadow: '0 0 8px rgba(220, 38, 38, 0.55)',
            duration: 0.18,
            ease: 'power1.out',
          });
        },
      });
    });

    // 4. Laser off, restore light background, return arm to final resting position, then cool over >= 5 seconds
    tl.call(() => {
      laserTargetRef.current.active = false;
      laserTargetRef.current.fireLaser = false;
      onEngravingThemeChangeRef.current?.(false);
      sound.playSuccess();
    })
      .to(overlayEl, { opacity: 0, duration: 0.55, ease: 'power2.inOut' })
      .to(topCinemaBarRef.current, { yPercent: -100, duration: 0.45, ease: 'power2.in' }, '<')
      .to(bottomCinemaBarRef.current, { yPercent: 100, duration: 0.45, ease: 'power2.in' }, '<')
      .to(contentZoomRef.current, { scale: 1, duration: 0.55, ease: 'power2.inOut' }, '<')
      .to(badgeRef.current, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25')
      .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '<')
      .to({}, { duration: 0.45 }) // Allow robotic arm to settle at its final resting position
      .call(() => {
        setIsIdleTracking(true);
        onEngravingCompleteRef.current?.();

        // 3s realistic thermal cooling after arm reaches final position
        const titleCool = gsap.timeline();
        titleCool
          .to(splitTitle.chars, {
            color: '#b91c1c',
            textShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
            duration: 1.0,
            stagger: { amount: 0.45, from: 'start' },
            ease: 'power1.inOut',
            overwrite: 'auto',
          })
          .to(splitTitle.chars, {
            color: '#450a0a',
            textShadow: '0 0 4px rgba(185, 28, 28, 0.25)',
            duration: 1.0,
            stagger: { amount: 0.45, from: 'start' },
            ease: 'power1.inOut',
          })
          .to(splitTitle.chars, {
            color: '#020617',
            textShadow: '0 0 0px rgba(0, 0, 0, 0)',
            duration: 1.0,
            stagger: { amount: 0.45, from: 'start' },
            ease: 'power2.out',
          });

        const headCool = gsap.timeline();
        headCool
          .to(splitHead.chars, {
            color: '#9a3412',
            textShadow: '0 0 5px rgba(234, 88, 12, 0.35)',
            duration: 1.3,
            stagger: { amount: 0.4, from: 'start' },
            ease: 'power1.inOut',
            overwrite: 'auto',
          })
          .to(splitHead.chars, {
            color: '#475569',
            textShadow: '0 0 0px rgba(0, 0, 0, 0)',
            duration: 1.7,
            stagger: { amount: 0.4, from: 'start' },
            ease: 'power2.out',
          });
      });

    return () => {
      onEngravingThemeChangeRef.current?.(false);
      gsap.killTweensOf([...splitTitle.chars, ...splitHead.chars]);
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
      className="relative min-h-screen flex flex-col justify-start pt-16 pb-56 sm:justify-center sm:pt-0 sm:pb-0 overflow-visible touch-pan-y"
    >
      {/* Full-Width Open-Stage Faceted Industrial Arm + Blood-Red Laser + Sparks + Cinematic Post */}
      <RoboticArmStage
        armPoseRef={armPoseRef}
        laserTargetRef={laserTargetRef}
        isIdleTracking={isIdleTracking}
        isInView={isInView}
      />

      {/* 2.39:1 Cinematic Letterbox Bars */}
      <div
        ref={topCinemaBarRef}
        className="fixed top-0 inset-x-0 h-7 sm:h-12 bg-black z-50 pointer-events-none will-change-transform"
        style={{ transform: 'translateY(-100%)' }}
      />
      <div
        ref={bottomCinemaBarRef}
        className="fixed bottom-0 inset-x-0 h-7 sm:h-12 bg-black z-50 pointer-events-none will-change-transform"
        style={{ transform: 'translateY(100%)' }}
      />

      {/* Pure Black (#000000) Optical Surround + Focused Laser Spotlight */}
      <div
        ref={spotlightOverlayRef}
        className="fixed inset-0 z-40 pointer-events-none opacity-0 will-change-[opacity]"
        style={{
          background:
            'radial-gradient(circle clamp(105px, 26vw, 200px) at var(--lx, 30%) var(--ly, 45%), rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.25) 35%, rgba(0, 0, 0, 0.78) 65%, #000000 88%, #000000 100%)',
        }}
      >
        {/* Blood-red optical scatter halo */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle 145px at var(--lx, 30%) var(--ly, 45%), rgba(239, 68, 68, 0.28) 0%, rgba(185, 28, 28, 0.12) 45%, transparent 100%)',
          }}
        />
        {/* Anamorphic horizontal crimson refractive streak */}
        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              'radial-gradient(ellipse 320px 16px at var(--lx, 30%) var(--ly, 45%), rgba(248, 113, 113, 0.32) 0%, rgba(220, 38, 38, 0.1) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Ultra-Clean, Focused Left-Aligned Hero Content (Synced Zoom Container) */}
      <div
        ref={contentZoomRef}
        className={`relative z-30 max-w-xl space-y-6 will-change-transform ${
          isIdleTracking ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
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
          className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-950 leading-[0.95] flex flex-col items-start"
        >
          <span className="block">{nameParts[0]}</span>
          {nameParts[1] && <span className="block">{nameParts[1]}</span>}
        </h1>

        <p
          ref={headlineRef}
          style={{ fontKerning: 'none', textRendering: 'optimizeSpeed' }}
          className="text-base sm:text-xl text-slate-600 leading-relaxed font-normal max-w-lg"
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
