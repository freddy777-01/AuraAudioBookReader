import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  isLoading: boolean;
  bookCount?: number;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  onFinish,
}) => {
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-aura-950 transition-all duration-700 ease-out select-none ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(circle at center, #141926 0%, #090a0f 70%, #050608 100%)',
      }}
    >
      {/* Ambient background aura glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-600/10 to-transparent blur-3xl pointer-events-none animate-pulse" />

      {/* Center Branding Container */}
      <div className="relative flex flex-col items-center text-center space-y-6 z-10">
        {/* App Icon floating cleanly without dark container box */}
        <div className="relative">
          {/* Luminous warm aura glow radiating directly around icon */}
          <div className="absolute -inset-4 rounded-full bg-amber-500/25 blur-2xl animate-pulse pointer-events-none" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <img
              src="/app-icon.png"
              alt="AuraAudio Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight drop-shadow-sm flex items-center justify-center gap-2">
            <span>Aura</span>
            <span className="text-amber-500">Audio</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-mono font-medium">
            Native Audiobook Experience
          </p>
        </div>

        {/* Dynamic Progress Bar with active progression animation */}
        <div className="w-64 sm:w-72 space-y-2 pt-2">
          {/* Progress Bar Track */}
          <div className="h-1.5 w-full bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/60 relative backdrop-blur-sm">
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
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-0.5">
            <div className="flex items-center space-x-2">
              {progress < 100 && (
                <div className="w-2 h-2 rounded-full border border-amber-500 border-t-transparent animate-spin" />
              )}
              <span className="text-slate-300 font-medium transition-all duration-200">
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
      <div className="absolute bottom-6 flex flex-col items-center text-center space-y-1 text-xs font-mono select-none">
        <span className="text-slate-400">v0.2.3</span>
        <span className="text-amber-500 font-semibold tracking-wide">Powered by FEMAG</span>
      </div>
    </div>
  );
};
