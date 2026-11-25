'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface GsapTextRevealProps {
  children: string;
  className?: string;
  delay?: number;
}

export default function GsapTextReveal({
  children,
  className = '',
  delay = 0,
}: GsapTextRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const el = containerRef.current;
    if (!el) return;

    const words = el.querySelectorAll('.gsap-word');

    const ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        {
          y: '100%',
          opacity: 0,
          rotateZ: 2,
        },
        {
          y: '0%',
          opacity: 1,
          rotateZ: 0,
          duration: 0.8,
          stagger: 0.04,
          delay,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, children]);

  const words = children.split(' ');

  return (
    <h2 ref={containerRef} className={`overflow-hidden flex flex-wrap gap-x-[0.28em] ${className}`}>
      {words.map((word, idx) => (
        <span key={idx} className="inline-block overflow-hidden py-1">
          <span className="gsap-word inline-block will-change-transform">
            {word}
          </span>
        </span>
      ))}
    </h2>
  );
}
