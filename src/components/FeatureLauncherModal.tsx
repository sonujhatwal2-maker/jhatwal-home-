import React from 'react';
import { AppTab, AIMode } from '../types';
import {
  Mic,
  MessageSquare,
  BookOpen,
  Wrench,
  Palette,
  Radio,
  History,
  Users,
  Search,
  MapPin,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface FeatureLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: AppTab) => void;
  onOpenVoiceStudio: () => void;
  onOpenLiveVoice: () => void;
  isAdmin?: boolean;
}

export const FeatureLauncherModal: React.FC<FeatureLauncherModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenVoiceStudio,
  onOpenLiveVoice,
  isAdmin = false,
}) => {
  if (!isOpen) return null;

  const features = [
    {
      id: 'voice_studio',
      title: '🎙️ AI Voice Studio (Use My Voice)',
      badge: 'NEW',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: 'Clone and record your real voice so the AI speaks without mechanical robotic synthesizer tones.',
      actionLabel: 'Open Voice Studio',
      onClick: () => {
        onClose();
        onOpenVoiceStudio();
      },
      icon: <Mic className="w-5 h-5 text-amber-400" />,
      highlight: true,
    },
    {
      id: 'live_voice',
      title: '📻 Live Gemini Voice Call',
      badge: 'LIVE',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      description: 'Hands-free real-time bidirectional voice conversation with visual audio spectrum.',
      actionLabel: 'Start Voice Call',
      onClick: () => {
        onClose();
        onOpenLiveVoice();
      },
      icon: <Radio className="w-5 h-5 text-orange-400" />,
    },
    {
      id: 'family_chat',
      title: '💬 Gemini 3.8 Family Chat',
      badge: 'SMART',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: 'Multimodal family assistant with Google Web Search, Google Maps grounding, and camera vision.',
      actionLabel: 'Open Family Chat',
      onClick: () => {
        onClose();
        onNavigateTab('chat');
      },
      icon: <MessageSquare className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'image_studio',
      title: '🎨 Family Image Studio',
      badge: 'CREATIVE',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Generate 8K family artwork, storybook illustrations, coloring pages, and wall decor.',
      actionLabel: 'Open Image Studio',
      onClick: () => {
        onClose();
        onNavigateTab('studio');
      },
      icon: <Palette className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 'family_brain',
      title: '🧠 Household Memory & Vault',
      badge: 'CORE',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Living family repository: allergy protocols, emergency contacts, house rules, and chore points.',
      actionLabel: 'Open Memory Vault',
      onClick: () => {
        onClose();
        onNavigateTab('vault');
      },
      icon: <BookOpen className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'family_tools',
      title: '🛠️ 1-Click Family Tools',
      badge: 'UTILITY',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      description: 'Pantry Chef (allergy safe for Kabir), Socratic Homework Tutor, Bedtime Story Weaver, Day Trip Planner.',
      actionLabel: 'Open Family Tools',
      onClick: () => {
        onClose();
        onNavigateTab('tools');
      },
      icon: <Wrench className="w-5 h-5 text-teal-400" />,
    },
    {
      id: 'member_access',
      title: '👥 Household Member Accounts',
      badge: 'ROLES',
      badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
      description: 'Role-based profiles for Krish (Admin), Sunita (Parent), Kabir (Kid Safe), Grandma, and guests.',
      actionLabel: 'View Members',
      onClick: () => {
        onClose();
        onNavigateTab('access');
      },
      icon: <Users className="w-5 h-5 text-rose-400" />,
    },
    ...(isAdmin
      ? [
          {
            id: 'admin_history',
            title: '📜 Admin Oversight & Audit',
            badge: 'ADMIN',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            description: 'Monitor recent logins, device metadata, child activity, and AI conversation history.',
            actionLabel: 'View Admin History',
            onClick: () => {
              onClose();
              onNavigateTab('history');
            },
            icon: <History className="w-5 h-5 text-amber-400" />,
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl shadow-black/80 my-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Feature Hub & Quick Buttons</h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Direct 1-click access buttons for every capability in Jhatwal Home.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {features.map((feat) => (
            <div
              key={feat.id}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                feat.highlight
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-stone-900 border border-stone-800">
                      {feat.icon}
                    </div>
                    <span className="text-xs font-black text-white">{feat.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${feat.badgeColor}`}
                  >
                    {feat.badge}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">{feat.description}</p>
              </div>

              <button
                type="button"
                onClick={feat.onClick}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  feat.highlight
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-black shadow-md'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
              >
                <span>{feat.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>All features run with real-time household persistence.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
