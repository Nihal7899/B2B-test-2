import { useEffect, useMemo, useRef } from 'react';
import { X, Mic, AlertCircle, Search } from 'lucide-react';

interface VoiceSearchModalProps {
  open: boolean;
  onClose: () => void;
  isListening: boolean;
  error: string | null;
  transcript: string;
  onRetry: () => void;
  onConfirm: (text: string) => void;
  lang?: string;
}

const BAR_COUNT = 9;

export function VoiceSearchModal({
  open,
  onClose,
  isListening,
  error,
  transcript,
  onRetry,
  onConfirm,
  lang = 'en-IN',
}: VoiceSearchModalProps) {
  const trimmedTranscript = transcript.trim();
  const hasTranscript = trimmedTranscript.length > 0;
  const showError = Boolean(error);
  const canConfirm = hasTranscript && !showError;

  // Per-bar random seeds — computed once per mount for organic variation
  const barSeeds = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, () => ({
        maxHeight: 10 + Math.random() * 16,
        minHeight: 4 + Math.random() * 4,
        duration: 0.65 + Math.random() * 0.6,
        delay: Math.random() * 0.9,
      })),
    []
  );

  const lastTranscriptLenRef = useRef(0);
  const barsContainerRef = useRef<HTMLDivElement>(null);

  // ---------- Lock body scroll ----------
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ---------- Escape key ----------
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ---------- Boost waveform when transcript updates ----------
  useEffect(() => {
    if (!open || !isListening) return;
    const container = barsContainerRef.current;
    if (!container) return;

    const currentLen = transcript.length;
    const grew = currentLen > lastTranscriptLenRef.current;
    lastTranscriptLenRef.current = currentLen;

    if (!grew) return;

    container.classList.add('vs-wave-boost');
    const t = window.setTimeout(() => {
      container.classList.remove('vs-wave-boost');
    }, 260);
    return () => window.clearTimeout(t);
  }, [transcript, open, isListening]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(trimmedTranscript);
  };

  // Tap the mic tile: start / retry when idle, stop when listening
  const handleMicPress = () => {
    if (isListening) {
      onClose();
      return;
    }
    onRetry();
  };

  const statusText = showError
    ? 'Tap to try again'
    : isListening
    ? 'Listening…'
    : hasTranscript
    ? 'Did you mean?'
    : 'Tap to speak';

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200" />

      {/* Content */}
      <div
        className="relative flex flex-col items-center animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute -top-3 -right-3 z-30 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/85 active:scale-90 transition-all"
        >
          <X size={15} strokeWidth={2.6} />
        </button>

        <div className="relative">
          {/* Expanding rings (listening only) */}
          {isListening && !showError && (
            <div className="pointer-events-none absolute inset-0">
              <span className="vs-ring" />
              <span className="vs-ring" />
              <span className="vs-ring" />
            </div>
          )}

          {/* Ambient glow */}
          <div
            className={`pointer-events-none absolute -inset-8 rounded-[80px] blur-3xl transition-colors duration-500 ${
              showError
                ? 'bg-rose-500/30'
                : isListening
                ? 'bg-emerald-400/35'
                : 'bg-emerald-500/15'
            }`}
          />

          {/* Mic tile */}
          <button
            type="button"
            onClick={handleMicPress}
            aria-label={isListening ? 'Stop listening' : 'Start voice search'}
            className={`relative h-[150px] w-[150px] rounded-[44px] overflow-hidden border flex items-center justify-center transition-all duration-300 active:scale-[0.93] ${
              showError
                ? 'bg-gradient-to-br from-rose-400 via-red-500 to-red-700 border-rose-200/30 shadow-[0_25px_70px_-20px_rgba(244,63,94,0.85)]'
                : isListening
                ? 'bg-gradient-to-br from-emerald-300 via-emerald-500 to-emerald-700 border-emerald-200/40 shadow-[0_25px_70px_-15px_rgba(16,185,129,0.9)]'
                : 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 border-emerald-200/25 shadow-[0_25px_70px_-22px_rgba(16,185,129,0.75)] hover:brightness-110'
            }`}
          >
            {/* Glass sheen */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
            <span className="pointer-events-none absolute inset-0 rounded-[44px] ring-1 ring-inset ring-white/20" />

            {/* Big icon */}
            <span
              className={`relative z-10 transition-transform duration-300 ${
                isListening ? '-translate-y-2.5' : ''
              }`}
            >
              {showError ? (
                <AlertCircle
                  size={46}
                  strokeWidth={2.2}
                  className="text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                />
              ) : (
                <Mic
                  size={46}
                  strokeWidth={2.2}
                  className="text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                />
              )}
            </span>

            {/* Waves (listening only) */}
            {isListening && !showError && (
              <div
                ref={barsContainerRef}
                className="vs-wave absolute bottom-5 left-0 right-0 h-8 flex items-end justify-center gap-[3px] px-5"
              >
                {barSeeds.map((seed, i) => (
                  <span
                    key={i}
                    className="vs-bar"
                    style={{
                      // @ts-ignore -- CSS custom properties
                      '--vs-max-h': `${seed.maxHeight}px`,
                      // @ts-ignore
                      '--vs-min-h': `${seed.minHeight}px`,
                      animationDuration: `${seed.duration}s`,
                      animationDelay: `${seed.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </button>
        </div>

        {/* Status */}
        <div className="mt-6 flex flex-col items-center min-h-[44px]">
          <p
            className={`text-[12px] font-bold tracking-[0.02em] ${
              showError ? 'text-rose-200/90' : 'text-white/55'
            }`}
          >
            {statusText}
          </p>

          {showError && (
            <p className="mt-1.5 max-w-[260px] text-center text-[11.5px] font-medium text-rose-200/70 leading-snug">
              {error}
            </p>
          )}

          {!showError && hasTranscript && !isListening && (
            <p className="mt-2 max-w-[280px] text-center text-[16px] font-black text-white leading-snug break-words">
              {trimmedTranscript}
            </p>
          )}

          {canConfirm && !isListening && (
            <button
              onClick={handleConfirm}
              className="mt-5 h-11 px-7 rounded-full bg-white text-emerald-950 text-[13px] font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-emerald-950/40 hover:bg-emerald-50"
            >
              <Search size={14} strokeWidth={3} />
              Search
            </button>
          )}
        </div>

        {/* Language hint */}
        <p className="mt-5 text-[9px] font-bold text-white/25 tracking-[0.18em] uppercase">
          {lang === 'en-IN' ? 'English (India)' : lang}
        </p>
      </div>

      {/* Scoped styles */}
      <style>{`
        .vs-ring {
          position: absolute;
          inset: 0;
          border-radius: 44px;
          border: 2px solid rgba(52, 211, 153, 0.55);
          pointer-events: none;
          animation: vsRingExpand 2.6s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
        }
        .vs-ring:nth-child(1) { animation-delay: 0s; }
        .vs-ring:nth-child(2) { animation-delay: 0.85s; }
        .vs-ring:nth-child(3) { animation-delay: 1.7s; }

        @keyframes vsRingExpand {
          0%   { transform: scale(1);   opacity: 0.75; border-width: 2px; }
          70%  { opacity: 0.15; }
          100% { transform: scale(1.6); opacity: 0;    border-width: 1px; }
        }

        /* Waveform */
        .vs-wave {
          transform-origin: bottom center;
          transition: transform 0.2s ease-out;
        }
        .vs-wave-boost {
          transform: scaleY(1.2);
        }

        .vs-bar {
          display: block;
          width: 3px;
          height: 6px;
          border-radius: 9999px;
          background: linear-gradient(180deg, #ffffff 0%, #a7f3d0 100%);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.35);
          animation-name: vsBarPulse;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          will-change: height;
        }

        @keyframes vsBarPulse {
          0%, 100% { height: var(--vs-min-h, 5px);  opacity: 0.5; }
          50%      { height: var(--vs-max-h, 20px); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}