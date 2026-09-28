import React, { useState } from 'react';
import { FamilyUser, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  UserCheck,
} from 'lucide-react';

interface UserManagementProps {
  currentUser: FamilyUser;
  users: FamilyUser[];
  onAddUser: (user: Partial<FamilyUser> & { password: string }) => Promise<void>;
  onUpdateUser: (id: string, updates: Partial<FamilyUser> & { password?: string }) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<FamilyUser | null>(null);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('kid');
  const [newAvatar, setNewAvatar] = useState('🌟');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Password reset inline state
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  const isAdminOrParent = currentUser.role === 'admin' || currentUser.role === 'parent';

  const avatarChoices = ['👑', '👩', '👨', '🚀', '👵', '👴', '🧒', '👧', '🎨', '⚽', '🎸', '🌟'];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      setFormError('Username, password, and display name are required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await onAddUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        name: newName.trim(),
        role: newRole,
        avatar: newAvatar,
        notes: newNotes.trim(),
        active: true,
      });

      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewNotes('');
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add family member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmitting(true);
    try {
      await onUpdateUser(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role,
        avatar: editingUser.avatar,
        notes: editingUser.notes,
        active: editingUser.active,
      });
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveResetPassword = async (userId: string) => {
    if (!newPasswordValue.trim()) return;
    try {
      await onUpdateUser(userId, { password: newPasswordValue.trim() });
      setResetPwdUserId(null);
      setNewPasswordValue('');
      alert('Password updated successfully for this family member.');
    } catch (err: any) {
      alert(err.message || 'Failed to update password.');
    }
  };

  const toggleUserActive = async (user: FamilyUser) => {
    if (user.role === 'admin' && user.id === currentUser.id) {
      alert('You cannot deactivate your own admin account.');
      return;
    }
    await onUpdateUser(user.id, { active: !user.active });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-400" />
              Jhatwal Home Access Control & Allowlist
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Private Household
            </span>
          </div>
          <p className="text-stone-400 text-sm mt-0.5">
            Only users on this allowlist can log in with their username & password.
          </p>
        </div>

        {isAdminOrParent && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 text-xs sm:text-sm cursor-pointer transition shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Allow New Family Member</span>
          </button>
        )}
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isCurrent = u.id === currentUser.id;
          return (
            <div
              key={u.id}
              className={`bg-stone-900 border rounded-3xl p-5 flex flex-col justify-between transition ${
                isCurrent ? 'border-amber-500/50 shadow-md shadow-amber-500/5' : 'border-stone-800'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none">{u.avatar}</span>
                    <div>
                      <h3 className="font-bold text-stone-100 flex items-center gap-1.5 text-sm sm:text-base">
                        {u.name}
                        {isCurrent && (
                          <span className="text-[10px] text-amber-400 font-mono">(You)</span>
                        )}
                      </h3>
                      <p className="text-xs font-mono text-stone-400">@{u.username}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      u.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : u.role === 'parent'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : u.role === 'kid'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 text-xs mb-3">
                  {u.active ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Login Permitted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-medium">
                      <XCircle className="w-3.5 h-3.5" /> Access Suspended
                    </span>
                  )}
                  {u.lastLogin ? (
                    <span className="text-[10px] text-stone-500">
                      Active: {new Date(u.lastLogin).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">No login yet</span>
                  )}
                </div>

                {/* Personal Notes for AI */}
                {u.notes ? (
                  <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-2xl text-xs text-stone-300 mb-3">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> AI Persona & Family Notes:
                    </p>
                    <p className="line-clamp-3 leading-relaxed">{u.notes}</p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic mb-3">No specific notes provided.</p>
                )}

                {/* Password reset input inline */}
                {resetPwdUserId === u.id && (
                  <div className="p-3 bg-stone-950 border border-amber-500/40 rounded-2xl mb-3 space-y-2">
                    <p className="text-xs font-bold text-amber-300">Set New Password for @{u.username}:</p>
                    <input
                      type="password"
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      placeholder="New family passcode"
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setResetPwdUserId(null)}
                        className="px-2.5 py-1 text-xs text-stone-400 hover:text-stone-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveResetPassword(u.id)}
                        className="px-3 py-1 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions for Admin / Parents */}
              {isAdminOrParent && (
                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                      title="Edit member details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setResetPwdUserId(resetPwdUserId === u.id ? null : u.id);
                        setNewPasswordValue('');
                      }}
                      className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                      title="Reset family password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleUserActive(u)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        u.active
                          ? 'text-stone-400 hover:text-red-400 hover:bg-red-500/10'
                          : 'text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title="Toggle login permission"
                    >
                      {u.active ? 'Suspend' : 'Activate'}
                    </button>
                  </div>

                  {currentUser.role === 'admin' && u.id !== currentUser.id && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove @${u.username} from the family allowlist?`)) {
                          onDeleteUser(u.id);
                        }
                      }}
                      className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      title="Remove member permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Add Approved Family Member</h3>
            <p className="text-xs text-stone-400 mb-4">
              Create credentials for a family member so they can access Jhatwal Home.
            </p>

            {formError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Username (Login ID)
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="e.g. maya or leo"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Family Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Secret passcode"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Full Name / Nickname
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Maya (Daughter)"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Family Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="parent">Parent (Full access)</option>
                    <option value="kid">Kid (Homework tutor & safe mode)</option>
                    <option value="elder">Elder (Storytelling & large text)</option>
                    <option value="admin">Family Admin</option>
                  </select>
                </div>
              </div>

              {/* Avatar picker */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Choose Avatar Emoji
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {avatarChoices.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewAvatar(emoji)}
                      className={`text-xl p-2 rounded-xl border transition cursor-pointer ${
                        newAvatar === emoji
                          ? 'bg-amber-500/20 border-amber-500/60 scale-110'
                          : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes for Gemini */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Personal Context & AI Guidance
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Age 8, 3rd grade math, loves dinosaurs, allergic to dairy..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-stone-400 hover:text-stone-200 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold rounded-xl text-sm transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  {submitting ? 'Adding...' : 'Approve & Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Edit @{editingUser.username}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Update display name, role, avatar, or personal notes.
            </p>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e: any) =>
                      setEditingUser({ ...editingUser, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="parent">Parent</option>
                    <option value="kid">Kid</option>
                    <option value="elder">Elder</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  Avatar Emoji
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {avatarChoices.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setEditingUser({ ...editingUser, avatar: emoji })
                      }
                      className={`text-xl p-2 rounded-xl border transition cursor-pointer ${
                        editingUser.avatar === emoji
                          ? 'bg-amber-500/20 border-amber-500/60 scale-110'
                          : 'bg-stone-950 border-stone-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">
                  AI Context / Notes
                </label>
                <textarea
                  value={editingUser.notes}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-stone-400 hover:text-stone-200 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
