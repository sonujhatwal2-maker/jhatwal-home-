import React, { useState } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { AppLogo } from './AppLogo';

interface PhoneAccessModalProps {
  onClose: () => void;
  isInstallable?: boolean;
  onInstall?: () => void;
}

export const PhoneAccessModal: React.FC<PhoneAccessModalProps> = ({
  onClose,
  isInstallable,
  onInstall,
}) => {
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedPre, setCopiedPre] = useState(false);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const [activePlatform, setActivePlatform] = useState<'iphone' | 'android'>(
    isAndroid ? 'android' : 'android'
  );

  const devUrl = 'https://ais-dev-ydvoqxubbxfgtprcokp6p7-845249711303.asia-southeast1.run.app';
  const preUrl = 'https://ais-pre-ydvoqxubbxfgtprcokp6p7-845249711303.asia-southeast1.run.app';

  // QR Code for the live dev URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    devUrl
  )}&bgcolor=1c1917&color=f59e0b&margin=2`;

  const handleCopyDev = () => {
    navigator.clipboard.writeText(devUrl);
    setCopiedDev(true);
    setTimeout(() => setCopiedDev(false), 2500);
  };

  const handleCopyPre = () => {
    navigator.clipboard.writeText(preUrl);
    setCopiedPre(true);
    setTimeout(() => setCopiedPre(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <AppLogo size="md" showText={false} glow={true} />
          <div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              Open Jhatwal Home on Your Phone
            </h3>
            <p className="text-xs text-stone-400">
              Live mobile link & easy home screen installation guide.
            </p>
          </div>
        </div>

        {/* 1. Direct Live Dev Link (Works immediately with your Google account) */}
        <div className="bg-stone-950/80 border border-amber-500/30 rounded-2xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="bg-stone-900 p-2 rounded-xl border border-stone-800 shrink-0 shadow-inner">
              <img
                src={qrCodeUrl}
                alt="Scan to open on phone"
                className="w-28 h-28 rounded-lg object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block mb-1.5">
                ⚡ Active Live Link
              </span>
              <h4 className="text-sm font-bold text-white mb-1">Scan or Open on Mobile</h4>
              <p className="text-xs text-stone-400 mb-2">
                Open in your phone browser and log in with your Google account (<strong className="text-stone-300">sonujhatwal2@gmail.com</strong>).
              </p>

              <button
                onClick={handleCopyDev}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition cursor-pointer shadow-md"
              >
                {copiedDev ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Phone Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Why did "404 Page not found" appear notice */}
        <div className="mb-4 p-3 bg-stone-950/60 border border-stone-800 rounded-2xl text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>How to enable the Public Family Link (without 404):</span>
          </div>
          <p className="text-stone-400 text-[11px] leading-relaxed">
            In AI Studio, the public link is activated when you click the blue <strong className="text-white">"Share"</strong> button at the top-right of your screen. Until you click Share, opening the public link gives a 404 error. Use the <strong className="text-amber-300">Active Live Link</strong> above to open it right now!
          </p>
        </div>

        {/* Step-by-Step Installation Guides */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Add to Phone Home Screen (Like an App)
            </span>
            <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-xl border border-stone-800">
              <button
                onClick={() => setActivePlatform('iphone')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  activePlatform === 'iphone'
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                iPhone / iPad
              </button>
              <button
                onClick={() => setActivePlatform('android')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  activePlatform === 'android'
                    ? 'bg-amber-500 text-stone-950'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Android
              </button>
            </div>
          </div>

          {activePlatform === 'iphone' ? (
            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-2xl text-xs space-y-2 text-stone-300">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>Open the link in <strong className="text-white">Safari</strong> on your iPhone.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p className="flex items-center gap-1 flex-wrap">
                  Tap the <strong className="text-white">Share</strong> button{' '}
                  <span className="inline-flex items-center p-0.5 bg-stone-800 rounded text-stone-200">
                    <Share2 className="w-3 h-3" />
                  </span>{' '}
                  at the bottom.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p className="flex items-center gap-1 flex-wrap">
                  Scroll down and tap{' '}
                  <strong className="text-white flex items-center gap-1">
                    <PlusSquare className="w-3.5 h-3.5 text-amber-400" /> "Add to Home Screen"
                  </strong>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-2xl text-xs space-y-2 text-stone-300">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>Open the link in <strong className="text-white">Chrome</strong> on your Android phone.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Tap the <strong className="text-white">three dots menu (⋮)</strong> in the top right.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p>
                  Tap <strong className="text-white">"Install app"</strong> or{' '}
                  <strong className="text-white">"Add to Home screen"</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
          <span className="text-stone-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Runs full-screen like a real app
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
