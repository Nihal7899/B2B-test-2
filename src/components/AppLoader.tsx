import React, { useEffect, useState } from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  message?: string;
  subtext?: string;
  messages?: string[];
  className?: string;
}

const DEFAULT_HOME_MESSAGES = [
  'Dispatching wholesale catalog...',
  'Checking fresh grocery stock...',
  'Loading bulk crates & staples...',
  'Routing your store delivery...',
];

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  showStatus = false,
  message,
  subtext = 'Direct from farms & verified wholesale brands',
  messages = DEFAULT_HOME_MESSAGES,
  className = '',
}: AppLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!showStatus || message || messages.length <= 1) return;

    const interval = window.setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => window.clearInterval(interval);
  }, [showStatus, message, messages]);

  const activeMessage =
    message || messages[msgIndex] || DEFAULT_HOME_MESSAGES[0];

  const scaleClass =
    size === 'sm'
      ? 'scale-[0.72]'
      : size === 'lg'
        ? 'scale-[1.08]'
        : 'scale-[0.92] sm:scale-[0.98]';

  return (
    <div
      className={[
        'flex flex-col items-center justify-center',
        'bg-white select-none overflow-hidden',
        fullScreen
          ? 'fixed inset-0 z-50 px-4 animate-loader-fade'
          : 'relative w-full py-8',
        className,
      ].join(' ')}
    >
      {/* =========================================================
          MAIN ILLUSTRATION
         ========================================================= */}

      <div
        className={[
          'relative flex flex-col items-center justify-end',
          'w-[340px] h-[250px]',
          'overflow-visible',
          scaleClass,
        ].join(' ')}
      >
        {/* Soft ambient grocery-green glow */}
        <div
          className="
            absolute
            left-1/2 top-[48px]
            -translate-x-1/2
            w-[245px] h-[155px]
            rounded-full
            bg-emerald-100/45
            blur-3xl
            pointer-events-none
          "
        />

        {/* =====================================================
            BACKGROUND CLOUDS
           ===================================================== */}

        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute left-[45px] top-[55px] animate-cloud-one">
            <svg width="70" height="30" viewBox="0 0 70 30">
              <path
                d="
                  M8 23
                  C8 16 13 11 20 11
                  C23 5 29 2 36 4
                  C43 4 48 9 50 15
                  C58 14 64 18 64 23
                  Z
                "
                fill="#ecfdf5"
              />
            </svg>
          </div>

          <div className="absolute right-[48px] top-[75px] animate-cloud-two">
            <svg width="58" height="25" viewBox="0 0 58 25">
              <path
                d="
                  M6 19
                  C6 13 11 9 17 9
                  C20 4 25 2 31 4
                  C37 4 41 8 43 13
                  C50 12 54 15 54 19
                  Z
                "
                fill="#f0fdf4"
              />
            </svg>
          </div>
        </div>

        {/* =====================================================
            MOVING CITY / BUILDINGS
           ===================================================== */}

        <div
          className="
            absolute
            left-0
            bottom-[48px]
            w-full
            h-[125px]
            overflow-hidden
            pointer-events-none
            z-0
          "
        >
          <div className="city-track flex h-full w-[680px]">
            <CitySegment />
            <CitySegment />
          </div>
        </div>

        {/* =====================================================
            MOTION PARTICLES
           ===================================================== */}

        <div className="absolute left-[42px] top-[116px] z-10 pointer-events-none animate-particle-one">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              d="M9 1C5 4 3 7 4 11C5 15 9 17 12 14C15 11 14 6 9 1Z"
              fill="#34d399"
              opacity="0.75"
            />
            <path
              d="M5 13C8 10 10 7 12 4"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="absolute left-[67px] top-[145px] z-10 pointer-events-none animate-particle-two">
          <svg width="13" height="13" viewBox="0 0 13 13">
            <path
              d="M6.5 1C3.5 3 2 5 2.5 8C3 11 6 12 8 10C10 8 10 4 6.5 1Z"
              fill="#6ee7b7"
              opacity="0.8"
            />
          </svg>
        </div>

        <div className="absolute left-[88px] top-[128px] z-10 pointer-events-none animate-particle-three">
          <svg width="15" height="15" viewBox="0 0 15 15">
            <circle cx="7.5" cy="7.5" r="6" fill="#fbbf24" opacity="0.9" />
            <path
              d="M7.5 2V13M2 7.5H13"
              stroke="#fff7ed"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* =====================================================
            DASHED DELIVERY ROUTE
           ===================================================== */}

        <div className="absolute right-[72px] top-[88px] z-[2] pointer-events-none opacity-70">
          <svg
            width="105"
            height="75"
            viewBox="0 0 105 75"
            fill="none"
          >
            <path
              d="M5 67C20 32 55 12 100 12"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeDasharray="7 7"
              strokeLinecap="round"
              className="animate-route"
            />
          </svg>
        </div>

        {/* =====================================================
            GROCERY TRUCK
           ===================================================== */}

        <div className="absolute left-1/2 bottom-[55px] -translate-x-1/2 z-20 w-[310px]">
          <svg
            viewBox="0 0 310 145"
            width="310"
            height="145"
            className="w-full h-auto overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Main cargo gradient */}
              <linearGradient
                id="cargoGreen"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#20c77a" />
                <stop offset="100%" stopColor="#07945a" />
              </linearGradient>

              <linearGradient
                id="cargoSide"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#24c982" />
                <stop offset="100%" stopColor="#07965c" />
              </linearGradient>

              <linearGradient
                id="cabGreen"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#087d51" />
                <stop offset="100%" stopColor="#034d37" />
              </linearGradient>

              <linearGradient
                id="window"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#d9fff0" />
                <stop offset="100%" stopColor="#8fe8c4" />
              </linearGradient>

              <linearGradient
                id="wheelGreen"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#b7f34a" />
                <stop offset="100%" stopColor="#55c82c" />
              </linearGradient>

              <filter id="truckShadow">
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="4"
                  floodColor="#064e3b"
                  floodOpacity="0.18"
                />
              </filter>

              <clipPath id="cargoClip">
                <rect
                  x="25"
                  y="27"
                  width="174"
                  height="76"
                  rx="4"
                />
              </clipPath>
            </defs>

            {/* =================================================
                TRUCK BODY
               ================================================= */}

            <g
              className="animate-truck-body"
              filter="url(#truckShadow)"
            >
              {/* ---------------------------------------------
                  CARGO BOX
                 --------------------------------------------- */}

              <rect
                x="25"
                y="27"
                width="174"
                height="76"
                rx="5"
                fill="url(#cargoGreen)"
              />

              {/* Cargo top rim */}
              <rect
                x="25"
                y="25"
                width="174"
                height="7"
                rx="3"
                fill="#087f50"
              />

              <rect
                x="31"
                y="26"
                width="162"
                height="2"
                rx="1"
                fill="#65e6b0"
                opacity="0.65"
              />

              {/* ---------------------------------------------
                  GROCERY INSIDE CARGO
                  Items are behind the cargo opening.
                 --------------------------------------------- */}

              <g clipPath="url(#cargoClip)">
                {/* dark interior */}
                <rect
                  x="38"
                  y="45"
                  width="143"
                  height="52"
                  rx="3"
                  fill="#04734a"
                  opacity="0.42"
                />

                {/* rice / flour bags */}
                <path
                  d="M51 50L69 50L72 92L48 92Z"
                  fill="#fef3c7"
                />
                <path
                  d="M55 57H67"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />

                <path
                  d="M75 53L92 53L94 92L72 92Z"
                  fill="#fff7ed"
                />
                <path
                  d="M77 60H90"
                  stroke="#f97316"
                  strokeWidth="2"
                />

                {/* green vegetable crate */}
                <rect
                  x="98"
                  y="67"
                  width="31"
                  height="28"
                  rx="2"
                  fill="#14532d"
                />

                <circle
                  cx="106"
                  cy="66"
                  r="7"
                  fill="#ef4444"
                />
                <circle
                  cx="117"
                  cy="64"
                  r="7"
                  fill="#f97316"
                />
                <circle
                  cx="125"
                  cy="68"
                  r="6"
                  fill="#22c55e"
                />

                {/* milk bottles */}
                <path
                  d="
                    M136 56
                    L140 56
                    L140 51
                    L145 51
                    L145 56
                    L149 56
                    L150 92
                    L136 92
                    Z
                  "
                  fill="#dbeafe"
                />

                <path
                  d="
                    M153 58
                    L157 58
                    L157 53
                    L162 53
                    L162 58
                    L166 58
                    L167 92
                    L153 92
                    Z
                  "
                  fill="#f8fafc"
                />

                {/* small grocery boxes */}
                <rect
                  x="171"
                  y="62"
                  width="17"
                  height="31"
                  rx="2"
                  fill="#fbbf24"
                />

                <rect
                  x="173"
                  y="66"
                  width="13"
                  height="4"
                  rx="1"
                  fill="#fff7ed"
                />

                {/* leafy vegetables */}
                <ellipse
                  cx="43"
                  cy="72"
                  rx="9"
                  ry="17"
                  fill="#16a34a"
                />
                <ellipse
                  cx="49"
                  cy="65"
                  rx="8"
                  ry="15"
                  fill="#22c55e"
                />
                <ellipse
                  cx="57"
                  cy="69"
                  rx="7"
                  ry="13"
                  fill="#15803d"
                />
              </g>

              {/* Vertical cargo panel lines */}
              <path
                d="M55 33V101M84 33V101M113 33V101M142 33V101M171 33V101"
                stroke="#047c4d"
                strokeWidth="1"
                opacity="0.5"
              />

              {/* Cargo bottom highlight */}
              <rect
                x="25"
                y="99"
                width="174"
                height="5"
                rx="1"
                fill="#047c4d"
              />

              <rect
                x="31"
                y="99"
                width="162"
                height="1.5"
                fill="#66e7b2"
                opacity="0.7"
              />

              {/* ---------------------------------------------
                  CENTER BRAND MARK
                 --------------------------------------------- */}

              <g transform="translate(89 49)">
                <circle
                  cx="26"
                  cy="25"
                  r="24"
                  fill="#ffffff"
                  opacity="0.08"
                />

                {/* simplified fresh/grocery logo */}
                <path
                  d="
                    M33 8
                    C24 2 12 5 7 14
                    C2 23 5 35 14 40
                    C22 45 32 43 38 36
                  "
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />

                <path
                  d="M30 12L43 24L30 36"
                  stroke="white"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* fresh leaf */}
                <path
                  d="
                    M30 42
                    C38 40 45 37 51 32
                    C48 41 40 47 30 48
                    Z
                  "
                  fill="#bef264"
                />
              </g>

              {/* ---------------------------------------------
                  CAB
                 --------------------------------------------- */}

              <path
                d="
                  M199 45
                  H235
                  C244 45 251 49 256 57
                  L271 84
                  C274 89 272 101 265 103
                  H199
                  Z
                "
                fill="url(#cabGreen)"
              />

              {/* Cab window */}
              <path
                d="
                  M207 50
                  H232
                  C238 50 243 53 246 59
                  L255 74
                  H207
                  Z
                "
                fill="url(#window)"
              />

              {/* Window divider */}
              <path
                d="M235 51L243 74"
                stroke="#ffffff"
                strokeWidth="2"
                opacity="0.65"
              />

              {/* Window reflection */}
              <path
                d="M214 53H228"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* Cab lower section */}
              <path
                d="
                  M207 76
                  H258
                  L269 96
                  H207
                  Z
                "
                fill="#034b36"
              />

              {/* Door line */}
              <path
                d="M208 75V99"
                stroke="#0b6949"
                strokeWidth="1.5"
              />

              {/* Door handle */}
              <rect
                x="231"
                y="82"
                width="12"
                height="2"
                rx="1"
                fill="#67e8b5"
              />

              {/* Side mirror */}
              <path
                d="M249 54H257"
                stroke="#064e3b"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <rect
                x="254"
                y="51"
                width="7"
                height="5"
                rx="2"
                fill="#475569"
              />

              {/* Front bumper */}
              <path
                d="M261 95H283C286 95 288 98 288 101V104H258Z"
                fill="#172033"
              />

              {/* Headlight */}
              <rect
                x="269"
                y="88"
                width="10"
                height="7"
                rx="2"
                fill="#fef08a"
              />

              {/* Tail light */}
              <rect
                x="21"
                y="82"
                width="6"
                height="14"
                rx="2"
                fill="#fb7185"
              />

              {/* ---------------------------------------------
                  UNDERCARRIAGE
                 --------------------------------------------- */}

              <path
                d="
                  M29 102
                  H285
                  V108
                  H29
                  Z
                "
                fill="#172033"
              />

              {/* Small mudguard */}
              <path
                d="
                  M39 104
                  C39 89 48 81 60 81
                  C72 81 81 89 81 104
                "
                fill="#064e3b"
              />

              <path
                d="
                  M218 104
                  C218 89 227 81 239 81
                  C251 81 260 89 260 104
                "
                fill="#064e3b"
              />

              {/* small delivery box under body */}
              <rect
                x="151"
                y="92"
                width="13"
                height="13"
                rx="2"
                fill="#f59e0b"
              />

              <rect
                x="154"
                y="89"
                width="7"
                height="4"
                rx="1"
                fill="#b45309"
              />

              {/* tiny green accent */}
              <circle
                cx="157"
                cy="98"
                r="2"
                fill="#fef3c7"
              />
            </g>

            {/* =================================================
                WHEELS
                IMPORTANT: wheels are separate from suspension
                so they remain planted and never fly.
               ================================================= */}

            <g className="animate-wheel">
              <circle
                cx="60"
                cy="106"
                r="18"
                fill="#172033"
              />

              <circle
                cx="60"
                cy="106"
                r="11"
                fill="url(#wheelGreen)"
              />

              <circle
                cx="60"
                cy="106"
                r="7"
                fill="#f8fafc"
              />

              <path
                d="M60 99V113M53 106H67"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle
                cx="60"
                cy="106"
                r="3"
                fill="#334155"
              />
            </g>

            <g className="animate-wheel">
              <circle
                cx="239"
                cy="106"
                r="18"
                fill="#172033"
              />

              <circle
                cx="239"
                cy="106"
                r="11"
                fill="url(#wheelGreen)"
              />

              <circle
                cx="239"
                cy="106"
                r="7"
                fill="#f8fafc"
              />

              <path
                d="M239 99V113M232 106H246"
                stroke="#16a34a"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle
                cx="239"
                cy="106"
                r="3"
                fill="#334155"
              />
            </g>
          </svg>
        </div>

        {/* =====================================================
            ROAD
           ===================================================== */}

        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            bottom-[39px]
            w-[310px]
            z-30
          "
        >
          {/* contact line */}
          <div className="h-[3px] w-full rounded-full bg-slate-500" />

          {/* asphalt */}
          <div
            className="
              relative
              h-[17px]
              w-full
              overflow-hidden
              rounded-b-sm
              bg-slate-800
              shadow-[0_4px_10px_rgba(15,23,42,0.12)]
            "
          >
            <div
              className="
                absolute
                top-[7px]
                left-0
                h-[3px]
                w-[500px]
                road-lines
                opacity-90
              "
            />
          </div>

          {/* road bottom */}
          <div className="h-[3px] w-full bg-slate-950 rounded-b-md" />
        </div>

        {/* =====================================================
            CONTACT SHADOW
           ===================================================== */}

        <div
          className="
            absolute
            bottom-[48px]
            left-1/2
            -translate-x-1/2
            w-[245px]
            h-[10px]
            rounded-full
            bg-slate-500/20
            blur-md
            z-10
            animate-ground-shadow
          "
        />
      </div>

      {/* =========================================================
          HOME STATUS ONLY
         ========================================================= */}

      {showStatus && (
        <div
          className="
            mt-1
            flex
            flex-col
            items-center
            text-center
            max-w-[310px]
            animate-status-in
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              px-3.5
              py-1.5
              rounded-full
              bg-emerald-50
              border
              border-emerald-200/70
              shadow-sm
            "
          >
            <span className="relative flex h-2 w-2">
              <span
                className="
                  absolute
                  inline-flex
                  h-full
                  w-full
                  rounded-full
                  bg-emerald-400
                  opacity-70
                  animate-ping
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  h-2
                  w-2
                  rounded-full
                  bg-emerald-600
                "
              />
            </span>

            <p
              key={activeMessage}
              className="
                text-[11px]
                sm:text-xs
                font-bold
                text-emerald-950
                tracking-tight
                whitespace-nowrap
                animate-message
              "
            >
              {activeMessage}
            </p>
          </div>

          <p
            className="
              mt-2
              text-[10px]
              sm:text-[11px]
              font-medium
              text-slate-400
            "
          >
            {subtext}
          </p>
        </div>
      )}

      {/* =========================================================
          ANIMATIONS
         ========================================================= */}

      <style>{`
        /* -------------------------------------------------------
           Loader entrance
        ------------------------------------------------------- */

        @keyframes loaderFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .animate-loader-fade {
          animation: loaderFade 0.2s ease-out both;
        }

        /* -------------------------------------------------------
           Buildings move backward
        ------------------------------------------------------- */

        @keyframes cityScroll {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-340px, 0, 0);
          }
        }

        .city-track {
          animation: cityScroll 7s linear infinite;
          will-change: transform;
        }

        /* -------------------------------------------------------
           Clouds
        ------------------------------------------------------- */

        @keyframes cloudOne {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.75;
          }

          50% {
            transform: translateX(8px);
            opacity: 0.9;
          }
        }

        .animate-cloud-one {
          animation: cloudOne 5s ease-in-out infinite;
        }

        @keyframes cloudTwo {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.65;
          }

          50% {
            transform: translateX(-7px);
            opacity: 0.85;
          }
        }

        .animate-cloud-two {
          animation: cloudTwo 6s ease-in-out infinite;
        }

        /* -------------------------------------------------------
           Truck body suspension
           Wheels are NOT inside this group.
        ------------------------------------------------------- */

        @keyframes truckBody {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }

          25% {
            transform: translateY(-1px) rotate(-0.15deg);
          }

          50% {
            transform: translateY(0.6px) rotate(0.08deg);
          }

          75% {
            transform: translateY(-0.7px) rotate(-0.08deg);
          }
        }

        .animate-truck-body {
          transform-box: fill-box;
          transform-origin: center bottom;
          animation: truckBody 0.7s ease-in-out infinite;
        }

        /* -------------------------------------------------------
           Wheels rotate in place.
           Their centres are fixed on the same road level.
        ------------------------------------------------------- */

        @keyframes wheelSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .animate-wheel {
          transform-box: fill-box;
          transform-origin: center;
          animation: wheelSpin 0.55s linear infinite;
        }

        /* -------------------------------------------------------
           Road speed
        ------------------------------------------------------- */

        .road-lines {
          background-image: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.95) 0px,
            rgba(255,255,255,0.95) 22px,
            transparent 22px,
            transparent 48px
          );

          animation: roadMove 0.42s linear infinite;
        }

        @keyframes roadMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-48px);
          }
        }

        /* -------------------------------------------------------
           Delivery route
        ------------------------------------------------------- */

        @keyframes routeMove {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -28;
          }
        }

        .animate-route {
          animation: routeMove 1.4s linear infinite;
        }

        /* -------------------------------------------------------
           Grocery motion particles
        ------------------------------------------------------- */

        @keyframes particleOne {
          0% {
            transform: translate3d(25px, 0, 0) scale(0.4) rotate(0deg);
            opacity: 0;
          }

          25% {
            opacity: 0.9;
          }

          100% {
            transform: translate3d(-38px, 13px, 0) scale(1) rotate(-80deg);
            opacity: 0;
          }
        }

        .animate-particle-one {
          animation: particleOne 1.25s ease-out infinite;
        }

        @keyframes particleTwo {
          0% {
            transform: translate3d(18px, 0, 0) scale(0.4);
            opacity: 0;
          }

          30% {
            opacity: 0.8;
          }

          100% {
            transform: translate3d(-32px, 8px, 0) scale(0.9);
            opacity: 0;
          }
        }

        .animate-particle-two {
          animation: particleTwo 1.45s ease-out infinite 0.35s;
        }

        @keyframes particleThree {
          0% {
            transform: translate3d(20px, 0, 0) scale(0.5) rotate(0deg);
            opacity: 0;
          }

          30% {
            opacity: 0.9;
          }

          100% {
            transform: translate3d(-35px, 15px, 0) scale(0.9) rotate(180deg);
            opacity: 0;
          }
        }

        .animate-particle-three {
          animation: particleThree 1.35s ease-out infinite 0.2s;
        }

        /* -------------------------------------------------------
           Ground shadow
        ------------------------------------------------------- */

        @keyframes groundShadow {
          0%, 100% {
            transform: translateX(-50%) scaleX(1);
            opacity: 0.24;
          }

          50% {
            transform: translateX(-50%) scaleX(0.94);
            opacity: 0.16;
          }
        }

        .animate-ground-shadow {
          animation: groundShadow 0.7s ease-in-out infinite;
        }

        /* -------------------------------------------------------
           Status
        ------------------------------------------------------- */

        @keyframes statusIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-status-in {
          animation: statusIn 0.25s ease-out both;
        }

        @keyframes messageIn {
          from {
            opacity: 0;
            transform: translateY(3px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-message {
          animation: messageIn 0.25s ease-out both;
        }

        /* Respect reduced-motion settings */
        @media (prefers-reduced-motion: reduce) {
          .city-track,
          .animate-cloud-one,
          .animate-cloud-two,
          .animate-truck-body,
          .animate-wheel,
          .road-lines,
          .animate-route,
          .animate-particle-one,
          .animate-particle-two,
          .animate-particle-three,
          .animate-ground-shadow {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});


/* =============================================================
   REPEATING CITY SEGMENT
   ============================================================= */

function CitySegment() {
  return (
    <svg
      viewBox="0 0 340 125"
      width="340"
      height="125"
      className="shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* far buildings */}

      <rect
        x="5"
        y="35"
        width="38"
        height="90"
        rx="2"
        fill="#f1f8f5"
      />

      <rect
        x="50"
        y="18"
        width="46"
        height="107"
        rx="2"
        fill="#e9f5f0"
      />

      <rect
        x="104"
        y="48"
        width="35"
        height="77"
        rx="2"
        fill="#f1f8f5"
      />

      <rect
        x="147"
        y="27"
        width="50"
        height="98"
        rx="2"
        fill="#e5f2ed"
      />

      <rect
        x="207"
        y="42"
        width="40"
        height="83"
        rx="2"
        fill="#f1f8f5"
      />

      <rect
        x="257"
        y="13"
        width="48"
        height="112"
        rx="2"
        fill="#e7f3ee"
      />

      <rect
        x="313"
        y="51"
        width="27"
        height="74"
        rx="2"
        fill="#f1f8f5"
      />

      {/* windows */}

      <g
        fill="#ffffff"
        opacity="0.8"
      >
        <rect x="59" y="29" width="7" height="8" rx="1" />
        <rect x="77" y="29" width="7" height="8" rx="1" />

        <rect x="59" y="45" width="7" height="8" rx="1" />
        <rect x="77" y="45" width="7" height="8" rx="1" />

        <rect x="158" y="38" width="8" height="8" rx="1" />
        <rect x="178" y="38" width="8" height="8" rx="1" />

        <rect x="158" y="54" width="8" height="8" rx="1" />
        <rect x="178" y="54" width="8" height="8" rx="1" />

        <rect x="268" y="25" width="8" height="8" rx="1" />
        <rect x="288" y="25" width="8" height="8" rx="1" />

        <rect x="268" y="41" width="8" height="8" rx="1" />
        <rect x="288" y="41" width="8" height="8" rx="1" />
      </g>

      {/* subtle trees */}

      <path
        d="
          M28 102
          C18 95 18 82 28 78
          C26 68 36 62 43 70
          C50 63 61 70 57 80
          C68 84 65 98 55 102
          Z
        "
        fill="#d9f7e9"
      />

      <rect
        x="40"
        y="96"
        width="4"
        height="29"
        fill="#d1e9df"
      />

      <path
        d="
          M230 105
          C221 98 222 87 231 83
          C228 75 237 68 244 75
          C251 68 261 75 257 84
          C267 88 264 100 255 105
          Z
        "
        fill="#dff8eb"
      />

      <rect
        x="241"
        y="99"
        width="4"
        height="26"
        fill="#d1e9df"
      />
    </svg>
  );
}