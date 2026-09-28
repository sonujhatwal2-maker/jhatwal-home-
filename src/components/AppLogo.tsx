import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  glow?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  glow = true,
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-xs', sub: 'text-[8px]', star: 1 },
    sm: { icon: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]', star: 1.5 },
    md: { icon: 'w-10 h-10', text: 'text-base', sub: 'text-[10px]', star: 2 },
    lg: { icon: 'w-14 h-14', text: 'text-xl', sub: 'text-xs', star: 3 },
    xl: { icon: 'w-24 h-24', text: 'text-3xl', sub: 'text-sm', star: 4 },
  };

  const dim = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3D Holographic Quantum Nexus Crest */}
      <div className={`relative ${dim.icon} shrink-0 group`}>
        {glow && (
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-amber-500/40 via-orange-500/30 to-amber-300/40 blur-lg opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
        )}
        <svg
          viewBox="0 0 120 120"
          className="relative w-full h-full drop-shadow-[0_4px_16px_rgba(245,158,11,0.45)] transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* Ultra-luminous solar gold gradient */}
            <linearGradient id="coolLogoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fde047" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Cyber Flame Gradient */}
            <linearGradient id="coolLogoFlame" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            {/* Obsidian Glass Outer Plate */}
            <linearGradient id="coolLogoPlate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#292524" />
              <stop offset="50%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#0c0a09" />
            </linearGradient>

            {/* Ambient Core Radial Glow */}
            <radialGradient id="coolLogoCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#ea580c" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0c0a09" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Faceted Cyber-Shield Backplate */}
          <polygon
            points="60,6 104,28 104,82 60,114 16,82 16,28"
            fill="url(#coolLogoPlate)"
            stroke="url(#coolLogoGold)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Core Radial Flare */}
          <circle cx="60" cy="60" r="38" fill="url(#coolLogoCoreGlow)" />

          {/* Orbital Guidance Ring with Cyber Hash Marks */}
          <circle
            cx="60"
            cy="60"
            r="38"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeOpacity="0.3"
            strokeDasharray="3 6"
          />

          {/* Interlocking Infinite Quantum Knot (Stylized 'J' and 'H' Monogram) */}
          {/* Left Wing & J Hook */}
          <path
            d="M 36 38 L 48 38 L 48 72 C 48 79, 54 84, 62 84 L 66 84 C 72 84, 76 80, 76 74 L 76 64 L 62 64"
            fill="none"
            stroke="url(#coolLogoGold)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Pillar & Dynamic H Cross-bridge */}
          <path
            d="M 84 38 L 84 82 M 84 54 L 52 54 M 52 38 L 52 54"
            fill="none"
            stroke="url(#coolLogoFlame)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Radiance Diamond Spark */}
          <polygon
            points="60,46 64,56 74,60 64,64 60,74 56,64 46,60 56,56"
            fill="#ffffff"
            className="animate-pulse"
          />
          <circle cx="60" cy="60" r="2.5" fill="#fef08a" />

          {/* Quantum Energy Corner Accents */}
          <circle cx="60" cy="18" r="2" fill="#38bdf8" />
          <circle cx="94" cy="35" r="2" fill="#f59e0b" />
          <circle cx="94" cy="76" r="2" fill="#ea580c" />
          <circle cx="60" cy="102" r="2" fill="#fde047" />
          <circle cx="26" cy="76" r="2" fill="#ea580c" />
          <circle cx="26" cy="35" r="2" fill="#38bdf8" />
        </svg>
      </div>

      {/* Modern High-Impact Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-amber-100 to-amber-300 ${dim.text}`}
            >
              JHATWAL
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-400/25 text-amber-300 border border-amber-500/40 uppercase tracking-widest flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
              AI
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`font-semibold text-stone-400 tracking-wider ${dim.sub}`}>
              Family Intelligence Nexus
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
