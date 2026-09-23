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

const BAR_COUNT = 7;

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
        maxHeight: 10 + Math.random() * 14,
        minHeight: 4 + Math.random() * 4,
        duration: 0.6 + Math.random() * 0.6,
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

  // Tap the tile: start / retry when idle, stop when listening
  const handleMicPress = () => {
    if (isListening) {
      onClose();
      return;
    }
    onRetry();
  };

  const statusText = showError
    ? 'Tap mic to try again'
    : isListening
    ? 'Listening…'
    : hasTranscript
    ? 'Did you mean?'
    : 'Tap to speak';

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
    >
      {/* Backdrop — minimal blur */}
      <div className="absolute inset-0 bg-[#01100b]/80 backdrop-blur-[2px] animate-in fade-in duration-200" />

      {/* Card */}
      <div
        className="relative w-full max-w-[330px] overflow-hidden rounded-[34px] border border-emerald-400/12 bg-gradient-to-b from-[#062018] via-[#032a1e] to-[#023524] shadow-[0_35px_90px_-30px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gloss */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />

        {/* Ambient corner glows */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-500/18 blur-[70px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-emerald-600/15 blur-[80px]" />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/80 transition-all hover:bg-white/15 active:scale-90"
        >
          <X size={14} strokeWidth={2.6} />
        </button>

        <div className="relative flex flex-col items-center px-7 pt-10 pb-7">
          {/* Mic tile wrapper */}
          <div className="relative">
            {/* Pulsing halo (listening only) */}
            {isListening && !showError && (
              <span className="vs-halo pointer-events-none absolute -inset-4 rounded-[56px] bg-emerald-400/25 blur-2xl" />
            )}

            {/* Expanding rings (listening only) */}
            {isListening && !showError && (
              <>
                <span className="vs-ring vs-ring-1" />
                <span className="vs-ring vs-ring-2" />
                <span className="vs-ring vs-ring-3" />
              </>
            )}

            {/* Tappable tile */}
            <button
              type="button"
              onClick={handleMicPress}
              aria-label={isListening ? 'Stop listening' : 'Start voice search'}
              className={`group relative flex h-[136px] w-[136px] items-center justify-center overflow-hidden rounded-[40px] border transition-all duration-300 active:scale-[0.94] ${
                showError
                  ? 'border-rose-300/25 bg-gradient-to-b from-rose-400 via-red-500 to-red-700 shadow-[0_22px_60px_-18px_rgba(244,63,94,0.8)]'
                  : isListening
                  ? 'border-emerald-200/40 bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-700 shadow-[0_22px_65px_-12px_rgba(16,185,129,0.9)]'
                  : 'border-emerald-200/20 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_22px_60px_-20px_rgba(16,185,129,0.75)] hover:brightness-110'
              }`}
            >
              {/* Inner gloss + inset ring */}
              <span className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-b from-white/25 via-white/0 to-black/15" />
              <span className="pointer-events-none absolute inset-0 rounded-[40px] ring-1 ring-inset ring-white/15" />

              {/* Big icon */}
              <span
                className={`relative z-10 transition-transform duration-300 ${
                  isListening && !showError ? '-translate-y-3.5' : ''
                }`}
              >
                {showError ? (
                  <AlertCircle
                    size={44}
                    strokeWidth={2.2}
                    className="text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                  />
                ) : (
                  <Mic
                    size={44}
                    strokeWidth={2.2}
                    className="text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
                  />
                )}
              </span>

              {/* Waves — inside the tile, listening only */}
              {isListening && !showError && (
                <div
                  ref={barsContainerRef}
                  className="vs-wave absolute bottom-4 left-0 right-0 flex h-8 items-end justify-center gap-[4px] px-7"
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
          <div className="mt-5 flex min-h-[18px] items-center justify-center">
            <p
              className={`text-[12px] font-bold tracking-[0.01em] ${
                showError ? 'text-rose-200/90' : 'text-emerald-100/60'
              }`}
            >
              {statusText}
            </p>
          </div>

          {/* Error detail */}
          {showError && (
            <p className="mt-1.5 max-w-[250px] text-center text-[11.5px] font-medium leading-snug text-rose-200/70">
              {error}
            </p>
          )}

          {/* Transcript pill */}
          {hasTranscript && !showError && (
            <div className="mt-4 w-full rounded-2xl border border-emerald-300/12 bg-emerald-950/40 px-4 py-3">
              <p className="break-words text-center text-[14px] font-bold leading-snug text-white">
                {trimmedTranscript}
              </p>
            </div>
          )}

          {/* Confirm */}
          {canConfirm && !isListening && (
            <button
              onClick={handleConfirm}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-emerald-500 text-[13px] font-black text-emerald-950 shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 active:scale-[0.97]"
            >
              <Search size={15} strokeWidth={3} />
              Search
            </button>
          )}

          {/* Language hint */}
          <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/25">
            {lang === 'en-IN' ? 'English (India)' : lang}
          </p>
        </div>

        {/* Scoped styles */}
        <style>{`
          .vs-ring {
            position: absolute;
            inset: 0;
            border-radius: 40px;
            border: 2px solid rgba(52, 211, 153, 0.5);
            pointer-events: none;
            animation: vsRingExpand 2.6s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
          }
          .vs-ring-1 { animation-delay: 0s; }
          .vs-ring-2 { animation-delay: 0.86s; }
          .vs-ring-3 { animation-delay: 1.72s; }

          @keyframes vsRingExpand {
            0%   { transform: scale(1);    opacity: 0.7;  }
            70%  { opacity: 0.12; }
            100% { transform: scale(1.55); opacity: 0;    }
          }

          .vs-halo {
            animation: vsHalo 2.4s ease-in-out infinite;
          }
          @keyframes vsHalo {
            0%, 100% { opacity: 0.55; transform: scale(1);    }
            50%      { opacity: 1;    transform: scale(1.06); }
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
            background: linear-gradient(180deg, #ffffff 0%, #d1fae5 100%);
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
            animation-name: vsBarPulse;
            animation-iteration-count: infinite;
            animation-timing-function: ease-in-out;
            will-change: height;
          }

          @keyframes vsBarPulse {
            0%, 100% { height: var(--vs-min-h, 5px);  opacity: 0.5; }
            50%      { height: var(--vs-max-h, 18px); opacity: 1;   }
          }
        `}</style>
      </div>
    </div>
  );
}