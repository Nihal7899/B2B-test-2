import React, { useEffect, useMemo, useState } from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

const HOME_MESSAGES = [
  'Dispatching wholesale catalog...',
  'Verifying mandi rates & cold-chain stock...',
  'Loading bulk crates & staples...',
  'Routing your express store delivery...',
  'Finalizing wholesale dispatch...',
];

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  showStatus = false,
  className = '',
}: AppLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!showStatus) return;

    const interval = window.setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % HOME_MESSAGES.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [showStatus]);

  const scaleClass = useMemo(() => {
    if (size === 'sm') return 'scale-[0.82]';
    if (size === 'lg') return 'scale-[1.08]';
    return 'scale-[0.96] sm:scale-100';
  }, [size]);

  const progressPercent =
    (msgIndex / (HOME_MESSAGES.length - 1)) * 100;

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 px-4 animate-loader-fade'
          : 'w-full py-8'
      } ${className}`}
    >
      <div className={`flex flex-col items-center ${scaleClass}`}>
        {/*
          The artwork is deliberately split into two independent SVGs:
          1) the environment moves backwards
          2) the truck stays in place while its wheels spin

          This is much closer to the reference image and prevents the truck
          from swallowing the buildings visually.
        */}
        <div className="relative w-[370px] h-[250px] max-w-[100vw] overflow-hidden">
          {/* ==========================================================
              MOVING BACKGROUND
             ========================================================== */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg
              viewBox="0 0 740 250"
              className="absolute left-0 top-0 h-full w-[740px] animate-loader-bg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="loaderSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="0.72" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#f4faf6" />
                </linearGradient>
                <linearGradient id="loaderRoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#eef7f1" />
                  <stop offset="1" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* White / mint sky */}
              <rect width="740" height="250" fill="url(#loaderSky)" />

              {/* Clouds */}
              <g opacity="0.72" fill="#dfeee5">
                <path d="M42 42c0-6 5-11 11-11 2 0 4 .6 5.5 1.7 2.4-5.1 7.4-8.4 13.2-8.4 8.3 0 15.1 6.5 15.1 14.6 3.4 0 6.2 2.7 6.2 6 0 3.4-2.8 6.1-6.2 6.1H49c-3.9 0-7-3.2-7-7Z" />
                <path d="M298 33c0-5.3 4.4-9.7 9.8-9.7 1.7 0 3.2.4 4.6 1.2 2-4.3 6.2-7.1 11-7.1 7 0 12.8 5.5 12.8 12.4 2.9 0 5.4 2.3 5.4 5.2 0 2.8-2.5 5.1-5.4 5.1h-32c-3.4 0-6.2-2.7-6.2-6.1Z" />
                <path d="M550 49c0-6 5-11 11-11 1.9 0 3.7.5 5.2 1.5 2.3-4.8 7-8 12.5-8 7.8 0 14.3 6.1 14.3 13.8 3.2 0 5.9 2.6 5.9 5.8 0 3.2-2.7 5.8-5.9 5.8h-36.4c-3.7 0-6.6-3-6.6-6.7Z" />
              </g>

              {/* Distant skyline */}
              <g opacity="0.82">
                <rect x="15" y="108" width="45" height="94" rx="2" fill="#e1efe6" />
                <rect x="72" y="87" width="56" height="115" rx="3" fill="#d9ebe0" />
                <rect x="140" y="123" width="47" height="79" rx="3" fill="#e5f1e8" />
                <rect x="197" y="96" width="63" height="106" rx="3" fill="#dceee3" />
                <rect x="275" y="117" width="48" height="85" rx="3" fill="#e4f1e8" />
                <rect x="336" y="104" width="57" height="98" rx="3" fill="#dceee3" />
                <rect x="406" y="126" width="46" height="76" rx="3" fill="#e5f2e9" />
                <rect x="464" y="91" width="62" height="111" rx="3" fill="#dceee3" />
                <rect x="538" y="116" width="49" height="86" rx="3" fill="#e5f2e9" />
                <rect x="600" y="88" width="58" height="114" rx="3" fill="#dceee3" />
                <rect x="669" y="112" width="52" height="90" rx="3" fill="#e6f2e9" />

                <g fill="#f7fbf8" opacity="0.92">
                  <rect x="81" y="99" width="8" height="13" rx="1" />
                  <rect x="96" y="99" width="8" height="13" rx="1" />
                  <rect x="111" y="99" width="8" height="13" rx="1" />
                  <rect x="81" y="120" width="8" height="13" rx="1" />
                  <rect x="96" y="120" width="8" height="13" rx="1" />
                  <rect x="111" y="120" width="8" height="13" rx="1" />

                  <rect x="209" y="108" width="9" height="13" rx="1" />
                  <rect x="226" y="108" width="9" height="13" rx="1" />
                  <rect x="243" y="108" width="9" height="13" rx="1" />
                  <rect x="209" y="130" width="9" height="13" rx="1" />
                  <rect x="226" y="130" width="9" height="13" rx="1" />
                  <rect x="243" y="130" width="9" height="13" rx="1" />

                  <rect x="476" y="103" width="9" height="14" rx="1" />
                  <rect x="494" y="103" width="9" height="14" rx="1" />
                  <rect x="512" y="103" width="9" height="14" rx="1" />

                  <rect x="610" y="100" width="10" height="14" rx="1" />
                  <rect x="628" y="100" width="10" height="14" rx="1" />
                  <rect x="646" y="100" width="10" height="14" rx="1" />
                </g>
              </g>

              {/* Right-side warehouse from the generated reference */}
              <g transform="translate(486 115)">
                <path d="M0 27 82 0l92 27v11H0Z" fill="#d7ebe0" />
                <path d="M7 28 82 5l81 23" fill="none" stroke="#55bc84" strokeWidth="5" strokeLinecap="round" />
                <rect x="8" y="38" width="160" height="91" rx="3" fill="#e1efe6" />
                <rect x="8" y="40" width="160" height="6" fill="#c2dfce" />
                <rect x="26" y="61" width="24" height="20" rx="2" fill="#f8fbf9" />
                <rect x="58" y="61" width="24" height="20" rx="2" fill="#f8fbf9" />
                <rect x="105" y="59" width="39" height="70" rx="2" fill="#c4dfcf" />
                <path d="M105 71h39M105 83h39M105 95h39M105 107h39M105 119h39" stroke="#aed2bd" strokeWidth="1.6" />

                {/* Simplified CafKart mark */}
                <g transform="translate(27 22)">
                  <path d="M0 14C8 3 16 0 23 0c-4 9-10 15-20 18" fill="#35a76d" />
                  <path d="M8 20c8-7 16-9 23-8-4 9-12 14-22 15" fill="#63c88d" />
                  <text x="38" y="16" fontSize="13" fontWeight="700" fill="#309568" fontFamily="Arial, sans-serif">CafKart</text>
                </g>

                {/* Boxes + tiny forklift */}
                <g transform="translate(158 99)">
                  <rect x="0" y="0" width="21" height="20" rx="2" fill="#d4b57a" />
                  <rect x="20" y="-9" width="22" height="29" rx="2" fill="#e0c693" />
                  <path d="M3 4h15M23-5h16" stroke="#be9658" strokeWidth="1.7" />
                </g>
                <g transform="translate(183 100)">
                  <rect x="0" y="9" width="24" height="15" rx="3" fill="#6dbb91" />
                  <rect x="4" y="2" width="15" height="9" rx="2" fill="#8fcaa9" />
                  <circle cx="6" cy="27" r="4.5" fill="#334155" />
                  <circle cx="20" cy="27" r="4.5" fill="#334155" />
                  <path d="M25 6v21M25 27h11" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                </g>
              </g>

              {/* Trees */}
              <g opacity="0.86">
                <g transform="translate(45 175)">
                  <rect x="13" y="25" width="5" height="20" rx="2" fill="#a9cdb7" />
                  <circle cx="15" cy="18" r="14" fill="#c7e2d0" />
                  <circle cx="7" cy="23" r="8" fill="#d5eadd" />
                  <circle cx="24" cy="24" r="8" fill="#c2ddcb" />
                </g>
                <g transform="translate(458 176)">
                  <rect x="13" y="25" width="5" height="20" rx="2" fill="#a9cdb7" />
                  <circle cx="15" cy="18" r="14" fill="#c7e2d0" />
                  <circle cx="7" cy="23" r="8" fill="#d5eadd" />
                  <circle cx="24" cy="24" r="8" fill="#c2ddcb" />
                </g>
              </g>

              {/* Ground */}
              <rect x="0" y="202" width="740" height="48" fill="url(#loaderRoad)" />
              <rect x="0" y="202" width="740" height="2" fill="#d9ece1" />
              <path d="M0 223h740" stroke="#e6f2ea" strokeWidth="2" />
              <path d="M0 241h740" stroke="#edf6f0" strokeWidth="3" />
            </svg>
          </div>

          {/* ==========================================================
              TRUCK / FOREGROUND
             ========================================================== */}
          <svg
            viewBox="0 0 380 190"
            className="absolute left-1/2 top-[55px] z-20 h-[190px] w-[330px] -translate-x-1/2 overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="cargoGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#21c86a" />
                <stop offset="1" stopColor="#10a654" />
              </linearGradient>
              <linearGradient id="cabWhite" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.72" stopColor="#f5faf7" />
                <stop offset="1" stopColor="#d9eee2" />
              </linearGradient>
              <linearGradient id="windowGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#bfeeda" />
                <stop offset="1" stopColor="#70bd9b" />
              </linearGradient>
              <radialGradient id="truckShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#415c50" stopOpacity="0.28" />
                <stop offset="1" stopColor="#415c50" stopOpacity="0" />
              </radialGradient>
              <clipPath id="cargoOpenTop">
                <rect x="56" y="53" width="174" height="65" rx="5" />
              </clipPath>
            </defs>

            {/* Shadow */}
            <ellipse cx="194" cy="171" rx="117" ry="7" fill="url(#truckShadow)" />

            <g className="animate-truck-bounce">
              {/* ========================================================
                  GROCERY LOAD — behind the side wall, clipped to cargo
                 ======================================================== */}
              <g clipPath="url(#cargoOpenTop)" className="animate-load-bob">
                {/* back row */}
                <g transform="translate(70 35)">
                  {/* green bag */}
                  <path d="M2 18c0-4 3-7 7-7h23c4 0 7 3 7 7l-2 31H4Z" fill="#14954a" />
                  <path d="M11 12c0-8 18-10 24 0" fill="none" stroke="#0d733a" strokeWidth="3" strokeLinecap="round" />

                  {/* oil bottle */}
                  <g transform="translate(91 0)">
                    <rect x="6" y="11" width="18" height="43" rx="5" fill="#f0c02b" />
                    <rect x="10" y="2" width="10" height="11" rx="2" fill="#cc9717" />
                    <rect x="8" y="28" width="14" height="15" rx="2" fill="#fff7d3" />
                  </g>

                  {/* milk */}
                  <g transform="translate(119 6)">
                    <path d="M1 11 11 3l18 7v45H1Z" fill="#fff" stroke="#d4e2dc" />
                    <path d="M1 11 11 3l18 7" fill="#3ba8d3" />
                    <rect x="2" y="27" width="26" height="15" fill="#3ba8d3" />
                    <text x="6" y="38" fontSize="7" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">MILK</text>
                  </g>

                  {/* orange packet */}
                  <g transform="translate(150 13)">
                    <path d="M0 7 14 0l15 7v43H0Z" fill="#e35b23" />
                    <path d="M0 7 14 0l15 7" fill="#c94418" />
                    <circle cx="14.5" cy="27" r="6" fill="#fff0d7" />
                  </g>

                  {/* green packet */}
                  <g transform="translate(181 12)">
                    <path d="M0 7 12 0l25 7v43H0Z" fill="#2da35f" />
                    <path d="M0 7 12 0l25 7" fill="#1d884c" />
                    <circle cx="18.5" cy="27" r="6" fill="#dff5e6" />
                  </g>

                  {/* leafy greens */}
                  <g transform="translate(-2 16)">
                    <ellipse cx="25" cy="27" rx="20" ry="21" fill="#158b49" />
                    <ellipse cx="14" cy="28" rx="12" ry="17" fill="#20a955" />
                    <ellipse cx="37" cy="20" rx="13" ry="16" fill="#2eb666" />
                  </g>
                </g>

                {/* front produce row */}
                <g transform="translate(86 78)">
                  {/* bananas */}
                  <g transform="translate(0 -5) rotate(-8)">
                    <path d="M0 31c16 3 28-5 36-18 3-5 4-9 2-13-4 3-6 8-10 11C21 21 12 25 0 31Z" fill="#f3ca29" />
                    <path d="M4 26c12 2 24-6 30-17 2-4 2-7 1-10-4 4-6 8-10 11C18 18 11 22 4 26Z" fill="#ffe061" />
                  </g>

                  {/* tomatoes */}
                  <circle cx="44" cy="29" r="9" fill="#e84343" />
                  <circle cx="60" cy="26" r="9" fill="#d93434" />
                  <circle cx="77" cy="30" r="9" fill="#ee4a42" />
                  <path d="M44 21l-2-3m2 3 3-3m13 0-2-3m2 3 3-3m14 5-2-3m2 3 3-3" stroke="#277b41" strokeWidth="2" strokeLinecap="round" />

                  {/* capsicum */}
                  <g transform="translate(89 17)">
                    <path d="M3 8c-3 5-2 15 3 18 4 2 12 2 16-1 4-4 4-13 1-17-2-3-7-3-10-1-3-2-8-2-10 1Z" fill="#1ba457" />
                    <path d="M13 7V1" stroke="#185b34" strokeWidth="2.2" strokeLinecap="round" />
                  </g>

                  {/* broccoli */}
                  <g transform="translate(114 10)">
                    <rect x="12" y="24" width="9" height="18" rx="3" fill="#78a84a" />
                    <circle cx="11" cy="18" r="10" fill="#178a4a" />
                    <circle cx="22" cy="13" r="11" fill="#1c9b50" />
                    <circle cx="31" cy="20" r="10" fill="#168245" />
                    <circle cx="21" cy="23" r="10" fill="#259f56" />
                  </g>
                </g>
              </g>

              {/* ========================================================
                  OPEN CARGO BOX / SIDE WALL
                 ======================================================== */}
              <path
                d="M56 55Q56 50 61 50h169q6 0 6 6v61H56Z"
                fill="url(#cargoGreen)"
              />

              <rect x="56" y="111" width="180" height="7" fill="#0a944a" />

              {/* top lip makes groceries visually sit INSIDE the truck */}
              <rect x="56" y="51" width="174" height="6" rx="3" fill="#0b9c4f" />

              {/* cargo side highlight */}
              <path d="M62 59h162v42H62Z" fill="#2fd374" opacity="0.26" />

              {/* subtle side sweep */}
              <path d="M170 55h60v63h-21c-7-25-20-46-39-63Z" fill="#0a974b" opacity="0.35" />

              {/* CafKart logo */}
              <g transform="translate(98 75)">
                <g transform="translate(0 2)">
                  <path d="M19 0C10 2 4 8 3 17c8-1 13-6 16-17Z" fill="#fff" />
                  <path d="M4 20c5-6 10-11 16-16" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
                  <path d="M9 19c6 0 11-3 15-8-1 8-7 12-15 13Z" fill="#def9e8" />
                </g>
                <text x="30" y="17" fontSize="18" fontWeight="800" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">CafKart</text>
                <text x="31" y="31" fontSize="6.7" fontWeight="700" fill="#eafff2" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="0.45">B2B GROCERY SOLUTIONS</text>
              </g>

              {/* ========================================================
                  CABIN
                 ======================================================== */
              <path
                d="M236 55h37c9 0 14 3 20 11l25 38c3 5 1 12-6 12H236Z"
                fill="url(#cabWhite)"
              />

              {/* green roof accent */}
              <path d="M236 55h37c9 0 14 3 20 11l5 8H236Z" fill="#17a85a" />

              {/* cabin windows */}
              <path d="M242 64h29v34h-29Z" fill="url(#windowGreen)" />
              <path d="M275 64h5c4 0 8 2 11 7l16 27h-32Z" fill="url(#windowGreen)" />

              {/* window divider */}
              <line x1="273" y1="63" x2="273" y2="101" stroke="#0b6a43" strokeWidth="2.4" />

              {/* glass shine */}
              <path d="M246 68h18" stroke="#effff6" strokeWidth="2" strokeLinecap="round" opacity=".8" />

              {/* cabin green lower */}
              <path d="M236 99h88l5 17H236Z" fill="#087a45" />

              {/* door */}
              <path d="M240 102v39h51v-39" fill="none" stroke="#076f40" strokeWidth="1.8" />
              <rect x="276" y="111" width="9" height="3" rx="1.5" fill="#064a34" />

              {/* mirror */}
              <path d="M302 81h12" stroke="#123a2f" strokeWidth="3" strokeLinecap="round" />
              <rect x="310" y="77" width="8" height="11" rx="3" fill="#163f33" />

              {/* front grille / light */}
              <path d="M318 103h20v14h-20Z" fill="#18312b" />
              <path d="M320 105h16M320 109h16" stroke="#96d9b8" strokeWidth="1" />
              <path d="M321 94h11v9h-11Z" fill="#fff1ad" />
              <path d="M322 96h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />

              {/* bumper */}
              <path d="M316 117h24c3 0 5 2 5 5h-31Z" fill="#182b28" />

              {/* chassis */}
              <rect x="53" y="136" width="289" height="12" rx="4" fill="#1a2c29" />
              <rect x="84" y="147" width="221" height="6" rx="3" fill="#253b35" />

              {/* mudguards */}
              <path d="M76 148c0-19 13-29 28-29s28 10 28 29" fill="#182b28" />
              <path d="M260 148c0-19 13-29 28-29s28 10 28 29" fill="#182b28" />

              {/* ========================================================
                  WHEELS — tyre stays still; only spokes rotate
                 ======================================================== */}
              <Wheel cx={104} cy={149} spokeClass="wheel-spokes-rear" />
              <Wheel cx={288} cy={149} spokeClass="wheel-spokes-front" />

              {/* little chassis details */}
              <rect x="241" y="139" width="7" height="4" rx="1" fill="#e6aa35" />
              <rect x="330" y="113" width="5" height="5" rx="1" fill="#f3a62d" />
            </g>
          </svg>

          {/* Motion streaks remain behind the truck but inside the stage */}
          <svg
            viewBox="0 0 370 250"
            className="absolute inset-0 z-15 h-full w-full pointer-events-none"
            aria-hidden="true"
          >
            <g className="animate-speed-lines">
              <line x1="15" y1="182" x2="72" y2="182" stroke="#44bd7a" strokeWidth="3" strokeLinecap="round" />
              <line x1="4" y1="192" x2="62" y2="192" stroke="#44bd7a" strokeWidth="3" strokeLinecap="round" />
              <line x1="22" y1="202" x2="71" y2="202" stroke="#64cb91" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* ==============================================================
            OPTIONAL STATUS UI — unchanged behavior
           ============================================================== */}
        {showStatus && (
          <div className="mt-1 flex flex-col items-center justify-center animate-loader-fade">
            <div className="relative flex items-center justify-between w-52 mb-3">
              <div className="absolute top-1/2 left-0 right-0 h-[2.5px] -translate-y-1/2 bg-[#cbd5e1] z-0" />
              <div
                className="absolute top-1/2 left-0 h-[2.5px] -translate-y-1/2 bg-[#22c55e] z-0 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />

              {HOME_MESSAGES.map((_, idx) => {
                const isCompleted = idx < msgIndex;
                const isActive = idx === msgIndex;

                return (
                  <div key={idx} className="relative z-10 flex items-center justify-center w-5 h-5">
                    {isActive ? (
                      <div className="flex items-center justify-center h-[18px] w-[18px] rounded-full border-2 border-[#22c55e] bg-white transition-all duration-300 scale-110 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
                      </div>
                    ) : isCompleted ? (
                      <div className="h-3 w-3 rounded-full bg-[#22c55e] transition-all duration-300" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-[#cbd5e1] transition-all duration-300" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="h-6 flex items-center justify-center">
              <p
                key={msgIndex}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight animate-loader-message"
              >
                {HOME_MESSAGES[msgIndex]}
                <span className="text-emerald-500 text-sm">🍃</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loaderBgScroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-370px, 0, 0); }
        }

        .animate-loader-bg {
          animation: loaderBgScroll 10s linear infinite;
          will-change: transform;
        }

        @keyframes truckBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        .animate-truck-bounce {
          animation: truckBounce .62s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center bottom;
          will-change: transform;
        }

        @keyframes loadBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-0.8px); }
        }

        .animate-load-bob {
          animation: loadBob .62s ease-in-out infinite .04s;
          transform-box: fill-box;
          transform-origin: center bottom;
        }

        @keyframes speedLines {
          0% { opacity: .85; transform: translateX(8px); }
          50% { opacity: .35; transform: translateX(-2px); }
          100% { opacity: .85; transform: translateX(8px); }
        }

        .animate-speed-lines {
          animation: speedLines .55s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes loaderMessage {
          0% { opacity: 0; transform: translateY(3px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-3px); }
        }

        .animate-loader-message {
          animation: loaderMessage 1.8s ease-in-out infinite;
        }

        @keyframes loaderFade {
          from { opacity: 0; transform: scale(.985); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-loader-fade {
          animation: loaderFade .15s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-loader-bg,
          .animate-truck-bounce,
          .animate-load-bob,
          .animate-speed-lines,
          .animate-loader-message,
          .wheel-spokes-rear,
          .wheel-spokes-front {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});

interface WheelProps {
  cx: number;
  cy: number;
  spokeClass: string;
}

function Wheel({ cx, cy, spokeClass }: WheelProps) {
  return (
    <g>
      {/* Static tyre */}
      <circle cx={cx} cy={cy} r="21" fill="#172a29" />
      <circle cx={cx} cy={cy} r="16" fill="#334155" />
      <circle cx={cx} cy={cy} r="11" fill="#e2e8e5" />

      {/* ONLY the spokes rotate. The tyre/rim do not revolve. */}
      <g className={spokeClass}>
        <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        <line x1={cx - 7} y1={cy - 7} x2={cx + 7} y2={cy + 7} stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        <line x1={cx - 7} y1={cy + 7} x2={cx + 7} y2={cy - 7} stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill="#1b302c" />
        <circle cx={cx} cy={cy} r="1.6" fill="#94a3b8" />
      </g>
    </g>
  );
}
