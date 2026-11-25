'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Mail, CheckCircle2, AlertCircle, X, ShieldAlert, RotateCw, Save } from 'lucide-react';
import { ProjectItem } from '@/types';
import { sound } from '@/utils/audio';

interface SecretCMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  onUpdateProjects: (updated: ProjectItem[]) => void;
}

export default function SecretCMSModal({
  isOpen,
  onClose,
  projects,
  onUpdateProjects,
}: SecretCMSModalProps) {
  const [stage, setStage] = useState<'password' | 'otp' | 'studio'>('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('p••••••••••3@gmail.com');
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingProjects, setEditingProjects] = useState<ProjectItem[]>(projects);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [devOtpNotification, setDevOtpNotification] = useState<string | null>(null);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, countdown]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Verify Password
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

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
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
        setCountdown(300);
        setResendCooldown(30);
        if (data.devOtp) setDevOtpNotification(data.devOtp);
        sound.playSuccess();
      } else {
        setErrorMsg('Failed to resend verification code.');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown <= 0) {
      setErrorMsg('Code expired. Please click Resend Code.');
      return;
    }

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
        setErrorMsg(data.error || 'Invalid verification token.');
      }
    } catch {
      setErrorMsg('Verification error.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save Changes
  const handleSaveProjects = async () => {
    setLoading(true);
    sound.playClick();
    try {
      const res = await fetch('/api/cms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: editingProjects }),
      });

      if (res.ok) {
        onUpdateProjects(editingProjects);
        setSaveSuccess(true);
        sound.playSuccess();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg('Failed to update project data.');
      }
    } catch {
      setErrorMsg('Save failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl p-6 sm:p-8 overflow-y-auto flex flex-col gap-6 border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-sky-600" size={22} />
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-mono text-slate-900 tracking-wide">
                STUDIO CMS // SECURE GATEWAY
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {stage === 'password' && 'STAGE 1: MASTER PASSCODE REQUIRED'}
                {stage === 'otp' && 'STAGE 2: TWO-FACTOR EMAIL AUTHENTICATION'}
                {stage === 'studio' && 'STAGE 3: CONTENT REVISION MODE'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setStage('password');
              setPassword('');
              setOtp('');
              setErrorMsg('');
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* STAGE 1: PASSWORD */}
        {stage === 'password' && (
          <form onSubmit={handleVerifyPassword} className="space-y-4 max-w-sm mx-auto py-8 w-full font-mono">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Enter Admin Passcode</h3>
              <p className="text-xs text-slate-500">
                Authorized access only.
              </p>
            </div>

            <div>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-center tracking-widest bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white transition-colors"
              />
            </div>

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
              {/* Masked Email Protection */}
              <p className="text-xs text-slate-500">
                A 6-digit code has been sent to your registered address:
              </p>
              <p className="text-xs text-sky-600 font-semibold tracking-wider">
                {maskedEmail}
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 py-1">
              <span className="text-xs text-slate-400">EXPIRES IN:</span>
              <span className={`text-xs font-bold ${countdown < 60 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
                {formatTimer(countdown)}
              </span>
            </div>

            {/* Input Box */}
            <div>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[10px] font-bold text-2xl bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white transition-colors"
              />
            </div>

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

            {/* Resend Action */}
            <div className="text-center pt-2">
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResendOtp}
                className="text-xs text-slate-500 hover:text-sky-600 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCw size={13} className={resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'} />
                <span>
                  {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Verification Code'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* STAGE 3: STUDIO CMS */}
        {stage === 'studio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="font-mono text-xs text-sky-700 font-bold">
                MANAGE PROJECTS & REPOSITORIES ({editingProjects.length})
              </span>

              <button
                onClick={handleSaveProjects}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <Save size={14} />
                <span>{loading ? 'SAVING...' : 'SAVE REVISIONS'}</span>
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>PROJECT REVISIONS APPLIED TO LOCAL SESSION.</span>
              </div>
            )}

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {editingProjects.map((p, idx) => (
                <div key={p.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">TITLE</label>
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => {
                          const updated = [...editingProjects];
                          updated[idx].title = e.target.value;
                          setEditingProjects(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">SUBTITLE</label>
                      <input
                        type="text"
                        value={p.subtitle}
                        onChange={(e) => {
                          const updated = [...editingProjects];
                          updated[idx].subtitle = e.target.value;
                          setEditingProjects(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">SUMMARY</label>
                    <textarea
                      rows={2}
                      value={p.summary}
                      onChange={(e) => {
                        const updated = [...editingProjects];
                        updated[idx].summary = e.target.value;
                        setEditingProjects(updated);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500 resize-none font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">GITHUB REPO URL</label>
                      <input
                        type="text"
                        value={p.githubUrl || ''}
                        onChange={(e) => {
                          const updated = [...editingProjects];
                          updated[idx].githubUrl = e.target.value;
                          setEditingProjects(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">LIVE DEMO URL</label>
                      <input
                        type="text"
                        value={p.demoUrl || ''}
                        onChange={(e) => {
                          const updated = [...editingProjects];
                          updated[idx].demoUrl = e.target.value;
                          setEditingProjects(updated);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
