'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
  RotateCw,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { PortfolioData } from '@/types';
import { portfolioData as defaultPortfolioData } from '@/data/portfolioData';
import { sound } from '@/utils/audio';

interface SecretCMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: PortfolioData;
  onUpdateContent: (updated: PortfolioData) => void;
}

type CmsTab = 'hero' | 'story' | 'research' | 'experience' | 'projects' | 'beyond' | 'contact';

export default function SecretCMSModal({
  isOpen,
  onClose,
  content,
  onUpdateContent,
}: SecretCMSModalProps) {
  const [stage, setStage] = useState<'password' | 'otp' | 'studio'>('password');
  const [activeTab, setActiveTab] = useState<CmsTab>('hero');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('p••••••••••3@gmail.com');
  const [countdown, setCountdown] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<PortfolioData>(content);
  const [statusNote, setStatusNote] = useState('');
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  useEffect(() => {
    setDraft(content);
  }, [content, isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [stage, countdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    sound.playClick();
    try {
      const res = await fetch('/api/cms/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_password', password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStage('otp');
        setCountdown(300);
        setResendCooldown(30);
        if (data.maskedEmail) setMaskedEmail(data.maskedEmail);
        if (data.devOtp) setDevOtpNotification(data.devOtp);
        sound.playSuccess();
      } else {
        setErrorMsg(data.error || 'Access Denied: Incorrect passcode.');
      }
    } catch {
      setErrorMsg('Auth communication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    sound.playClick();
    try {
      const res = await fetch('/api/cms/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', otp }),
      });
      const data = await res.json();
      if (res.ok) {
        setStage('studio');
        sound.playSuccess();
      } else {
        setErrorMsg(data.error || 'Invalid or expired verification token.');
      }
    } catch {
      setErrorMsg('Verification error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setLoading(true);
    sound.playClick();
    try {
      const res = await fetch('/api/cms/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_otp' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCountdown(300);
        setResendCooldown(30);
        if (data.devOtp) setDevOtpNotification(data.devOtp);
        sound.playSuccess();
      } else {
        setErrorMsg(data.error || 'Failed to resend code.');
      }
    } catch {
      setErrorMsg('Failed to communicate with auth server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    setStatusNote('');
    sound.playClick();
    try {
      const res = await fetch('/api/cms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      if (res.ok) {
        onUpdateContent(draft);
        setStatusNote('ALL SECTIONS SAVED TO LIVE SITE & LOCAL STORAGE.');
        sound.playSuccess();
        setTimeout(() => setStatusNote(''), 3500);
      }
    } catch {
      setErrorMsg('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = () => {
    sound.playClick();
    setDraft(defaultPortfolioData);
    onUpdateContent(defaultPortfolioData);
    setStatusNote('RESTORED DEFAULT SITE CONTENT.');
    setTimeout(() => setStatusNote(''), 3000);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
      sound.playSuccess();
      setStatusNote('COPIED FULL SITE JSON TO CLIPBOARD.');
      setTimeout(() => setStatusNote(''), 3000);
    } catch {
      setErrorMsg('Clipboard copy failed.');
    }
  };

  const splitLines = (val: string) =>
    val
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const splitComma = (val: string) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const inputClass =
    'w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500';
  const labelClass = 'block text-[10px] text-slate-500 font-bold mb-1 uppercase';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <ShieldAlert size={16} className="text-sky-600" />
            <span className="font-bold text-slate-900 tracking-wider">DHRUV FULL-SITE CMS // 2FA</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* STAGE 1: PASSWORD */}
        {stage === 'password' && (
          <form onSubmit={handleVerifyPassword} className="space-y-4 max-w-sm mx-auto py-6 w-full font-mono">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Authorization Required</h3>
              <p className="text-xs text-slate-500">Enter CMS passcode to unlock full-site editing.</p>
            </div>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Passcode..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white"
            />
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wider transition-all shadow-md"
            >
              {loading ? 'AUTHENTICATING...' : 'NEXT: 2-STEP VERIFICATION'}
            </button>
          </form>
        )}

        {/* STAGE 2: 2FA OTP */}
        {stage === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 max-w-sm mx-auto py-6 w-full font-mono">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Mail size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Verification Token</h3>
              <p className="text-xs text-slate-500">A 6-digit code has been sent to:</p>
              <p className="text-xs text-sky-600 font-semibold tracking-wider">{maskedEmail}</p>
            </div>
            <div className="flex items-center justify-center gap-2 py-1">
              <span className="text-xs text-slate-400">EXPIRES IN:</span>
              <span className={`text-xs font-bold ${countdown < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                {formatTimer(countdown)}
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[10px] font-bold text-2xl bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white"
            />
            {devOtpNotification && (
              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-800 text-center">
                Local Dev Token: <strong className="text-sky-950 tracking-widest">{devOtpNotification}</strong>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || countdown <= 0}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold tracking-wider transition-all shadow-md"
            >
              {loading ? 'VERIFYING...' : 'CONFIRM & UNLOCK'}
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-xs text-slate-500 hover:text-sky-600 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                <RotateCw size={13} />
                <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STAGE 3: FULL-SITE STUDIO CMS */}
        {stage === 'studio' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(['hero', 'story', 'research', 'experience', 'projects', 'beyond', 'contact'] as CmsTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        sound.playClick();
                        setActiveTab(tab);
                      }}
                      className={`px-3 py-1.5 rounded-xl uppercase font-bold border transition-all ${
                        activeTab === tab
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-sky-400'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  title="Copy JSON"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleResetDefaults}
                  title="Reset Defaults"
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>RESET</span>
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save size={13} />
                  <span>{loading ? 'SAVING...' : 'SAVE ALL'}</span>
                </button>
              </div>
            </div>

            {statusNote && (
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{statusNote}</span>
              </div>
            )}

            {/* Scrollable Editor Area */}
            <div className="max-h-[54vh] overflow-y-auto pr-2 space-y-4">
              {/* HERO TAB */}
              {activeTab === 'hero' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Name / Display Title</label>
                      <input
                        className={inputClass}
                        value={draft.hero.name}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, name: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Status Badge</label>
                      <input
                        className={inputClass}
                        value={draft.hero.statusBadge}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, statusBadge: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Headline</label>
                    <input
                      className={inputClass}
                      value={draft.hero.headline}
                      onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, headline: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Subheadline</label>
                    <textarea
                      rows={3}
                      className={`${inputClass} font-sans`}
                      value={draft.hero.subheadline}
                      onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, subheadline: e.target.value } })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>GitHub URL</label>
                      <input
                        className={inputClass}
                        value={draft.hero.githubUrl}
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, githubUrl: e.target.value } })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Resume PDF URL (Optional)</label>
                      <input
                        className={inputClass}
                        value={draft.hero.resumeUrl || ''}
                        placeholder="/resume.pdf or Google Drive link"
                        onChange={(e) => setDraft({ ...draft, hero: { ...draft.hero, resumeUrl: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Highlight Pills (One per line)</label>
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={draft.hero.highlights.join('\n')}
                      onChange={(e) =>
                        setDraft({ ...draft, hero: { ...draft.hero, highlights: splitLines(e.target.value) } })
                      }
                    />
                  </div>
                </div>
              )}

              {/* STORY TAB */}
              {activeTab === 'story' && (
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      setDraft({
                        ...draft,
                        chapters: [
                          ...draft.chapters,
                          {
                            id: Date.now(),
                            actTitle: `ACT 0${draft.chapters.length} // NEW CHAPTER`,
                            heading: 'New Story Chapter',
                            tagline: 'Chapter tagline',
                            location: 'Location',
                            timeframe: '2026',
                            narrativeText: ['Describe this milestone...'],
                            milestones: ['Key milestone'],
                            themeColor: '#0284c7',
                          },
                        ],
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>ADD STORY CHAPTER</span>
                  </button>
                  {draft.chapters.map((ch, idx) => (
                    <div key={ch.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sky-700">{ch.actTitle}</span>
                        <button
                          onClick={() =>
                            setDraft({ ...draft, chapters: draft.chapters.filter((_, i) => i !== idx) })
                          }
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          className={inputClass}
                          value={ch.actTitle}
                          onChange={(e) => {
                            const next = [...draft.chapters];
                            next[idx] = { ...ch, actTitle: e.target.value };
                            setDraft({ ...draft, chapters: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={ch.heading}
                          onChange={(e) => {
                            const next = [...draft.chapters];
                            next[idx] = { ...ch, heading: e.target.value };
                            setDraft({ ...draft, chapters: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={ch.timeframe}
                          onChange={(e) => {
                            const next = [...draft.chapters];
                            next[idx] = { ...ch, timeframe: e.target.value };
                            setDraft({ ...draft, chapters: next });
                          }}
                        />
                      </div>
                      <textarea
                        rows={3}
                        className={`${inputClass} font-sans`}
                        value={ch.narrativeText.join('\n')}
                        onChange={(e) => {
                          const next = [...draft.chapters];
                          next[idx] = { ...ch, narrativeText: splitLines(e.target.value) };
                          setDraft({ ...draft, chapters: next });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* RESEARCH TAB */}
              {activeTab === 'research' && (
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      setDraft({
                        ...draft,
                        research: [
                          ...draft.research,
                          {
                            id: `paper-${Date.now()}`,
                            title: 'New Research Paper Title',
                            venue: 'Conference / Journal Name',
                            date: '2026',
                            status: 'Accepted',
                            authors: ['Dhruv Patel'],
                            abstract: 'Abstract summary...',
                            metrics: ['Metric 1'],
                            hardwareStack: ['Hardware 1'],
                            softwareStack: ['Software 1'],
                            paperUrl: '',
                            codeUrl: '',
                          },
                        ],
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>ADD RESEARCH PAPER</span>
                  </button>
                  {draft.research.map((paper, idx) => (
                    <div key={paper.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-700">{paper.venue}</span>
                        <button
                          onClick={() =>
                            setDraft({ ...draft, research: draft.research.filter((_, i) => i !== idx) })
                          }
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div>
                        <label className={labelClass}>Paper Title</label>
                        <input
                          className={inputClass}
                          value={paper.title}
                          onChange={(e) => {
                            const next = [...draft.research];
                            next[idx] = { ...paper, title: e.target.value };
                            setDraft({ ...draft, research: next });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className={labelClass}>Venue</label>
                          <input
                            className={inputClass}
                            value={paper.venue}
                            onChange={(e) => {
                              const next = [...draft.research];
                              next[idx] = { ...paper, venue: e.target.value };
                              setDraft({ ...draft, research: next });
                            }}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Date</label>
                          <input
                            className={inputClass}
                            value={paper.date}
                            onChange={(e) => {
                              const next = [...draft.research];
                              next[idx] = { ...paper, date: e.target.value };
                              setDraft({ ...draft, research: next });
                            }}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Status</label>
                          <select
                            className={inputClass}
                            value={paper.status}
                            onChange={(e) => {
                              const next = [...draft.research];
                              next[idx] = { ...paper, status: e.target.value as typeof paper.status };
                              setDraft({ ...draft, research: next });
                            }}
                          >
                            <option value="Accepted">Accepted</option>
                            <option value="Published">Published</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Preprint">Preprint</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Abstract</label>
                        <textarea
                          rows={3}
                          className={`${inputClass} font-sans`}
                          value={paper.abstract}
                          onChange={(e) => {
                            const next = [...draft.research];
                            next[idx] = { ...paper, abstract: e.target.value };
                            setDraft({ ...draft, research: next });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className={labelClass}>Paper URL</label>
                          <input
                            className={inputClass}
                            value={paper.paperUrl || ''}
                            onChange={(e) => {
                              const next = [...draft.research];
                              next[idx] = { ...paper, paperUrl: e.target.value };
                              setDraft({ ...draft, research: next });
                            }}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Code URL</label>
                          <input
                            className={inputClass}
                            value={paper.codeUrl || ''}
                            onChange={(e) => {
                              const next = [...draft.research];
                              next[idx] = { ...paper, codeUrl: e.target.value };
                              setDraft({ ...draft, research: next });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EXPERIENCE & CLUBS TAB */}
              {activeTab === 'experience' && (
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      setDraft({
                        ...draft,
                        experiences: [
                          {
                            id: `exp-${Date.now()}`,
                            type: 'work',
                            role: 'Software Engineering Intern',
                            organization: 'Company Name',
                            period: 'Summer 2027',
                            location: 'Remote / India',
                            summary: 'Key engineering work...',
                            highlights: ['Impact metric 1'],
                            badge: 'Internship',
                          },
                          ...draft.experiences,
                        ],
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>ADD WORK / INTERNSHIP / CLUB</span>
                  </button>
                  {draft.experiences.map((exp, idx) => (
                    <div key={exp.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sky-700">{exp.role}</span>
                        <button
                          onClick={() =>
                            setDraft({ ...draft, experiences: draft.experiences.filter((_, i) => i !== idx) })
                          }
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className={labelClass}>Type (Work appears first)</label>
                          <select
                            className={inputClass}
                            value={exp.type}
                            onChange={(e) => {
                              const next = [...draft.experiences];
                              next[idx] = { ...exp, type: e.target.value as typeof exp.type };
                              setDraft({ ...draft, experiences: next });
                            }}
                          >
                            <option value="work">Work / Internship</option>
                            <option value="achievement">Hackathon / Achievement</option>
                            <option value="club">Club / Leadership</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Role</label>
                          <input
                            className={inputClass}
                            value={exp.role}
                            onChange={(e) => {
                              const next = [...draft.experiences];
                              next[idx] = { ...exp, role: e.target.value };
                              setDraft({ ...draft, experiences: next });
                            }}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Organization</label>
                          <input
                            className={inputClass}
                            value={exp.organization}
                            onChange={(e) => {
                              const next = [...draft.experiences];
                              next[idx] = { ...exp, organization: e.target.value };
                              setDraft({ ...draft, experiences: next });
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          className={inputClass}
                          value={exp.period}
                          placeholder="Period"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, period: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={exp.location}
                          placeholder="Location"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, location: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={exp.badge || ''}
                          placeholder="Badge"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, badge: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                        />
                      </div>
                      <textarea
                        rows={2}
                        className={`${inputClass} font-sans`}
                        value={exp.summary}
                        onChange={(e) => {
                          const next = [...draft.experiences];
                          next[idx] = { ...exp, summary: e.target.value };
                          setDraft({ ...draft, experiences: next });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* PROJECTS TAB */}
              {activeTab === 'projects' && (
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      setDraft({
                        ...draft,
                        projects: [
                          {
                            id: `proj-${Date.now()}`,
                            title: 'New Engineering Project',
                            subtitle: 'Short technical subtitle',
                            category: 'systems',
                            tags: ['TypeScript'],
                            summary: 'Project summary...',
                            story: 'Architecture notes...',
                            metrics: ['Key metric'],
                            githubUrl: '',
                            demoUrl: '',
                            featured: true,
                          },
                          ...draft.projects,
                        ],
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>ADD PROJECT</span>
                  </button>
                  {draft.projects.map((p, idx) => (
                    <div key={p.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{p.title}</span>
                        <button
                          onClick={() =>
                            setDraft({ ...draft, projects: draft.projects.filter((_, i) => i !== idx) })
                          }
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          className={inputClass}
                          value={p.title}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...p, title: e.target.value };
                            setDraft({ ...draft, projects: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={p.subtitle}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...p, subtitle: e.target.value };
                            setDraft({ ...draft, projects: next });
                          }}
                        />
                        <select
                          className={inputClass}
                          value={p.category}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...p, category: e.target.value as typeof p.category };
                            setDraft({ ...draft, projects: next });
                          }}
                        >
                          <option value="edge-ai">Edge AI</option>
                          <option value="iot">IoT / Embedded</option>
                          <option value="automation">Automation / PCB</option>
                          <option value="systems">Systems</option>
                          <option value="fullstack">Full-Stack</option>
                          <option value="simulation">Simulation</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        className={`${inputClass} font-sans`}
                        value={p.summary}
                        onChange={(e) => {
                          const next = [...draft.projects];
                          next[idx] = { ...p, summary: e.target.value };
                          setDraft({ ...draft, projects: next });
                        }}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          className={inputClass}
                          placeholder="Tags (comma separated)"
                          value={p.tags.join(', ')}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...p, tags: splitComma(e.target.value) };
                            setDraft({ ...draft, projects: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          placeholder="GitHub URL"
                          value={p.githubUrl || ''}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...p, githubUrl: e.target.value };
                            setDraft({ ...draft, projects: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          placeholder="Live Demo URL"
                          value={p.demoUrl || ''}
                          onChange={(e) => {
                            const next = [...draft.projects];
                            next[idx] = { ...p, demoUrl: e.target.value };
                            setDraft({ ...draft, projects: next });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BEYOND CODE TAB */}
              {activeTab === 'beyond' && (
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      setDraft({
                        ...draft,
                        beyond: [
                          ...draft.beyond,
                          {
                            id: `beyond-${Date.now()}`,
                            title: 'New Interest',
                            category: 'other',
                            tagline: 'Short tagline',
                            details: 'Details...',
                            badge: 'Interest',
                            icon: 'Sparkles',
                          },
                        ],
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>ADD HOBBY / SPORT / ACTIVITY</span>
                  </button>
                  {draft.beyond.map((b, idx) => (
                    <div key={b.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-700">{b.title}</span>
                        <button
                          onClick={() =>
                            setDraft({ ...draft, beyond: draft.beyond.filter((_, i) => i !== idx) })
                          }
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          className={inputClass}
                          value={b.title}
                          onChange={(e) => {
                            const next = [...draft.beyond];
                            next[idx] = { ...b, title: e.target.value };
                            setDraft({ ...draft, beyond: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={b.badge}
                          onChange={(e) => {
                            const next = [...draft.beyond];
                            next[idx] = { ...b, badge: e.target.value };
                            setDraft({ ...draft, beyond: next });
                          }}
                        />
                        <input
                          className={inputClass}
                          value={b.tagline}
                          onChange={(e) => {
                            const next = [...draft.beyond];
                            next[idx] = { ...b, tagline: e.target.value };
                            setDraft({ ...draft, beyond: next });
                          }}
                        />
                      </div>
                      <textarea
                        rows={2}
                        className={`${inputClass} font-sans`}
                        value={b.details}
                        onChange={(e) => {
                          const next = [...draft.beyond];
                          next[idx] = { ...b, details: e.target.value };
                          setDraft({ ...draft, beyond: next });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* CONTACT TAB */}
              {activeTab === 'contact' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Section Badge</label>
                      <input
                        className={inputClass}
                        value={draft.contact.badge}
                        onChange={(e) =>
                          setDraft({ ...draft, contact: { ...draft.contact, badge: e.target.value } })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Destination Email</label>
                      <input
                        className={inputClass}
                        value={draft.contact.email}
                        onChange={(e) =>
                          setDraft({ ...draft, contact: { ...draft.contact, email: e.target.value } })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Heading</label>
                    <input
                      className={inputClass}
                      value={draft.contact.heading}
                      onChange={(e) =>
                        setDraft({ ...draft, contact: { ...draft.contact, heading: e.target.value } })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      rows={2}
                      className={`${inputClass} font-sans`}
                      value={draft.contact.description}
                      onChange={(e) =>
                        setDraft({ ...draft, contact: { ...draft.contact, description: e.target.value } })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Location</label>
                      <input
                        className={inputClass}
                        value={draft.contact.location}
                        onChange={(e) =>
                          setDraft({ ...draft, contact: { ...draft.contact, location: e.target.value } })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>GitHub URL</label>
                      <input
                        className={inputClass}
                        value={draft.contact.githubUrl}
                        onChange={(e) =>
                          setDraft({ ...draft, contact: { ...draft.contact, githubUrl: e.target.value } })
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>LinkedIn URL</label>
                      <input
                        className={inputClass}
                        value={draft.contact.linkedinUrl}
                        onChange={(e) =>
                          setDraft({ ...draft, contact: { ...draft.contact, linkedinUrl: e.target.value } })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
