import React from 'react';
import { AppTab } from '../types';
import { MessageSquare, BookOpen, Wrench, Users, History, Palette, Radio, Mic } from 'lucide-react';

interface MobileNavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isAdmin?: boolean;
  onOpenLiveVoice?: () => void;
  onOpenVoiceStudio?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  isAdmin = false,
  onOpenLiveVoice,
  onOpenVoiceStudio,
}) => {
  return (
    <>
      {/* Floating 1-Tap Voice Buttons on Mobile */}
      <div className="fixed bottom-18 right-4 sm:hidden z-40 flex flex-col gap-2.5 items-end pointer-events-auto">
        {onOpenVoiceStudio && (
          <button
            onClick={onOpenVoiceStudio}
            className="p-3 rounded-full bg-stone-900 border border-amber-500/50 text-amber-400 shadow-xl active:scale-90 transition cursor-pointer flex items-center justify-center"
            title="Use My Voice / AI Voice Studio"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
        {onOpenLiveVoice && (
          <button
            onClick={onOpenLiveVoice}
            className="p-3.5 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 text-stone-950 shadow-xl shadow-amber-500/35 border-2 border-stone-900 active:scale-90 transition cursor-pointer flex items-center justify-center"
            title="Start Live Voice Conversation"
          >
            <Radio className="w-5 h-5 text-stone-950 animate-pulse" />
          </button>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-lg border-t border-stone-800 px-2 py-1.5 safe-area-pb">
        <div
          className={`grid ${
            isAdmin ? 'grid-cols-6' : 'grid-cols-5'
          } gap-1 items-center max-w-md mx-auto`}
        >
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'chat'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'studio'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Palette className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'vault'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Brain</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'tools'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Tools</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'history'
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <History className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">History</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('access')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'access'
                ? 'text-amber-400 font-bold bg-amber-500/10'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Members</span>
          </button>
        </div>
      </div>
    </>
  );
};
