import React, { useEffect, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface SplashScreenProps {
  isLoading: boolean;
  bookCount?: number;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  onFinish,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [phase, setPhase] = useState<'starting' | 'loading' | 'finalizing' | 'exiting' | 'hidden'>(
    'starting'
  );
  const [statusText, setStatusText] = useState('Loading local library...');
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Smooth continuous progression animation from 0% to ~90% while loading
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setStatusText('Ready');
      setIsReady(true);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        const increment = prev < 30 ? 2.8 : prev < 65 ? 1.8 : 1.1;
        return Math.min(90, prev + increment);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [isLoading]);

  // When loading finishes, transition smoothly from 100% to main app
  useEffect(() => {
    if (!isLoading || isReady) {
      setProgress(100);
      setStatusText('Ready');

      const exitTimer = setTimeout(() => {
        setPhase('exiting');
      }, 400);

      const hideTimer = setTimeout(() => {
        setPhase('hidden');
        if (onFinish) onFinish();
      }, 900);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isLoading, isReady, onFinish]);

  // Hard fail-safe: Ensure splashscreen is NEVER stuck under any circumstance (max 3s)
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setPhase('hidden');
      if (onFinish) onFinish();
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, [onFinish]);

  if (phase === 'hidden') {
    return null;
  }

  const isExiting = phase === 'exiting';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ease-out select-none ${
        isDark ? 'bg-aura-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      } ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: isDark
          ? 'radial-gradient(circle at center, #141926 0%, #090a0f 70%, #050608 100%)'
          : 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 70%, #f1f5f9 100%)',
      }}
    >
      {/* Ambient background aura glow */}
      <div
        className={`absolute w-[450px] h-[450px] rounded-full blur-3xl pointer-events-none animate-pulse ${
          isDark
            ? 'bg-gradient-to-tr from-amber-500/20 via-amber-600/10 to-transparent'
            : 'bg-gradient-to-tr from-amber-500/25 via-amber-300/15 to-transparent'
        }`}
      />

      {/* Center Branding Container */}
      <div className="relative flex flex-col items-center text-center space-y-6 z-10">
        {/* App Icon floating cleanly without dark container box */}
        <div className="relative">
          {/* Luminous warm aura glow radiating directly around icon */}
          <div
            className={`absolute -inset-4 rounded-full blur-2xl animate-pulse pointer-events-none ${
              isDark ? 'bg-amber-500/25' : 'bg-amber-500/20'
            }`}
          />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <img
              src="/app-icon.png"
              alt="AuraAudio Logo"
              className={`w-full h-full object-contain filter ${
                isDark
                  ? 'drop-shadow-[0_12px_28px_rgba(0,0,0,0.5)]'
                  : 'drop-shadow-[0_12px_28px_rgba(245,158,11,0.25)]'
              }`}
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <h1
            className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight drop-shadow-sm flex items-center justify-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span>Aura</span>
            <span className="text-amber-500">Audio</span>
          </h1>
          <p
            className={`text-xs uppercase tracking-[0.25em] font-mono font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Native Audiobook Experience
          </p>
        </div>

        {/* Dynamic Progress Bar with active progression animation */}
        <div className="w-64 sm:w-72 space-y-2 pt-2">
          {/* Progress Bar Track */}
          <div
            className={`h-1.5 w-full rounded-full overflow-hidden relative backdrop-blur-sm ${
              isDark
                ? 'bg-slate-800/90 border border-slate-700/60'
                : 'bg-slate-200/90 border border-slate-300/60'
            }`}
          >
            {/* Animated Progress Fill */}
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 rounded-full transition-all duration-150 ease-linear relative overflow-hidden shadow-amber-glow"
              style={{ width: `${progress}%` }}
            >
              {/* Traveling light shimmer beam across the progress line */}
              <div className="absolute inset-0 w-2/3 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-progress-shimmer pointer-events-none" />
            </div>
          </div>

          {/* Status Text & Progress Percentage */}
          <div
            className={`flex items-center justify-between text-xs font-mono px-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <div className="flex items-center space-x-2">
              {progress < 100 && (
                <div className="w-2 h-2 rounded-full border border-amber-500 border-t-transparent animate-spin" />
              )}
              <span
                className={`font-medium transition-all duration-200 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {statusText}
              </span>
            </div>
            <span className="text-amber-500 font-mono font-semibold text-[11px]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer Details: App Version & Powered by FEMAG */}
      <div
        className={`absolute bottom-6 flex flex-col items-center text-center space-y-1 text-xs font-mono select-none ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
      >
        <span>v0.2.7</span>
        <span className="text-amber-500 font-semibold tracking-wide">Powered by FEMAG</span>
      </div>
    </div>
  );
};
