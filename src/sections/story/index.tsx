'use client';

import React from 'react';
import GsapTextReveal from '@/shared/animations/GsapTextReveal';
import TiltCard from '@/shared/animations/TiltCard';

interface StorySectionProps {
  onTriggerActuator: () => void;
}

export default function StorySection({ onTriggerActuator }: StorySectionProps) {
  return (
    <>
      {/* ACT 0: THE MACHINE SHOP & MAKER INTUITION */}
      <section className="min-h-[75vh] flex flex-col justify-center border-t border-slate-200 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 font-mono">
            <span className="text-xs text-amber-600 font-bold tracking-widest block">
              ACT 00 // THE PHYSICAL ORIGIN
            </span>
            <GsapTextReveal className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-tight">
              The Factory Shop &amp; Maker Intuition.
            </GsapTextReveal>
            <p className="text-xs text-slate-400">
              FATHER&apos;S INDUSTRIAL WORKSHOP &bull; CHILDHOOD ROOTS
            </p>
          </div>

          <div className="lg:col-span-6">
            <TiltCard className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-md space-y-5 text-slate-700 text-sm sm:text-base leading-relaxed">
              <p>
                Before I wrote a single line of code, my playground was my father&apos;s factory workshop. While other kids received finished toys, I disassembled mine to see how gears meshed, shafts rotated, and electric motors whirred.
              </p>
              <p>
                I spent hours beside my father as he engineered and fabricated custom machinery for manufacturing lines. Handing him wrenches, measuring with calipers, and observing raw cold-rolled steel transform into functional machinery instilled a physical intuition for how systems operate under stress.
              </p>
              <div className="pt-4 border-t border-slate-200 flex items-center gap-4 text-xs font-mono text-slate-500">
                <span className="text-amber-600 font-bold">▹ HELICAL GEAR TRAIN</span>
                <span>&bull;</span>
                <span className="text-amber-600 font-bold">▹ MECHANICAL TOLERANCE</span>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ACT 1: LOCKDOWN AWAKENING */}
      <section id="act-1" className="min-h-[75vh] flex flex-col justify-center border-t border-slate-200 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 font-mono">
            <span className="text-xs text-sky-600 font-bold tracking-widest block">
              ACT 01 // THE DIGITAL SYNAPSE
            </span>
            <GsapTextReveal className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-tight">
              Lockdown Awakening: Code as Creation.
            </GsapTextReveal>
            <p className="text-xs text-slate-400">
              HOME WORKSTATION &bull; COVID-19 LOCKDOWN (2020 - 2021)
            </p>
          </div>

          <div className="lg:col-span-6">
            <TiltCard className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-md space-y-5 text-slate-700 text-sm sm:text-base leading-relaxed">
              <p>
                When the world paused during the lockdown, my curiosity transitioned from physical wrenches to programming. Sitting at a keyboard, I realized that software is the ultimate workshop—where you can architect complex logical machines without material friction.
              </p>
              <p>
                I dove headfirst into algorithms, building 2D game loops, mobile applications, and simulation sandboxes from scratch. Code wasn&apos;t just syntax; it was the power to architect logic that breathes life into empty memory addresses.
              </p>
              <div className="pt-4 border-t border-slate-200 flex items-center gap-4 text-xs font-mono text-slate-500">
                <span className="text-sky-600 font-bold">▹ EMBEDDED LOGIC</span>
                <span>&bull;</span>
                <span className="text-sky-600 font-bold">▹ 2D ALGORITHMIC LOOPS</span>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ACT 2: CODE MEETS STEEL (2Y+ ROBOTIC GRIPPER) */}
      <section id="act-2" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 font-mono">
            <span className="text-xs text-emerald-600 font-bold tracking-widest block">
              ACT 02 // CODE MEETS STEEL
            </span>
            <GsapTextReveal className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-tight">
              The Robotic Gripper: Code in Production.
            </GsapTextReveal>
            <p className="text-xs text-slate-400">
              ACTIVE FACTORY LINE &bull; 2+ YEARS PRODUCTION RUNTIME
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>PRODUCTION RUNTIME: 2+ YEARS</span>
              </div>
              <span className="text-emerald-700 font-bold">99.9% UPTIME</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <TiltCard className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-md space-y-5 text-slate-700 text-sm leading-relaxed">
              <p>
                Writing code on a screen wasn&apos;t enough—I needed my software to act upon the physical world. I combined programming with electrical engineering: designing custom circuit boards, soldering microcontroller drivers, and diving into robotics.
              </p>
              <p>
                I engineered and programmed an autonomous 1-axis pick-and-place robotic gripper. We installed it as a permanent automation fixture in my father&apos;s factory. That exact gripper has been running non-stop in active production for over 2 continuous years with zero maintenance failures.
              </p>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-500 font-medium">STATUS: 10,000+ COMPLETED CYCLES</span>
                <button
                  onClick={onTriggerActuator}
                  className="text-emerald-700 hover:text-emerald-800 underline font-bold"
                >
                  ▶ TEST PNEUMATIC ACTUATION
                </button>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ACT 3: THE SYSTEMS MATRIX (VIT VELLORE '29) */}
      <section id="act-3" className="min-h-[75vh] flex flex-col justify-center border-t border-slate-200 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 font-mono">
            <span className="text-xs text-indigo-600 font-bold tracking-widest block">
              ACT 03 // SYSTEMS FRONTIER
            </span>
            <GsapTextReveal className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans leading-tight">
              Computer Science &amp; Systems Lab.
            </GsapTextReveal>
            <p className="text-xs text-slate-400">
              B.TECH CSE &bull; VIT VELLORE &apos;29
            </p>
          </div>

          <div className="lg:col-span-6">
            <TiltCard className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-md space-y-5 text-slate-700 text-sm sm:text-base leading-relaxed">
              <p>
                Currently pursuing Computer Science &amp; Engineering at VIT Vellore (&apos;29), my craft focuses on high-performance architectures, low-level memory layout, dynamic memory allocators, and distributed systems.
              </p>
              <p>
                From building <code>cpp_memory_visualizer</code> to inspect pointer hops and heap fragmentation at the byte level, to architecting <code>AEGIS-OTA</code> for cryptographically verified firmware distribution, I engineer software that knows exactly what the hardware is doing.
              </p>
              <div className="pt-4 border-t border-slate-200 flex items-center gap-4 text-xs font-mono text-slate-500">
                <span className="text-indigo-600 font-bold">▹ C++ MEMORY ENGINE</span>
                <span>&bull;</span>
                <span className="text-indigo-600 font-bold">▹ CRYPTOGRAPHIC OTA FIRMWARE</span>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    </>
  );
}
