import React, { useState } from 'react';

interface NoInternetProps {
  fullScreen?: boolean;
  title?: string;
  message?: string;
  retryLabel?: string;
  /** Called when the user taps "Try again". May return a promise – the button shows a spinner until it settles. */
  onRetry?: () => void | Promise<void>;
  className?: string;
}

/**
 * "No internet / something went wrong" screen.
 * A worried electrician holds a snapped network cable (sparks flying between the
 * two broken ends) and shakes his head sideways: "no, no, no…".
 */
export const NoInternet = React.memo(function NoInternet({
  fullScreen = true,
  title = 'No Internet Connection',
  message = 'Looks like the wires got crossed. Check your connection and give it another go.',
  retryLabel = 'Try again',
  onRetry,
  className = '',
}: NoInternetProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await onRetry?.();
    } finally {
      // keep the spinner visible briefly so the tap feels acknowledged
      setTimeout(() => setRetrying(false), 700);
    }
  };

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center bg-white select-none px-6 ${
        fullScreen ? 'fixed inset-0 z-[999] ni-fade-in' : 'w-full py-10'
      } ${className}`}
    >
      <div className="w-full max-w-[380px] sm:max-w-[440px]">
        <svg
          viewBox="0 0 420 340"
          className="w-full h-auto overflow-visible"
          fill="none"
          role="img"
          aria-label="An electrician holding a broken cable and shaking his head"
        >
          <defs>
            <radialGradient id="ni-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FFF59D" stopOpacity="0.95" />
              <stop offset="1" stopColor="#FFF59D" stopOpacity="0" />
            </radialGradient>
            <path id="ni-bolt" d="M4 -16 L-7 3 L-1 3 L-5 16 L8 -4 L1 -4 Z" />
          </defs>

          {/* ---------- Background blob + floor ---------- */}
          <circle className="ni-blob" cx="210" cy="170" r="150" fill="#E8F5E9" />
          <circle cx="62" cy="62" r="7" fill="#C8E6C9" className="ni-float" style={{ animationDelay: '0.3s' }} />
          <circle cx="368" cy="96" r="5" fill="#C8E6C9" className="ni-float" style={{ animationDelay: '1.1s' }} />
          <circle cx="352" cy="232" r="9" fill="#DCEFDD" className="ni-float" style={{ animationDelay: '0.7s' }} />
          <ellipse cx="210" cy="318" rx="130" ry="11" fill="#000" opacity="0.09" />

          {/* ---------- Dead Wi-Fi sign (flickering) ---------- */}
          <g transform="translate(330 58)"><g className="ni-float" style={{ animationDuration: '3s' }}>
            <circle r="30" fill="#fff" stroke="#E0E7E3" strokeWidth="2" />
            <g stroke="#9AA9A0" strokeWidth="4.5" strokeLinecap="round" fill="none">
              <path className="ni-wifi-3" d="M-18 -5 Q0 -21 18 -5" />
              <path className="ni-wifi-2" d="M-11 2 Q0 -8 11 2" />
              <path className="ni-wifi-1" d="M-5 9 Q0 5 5 9" />
            </g>
            <circle className="ni-wifi-0" cx="0" cy="15" r="3" fill="#9AA9A0" />
            <g className="ni-x-pulse">
              <circle cx="18" cy="-20" r="11" fill="#EF4444" />
              <path d="M13 -25 L23 -15 M23 -25 L13 -15" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </g>
          </g></g>

          {/* ---------- Router on the floor (left) ---------- */}
          <g transform="translate(22 284)">
            <rect x="0" y="10" width="62" height="24" rx="7" fill="#37474F" />
            <rect x="0" y="10" width="62" height="7" rx="3.5" fill="#455A64" />
            <path d="M14 10 L10 -8" stroke="#37474F" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M48 10 L52 -8" stroke="#37474F" strokeWidth="3.5" strokeLinecap="round" />
            <circle className="ni-led-red" cx="14" cy="25" r="3" fill="#EF4444" />
            <circle cx="26" cy="25" r="3" fill="#607D8B" />
            <circle cx="38" cy="25" r="3" fill="#607D8B" />
          </g>

          {/* ---------- Wall socket (right) ---------- */}
          <g transform="translate(372 286)">
            <rect x="0" y="0" width="30" height="34" rx="7" fill="#ECEFF1" stroke="#B0BEC5" strokeWidth="2.5" />
            <rect x="8" y="8" width="14" height="10" rx="2" fill="#546E7A" />
            <rect x="11" y="20" width="8" height="6" rx="1.5" fill="#90A4AE" />
          </g>

          {/* ---------- Cable halves: router → left hand, right hand → socket ---------- */}
          <path d="M60 298 C100 316 130 292 150 262 C160 246 166 236 172 230" stroke="#263238" strokeWidth="7" strokeLinecap="round" />
          <path d="M60 298 C100 316 130 292 150 262 C160 246 166 236 172 230" stroke="#4FC3F7" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11" />
          <path d="M372 303 C340 320 306 300 290 270 C280 250 272 238 262 230" stroke="#263238" strokeWidth="7" strokeLinecap="round" />
          <path d="M372 303 C340 320 306 300 290 270 C280 250 272 238 262 230" stroke="#4FC3F7" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11" />

          {/* ---------- Electrician ---------- */}
          <g className="ni-body">
            {/* legs + boots */}
            <rect x="178" y="236" width="24" height="68" rx="8" fill="#37474F" />
            <rect x="218" y="236" width="24" height="68" rx="8" fill="#37474F" />
            <path d="M172 298 h34 v14 a5 5 0 0 1 -5 5 h-24 a5 5 0 0 1 -5 -5 Z" fill="#5D4037" />
            <path d="M214 298 h34 v14 a5 5 0 0 1 -5 5 h-24 a5 5 0 0 1 -5 -5 Z" fill="#5D4037" />

            {/* torso: shirt + hi-vis vest */}
            <path d="M166 160 Q166 146 182 146 H238 Q254 146 254 160 V244 Q254 252 246 252 H174 Q166 252 166 244 Z" fill="#455A64" />
            <path d="M172 158 Q172 150 182 150 H196 L210 176 L224 150 H238 Q248 150 248 158 V240 H172 Z" fill="#FB8C00" />
            <rect x="172" y="198" width="76" height="8" fill="#FFF59D" />
            <rect x="172" y="220" width="76" height="8" fill="#FFF59D" />
            <rect x="203" y="176" width="14" height="64" fill="#EF6C00" opacity="0.35" />
            {/* tool belt */}
            <rect x="166" y="238" width="88" height="10" rx="3" fill="#5D4037" />
            <rect x="196" y="236" width="28" height="14" rx="3" fill="#8D6E63" />
            <rect x="226" y="248" width="9" height="20" rx="3" fill="#FDD835" />
            <rect x="184" y="248" width="9" height="16" rx="3" fill="#EF4444" />

            {/* ---- head (shakes side to side) ---- */}
            <g className="ni-head">
              {/* neck */}
              <rect x="199" y="134" width="22" height="20" rx="6" fill="#E5A57C" />
              {/* ears */}
              <circle cx="174" cy="112" r="8" fill="#F2B78F" />
              <circle cx="246" cy="112" r="8" fill="#F2B78F" />
              {/* face */}
              <circle cx="210" cy="110" r="37" fill="#F2B78F" />
              {/* cheeks */}
              <circle cx="188" cy="124" r="6" fill="#EF9A9A" opacity="0.55" />
              <circle cx="232" cy="124" r="6" fill="#EF9A9A" opacity="0.55" />
              {/* eyes */}
              <ellipse cx="195" cy="108" rx="9" ry="10.5" fill="#fff" />
              <ellipse cx="225" cy="108" rx="9" ry="10.5" fill="#fff" />
              <g className="ni-pupils">
                <circle cx="195" cy="109" r="4.6" fill="#263238" />
                <circle cx="225" cy="109" r="4.6" fill="#263238" />
                <circle cx="196.6" cy="107" r="1.4" fill="#fff" />
                <circle cx="226.6" cy="107" r="1.4" fill="#fff" />
              </g>
              {/* worried brows */}
              <g className="ni-brows" stroke="#4E342E" strokeWidth="3.6" strokeLinecap="round">
                <path d="M185 94 L203 87" />
                <path d="M235 94 L217 87" />
              </g>
              {/* tense, gritted mouth */}
              <path d="M193 133 q4.5 -5 9 0 t9 0 t9 0 t9 0" stroke="#7B3F2A" strokeWidth="3.2" strokeLinecap="round" />
              {/* hard hat */}
              <path d="M170 92 Q170 56 210 54 Q250 56 250 92 Z" fill="#FDD835" />
              <path d="M200 55 Q210 52 220 55 L220 90 H200 Z" fill="#F9C80E" />
              <rect x="162" y="88" width="96" height="10" rx="5" fill="#F9A825" />
              <circle cx="210" cy="72" r="7" fill="#FFF8E1" stroke="#F9A825" strokeWidth="2.5" />
              <circle className="ni-lamp" cx="210" cy="72" r="16" fill="url(#ni-glow)" />
              {/* sweat drops */}
              <g className="ni-sweat">
                <path d="M254 92 q-6 10 0 14 q6 -4 0 -14 Z" fill="#81D4FA" stroke="#4FC3F7" strokeWidth="1.5" />
              </g>
              <g className="ni-sweat" style={{ animationDelay: '0.9s' }}>
                <path d="M168 84 q-5 8 0 12 q5 -4 0 -12 Z" fill="#81D4FA" stroke="#4FC3F7" strokeWidth="1.5" />
              </g>
            </g>

            {/* ---- arms + hands holding the broken cable ---- */}
            <g className="ni-hands">
              {/* arms */}
              <path d="M172 168 Q132 188 162 226" stroke="#455A64" strokeWidth="21" strokeLinecap="round" />
              <path d="M248 168 Q288 188 258 226" stroke="#455A64" strokeWidth="21" strokeLinecap="round" />
              {/* cable ends, frayed copper */}
              <path d="M170 228 L192 224" stroke="#263238" strokeWidth="8" strokeLinecap="round" />
              <path d="M250 228 L228 224" stroke="#263238" strokeWidth="8" strokeLinecap="round" />
              <g stroke="#FFB300" strokeWidth="2" strokeLinecap="round">
                <path d="M192 224 l7 -5" />
                <path d="M192 224 l8 0" />
                <path d="M192 224 l7 5" />
                <path d="M228 224 l-7 -5" />
                <path d="M228 224 l-8 0" />
                <path d="M228 224 l-7 5" />
              </g>
              {/* hands */}
              <circle cx="168" cy="228" r="11" fill="#F2B78F" />
              <circle cx="252" cy="228" r="11" fill="#F2B78F" />
              <path d="M163 224 q5 -4 10 0" stroke="#D88C62" strokeWidth="2" strokeLinecap="round" />
              <path d="M247 224 q5 -4 10 0" stroke="#D88C62" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>

          {/* ---------- Sparks between the broken ends ---------- */}
          <g aria-hidden="true">
            <circle className="ni-spark-glow" cx="210" cy="224" r="26" fill="url(#ni-glow)" />
            <use href="#ni-bolt" className="ni-bolt" x="210" y="222" fill="#FDD835" stroke="#F9A825" strokeWidth="1.5" strokeLinejoin="round" />
            <g stroke="#FFEE58" strokeWidth="2.6" strokeLinecap="round">
              <line className="ni-ray" style={{ animationDelay: '0s' }} x1="206" y1="216" x2="198" y2="204" />
              <line className="ni-ray" style={{ animationDelay: '0.12s' }} x1="214" y1="216" x2="224" y2="203" />
              <line className="ni-ray" style={{ animationDelay: '0.22s' }} x1="204" y1="230" x2="194" y2="240" />
              <line className="ni-ray" style={{ animationDelay: '0.05s' }} x1="216" y1="230" x2="227" y2="241" />
              <line className="ni-ray" style={{ animationDelay: '0.3s' }} x1="210" y1="212" x2="210" y2="198" />
            </g>
            <circle className="ni-ember" cx="200" cy="214" r="2.2" fill="#FFCA28" style={{ ['--ex' as any]: '-26px', ['--ey' as any]: '-34px' }} />
            <circle className="ni-ember" cx="220" cy="214" r="2.2" fill="#FFA726" style={{ ['--ex' as any]: '28px', ['--ey' as any]: '-30px', animationDelay: '0.35s' }} />
            <circle className="ni-ember" cx="210" cy="232" r="2" fill="#FFCA28" style={{ ['--ex' as any]: '4px', ['--ey' as any]: '-40px', animationDelay: '0.7s' }} />
          </g>

          {/* Little "zzt" tags */}
          <text className="ni-zzt" x="258" y="206" fontSize="13" fontWeight="700" fill="#F9A825" fontFamily="ui-monospace, monospace">zzt!</text>
          <text className="ni-zzt" x="146" y="204" fontSize="13" fontWeight="700" fill="#F9A825" fontFamily="ui-monospace, monospace" style={{ animationDelay: '0.45s' }}>bzz</text>
        </svg>

        {/* ---------- Copy + action ---------- */}
        <div className="mt-2 text-center ni-rise">
          <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-800">{title}</h2>
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-500 max-w-sm mx-auto">{message}</p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition active:scale-95 hover:bg-emerald-600 disabled:opacity-80"
          >
            {retrying ? (
              <svg className="h-5 w-5 ni-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v6h-6" />
              </svg>
            )}
            {retrying ? 'Reconnecting…' : retryLabel}
          </button>
        </div>
      </div>

      <style>{`
        /* ---- Head: tense "no, no, no…" shake, then a beat of dread ---- */
        @keyframes niHeadShake {
          0%   { transform: rotate(0deg) translateX(0); }
          6%   { transform: rotate(-12deg) translateX(-4px); }
          14%  { transform: rotate(12deg) translateX(4px); }
          22%  { transform: rotate(-11deg) translateX(-4px); }
          30%  { transform: rotate(10deg) translateX(3px); }
          38%  { transform: rotate(-7deg) translateX(-2px); }
          46%  { transform: rotate(5deg) translateX(2px); }
          54%  { transform: rotate(-2deg) translateX(0); }
          62%, 100% { transform: rotate(0deg) translateX(0); }
        }
        .ni-head {
          transform-origin: 210px 150px;
          animation: niHeadShake 2.6s ease-in-out infinite;
        }

        /* eyes dart along with the head */
        @keyframes niPupils {
          0%, 62%, 100% { transform: translateX(0); }
          6%   { transform: translateX(-3.5px); }
          14%  { transform: translateX(3.5px); }
          22%  { transform: translateX(-3.5px); }
          30%  { transform: translateX(3px); }
          38%  { transform: translateX(-2px); }
          46%  { transform: translateX(2px); }
        }
        .ni-pupils { animation: niPupils 2.6s ease-in-out infinite; }

        @keyframes niBrows {
          0%, 60%, 100% { transform: translateY(0); }
          70%, 90% { transform: translateY(-2.5px); }
        }
        .ni-brows { animation: niBrows 2.6s ease-in-out infinite; }

        /* ---- Body shivers with tension; hands tremble around the cable ---- */
        @keyframes niBody {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-1.5px) rotate(-0.4deg); }
          75% { transform: translateY(0.5px) rotate(0.4deg); }
        }
        .ni-body { transform-origin: 210px 310px; animation: niBody 0.9s ease-in-out infinite; }

        @keyframes niHands {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-0.8px, 0.6px); }
          40% { transform: translate(0.8px, -0.6px); }
          60% { transform: translate(-0.6px, -0.4px); }
          80% { transform: translate(0.6px, 0.5px); }
        }
        .ni-hands { animation: niHands 0.16s linear infinite; }

        /* ---- Sweat ---- */
        @keyframes niSweat {
          0%   { opacity: 0; transform: translateY(-6px) scale(0.6); }
          25%  { opacity: 1; transform: translateY(0) scale(1); }
          80%  { opacity: 1; transform: translateY(22px) scale(1); }
          100% { opacity: 0; transform: translateY(32px) scale(0.8); }
        }
        .ni-sweat { animation: niSweat 1.8s ease-in infinite; transform-box: fill-box; transform-origin: center; }

        /* ---- Electricity ---- */
        @keyframes niBolt {
          0%, 100% { opacity: 0; transform: scale(0.6) rotate(-8deg); }
          8%       { opacity: 1; transform: scale(1.15) rotate(6deg); }
          18%      { opacity: 0.2; transform: scale(0.9) rotate(-4deg); }
          28%      { opacity: 1; transform: scale(1.25) rotate(8deg); }
          42%      { opacity: 0; transform: scale(0.8) rotate(0deg); }
          70%      { opacity: 0; }
          76%      { opacity: 1; transform: scale(1.05) rotate(-6deg); }
          86%      { opacity: 0; }
        }
        .ni-bolt { transform-box: fill-box; transform-origin: center; animation: niBolt 1.4s steps(1, end) infinite; animation-timing-function: linear; }

        @keyframes niRay {
          0%, 100% { opacity: 0; }
          10%, 30% { opacity: 1; }
          45%      { opacity: 0; }
          75%      { opacity: 0; }
          80%      { opacity: 1; }
          90%      { opacity: 0; }
        }
        .ni-ray { animation: niRay 0.7s linear infinite; }

        @keyframes niSparkGlow {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }
          30%      { opacity: 1; transform: scale(1.35); }
          55%      { opacity: 0.5; transform: scale(1); }
          75%      { opacity: 0.95; transform: scale(1.25); }
        }
        .ni-spark-glow { transform-box: fill-box; transform-origin: center; animation: niSparkGlow 0.7s ease-in-out infinite; }

        @keyframes niEmber {
          0%   { opacity: 0; transform: translate(0, 0) scale(1); }
          15%  { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--ex), var(--ey)) scale(0.2); }
        }
        .ni-ember { animation: niEmber 1.1s ease-out infinite; }

        @keyframes niZzt {
          0%, 100% { opacity: 0; transform: translateY(2px) rotate(-6deg); }
          15%, 35% { opacity: 1; transform: translateY(-3px) rotate(4deg); }
          55%      { opacity: 0; }
        }
        .ni-zzt { transform-box: fill-box; transform-origin: center; animation: niZzt 1.4s ease-in-out infinite; }

        @keyframes niLamp {
          0%, 100% { opacity: 0.9; }
          45% { opacity: 0.9; }
          50% { opacity: 0.15; }
          55% { opacity: 0.9; }
          62% { opacity: 0.3; }
        }
        .ni-lamp { transform-box: fill-box; transform-origin: center; animation: niLamp 1.4s linear infinite; }

        /* ---- Router LED + dead Wi-Fi badge ---- */
        @keyframes niLed { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        .ni-led-red { animation: niLed 1s steps(1, end) infinite; }

        @keyframes niWifi {
          0%, 100% { stroke: #9AA9A0; fill: #9AA9A0; opacity: 0.35; }
          50% { stroke: #4CAF50; fill: #4CAF50; opacity: 1; }
        }
        .ni-wifi-0, .ni-wifi-1, .ni-wifi-2, .ni-wifi-3 { animation: niWifi 2.4s ease-in-out infinite; }
        .ni-wifi-1 { animation-delay: 0.15s; }
        .ni-wifi-2 { animation-delay: 0.3s; }
        .ni-wifi-3 { animation-delay: 0.45s; }
        .ni-wifi-0 { stroke: none; }

        @keyframes niXPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        .ni-x-pulse { transform-box: fill-box; transform-origin: center; animation: niXPulse 1.2s ease-in-out infinite; }

        /* ---- Ambient ---- */
        @keyframes niFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        .ni-float { animation: niFloat 4s ease-in-out infinite; }

        @keyframes niBlob {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .ni-blob { transform-box: fill-box; transform-origin: center; animation: niBlob 5s ease-in-out infinite; }

        @keyframes niRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ni-rise { animation: niRise 0.6s ease-out 0.15s both; }

        @keyframes niFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ni-fade-in { animation: niFadeIn 0.25s ease-out forwards; }

        @keyframes niSpin { to { transform: rotate(360deg); } }
        .ni-spin { animation: niSpin 0.8s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ni-head, .ni-pupils, .ni-brows, .ni-body, .ni-hands, .ni-sweat, .ni-bolt, .ni-ray,
          .ni-spark-glow, .ni-ember, .ni-zzt, .ni-lamp, .ni-led-red, .ni-wifi-0, .ni-wifi-1,
          .ni-wifi-2, .ni-wifi-3, .ni-x-pulse, .ni-float, .ni-blob { animation: none; }
          .ni-bolt, .ni-ray { opacity: 1; }
        }
      `}</style>
    </div>
  );
});

export default NoInternet;
