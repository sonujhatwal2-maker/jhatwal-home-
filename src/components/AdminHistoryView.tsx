import React, { useState, useEffect } from 'react';
import { FamilyUser, FamilyHistoryEntry, MemberLoginLog, AIMode } from '../types';
import {
  History,
  MessageSquare,
  Search,
  Filter,
  Trash2,
  Clock,
  Sparkles,
  Shield,
  Laptop,
  Smartphone,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  UserCheck,
  Eye,
} from 'lucide-react';

interface AdminHistoryViewProps {
  currentUser: FamilyUser;
  allowedUsers: FamilyUser[];
}

export const AdminHistoryView: React.FC<AdminHistoryViewProps> = ({
  currentUser,
  allowedUsers,
}) => {
  const [subTab, setSubTab] = useState<'chats' | 'logins'>('chats');
  const [history, setHistory] = useState<FamilyHistoryEntry[]>([]);
  const [loginLogs, setLoginLogs] = useState<MemberLoginLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoryData();
  }, [selectedUserFilter, selectedModeFilter]);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUserFilter !== 'all') params.append('userId', selectedUserFilter);
      if (selectedModeFilter !== 'all') params.append('mode', selectedModeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setLoginLogs(data.loginLogs || []);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistoryData();
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Delete this history record?')) return;
    try {
      const res = await fetch(`/api/admin/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete history item', err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear ALL family chat history? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ', ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      );
    } catch {
      return isoString;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'thinking':
        return { label: '🧠 Deep Thinking', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'fast':
        return { label: '⚡ Ultra Fast', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'search':
        return { label: '🔍 Web Search', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'maps':
        return { label: '📍 Google Maps', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'vision':
        return { label: '📸 Photo Analysis', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { label: '💬 General', color: 'bg-stone-700 text-stone-300 border-stone-600' };
    }
  };

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.prompt.toLowerCase().includes(q) ||
      item.response.toLowerCase().includes(q) ||
      item.userName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-bold shadow-lg shadow-amber-500/20">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Family History & Oversight</h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-400">
              Full administrator access to every family member's questions, AI answers, and login records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistoryData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer border border-stone-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {subTab === 'chats' && history.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold transition cursor-pointer border border-red-800/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-stone-900/90 border border-stone-800 mb-6 max-w-md">
        <button
          onClick={() => setSubTab('chats')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'chats'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Family Chat Conversations ({history.length})</span>
        </button>

        <button
          onClick={() => setSubTab('logins')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'logins'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Member Login Audit ({loginLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: CHAT HISTORY */}
      {subTab === 'chats' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompt, question, topic, or response..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </form>

            {/* Member Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-semibold whitespace-nowrap">Member:</span>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Members</option>
                {allowedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.avatar} {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-semibold whitespace-nowrap">Mode:</span>
              <select
                value={selectedModeFilter}
                onChange={(e) => setSelectedModeFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-stone-950/70 border border-stone-800 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All AI Modes</option>
                <option value="general">General</option>
                <option value="thinking">Deep Thinking</option>
                <option value="fast">Ultra Fast</option>
                <option value="search">Web Grounded</option>
                <option value="maps">Google Maps</option>
                <option value="vision">Photo / Vision</option>
              </select>
            </div>
          </div>

          {/* Chat History List */}
          {filteredHistory.length === 0 ? (
            <div className="bg-stone-900/40 border border-stone-800 rounded-3xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-stone-800/80 border border-stone-700/50 flex items-center justify-center text-stone-500 mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-stone-500" />
              </div>
              <h4 className="text-base font-bold text-stone-200 mb-1">No conversation history found</h4>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Whenever you or any family member asks Jhatwal Home questions, recipes, homework help, or directions, their full conversations will be permanently saved and visible here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => {
                const modeBadge = getModeLabel(item.mode);
                const isExpanded = expandedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 transition hover:border-stone-700 shadow-md"
                  >
                    {/* Top Row: User details & Mode */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1 bg-stone-950 rounded-xl border border-stone-800">
                          {item.userAvatar || '👤'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-white">{item.userName}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                              {item.userRole}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-500" />
                            {formatTimestamp(item.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${modeBadge.color}`}
                        >
                          {modeBadge.label}
                        </span>

                        <button
                          onClick={() => handleDeleteEntry(item.id)}
                          className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-lg transition cursor-pointer"
                          title="Delete this entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Member's Prompt */}
                    <div className="mb-3 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 mb-1 flex items-center gap-1">
                        <span>Asked by {item.userName}:</span>
                      </div>
                      <p className="text-sm font-medium text-stone-100 whitespace-pre-wrap">
                        {item.prompt}
                      </p>
                    </div>

                    {/* AI's Response */}
                    <div className="p-3.5 rounded-xl bg-stone-800/40 border border-stone-700/40">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Sparkles className="w-3 h-3" />
                          Jhatwal Home AI Response:
                        </span>
                        {item.modelUsed && (
                          <span className="text-[10px] text-stone-500 font-mono">
                            {item.modelUsed}
                          </span>
                        )}
                      </div>

                      <div
                        className={`text-xs sm:text-sm text-stone-200 leading-relaxed whitespace-pre-wrap ${
                          !isExpanded && item.response.length > 300 ? 'line-clamp-4' : ''
                        }`}
                      >
                        {item.response}
                      </div>

                      {item.response.length > 300 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? 'Show less' : 'Read full response...'}
                        </button>
                      )}

                      {/* Generated Image in History */}
                      {item.generatedImage && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-stone-700/60 max-w-sm">
                          <img
                            src={item.generatedImage.url}
                            alt={item.generatedImage.prompt}
                            className="w-full h-auto object-cover max-h-56"
                            loading="lazy"
                          />
                          <div className="p-2 bg-stone-900 text-[10px] text-stone-400 flex items-center justify-between">
                            <span className="truncate">🎨 {item.generatedImage.prompt}</span>
                            <a
                              href={item.generatedImage.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 font-bold"
                            >
                              Open HD
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Grounding Sources */}
                      {item.sources && item.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-stone-700/40 flex flex-wrap gap-2 items-center">
                          <span className="text-[10px] uppercase font-bold text-stone-400">Sources:</span>
                          {item.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:text-amber-300"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="max-w-[200px] truncate">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MEMBER LOGIN AUDIT LOG */}
      {subTab === 'logins' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Family Sign-In Activity Trail</h3>
              <p className="text-xs text-stone-400">
                Log of every time a family member enters their username and password on a phone or computer.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-semibold">
              {loginLogs.length} Total Sign-Ins
            </span>
          </div>

          {loginLogs.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              No login logs recorded yet in this session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Family Member</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Device / Platform</th>
                    <th className="py-2.5 px-3 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {loginLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{log.userAvatar}</span>
                          <span className="font-bold text-stone-200">{log.userName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-stone-300">
                          {log.deviceInfo.includes('PC') || log.deviceInfo.includes('Mac') ? (
                            <Laptop className="w-3.5 h-3.5 text-stone-400" />
                          ) : (
                            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          {log.deviceInfo}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-stone-400 font-mono text-[11px]">
                        {formatTimestamp(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
