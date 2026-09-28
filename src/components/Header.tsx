import React from 'react';
import { FamilyUser, AppTab } from '../types';
import {
  MessageSquare,
  BookOpen,
  Wrench,
  Users,
  LogOut,
  ChevronDown,
  Bell,
  History,
  Palette,
  Share2,
  Radio,
  Mic,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  currentUser: FamilyUser;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onLogout: () => void;
  onOpenSwitchUser: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenShare?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenVoiceStudio?: () => void;
  onOpenFeatureHub?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenSwitchUser,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  onOpenShare,
  onOpenLiveVoice,
  onOpenVoiceStudio,
  onOpenFeatureHub,
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'parent':
        return { label: 'Parent', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'kid':
        return { label: 'Kid Safe', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'elder':
        return { label: 'Senior', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      default:
        return { label: role, color: 'bg-stone-500/20 text-stone-300 border-stone-500/30' };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const isAdmin = currentUser.role === 'admin';

  return (
    <header className="border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-6 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Brand New AppLogo */}
        <div
          onClick={() => setActiveTab('chat')}
          className="cursor-pointer group hover:opacity-95 transition"
        >
          <AppLogo size="md" showText={true} />
        </div>

        {/* Center: Nav Tabs */}
        <nav className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-2xl border border-stone-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Family Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Brain</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Tools</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Image Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Memory</span>
          </button>

          <button
            onClick={() => setActiveTab('access')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'access'
                ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Members</span>
          </button>
        </nav>

        {/* Right: Live Voice, Voice Studio, Features Hub, Notifications, PWA, Share, Member Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Voice Studio: Use My Voice */}
          {onOpenVoiceStudio && (
            <button
              onClick={onOpenVoiceStudio}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold shadow-sm transition cursor-pointer"
              title="Use My Voice / AI Voice Studio"
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Use My Voice</span>
            </button>
          )}

          {/* Gemini 3.8 Live Voice Button */}
          {onOpenLiveVoice && (
            <button
              onClick={onOpenLiveVoice}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer animate-pulse"
              title="Launch Real-time Voice Chat (gemini-3.8-live)"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Voice</span>
            </button>
          )}

          {/* All Features Hub */}
          {onOpenFeatureHub && (
            <button
              onClick={onOpenFeatureHub}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-amber-400 border border-stone-800 transition cursor-pointer text-xs font-semibold"
              title="View All Buttons & Features"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Features</span>
            </button>
          )}

          {/* Admin Notification Bell */}
          {isAdmin && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer"
              title="Family Sign-in & Security Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-stone-950 text-[10px] font-black shadow-md shadow-amber-500/50 animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          <PWAInstallButton variant="compact" />

          {/* Share with Friends & Family */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-400 border border-stone-800 transition cursor-pointer text-xs font-semibold"
              title="Share App with Friends & Family"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Share</span>
            </button>
          )}

          {/* Member Switcher */}
          <button
            onClick={onOpenSwitchUser}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 transition cursor-pointer text-left"
            title="Click to switch active family member"
          >
            <span className="text-xl leading-none">{currentUser.avatar}</span>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-200 leading-tight">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded border ${badge.color}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 leading-none">Tap to switch</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Sign out of Jhatwal Home"
            className="p-2 text-stone-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
