'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { sound } from '@/utils/audio';

interface ContactSectionProps {
  onSecretTrigger: () => void;
}

export default function ContactSection({ onSecretTrigger }: ContactSectionProps) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactMsg, setContactMsg] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      contactForm.message.trim().toLowerCase() === 'sudo dhruv' ||
      contactForm.message.trim().toLowerCase() === 'access --admin' ||
      contactForm.message.trim().toLowerCase() === 'admin'
    ) {
      sound.playSuccess();
      onSecretTrigger();
      setContactForm({ name: '', email: '', subject: '', message: '' });
      return;
    }

    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactStatus('error');
      setContactMsg('Please complete all mandatory parameters.');
      return;
    }

    setContactStatus('sending');
    setContactMsg('DISPATCHING DIRECT TRANSMISSION TO PATEL.DHRUV6113@GMAIL.COM...');
    sound.playClick();

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (res.ok) {
        setContactStatus('success');
        setContactMsg('TRANSMISSION CONFIRMED. PAYLOAD DELIVERED.');
        sound.playSuccess();
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setContactStatus('error');
        setContactMsg(data.error || 'Transmission delivery failed.');
      }
    } catch {
      setContactStatus('error');
      setContactMsg('Network error. Failed to reach transmission gateway.');
    }
  };

  return (
    <>
      <section id="act-6" className="space-y-8 scroll-mt-28 border-t border-slate-200 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-sky-50 text-sky-700 text-xs font-mono font-bold tracking-wider">
              <span>DIRECT PIPELINE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              Let&apos;s Build Something Extraordinary.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Open for high-impact software engineering roles, full-stack application development, distributed systems architecture, and hardware-software ventures.
            </p>
            <div className="pt-2 text-xs font-mono text-slate-500 space-y-1">
              <p>TRANSMISSION DESTINATION: patel.dhruv6113@gmail.com</p>
              <p>LOCATION: Vellore / Gujarat, India</p>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
            <form onSubmit={handleContactSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">CALLSIGN / NAME</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Alex Vance"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">RETURN EMAIL</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="e.g. alex@example.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">FREQUENCY / SUBJECT</label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="e.g. Software & Systems Collaboration"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">PAYLOAD / MESSAGE</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Enter message payload..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all resize-none font-sans text-xs"
                />
              </div>

              {contactStatus !== 'idle' && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    contactStatus === 'sending'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : contactStatus === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {contactStatus === 'sending' && <Loader2 size={14} className="animate-spin" />}
                  {contactStatus === 'success' && <CheckCircle2 size={14} />}
                  {contactStatus === 'error' && <AlertCircle size={14} />}
                  <span>{contactMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={contactStatus === 'sending'}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Send size={14} />
                <span>DISPATCH DIRECT TRANSMISSION</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer className="pt-16 pb-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-500">
        <div>
          &copy; {new Date().getFullYear()} DHRUV PATEL &bull; VIT VELLORE &apos;29
        </div>
        <div className="flex items-center gap-5">
          <a href="https://github.com/DhruvSPatel6113" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
            GITHUB
          </a>
          <span>&bull;</span>
          <a href="https://linkedin.com/in/dhruvpatel6113" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">
            LINKEDIN
          </a>
          <span>&bull;</span>
          <button
            onClick={onSecretTrigger}
            className="text-slate-400 hover:text-slate-700"
          >
            ADMIN
          </button>
        </div>
      </footer>
    </>
  );
}
