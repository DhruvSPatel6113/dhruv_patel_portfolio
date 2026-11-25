'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Terminal, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { sound } from '@/utils/audio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSection: (sectionId: string) => void;
  onSecretTrigger: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigateSection,
  onSecretTrigger,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        sound.playClick();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCommand = (command: string) => {
    sound.playClick();
    if (command === 'admin' || command === 'cms' || command === 'sudo dhruv') {
      onSecretTrigger();
      onClose();
      return;
    }
    onNavigateSection(command);
    onClose();
  };

  const actions = [
    { id: 'hero', label: '00 // Terminal Monolith', category: 'Navigation', hint: 'Top Overview' },
    { id: 'playground', label: '01 // Interactive Developer Playground', category: 'Engine', hint: 'Physics, C++ Heap & Crypto Simulators' },
    { id: 'projects', label: '02 // Production Software & Systems', category: 'Projects', hint: 'Flagship Projects & Architectures' },
    { id: 'skills', label: '03 // Dual-Stack Technical Arsenal', category: 'Arsenal', hint: 'Frontend, Systems & Hardware Stacks' },
    { id: 'transmission', label: '04 // Direct Transmission Terminal', category: 'Contact', hint: 'Dispatch directly to Dhruv Patel' },
  ];

  const filtered = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.hint.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl font-mono text-xs">
        {/* Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Secret check directly in search query
              if (
                e.target.value.toLowerCase() === 'admin' ||
                e.target.value.toLowerCase() === 'sudo dhruv'
              ) {
                sound.playSuccess();
                onSecretTrigger();
                onClose();
              }
            }}
            placeholder="Type a section name or command... (e.g. 'gripper', 'systems')"
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-xs"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100"
          >
            <X size={14} />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => handleCommand(item.id)}
              className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-slate-100 text-slate-700 hover:text-slate-950 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-sky-700 uppercase tracking-widest px-2 py-0.5 rounded bg-sky-50 border border-sky-200 font-semibold">
                  {item.category}
                </span>
                <span className="font-semibold text-slate-800 group-hover:text-sky-600">
                  {item.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-600 hidden sm:inline">
                {item.hint}
              </span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              No matching command found. Press ESC to exit.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50">
          <span>NAVIGATION // AUTONOMOUS ASSEMBLY CONSOLE</span>
          <span>PRESS ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
}
