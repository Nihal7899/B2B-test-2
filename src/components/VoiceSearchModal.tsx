import { useEffect, useMemo, useRef } from 'react';
import { X, Mic, MicOff, AlertCircle, Globe, ChevronDown } from 'lucide-react';

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

  // Updated copy to match the image precisely
  const title = showError
    ? 'Voice Search Failed'
    : isListening
    ? 'Listening…'
    : hasTranscript
    ? trimmedTranscript
    : 'Tap to speak';

  const subtitle = showError
    ? error
    : hasTranscript
    ? 'Searching...'
    : "Tell us what you're looking for,\nwe'll find it for you.";

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Voice search"
    >
      {/* Backdrop - Reduced blur and opacity */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200" />

      {/* Clean White Card matching the image exactly */}
      <div
        className="relative w-full max-w-[380px] bg-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-250 flex flex-col items-center pb-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Bottom Waves */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden h-32 flex items-end">
          <svg 
            viewBox="0 0 1440 320" 
            className="w-full h-auto fill-[#e0f6ef] absolute bottom-0 origin-bottom vs-bottom-wave-1"
            preserveAspectRatio="none"
          >
            <path d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,197.3C672,192,768,160,864,165.3C960,171,1056,213,1152,229.3C1248,245,1344,235,1392,229.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <svg 
            viewBox="0 0 1440 320" 
            className="w-full h-auto fill-[#ccf0e2] absolute bottom-0 origin-bottom vs-bottom-wave-2 opacity-80"
            preserveAspectRatio="none"
          >
            <path d="M0,128L60,149.3C120,171,240,213,360,208C480,203,600,149,720,138.7C840,128,960,160,1080,181.3C1200,203,1320,213,1380,218.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
          </svg>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-all z-20"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Main Content Area */}
        <div className="relative pt-16 px-6 flex flex-col items-center w-full z-10">
          
          {/* Waves & Mic Row */}
          <div 
            ref={barsContainerRef} 
            className="flex items-center justify-center gap-4 h-32 w-full vs-wave-container transition-transform duration-200"
          >
            {/* Left Waves (Forest Dark Green) */}
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

            {/* Mic Center (Forest Dark Green Ring Theme) */}
            <div className="relative flex items-center justify-center shrink-0 w-32 h-32 rounded-full cursor-pointer" onClick={showError ? onRetry : undefined}>
              {/* Expanding Rings */}
              {(isListening || showError) && (
                <>
                  <div className="absolute inset-0 rounded-full vs-ring vs-ring-1"></div>
                  <div className="absolute inset-0 rounded-full vs-ring vs-ring-2"></div>
                  <div className="absolute inset-0 rounded-full vs-ring vs-ring-3"></div>
                </>
              )}
              
              {/* Outer static pale ring */}
              <div className="absolute w-[100px] h-[100px] rounded-full bg-[#0d5235]/5 flex items-center justify-center"></div>
              
              {/* Inner dark forest green mic button */}
              <div
                className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  showError
                    ? 'bg-red-600'
                    : 'bg-[#0d5235] vs-mic-pulse'
                }`}
              >
                {showError ? (
                  <AlertCircle size={30} className="text-white" strokeWidth={2.2} />
                ) : isListening ? (
                  <MicOff size={30} className="text-white" strokeWidth={2.2} />
                ) : (
                  <Mic size={30} className="text-white" strokeWidth={2.2} />
                )}
              </div>
            </div>

            {/* Right Waves (Forest Dark Green) */}
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
          <h2 className="mt-6 text-[26px] font-bold text-[#112c22] tracking-tight text-center">
            {title}
          </h2>
          <p className="mt-3 text-[15px] font-medium text-[#4f6b5f] text-center leading-relaxed whitespace-pre-line">
            {subtitle}
          </p>

          {/* Language Pill */}
          <div className="mt-8 flex items-center gap-1.5 bg-[#e8f6f1] px-4 py-2 rounded-full text-[#0d5235] cursor-pointer hover:bg-[#d8f0e8] transition-colors">
            <Globe size={15} strokeWidth={2.2} />
            <span className="text-[13.5px] font-semibold">{lang === 'en-IN' ? 'English (India)' : lang}</span>
            <ChevronDown size={15} strokeWidth={2.2} />
          </div>

        </div>

        {/* Scoped Styles for Forest Dark Green Theme & Animations */}
        <style>{`
          /* Expanding mic rings */
          .vs-ring {
            border: 1px solid rgba(13, 82, 53, 0.4);
            animation: vsRingExpand 2s cubic-bezier(0.1, 0.7, 0.3, 1) infinite;
          }
          .vs-ring-1 { animation-delay: 0s; }
          .vs-ring-2 { animation-delay: 0.6s; }
          .vs-ring-3 { animation-delay: 1.2s; }

          @keyframes vsRingExpand {
            0%   { transform: scale(0.7);  opacity: 1; border-width: 2px; }
            100% { transform: scale(1.6); opacity: 0; border-width: 1px; }
          }

          /* Mic base pulse */
          .vs-mic-pulse {
            animation: vsMicPulse 1.8s ease-in-out infinite;
          }
          @keyframes vsMicPulse {
            0%, 100% { 
              transform: scale(1);    
              box-shadow: 0 4px 14px rgba(13, 82, 53, 0.25); 
            }
            50% { 
              transform: scale(1.04); 
              box-shadow: 0 8px 24px rgba(13, 82, 53, 0.35); 
            }
          }

          /* Transcript boost applies to parent flex container */
          .vs-wave-container {
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .vs-wave-boost {
            transform: scale(1.08);
          }

          /* Forest dark green side bars */
          .vs-bar {
            width: 4px;
            border-radius: 9999px;
            background: #0d5235; /* Forest dark green */
            animation: vsSideBarPulse 1.2s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes vsSideBarPulse {
            0%, 100% { transform: scaleY(0.5); opacity: 0.7; }
            50%      { transform: scaleY(1.1); opacity: 1;   }
          }

          /* Bottom wave continuous panning */
          .vs-bottom-wave-1 {
            animation: moveWave 12s linear infinite alternate;
          }
          .vs-bottom-wave-2 {
            animation: moveWave 18s linear infinite alternate-reverse;
          }

          @keyframes moveWave {
            0% { transform: scaleX(1.3) translateX(-5%); }
            100% { transform: scaleX(1.3) translateX(5%); }
          }
        `}</style>
      </div>
    </div>
  );
}
