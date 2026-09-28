import React, { useState } from 'react';
import { FamilyUser } from '../types';
import { X, Check, Lock, Sparkles, ShieldCheck, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

interface SwitchUserModalProps {
  currentUser: FamilyUser;
  users: FamilyUser[];
  onSelectUser: (user: FamilyUser) => void;
  onClose: () => void;
  onFullLogout: () => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({
  currentUser,
  users,
  onSelectUser,
  onClose,
  onFullLogout,
}) => {
  const [adminTargetUser, setAdminTargetUser] = useState<FamilyUser | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMemberClick = (user: FamilyUser) => {
    setError(null);
    setAdminPassword('');

    // If target user is an Admin, REQUIRE admin password!
    if (user.role === 'admin') {
      setAdminTargetUser(user);
    } else {
      // Regular members can switch easily
      onSelectUser(user);
      onClose();
    }
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError('Please enter the administrator password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-admin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Incorrect Administrator password.');
      }

      onSelectUser(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
        {/* If Admin Password Challenge is Active */}
        {adminTargetUser ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  setAdminTargetUser(null);
                  setError(null);
                  setAdminPassword('');
                }}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to members</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-200 rounded-xl hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold mx-auto mb-3 shadow-lg shadow-amber-500/10">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Administrator Protection</h3>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                <strong className="text-stone-200">{adminTargetUser.name}</strong> is protected. Enter the administrator password to access this account.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAdminVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5 uppercase tracking-wider">
                  Admin Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-white placeholder-stone-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAdminTargetUser(null);
                    setError(null);
                    setAdminPassword('');
                  }}
                  className="w-1/3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Unlock Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Normal Member Switcher List */
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Switch Active Family Member
                </h3>
                <p className="text-xs text-stone-400">
                  Select a profile. Admin account requires password.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-200 rounded-xl hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-6 max-h-[55vh] overflow-y-auto pr-1">
              {users
                .filter((u) => u.active)
                .map((u) => {
                  const isSelected = u.id === currentUser.id;
                  const isAdmin = u.role === 'admin';

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleMemberClick(u)}
                      className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1 bg-stone-900 rounded-xl border border-stone-800">
                          {u.avatar}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-1.5">
                            {u.name}
                            <span
                              className={`text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded border ${
                                isAdmin
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-stone-800 text-stone-400 border-stone-700'
                              }`}
                            >
                              {isAdmin ? 'Admin • Locked' : u.role}
                            </span>
                          </p>
                          <p className="text-xs text-stone-400 line-clamp-1">
                            {isAdmin ? 'Requires admin password to enter' : u.notes || `@${u.username}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isAdmin && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-800">
              <button
                onClick={onFullLogout}
                className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
              >
                Log out of household
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
