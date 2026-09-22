import { useEffect, useRef } from 'react';
import { X, Mic, MicOff, AlertCircle, Search } from 'lucide-react';

interface VoiceSearchModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Called when user dismisses or taps close. */
  onClose: () => void;
  /** Currently listening state (from the hook). */
  isListening: boolean;
  /** Error message from the hook, if any. */
  error: string | null;
  /** Live transcript while listening. */
  transcript: string;
  /** Triggered when user wants to (re)start listening. */
  onRetry: () => void;
  /** Optional language hint shown at bottom. */
  lang?: string;
}

export function VoiceSearchModal({
  open,
  onClose,
  isListening,
  error,
  transcript,
  onRetry,
  lang = 'en-IN',
}: VoiceSearchModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus close button on open
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => closeBtnRef.current?.focus(), 120);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const showError = Boolean(error);
  const showTranscript = transcript.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
    >
      {/* Backdrop with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021610]/95 via-[#011f1a]/95 to-[#02402c]/95 backdrop-blur-xl animate-in fade-in duration-200" />

      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="voice-blob voice-blob-1" />
        <div className="voice-blob voice-blob-2" />
        <div className="voice-blob voice-blob-3" />
      </div>

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-sm bg-white/[0.06] border border-white/15 rounded-[36px] shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gloss line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        {/* Close */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/90 active:scale-90 transition-all z-20"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Content */}
        <div className="px-6 pt-10 pb-7 flex flex-col items-center">
          {/* Waveform / Mic visual */}
          <div className="relative flex items-center justify-center mb-7" style={{ height: 200, width: 200 }}>
            {/* Expanding rings (only while listening) */}
            {isListening && !showError && (
              <>
                <span className="voice-ring voice-ring-1" />
                <span className="voice-ring voice-ring-2" />
                <span className="voice-ring voice-ring-3" />
              </>
            )}

            {/* Sound wave bars surrounding the mic */}
            {isListening && !showError && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(24)].map((_, i) => (
                  <span
                    key={i}
                    className="voice-bar"
                    style={{
                      transform: `rotate(${i * 15}deg) translateY(-70px)`,
                      animationDelay: `${i * 0.06}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Static glow behind mic */}
            <div
              className={`absolute h-24 w-24 rounded-full blur-2xl transition-colors duration-500 ${
                showError
                  ? 'bg-red-500/40'
                  : isListening
                  ? 'bg-emerald-400/50'
                  : 'bg-emerald-500/30'
              }`}
            />

            {/* Mic core */}
            <div
              className={`relative h-24 w-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                showError
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : isListening
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 voice-mic-pulse'
                  : 'bg-gradient-to-br from-emerald-500/80 to-emerald-700/80'
              }`}
            >
              {showError ? (
                <AlertCircle size={38} className="text-white" strokeWidth={2.2} />
              ) : isListening ? (
                <MicOff size={38} className="text-white" strokeWidth={2.2} />
              ) : (
                <Mic size={38} className="text-white" strokeWidth={2.2} />
              )}
            </div>
          </div>

          {/* Heading */}
          <h3 className="text-[17px] font-black text-white tracking-[-0.02em] text-center">
            {showError ? 'Voice Search Failed' : isListening ? 'Listening…' : 'Voice Search'}
          </h3>

          {/* Subtitle / status */}
          <p className="text-[12.5px] font-semibold text-emerald-100/80 text-center mt-1.5 leading-relaxed min-h-[18px] px-4">
            {showError
              ? error
              : isListening
              ? 'Speak now, I am listening…'
              : 'Tap the mic to start speaking'}
          </p>

          {/* Transcript preview box */}
          <div
            className={`mt-5 w-full rounded-2xl px-4 py-3 border transition-all duration-300 ${
              showTranscript
                ? 'bg-white/10 border-white/20 min-h-[52px]'
                : 'bg-white/[0.04] border-white/10 min-h-[52px]'
            }`}
          >
            {showTranscript ? (
              <div className="flex items-start gap-2.5">
                <Search size={14} className="text-emerald-300 shrink-0 mt-0.5" strokeWidth={2.4} />
                <p className="text-[14px] font-bold text-white leading-snug break-words">
                  {transcript}
                </p>
              </div>
            ) : (
              <p className="text-[12.5px] italic text-white/40 font-medium text-center py-1">
                Your speech will appear here…
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 w-full flex items-center gap-2.5">
            {showError ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13.5px] font-black active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onRetry}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13.5px] font-black active:scale-95 transition-all shadow-lg shadow-emerald-500/30"
                >
                  Try Again
                </button>
              </>
            ) : isListening ? (
              <button
                onClick={onClose}
                className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[13.5px] font-black active:scale-95 transition-all"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={onRetry}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[13.5px] font-black active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <Mic size={16} strokeWidth={2.6} />
                Start Speaking
              </button>
            )}
          </div>

          {/* Language hint */}
          <p className="mt-4 text-[10px] font-bold text-white/40 tracking-wider uppercase">
            {lang === 'en-IN' ? 'English (India)' : lang}
          </p>
        </div>
      </div>

      {/* Local styles for the waves + rings */}
      <style>{`
        /* Expanding rings */
        .voice-ring {
          position: absolute;
          border-radius: 9999px;
          border: 2px solid rgba(52, 211, 153, 0.55);
          pointer-events: none;
          animation: voiceRingExpand 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
        }
        .voice-ring-1 { animation-delay: 0s;    width: 96px;  height: 96px;  }
        .voice-ring-2 { animation-delay: 0.8s;  width: 96px;  height: 96px;  }
        .voice-ring-3 { animation-delay: 1.6s;  width: 96px;  height: 96px;  }

        @keyframes voiceRingExpand {
          0%   { transform: scale(1);   opacity: 0.9; border-width: 2px; }
          70%  { opacity: 0.25; }
          100% { transform: scale(2.1); opacity: 0;   border-width: 0.5px; }
        }

        /* Mic core gentle pulse */
        .voice-mic-pulse {
          animation: voiceMicPulse 1.6s ease-in-out infinite;
        }
        @keyframes voiceMicPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.45), 0 20px 40px -10px rgba(0,0,0,0.4); }
          50%      { transform: scale(1.05); box-shadow: 0 0 0 14px rgba(52, 211, 153, 0), 0 20px 40px -10px rgba(0,0,0,0.4); }
        }

        /* Sound wave bars around mic */
        .voice-bar {
          position: absolute;
          width: 3px;
          height: 14px;
          background: linear-gradient(180deg, rgba(52, 211, 153, 0.95), rgba(16, 185, 129, 0.6));
          border-radius: 9999px;
          transform-origin: center 70px;
          animation: voiceBarPulse 1.1s ease-in-out infinite;
        }
        @keyframes voiceBarPulse {
          0%, 100% { height: 8px;  opacity: 0.55; }
          50%      { height: 26px; opacity: 1; }
        }

        /* Floating background blobs */
        .voice-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.5;
        }
        .voice-blob-1 {
          top: -10%; left: -10%;
          width: 45vw; height: 45vw;
          background: radial-gradient(circle, rgba(52,211,153,0.55), transparent 65%);
          animation: blobFloat1 14s ease-in-out infinite;
        }
        .voice-blob-2 {
          bottom: -15%; right: -10%;
          width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(16,185,129,0.45), transparent 65%);
          animation: blobFloat2 18s ease-in-out infinite;
        }
        .voice-blob-3 {
          top: 30%; right: 20%;
          width: 30vw; height: 30vw;
          background: radial-gradient(circle, rgba(5,150,105,0.4), transparent 65%);
          animation: blobFloat3 22s ease-in-out infinite;
        }

        @keyframes blobFloat1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(30px, 20px) scale(1.1); }
        }
        @keyframes blobFloat2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-40px, -30px) scale(1.08); }
        }
        @keyframes blobFloat3 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-25px, 25px) scale(1.15); }
        }
      `}</style>
    </div>
  );
}