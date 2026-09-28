import React, { useState } from 'react';
import { FamilyUser } from '../types';
import { Lock, User, KeyRound, Sparkles, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppLogo } from './AppLogo';

interface AuthScreenProps {
  onLoginSuccess: (user: FamilyUser, token: string) => void;
  allowedUsers: FamilyUser[];
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, allowedUsers }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adminHint, setAdminHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setAdminHint(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (targetUsername: string, pass: string) => {
    setLoading(true);
    setError(null);
    setAdminHint(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate.');
      }
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSelect = (user: FamilyUser) => {
    setUsername(user.username);
    setError(null);

    // CRITICAL: NEVER AUTO-FILL ADMIN PASSWORD!
    if (user.role === 'admin' || user.username === 'krish' || user.username === 'admin') {
      setPassword('');
      setAdminHint('Admin account selected. Enter password or click "1-Tap Enter as Krish" above.');
      return;
    }

    setAdminHint(null);
    // Fill known default password for testing regular members
    if (user.username === 'mom') setPassword('family123');
    else if (user.username === 'dad') setPassword('family123');
    else if (user.username === 'kabir') setPassword('kabir2026');
    else if (user.username === 'nana') setPassword('nana123');
    else if (user.username === 'sonu') setPassword('sonu1234');
    else setPassword('family123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950/40 flex flex-col justify-center items-center p-4 sm:p-6 text-stone-100">
      {/* Decorative family ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header with New Cool Logo */}
        <div className="text-center mb-7 flex flex-col items-center">
          <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
            <AppLogo size="xl" showText={false} glow={true} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            JHATWAL HOME
            <span className="text-xs uppercase tracking-widest font-black px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/40 shadow-sm">
              FAMILY AI
            </span>
          </h1>
          <p className="text-stone-400 text-sm mt-1.5 font-medium">
            Private Household Intelligence & Living Memory
          </p>
        </div>

        {/* Card */}
        <div className="bg-stone-900/90 backdrop-blur-xl border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          {/* Quick Feature Badges */}
          <div className="flex items-center justify-center flex-wrap gap-1.5 mb-5 pb-4 border-b border-stone-800/80">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> 🎙️ Voice Studio
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30">
              📻 Live Voice
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
              💬 Gemini 3.8
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              🎨 Image Studio
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              🧠 Living Brain
            </span>
          </div>

          {/* 1-Tap Instant Entry Section */}
          <div className="mb-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-Tap Instant Entry (No Typing Needed)
              </span>
              <span className="text-[10px] text-amber-400/80 font-bold">Fast Access</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDirectLogin('krish', '@1234krish')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>👑 Enter as Krish</span>
              </button>
              <button
                type="button"
                onClick={() => handleDirectLogin('sonu', 'sonu1234')}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-black text-xs border border-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>👩 Enter as Sunita</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {adminHint && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs mb-5">
              <Lock className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{adminHint}</span>
            </div>
          )}

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-stone-800 w-full" />
            <span className="bg-stone-900 px-3 text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
              Or sign in manually
            </span>
            <div className="border-t border-stone-800 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                Family Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (e.target.value.toLowerCase() === 'krish' || e.target.value.toLowerCase() === 'admin') {
                      setAdminHint('Admin account requires your private password.');
                    } else {
                      setAdminHint(null);
                    }
                  }}
                  placeholder="e.g. krish, admin, sunita, kabir, grandma"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider">
                  Passcode / Password
                </label>
                {(username.toLowerCase() === 'krish' || username.toLowerCase() === 'admin') && (
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Password Protected
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    username.toLowerCase() === 'krish' || username.toLowerCase() === 'admin'
                      ? 'Enter admin password...'
                      : 'Enter your family password'
                  }
                  className={`w-full pl-10 pr-3.5 py-3 rounded-2xl bg-stone-950/70 border text-white placeholder-stone-500 text-sm focus:outline-none focus:ring-1 transition ${
                    username.toLowerCase() === 'krish' || username.toLowerCase() === 'admin'
                      ? 'border-amber-500/50 focus:border-amber-400 focus:ring-amber-400'
                      : 'border-stone-800 focus:border-amber-500 focus:ring-amber-500'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Entering Jhatwal Home...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Enter Jhatwal Home</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Member Switcher */}
          <div className="mt-8 pt-6 border-t border-stone-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Select Member Profile
              </span>
              <span className="text-[10px] text-stone-500">Select profile</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allowedUsers.map((u) => {
                const isAdmin = u.role === 'admin';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickDemoSelect(u)}
                    className={`text-left p-2 rounded-xl border border-stone-800 hover:border-amber-500/50 hover:bg-stone-800/50 transition flex items-center gap-2 group cursor-pointer ${
                      username === u.username ? 'bg-amber-500/10 border-amber-500/40' : 'bg-stone-950/40'
                    }`}
                  >
                    <span className="text-lg leading-none p-1 rounded-lg bg-stone-900 border border-stone-800 group-hover:scale-110 transition">
                      {u.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-stone-200 truncate group-hover:text-amber-300">
                          {u.name}
                        </p>
                        {isAdmin && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-stone-400 capitalize">
                        {isAdmin ? 'Admin (Locked)' : u.role}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <PWAInstallButton variant="login" />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-stone-500">
          Powered by Gemini 3.5 & 3.1 Pro • Search & Maps Grounded • Secure Household
        </div>
      </div>
    </div>
  );
};
