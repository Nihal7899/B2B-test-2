import React, { useState, useEffect } from 'react';

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
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % HOME_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [showStatus]);

  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-105' : 'scale-95 sm:scale-100';

  const progressPercent = (msgIndex / (HOME_MESSAGES.length - 1)) * 100;

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in px-6' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center ${scaleClass}`}>
        <div className="relative w-92 h-80 flex items-center justify-center overflow-hidden">
          {/* CLOUDS */}
          <div className="absolute top-1 left-0 w-full h-16 overflow-hidden pointer-events-none z-0">
            <div className="flex w-[840px] animate-clouds-scroll opacity-75">
              <svg viewBox="0 0 420 50" className="w-[420px] h-[50px] shrink-0" fill="none">
                <path d="M40 28C40 22 45 18 51 18C53 18 55 18.8 56.5 20C58.5 15.5 63 13 68 13C75 13 81 18.5 81 25.5C83 25.5 85 27.5 85 29.5C85 32 83 34 80.5 34H44C41.8 34 40 31.5 40 28Z" fill="#e2efe6" />
                <path d="M190 22C190 16.5 194.5 12 200 12C201.8 12 203.5 12.6 205 13.8C207 9.8 211 7.5 215.5 7.5C222 7.5 227 12.5 227 19C229 19 231 21 231 23C231 25.5 229 27.5 226.5 27.5H194C191.8 27.5 190 25 190 22Z" fill="#d9ebdf" />
                <path d="M330 25C330 20 334 16 339 16C340.5 16 342 16.5 343.5 17.5C345 14 349 12 353 12C359 12 364 16.5 364 22.5C365.5 22.5 367 24 367 26C367 28.5 365 30.5 363 30.5H334C331.8 30.5 330 28.2 330 25Z" fill="#e2efe6" />
              </svg>
              <svg viewBox="0 0 420 50" className="w-[420px] h-[50px] shrink-0" fill="none">
                <path d="M40 28C40 22 45 18 51 18C53 18 55 18.8 56.5 20C58.5 15.5 63 13 68 13C75 13 81 18.5 81 25.5C83 25.5 85 27.5 85 29.5C85 32 83 34 80.5 34H44C41.8 34 40 31.5 40 28Z" fill="#e2efe6" />
                <path d="M190 22C190 16.5 194.5 12 200 12C201.8 12 203.5 12.6 205 13.8C207 9.8 211 7.5 215.5 7.5C222 7.5 227 12.5 227 19C229 19 231 21 231 23C231 25.5 229 27.5 226.5 27.5H194C191.8 27.5 190 25 190 22Z" fill="#d9ebdf" />
                <path d="M330 25C330 20 334 16 339 16C340.5 16 342 16.5 343.5 17.5C345 14 349 12 353 12C359 12 364 16.5 364 22.5C365.5 22.5 367 24 367 26C367 28.5 365 30.5 363 30.5H334C331.8 30.5 330 28.2 330 25Z" fill="#e2efe6" />
              </svg>
            </div>
          </div>

          {/* CITY SKYLINE */}
          <div className="absolute top-6 left-0 w-full h-52 overflow-hidden pointer-events-none z-0">
            <div className="flex w-[840px] animate-skyline-scroll opacity-85">
              <svg viewBox="0 0 420 190" className="w-[420px] h-[190px] shrink-0" fill="none">
                <rect x="0" y="52" width="60" height="138" rx="3" fill="#d9ebdf" />
                <rect x="6" y="58" width="48" height="6" rx="1" fill="#c3decc" />
                <line x1="12" y1="74" x2="48" y2="74" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="82" x2="48" y2="82" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="90" x2="48" y2="90" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="98" x2="48" y2="98" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <rect x="15" y="116" width="30" height="40" rx="1.5" fill="#cbe3d3" />
                <line x1="15" y1="126" x2="45" y2="126" stroke="#d9ebdf" strokeWidth="1.5" />
                <line x1="15" y1="136" x2="45" y2="136" stroke="#d9ebdf" strokeWidth="1.5" />

                <rect x="68" y="22" width="56" height="168" rx="2" fill="#e2efe6" />
                <rect x="74" y="26" width="44" height="4" fill="#cbe3d3" />
                <line x1="78" y1="10" x2="78" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <line x1="114" y1="10" x2="114" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <rect x="76" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />

                <rect x="132" y="68" width="66" height="122" rx="3" fill="#d9ebdf" />
                <path d="M129 78H201L197 90H133L129 78Z" fill="#c3decc" />
                <path d="M134 90C134 92.5 136.5 94 139 94C141.5 94 144 92.5 144 90H134Z" fill="#b1d3bc" />
                <path d="M144 90C144 92.5 146.5 94 149 94C151.5 94 154 92.5 154 90H144Z" fill="#b1d3bc" />
                <path d="M154 90C154 92.5 156.5 94 159 94C161.5 94 164 92.5 164 90H154Z" fill="#b1d3bc" />
                <path d="M164 90C164 92.5 166.5 94 169 94C171.5 94 174 92.5 174 90H164Z" fill="#b1d3bc" />
                <path d="M174 90C174 92.5 176.5 94 179 94C181.5 94 184 92.5 184 90H174Z" fill="#b1d3bc" />
                <path d="M184 90C184 92.5 186.5 94 189 94C191.5 94 194 92.5 194 90H184Z" fill="#b1d3bc" />
                <path d="M143 118V106C143 103 145 101 148 101C151 101 153 103 153 106V118H143Z" fill="#f0f7f2" />
                <path d="M160 118V106C160 103 162 101 165 101C168 101 170 103 170 106V118H160Z" fill="#f0f7f2" />
                <path d="M177 118V106C177 103 179 101 182 101C185 101 187 103 187 106V118H177Z" fill="#f0f7f2" />

                <rect x="206" y="50" width="68" height="140" fill="#cbe3d3" />
                <rect x="216" y="24" width="48" height="26" fill="#d9ebdf" />
                <rect x="228" y="8" width="24" height="16" fill="#e2efe6" />
                <line x1="240" y1="-4" x2="240" y2="8" stroke="#b1d3bc" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="224" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="94" r="2.2" fill="#f0f7f2" />
                <g transform="translate(210, 26) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>

                <rect x="282" y="55" width="28" height="135" fill="#e2efe6" />
                <ellipse cx="296" cy="55" rx="14" ry="7" fill="#d9ebdf" />
                <rect x="314" y="45" width="30" height="145" fill="#d9ebdf" />
                <ellipse cx="329" cy="45" rx="15" ry="8" fill="#cbe3d3" />
                <rect x="296" y="68" width="33" height="4" fill="#b1d3bc" />

                <rect x="352" y="40" width="60" height="150" rx="2" fill="#cbe3d3" />
                <rect x="360" y="45" width="44" height="4" fill="#b1d3bc" />
                <rect x="362" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="362" y="80" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="80" width="10" height="16" rx="1" fill="#f0f7f2" />
                <g transform="translate(390, 24) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>
              </svg>

              <svg viewBox="0 0 420 190" className="w-[420px] h-[190px] shrink-0" fill="none">
                <rect x="0" y="52" width="60" height="138" rx="3" fill="#d9ebdf" />
                <rect x="6" y="58" width="48" height="6" rx="1" fill="#c3decc" />
                <line x1="12" y1="74" x2="48" y2="74" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="82" x2="48" y2="82" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="90" x2="48" y2="90" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="12" y1="98" x2="48" y2="98" stroke="#f0f7f2" strokeWidth="2.2" strokeLinecap="round" />
                <rect x="15" y="116" width="30" height="40" rx="1.5" fill="#cbe3d3" />
                <line x1="15" y1="126" x2="45" y2="126" stroke="#d9ebdf" strokeWidth="1.5" />
                <line x1="15" y1="136" x2="45" y2="136" stroke="#d9ebdf" strokeWidth="1.5" />

                <rect x="68" y="22" width="56" height="168" rx="2" fill="#e2efe6" />
                <rect x="74" y="26" width="44" height="4" fill="#cbe3d3" />
                <line x1="78" y1="10" x2="78" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <line x1="114" y1="10" x2="114" y2="22" stroke="#b1d3bc" strokeWidth="2" strokeLinecap="round" />
                <rect x="76" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="38" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="60" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="76" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="91" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />
                <rect x="106" y="82" width="10" height="15" rx="1" fill="#f0f7f2" />

                <rect x="132" y="68" width="66" height="122" rx="3" fill="#d9ebdf" />
                <path d="M129 78H201L197 90H133L129 78Z" fill="#c3decc" />
                <path d="M134 90C134 92.5 136.5 94 139 94C141.5 94 144 92.5 144 90H134Z" fill="#b1d3bc" />
                <path d="M144 90C144 92.5 146.5 94 149 94C151.5 94 154 92.5 154 90H144Z" fill="#b1d3bc" />
                <path d="M154 90C154 92.5 156.5 94 159 94C161.5 94 164 92.5 164 90H154Z" fill="#b1d3bc" />
                <path d="M164 90C164 92.5 166.5 94 169 94C171.5 94 174 92.5 174 90H164Z" fill="#b1d3bc" />
                <path d="M174 90C174 92.5 176.5 94 179 94C181.5 94 184 92.5 184 90H174Z" fill="#b1d3bc" />
                <path d="M184 90C184 92.5 186.5 94 189 94C191.5 94 194 92.5 194 90H184Z" fill="#b1d3bc" />
                <path d="M143 118V106C143 103 145 101 148 101C151 101 153 103 153 106V118H143Z" fill="#f0f7f2" />
                <path d="M160 118V106C160 103 162 101 165 101C168 101 170 103 170 106V118H160Z" fill="#f0f7f2" />
                <path d="M177 118V106C177 103 179 101 182 101C185 101 187 103 187 106V118H177Z" fill="#f0f7f2" />

                <rect x="206" y="50" width="68" height="140" fill="#cbe3d3" />
                <rect x="216" y="24" width="48" height="26" fill="#d9ebdf" />
                <rect x="228" y="8" width="24" height="16" fill="#e2efe6" />
                <line x1="240" y1="-4" x2="240" y2="8" stroke="#b1d3bc" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="224" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="62" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="78" r="2.2" fill="#f0f7f2" />
                <circle cx="224" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="240" cy="94" r="2.2" fill="#f0f7f2" />
                <circle cx="256" cy="94" r="2.2" fill="#f0f7f2" />
                <g transform="translate(210, 26) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>

                <rect x="282" y="55" width="28" height="135" fill="#e2efe6" />
                <ellipse cx="296" cy="55" rx="14" ry="7" fill="#d9ebdf" />
                <rect x="314" y="45" width="30" height="145" fill="#d9ebdf" />
                <ellipse cx="329" cy="45" rx="15" ry="8" fill="#cbe3d3" />
                <rect x="296" y="68" width="33" height="4" fill="#b1d3bc" />

                <rect x="352" y="40" width="60" height="150" rx="2" fill="#cbe3d3" />
                <rect x="360" y="45" width="44" height="4" fill="#b1d3bc" />
                <rect x="362" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="56" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="362" y="80" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="80" width="10" height="16" rx="1" fill="#f0f7f2" />
                <g transform="translate(390, 24) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#a4cfb1" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>
              </svg>
            </div>
          </div>

          {/* B2B CONTAINER TRUCK */}
          <svg
            viewBox="0 0 360 250"
            className="w-full h-full z-10 pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="groundShadowMain" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#475569" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Trailing Green Speed Streaks */}
            <g className="animate-speed-lines">
              <line x1="5" y1="138" x2="25" y2="138" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="0" y1="146" x2="22" y2="146" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="8" y1="154" x2="28" y2="154" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="12" y1="162" x2="32" y2="162" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
            </g>

            {/* Ground Shadow under extended truck length */}
            <ellipse cx="145" cy="200" rx="135" ry="5.5" fill="url(#groundShadowMain)" />

            <g className="animate-truck-body">
              {/* ----------------- B2B LONG REFRIGERATED CONTAINER ----------------- */}
              <rect x="25" y="90" width="175" height="90" rx="4" fill="#22c55e" />
              <rect x="25" y="174" width="175" height="6" fill="#16a34a" />
              
              {/* Container Corrugated Panel Lines */}
              <g stroke="#16a34a" strokeWidth="1.5" opacity="0.4">
                <line x1="32" y1="90" x2="32" y2="174" />
                <line x1="39" y1="90" x2="39" y2="174" />
                <line x1="46" y1="90" x2="46" y2="174" />
                <line x1="53" y1="90" x2="53" y2="174" />
                <line x1="60" y1="90" x2="60" y2="174" />
                <line x1="165" y1="90" x2="165" y2="174" />
                <line x1="172" y1="90" x2="172" y2="174" />
                <line x1="179" y1="90" x2="179" y2="174" />
                <line x1="186" y1="90" x2="186" y2="174" />
                <line x1="193" y1="90" x2="193" y2="174" />
              </g>

              {/* B2B Cold-Chain Reefer Unit at front of trailer */}
              <rect x="200" y="100" width="12" height="60" rx="2" fill="#cbd5e1" />
              <rect x="202" y="105" width="8" height="20" rx="1" fill="#475569" />
              <circle cx="206" cy="140" r="4.5" fill="#94a3b8" />
              <line x1="203" y1="137" x2="209" y2="143" stroke="#475569" strokeWidth="1" />
              <line x1="203" y1="143" x2="209" y2="137" stroke="#475569" strokeWidth="1" />

              {/* Articulation Cable */}
              <path d="M212 165 Q 206 170 200 165" stroke="#0f172a" strokeWidth="2" fill="none" />

              {/* Centered B2B Container Graphics / Typography */}
              <g transform="translate(95, 118) scale(0.025)">
                <path d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z" fill="#FFFFFF" fillRule="evenodd" />
                <path d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z" fill="#FFFFFF" fillRule="evenodd" />
              </g>
              <text x="112" y="160" fontFamily="sans-serif" fontSize="10" fontWeight="800" fill="#ffffff" letterSpacing="1.5" textAnchor="middle">B2B COLD-CHAIN</text>

              {/* ----------------- DRIVER CABIN (Aero-Deflector Style) ----------------- */}
              <path d="M212 95 Q 235 100 240 124 H 212 Z" fill="#02402c" />
              <path d="M212 124H240C245 124 249 127.5 251.5 132L265 155C267 158.5 265.5 163 261 163H212V124Z" fill="#02402c" />

              {/* Windshield & Door Frame */}
              <path d="M218 128H238C240.5 128 243 129.8 244 132.5L253 148H218V128Z" fill="#a7f3d0" opacity="0.9" />
              <line x1="235" y1="128" x2="235" y2="148" stroke="#02402c" strokeWidth="2.5" />

              {/* Front Bumper & Turn Indicator */}
              <path d="M261 163H274C277 163 279 165.5 279 168.5V173H256L261 163Z" fill="#0f172a" />
              <rect x="272" y="165" width="5" height="5" rx="1" fill="#f59e0b" />

              {/* Extended Chassis & Wheel Arches for Semi-Truck setup */}
              <path
                d="M25 180 
                   H30 C32 180 34 177.5 34 175 C34 162 40 152 50 152 
                   H85 C95 152 101 162 101 175 C101 177.5 103 180 105 180
                   H226 C228 180 230 177.5 230 175 C230 162 238 152 249 152 
                   C260 152 268 162 268 175 C268 177.5 270 180 272 180 
                   H280 V186 H25 Z"
                fill="#0f172a"
              />
              
              {/* Semi Truck Fuel Tanks */}
              <rect x="130" y="160" width="45" height="20" rx="6" fill="#cbd5e1" />
              <rect x="135" y="160" width="4" height="20" fill="#94a3b8" />
              <rect x="165" y="160" width="4" height="20" fill="#94a3b8" />
            </g>

            {/* ========================================================= */}
            {/* SPINNING ALLOY WHEELS (TANDEM REAR + FRONT)               */}
            {/* ========================================================= */}
            {/* Rear Axle 1 */}
            <g className="wheel-rear-1" style={{ transformOrigin: '50px 182px' }}>
              <circle cx="50" cy="182" r="17" fill="#1e293b" />
              <circle cx="50" cy="182" r="10.5" fill="#e2e8f0" />
              <line x1="50" y1="172" x2="50" y2="192" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="40" y1="182" x2="60" y2="182" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="43" y1="175" x2="57" y2="189" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <line x1="43" y1="189" x2="57" y2="175" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <circle cx="50" cy="182" r="4.5" fill="#0f172a" />
            </g>

            {/* Rear Axle 2 */}
            <g className="wheel-rear-2" style={{ transformOrigin: '85px 182px' }}>
              <circle cx="85" cy="182" r="17" fill="#1e293b" />
              <circle cx="85" cy="182" r="10.5" fill="#e2e8f0" />
              <line x1="85" y1="172" x2="85" y2="192" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="75" y1="182" x2="95" y2="182" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="78" y1="175" x2="92" y2="189" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <line x1="78" y1="189" x2="92" y2="175" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <circle cx="85" cy="182" r="4.5" fill="#0f172a" />
            </g>

            {/* Front Wheel */}
            <g className="wheel-front" style={{ transformOrigin: '249px 182px' }}>
              <circle cx="249" cy="182" r="17" fill="#1e293b" />
              <circle cx="249" cy="182" r="10.5" fill="#e2e8f0" />
              <line x1="249" y1="172" x2="249" y2="192" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="239" y1="182" x2="259" y2="182" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="242" y1="175" x2="256" y2="189" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <line x1="242" y1="189" x2="256" y2="175" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              <circle cx="249" cy="182" r="4.5" fill="#0f172a" />
            </g>
          </svg>
        </div>

        {/* 5-STEP STEPPER */}
        {showStatus && (
          <div className="mt-1 flex flex-col items-center justify-center animate-fade-in">
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
                      <div className="flex items-center justify-center h-4.5 w-4.5 rounded-full border-2 border-[#22c55e] bg-white transition-all duration-300 scale-110 shadow-xs">
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

            {/* Rotating Message */}
            <div className="h-6 flex items-center justify-center">
              <p
                key={msgIndex}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight animate-text-fade"
              >
                {HOME_MESSAGES[msgIndex]}
                <span className="text-emerald-500 text-sm">🍃</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes skylineInfiniteScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-420px, 0, 0); }
        }
        .animate-skyline-scroll {
          animation: skylineInfiniteScroll 5.6s linear infinite;
        }

        @keyframes cloudsDrift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-420px, 0, 0); }
        }
        .animate-clouds-scroll {
          animation: cloudsDrift 10s linear infinite;
        }

        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-rear-1, .wheel-rear-2, .wheel-front {
          animation: spinWheelAnim 0.42s linear infinite;
        }

        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-1.4px); }
          65% { transform: translateY(0.4px); }
        }
        .animate-truck-body {
          animation: truckBodyBounce 0.65s ease-in-out infinite;
        }

        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translateX(0); }
          50% { opacity: 0.35; transform: translateX(-4px); }
        }
        .animate-speed-lines {
          animation: speedLines 0.5s ease-in-out infinite;
        }

        @keyframes textFade {
          0% { opacity: 0; transform: translateY(3px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-3px); }
        }
        .animate-text-fade {
          animation: textFade 1.8s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
});
