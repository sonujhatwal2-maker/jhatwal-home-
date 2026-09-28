import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PhoneAccessModal } from './PhoneAccessModal';
import { Smartphone, Download, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'login';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed and in standalone mode, show verified mobile badge on desktop, or hide
  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <Check className="w-3 h-3" />
          <span>App Installed</span>
        </span>
      );
    }
    return null;
  }

  return (
    <>
      {variant === 'login' ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/30 font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer shadow-sm hover:border-amber-500/50"
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>Open or Install on Phone / Scan QR</span>
        </button>
      ) : variant === 'full' ? (
        <button
          type="button"
          onClick={() => {
            if (isInstallable) {
              install();
            } else {
              setShowModal(true);
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
          title="Open or Install on Phone"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Use on Phone</span>
        </button>
      )}

      {showModal && (
        <PhoneAccessModal
          onClose={() => setShowModal(false)}
          isInstallable={isInstallable}
          onInstall={install}
        />
      )}
    </>
  );
};
