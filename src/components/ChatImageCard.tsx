import React, { useState } from 'react';
import { Download, Maximize2, Palette, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { GeneratedImagePayload } from '../types';

interface ChatImageCardProps {
  image: GeneratedImagePayload;
  onOpenLightbox?: (url: string, prompt: string) => void;
  onOpenInStudio?: (prompt: string) => void;
}

export const ChatImageCard: React.FC<ChatImageCardProps> = ({
  image,
  onOpenLightbox,
  onOpenInStudio,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    setError(false);
    setLoaded(false);
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-stone-800/80 bg-stone-950 shadow-xl max-w-lg transition-all duration-200 hover:border-amber-500/40">
      {/* Image Preview Container */}
      <div className="relative group overflow-hidden bg-stone-900/60 min-h-[260px] sm:min-h-[320px] flex items-center justify-center">
        {/* Loading skeleton shimmer */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900 animate-pulse text-stone-500 gap-2 p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center animate-spin">
              <Palette className="w-5 h-5" />
            </div>
            <p className="text-xs text-stone-400 font-medium">Developing high-resolution artwork...</p>
            <p className="text-[11px] text-stone-500 truncate max-w-xs">"{image.prompt}"</p>
          </div>
        )}

        {/* Error state */}
        {error ? (
          <div className="p-6 text-center space-y-2">
            <p className="text-xs text-rose-400 font-medium">Failed to load artwork preview</p>
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 mx-auto transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Generation</span>
            </button>
          </div>
        ) : (
          <>
            <img
              key={reloadKey}
              src={image.url}
              alt={image.prompt}
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
              onClick={() => onOpenLightbox && onOpenLightbox(image.url, image.prompt)}
              className={`w-full h-auto max-h-[420px] object-cover sm:object-contain transition-all duration-300 cursor-zoom-in ${
                loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              loading="eager"
            />

            {/* Hover Action Overlay */}
            {loaded && (
              <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5 backdrop-blur-[2px]">
                <button
                  onClick={() => onOpenLightbox && onOpenLightbox(image.url, image.prompt)}
                  className="px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-100 font-semibold text-xs flex items-center gap-1.5 shadow-lg border border-stone-700 transition cursor-pointer"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zoom</span>
                </button>

                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  download={`jhatwal_art_${Date.now()}.jpg`}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
                  title="Download HD Image"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download HD</span>
                </a>

                {onOpenInStudio && (
                  <button
                    onClick={() => onOpenInStudio(image.prompt)}
                    className="px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-100 font-semibold text-xs flex items-center gap-1.5 shadow-lg border border-stone-700 transition cursor-pointer"
                    title="Open in Family Image Studio"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Studio</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Meta Footer */}
      <div className="p-3 bg-stone-950/90 border-t border-stone-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-200 truncate flex items-center gap-1.5">
            <span className="text-amber-400">🎨</span>
            <span className="truncate">"{image.prompt}"</span>
          </p>
          <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
            <span>High-Def 1024px</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span>Flux Free Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopyPrompt}
            className="p-1.5 rounded-lg hover:bg-stone-800/80 text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title="Copy prompt text"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <a
            href={image.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg hover:bg-stone-800/80 text-stone-400 hover:text-amber-400 transition cursor-pointer"
            title="Open original high-res image URL"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
