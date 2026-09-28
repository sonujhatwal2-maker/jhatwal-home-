import React, { useState } from 'react';
import { X, Copy, Check, Share2, Smartphone, Users, ShieldCheck, QrCode } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use the live public URL
  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-ydvoqxubbxfgtprcokp6p7-845249711303.asia-southeast1.run.app';

  // Direct QR Code using reliable quickchart / google charts API image URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    appUrl
  )}&bgcolor=1c1917&color=f59e0b&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Jhatwal Home AI',
          text: 'Join our private family intelligence assistant and creative image studio!',
          url: appUrl,
        });
      } catch (e) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" showText={false} glow={true} />
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Share Jhatwal Home
              </h3>
              <p className="text-xs text-stone-400">
                Invite friends and family to join on any phone or PC
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* QR Code and Share link */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-stone-950 border border-stone-800/80">
            <div className="shrink-0 p-2 rounded-xl bg-stone-900 border border-amber-500/30 shadow-inner flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="App QR Code"
                className="w-32 h-32 rounded-lg"
              />
              <span className="text-[10px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Scan with Phone
              </span>
            </div>

            <div className="space-y-3 w-full">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Private Household App Link:
                </label>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 font-mono">
                  <span className="truncate flex-1 select-all">{appUrl}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition shrink-0 cursor-pointer"
                    title="Copy Link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-stone-950" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Link Copied to Clipboard!' : 'Share Link with Friends'}</span>
              </button>
            </div>
          </div>

          {/* Simple 3-Step Guide */}
          <div>
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-3">
              How Your Friends Can Use It:
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-950/60 border border-stone-800/60">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-200">Send them the link or QR</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    They can open the link in any web browser (Chrome, Safari, Firefox, Edge) on their mobile phone, tablet, or laptop.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-950/60 border border-stone-800/60">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-200">Add a Profile for Them in "Members"</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    Go to the <strong className="text-stone-300">Members</strong> tab to create an account for them (e.g. Friend, Guest, or Family) with custom permissions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-950/60 border border-stone-800/60">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="text-xs font-semibold text-stone-200">Install on Home Screen (PWA)</p>
                  <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                    Tap the <strong className="text-stone-300">"Use on Phone"</strong> button in the header or browser menu <strong className="text-stone-300">"Add to Home Screen"</strong> for full-screen app experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
