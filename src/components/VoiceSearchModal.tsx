import { useEffect, useMemo, useRef } from 'react';
import { X, Mic, MicOff, AlertCircle, Search, RotateCcw, Globe, ChevronDown } from 'lucide-react';

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

// Sculpted static wave heights to match the symmetrical design in the image
const WAVE_BARS_LEFT = [
  { h: 6, delay: 0.1 },
  { h: 14, delay: 0.3 },
  { h: 26, delay: 0.5 },
  { h: 16, delay: 0.2 },
  { h: 22, delay: 0.4 },
];
const WAVE_BARS_RIGHT = [...WAVE_BARS_LEFT].reverse();

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

  // Updated copy to match the image precisely while keeping logic states
  const title = showError
    ? 'Voice Search Failed'
    : isListening
    ? 'Listening…'
    : hasTranscript
    ? 'Did you mean?'
    : 'Tap to speak';

  const subtitle = showError
    ? error
    : hasTranscript
    ? 'Tap Search to look this up'
    : "Tell us what you're looking for, we'll find it for you.";

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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Dark Forest Green Card */}
      <div
        className="relative w-full max-w-[380px] bg-gradient-to-b from-[#06291c] to-[#02130c] rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-emerald-800/30 overflow-hidden animate-in zoom-in-95 duration-250 flex flex-col items-center pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottom Abstract Vectors (matches image aesthetic in dark theme) */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-40">
          <svg viewBox="0 0 1440 320" className="w-full h-auto text-emerald-900/50 fill-current">
            <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,197.3C672,192,768,160,864,165.3C960,171,1056,213,1152,229.3C1248,245,1344,235,1392,229.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg viewBox="0 0 1440 320" className="w-full h-auto text-emerald-800/30 fill-current absolute bottom-0">
            <path d="M0,128L60,149.3C120,171,240,213,360,208C480,203,600,149,720,138.7C840,128,960,160,1080,181.3C1200,203,1320,213,1380,218.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/30 flex items-center justify-center text-emerald-200 active:scale-90 transition-all z-20"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Main Content Area */}
        <div className="relative pt-16 px-6 flex flex-col items-center w-full z-10">
          
          {/* Waves & Mic Row */}
          <div 
            ref={barsContainerRef} 
            className="flex items-center justify-center gap-5 h-32 w-full vs-wave-container transition-transform duration-200"
          >
            {/* Left Waves */}
            <div className={`flex items-center gap-1.5 transition-opacity duration-300 ${isListening && !showError ? 'opacity-100' : 'opacity-0'}`}>
              {WAVE_BARS_LEFT.map((bar, i) => (
                <div
                  key={`left-${i}`}
                  className="vs-bar"
                  style={{
                    height: `${bar.h}px`,
                    animationDelay: `${bar.delay}s`,
                  }}
                />
              ))}
            </div>

            {/* Mic Center (Ringed like the image) */}
            <div className="relative flex items-center justify-center shrink-0 w-28 h-28 rounded-full bg-emerald-500/5">
              <div className="absolute w-22 h-22 rounded-full bg-emerald-500/10 flex items-center justify-center inset-3"></div>
              <div
                className={`relative w-[68px] h-[68px] rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all duration-300 ${
                  showError
                    ? 'bg-red-500'
                    : isListening
                    ? 'bg-[#10b981] vs-mic-pulse'
                    : 'bg-[#10b981]'
                }`}
              >
                {showError ? (
                  <AlertCircle size={28} className="text-white" strokeWidth={2.3} />
                ) : isListening ? (
                  <MicOff size={28} className="text-white" strokeWidth={2.3} />
                ) : (
                  <Mic size={28} className="text-white" strokeWidth={2.3} />
                )}
              </div>
            </div>

            {/* Right Waves */}
            <div className={`flex items-center gap-1.5 transition-opacity duration-300 ${isListening && !showError ? 'opacity-100' : 'opacity-0'}`}>
              {WAVE_BARS_RIGHT.map((bar, i) => (
                <div
                  key={`right-${i}`}
                  className="vs-bar"
                  style={{
                    height: `${bar.h}px`,
                    animationDelay: `${bar.delay}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Texts */}
          <h2 className="mt-8 text-[24px] font-bold text-white tracking-tight text-center">
            {title}
          </h2>
          <p className="mt-2.5 text-[15px] font-medium text-emerald-100/60 text-center leading-relaxed max-w-[260px]">
            {subtitle}
          </p>

          {/* Language Pill */}
          <div className="mt-6 flex items-center gap-1.5 bg-[#0a3827] border border-emerald-700/50 px-4 py-2 rounded-full text-emerald-300">
            <Globe size={14} strokeWidth={2.5} />
            <span className="text-[13px] font-semibold">{lang === 'en-IN' ? 'English (India)' : lang}</span>
            <ChevronDown size={14} strokeWidth={2.5} />
          </div>

          {/* Action Buttons (Logic Preserved, styled to blend into bottom space) */}
          <div className="mt-10 w-full flex items-center gap-3 px-2">
            {showError ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-[14px] bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-100 text-[14px] font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onRetry}
                  className="flex-1 h-12 rounded-[14px] bg-[#10b981] text-white text-[14px] font-bold active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={15} strokeWidth={2.5} />
                  Try Again
                </button>
              </>
            ) : isListening ? (
              <button
                onClick={onClose}
                className="w-full h-12 rounded-[14px] bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-100 text-[14px] font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
            ) : hasTranscript ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-[14px] bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-100 text-[14px] font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 h-12 rounded-[14px] bg-[#10b981] text-white text-[14px] font-bold active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Search size={16} strokeWidth={2.5} />
                  Search
                </button>
              </>
            ) : (
              <button
                onClick={onRetry}
                className="w-full h-12 rounded-[14px] bg-[#10b981] text-white text-[14px] font-bold active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Mic size={16} strokeWidth={2.5} />
                Start Speaking
              </button>
            )}
          </div>

        </div>

        {/* Scoped Styles for matching Image aesthetics */}
        <style>{`
          .vs-mic-pulse {
            animation: vsMicPulse 1.8s ease-in-out infinite;
          }
          @keyframes vsMicPulse {
            0%, 100% { 
              transform: scale(1);    
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4), 0 10px 30px rgba(16, 185, 129, 0.3); 
            }
            50% { 
              transform: scale(1.05); 
              box-shadow: 0 0 0 12px rgba(16, 185, 129, 0), 0 10px 30px rgba(16, 185, 129, 0.3); 
            }
          }

          /* Transcript boost applies to parent flex container now */
          .vs-wave-container {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .vs-wave-boost {
            transform: scale(1.08);
          }

          /* New sculpted bars to match image */
          .vs-bar {
            width: 4px;
            border-radius: 9999px;
            background: #34d399; /* emerald-400 */
            animation: vsSideBarPulse 1.2s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes vsSideBarPulse {
            0%, 100% { transform: scaleY(0.5); opacity: 0.6; }
            50%      { transform: scaleY(1);   opacity: 1;   }
          }
        `}</style>
      </div>
    </div>
  );
}
