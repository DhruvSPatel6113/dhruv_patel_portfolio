'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 7,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    gsap.set(el, { transformPerspective: 1000 });
    const rxTo = gsap.quickTo(el, 'rotationX', { duration: 0.25, ease: 'power2.out' });
    const ryTo = gsap.quickTo(el, 'rotationY', { duration: 0.25, ease: 'power2.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power2.out' });

    let cachedRect: DOMRect | null = null;

    const handleMouseEnter = () => {
      cachedRect = el.getBoundingClientRect();
      yTo(-2);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = cachedRect || el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      rxTo(((y - centerY) / centerY) * -maxTilt);
      ryTo(((x - centerX) / centerX) * maxTilt);
    };

    const handleMouseLeave = () => {
      cachedRect = null;
      rxTo(0);
      ryTo(0);
      yTo(0);
    };

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt]);

  return (
    <div ref={cardRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
