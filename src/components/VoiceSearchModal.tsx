import { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, AlertCircle, Search, RotateCcw } from 'lucide-react';

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

const BAR_COUNT = 20;

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
  const [isRealWave, setIsRealWave] = useState(false);

  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const trimmedTranscript = transcript.trim();
  const hasTranscript = trimmedTranscript.length > 0;
  const showError = Boolean(error);
  const canConfirm = hasTranscript && !showError;

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

  // ---------- Cleanup on close/unmount ----------
  const stopVisualizer = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setIsRealWave(false);
    barsRef.current.forEach((bar) => {
      if (!bar) return;
      bar.style.height = '';
      bar.style.animation = '';
    });
  };

  useEffect(() => {
    if (!open) {
      stopVisualizer();
    }
    return () => {
      stopVisualizer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ---------- Real-time waveform via Web Audio ----------
  useEffect(() => {
    if (!open || !isListening || showError) return;
    let cancelled = false;

    const startVisualizer = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx: AudioContext = new AudioCtx();
        if (cancelled) {
          ctx.close().catch(() => {});
          return;
        }
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        setIsRealWave(true);

        let frame = 0;
        const draw = () => {
          rafRef.current = requestAnimationFrame(draw);
          frame++;
          if (frame % 3 !== 0) return;

          analyser.getByteFrequencyData(dataArray);

          const bars = barsRef.current;
          const activeBarCount = bars.length;
          if (activeBarCount === 0) return;

          const step = Math.max(1, Math.floor(dataArray.length / activeBarCount));

          for (let i = 0; i < activeBarCount; i++) {
            const bar = bars[i];
            if (!bar) continue;

            let sum = 0;
            const base = i * step;
            for (let j = 0; j < step; j++) {
              sum += dataArray[base + j] || 0;
            }
            const avg = sum / step;

            const height = Math.max(4, Math.min(36, (avg / 255) * 36));
            bar.style.height = `${height}px`;
          }
        };
        draw();
      } catch {
        setIsRealWave(false);
      }
    };

    void startVisualizer();

    return () => {
      cancelled = true;
      stopVisualizer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isListening, showError]);

  if (!open) return null;

  const title = showError
    ? 'Voice Search Failed'
    : isListening
    ? 'Listening…'
    : hasTranscript
    ? 'Did you mean?'
    : 'Voice Search';

  const subtitle = showError
    ? error
    : isListening
    ? 'Speak now'
    : hasTranscript
    ? 'Tap Search to look this up'
    : 'Tap the mic to start';

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(trimmedTranscript);
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Compact centered card */}
      <div
        className="relative w-full max-w-[340px] bg-gradient-to-b from-[#031b14] via-[#022a1d] to-[#02402c] rounded-[28px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.65)] border border-emerald-400/15 overflow-hidden animate-in zoom-in-95 duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gloss line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

        {/* Ambient corner glow */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-emerald-600/20 blur-3xl" />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute top-3.5 right-3.5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/85 active:scale-90 transition-all z-20"
        >
          <X size={14} strokeWidth={2.6} />
        </button>

        <div className="relative px-6 pt-8 pb-6 flex flex-col items-center">
          {/* Mic circle with rings */}
          <div
            className="relative flex items-center justify-center"
            style={{ height: 96, width: 96 }}
          >
            {isListening && !showError && (
              <>
                <span className="vs-ring vs-ring-1" />
                <span className="vs-ring vs-ring-2" />
                <span className="vs-ring vs-ring-3" />
              </>
            )}

            <div
              className={`absolute h-16 w-16 rounded-full blur-2xl transition-colors duration-500 ${
                showError
                  ? 'bg-red-500/45'
                  : isListening
                  ? 'bg-emerald-400/55'
                  : 'bg-emerald-500/30'
              }`}
            />

            <div
              className={`relative h-[68px] w-[68px] rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                showError
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : isListening
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 vs-mic-pulse'
                  : 'bg-gradient-to-br from-emerald-500/85 to-emerald-700/85'
              }`}
            >
              {showError ? (
                <AlertCircle size={26} className="text-white" strokeWidth={2.3} />
              ) : isListening ? (
                <MicOff size={26} className="text-white" strokeWidth={2.3} />
              ) : (
                <Mic size={26} className="text-white" strokeWidth={2.3} />
              )}
            </div>
          </div>

          {/* Status */}
          <h3 className="mt-4 text-[15px] font-black text-white tracking-[-0.01em] text-center">
            {title}
          </h3>
          <p className="mt-1 text-[11.5px] font-semibold text-emerald-100/75 text-center leading-relaxed min-h-[16px]">
            {subtitle}
          </p>

          {/* Waveform bars */}
          {isListening && !showError && (
            <div className="mt-4 h-10 w-full flex items-center justify-center gap-[3px] px-1">
              {Array.from({ length: BAR_COUNT }).map((_, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    barsRef.current[i] = el;
                  }}
                  className={`vs-bar ${isRealWave ? 'vs-bar-live' : ''}`}
                  style={{ animationDelay: `${i * 0.055}s` }}
                />
              ))}
            </div>
          )}

          {/* Transcript preview */}
          {(hasTranscript || isListening) && (
            <div
              className={`mt-4 w-full rounded-xl px-3.5 py-2.5 border transition-all duration-200 ${
                hasTranscript
                  ? 'bg-white/[0.09] border-white/15'
                  : 'bg-white/[0.04] border-white/10'
              }`}
            >
              {hasTranscript ? (
                <div className="flex items-start gap-2">
                  <Search
                    size={13}
                    className="text-emerald-300 shrink-0 mt-0.5"
                    strokeWidth={2.4}
                  />
                  <p className="text-[13px] font-bold text-white leading-snug break-words">
                    {trimmedTranscript}
                  </p>
                </div>
              ) : (
                <p className="text-[11.5px] italic text-white/40 font-medium text-center">
                  Your speech will appear here…
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-5 w-full flex items-center gap-2">
            {showError ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13px] font-black active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onRetry}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13px] font-black active:scale-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} strokeWidth={2.6} />
                  Try Again
                </button>
              </>
            ) : isListening ? (
              <button
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13px] font-black active:scale-95 transition-all"
              >
                Cancel
              </button>
            ) : hasTranscript ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13px] font-black active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13px] font-black active:scale-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
                >
                  <Search size={14} strokeWidth={2.8} />
                  Search
                </button>
              </>
            ) : (
              <button
                onClick={onRetry}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13px] font-black active:scale-95 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5"
              >
                <Mic size={14} strokeWidth={2.6} />
                Start Speaking
              </button>
            )}
          </div>

          {/* Language hint */}
          <p className="mt-3.5 text-[9.5px] font-bold text-white/35 tracking-[0.14em] uppercase">
            {lang === 'en-IN' ? 'English (India)' : lang}
          </p>
        </div>

        {/* Scoped styles */}
        <style>{`
          .vs-ring {
            position: absolute;
            border-radius: 9999px;
            border: 2px solid rgba(52, 211, 153, 0.5);
            pointer-events: none;
            animation: vsRingExpand 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
            width: 68px;
            height: 68px;
          }
          .vs-ring-1 { animation-delay: 0s; }
          .vs-ring-2 { animation-delay: 0.8s; }
          .vs-ring-3 { animation-delay: 1.6s; }

          @keyframes vsRingExpand {
            0%   { transform: scale(1);   opacity: 0.85; border-width: 2px; }
            70%  { opacity: 0.2; }
            100% { transform: scale(1.9); opacity: 0;   border-width: 0.5px; }
          }

          .vs-mic-pulse {
            animation: vsMicPulse 1.6s ease-in-out infinite;
          }
          @keyframes vsMicPulse {
            0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4), 0 20px 40px -12px rgba(0,0,0,0.5); }
            50%      { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(52, 211, 153, 0), 0 20px 40px -12px rgba(0,0,0,0.5); }
          }

          .vs-bar {
            display: inline-block;
            width: 3px;
            height: 6px;
            border-radius: 9999px;
            background: linear-gradient(180deg, #6ee7b7 0%, #10b981 100%);
            box-shadow: 0 0 6px rgba(16, 185, 129, 0.35);
            animation: vsBarPulse 1s ease-in-out infinite;
            transition: height 0.08s linear;
            will-change: height;
          }
          .vs-bar-live {
            animation: none;
          }
          @keyframes vsBarPulse {
            0%, 100% { height: 6px;  opacity: 0.6; }
            50%      { height: 24px; opacity: 1;   }
          }
        `}</style>
      </div>
    </div>
  );
}