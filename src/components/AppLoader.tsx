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
  'Verifying mandi rates & cold-chain stock...',
  'Loading bulk crates & staples...',
  'Routing your express store delivery...',
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

  /* ---------------------------------------------
     HOME LOADING MESSAGE ROTATION
     --------------------------------------------- */
  useEffect(() => {
    if (!showStatus || message || messages.length === 0) return;

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1250);

    return () => clearInterval(interval);
  }, [showStatus, message, messages]);

  const activeMessage =
    message || messages[msgIndex] || DEFAULT_HOME_MESSAGES[0];

  const scaleClass =
    size === 'sm'
      ? 'scale-75'
      : size === 'lg'
        ? 'scale-105'
        : 'scale-90 sm:scale-95';

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        bg-white select-none overflow-hidden
        ${
          fullScreen
            ? 'fixed inset-0 z-50 px-6'
            : 'relative w-full py-8'
        }
        ${className}
      `}
    >
      {/* =========================================================
          MAIN ILLUSTRATION
          ========================================================= */}
      <div
        className={`
          relative
          flex flex-col items-center
          justify-end
          w-[340px]
          h-[390px]
          ${scaleClass}
        `}
      >
        {/* =======================================================
            SOFT BACKGROUND GLOW
            ======================================================= */}
        <div
          className="
            absolute
            top-[65px]
            left-1/2
            -translate-x-1/2
            w-[300px]
            h-[220px]
            rounded-full
            bg-emerald-50/80
            blur-3xl
            pointer-events-none
          "
        />

        {/* =======================================================
            CLOUDS
            ======================================================= */}
        <div className="absolute top-[72px] left-[45px] opacity-70 animate-cloud-left">
          <svg width="72" height="32" viewBox="0 0 72 32">
            <path
              d="
                M8 25
                C8 18 14 13 21 13
                C24 5 31 2 38 2
                C47 2 54 8 55 16
                C62 16 67 20 67 25
                Z
              "
              fill="#e6f7f1"
            />
          </svg>
        </div>

        <div className="absolute top-[105px] right-[35px] opacity-60 animate-cloud-right">
          <svg width="64" height="28" viewBox="0 0 64 28">
            <path
              d="
                M6 22
                C6 16 12 12 18 12
                C20 5 26 2 32 2
                C40 2 45 7 47 14
                C53 14 58 17 58 22
                Z
              "
              fill="#e8f8f2"
            />
          </svg>
        </div>

        {/* =======================================================
            BIRDS
            ======================================================= */}
        <div className="absolute top-[125px] right-[72px] opacity-60">
          <svg width="40" height="24" viewBox="0 0 40 24">
            <path
              d="M4 12C8 7 12 7 16 12C20 7 24 7 28 12"
              fill="none"
              stroke="#72c9b0"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* =======================================================
            DELIVERY ROUTE
            ======================================================= */}
        <div className="absolute top-[125px] left-[70px] z-10 pointer-events-none">
          <svg
            width="220"
            height="135"
            viewBox="0 0 220 135"
            fill="none"
          >
            <path
              d="
                M20 90
                C35 35 90 15 145 42
                C175 56 195 77 190 110
              "
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="6 7"
              strokeLinecap="round"
              opacity="0.8"
              className="animate-route"
            />
          </svg>
        </div>

        {/* =======================================================
            LOCATION PIN
            ======================================================= */}
        <div className="absolute top-[130px] right-[72px] z-10 animate-pin">
          <svg
            width="36"
            height="46"
            viewBox="0 0 36 46"
            fill="none"
          >
            <path
              d="
                M18 44
                C18 44 31 29 31 17
                C31 8.7 25.2 2 18 2
                C10.8 2 5 8.7 5 17
                C5 29 18 44 18 44Z
              "
              fill="#10b981"
            />

            <circle
              cx="18"
              cy="17"
              r="6"
              fill="white"
            />
          </svg>
        </div>

        {/* =======================================================
            CITY SKYLINE
            ======================================================= */}
        <div
          className="
            absolute
            bottom-[86px]
            left-0
            w-full
            h-[150px]
            overflow-hidden
            pointer-events-none
          "
        >
          <div className="absolute inset-0 animate-city">
            <svg
              width="680"
              height="160"
              viewBox="0 0 680 160"
              fill="none"
            >
              {/* LEFT BUILDINGS */}
              <rect
                x="5"
                y="55"
                width="58"
                height="105"
                rx="3"
                fill="#edf8f5"
              />

              <rect
                x="72"
                y="78"
                width="45"
                height="82"
                rx="3"
                fill="#e3f3ef"
              />

              <rect
                x="125"
                y="35"
                width="62"
                height="125"
                rx="3"
                fill="#eaf7f3"
              />

              <rect
                x="198"
                y="65"
                width="55"
                height="95"
                rx="3"
                fill="#dff1ec"
              />

              {/* CENTER TALL BUILDING */}
              <rect
                x="265"
                y="15"
                width="70"
                height="145"
                rx="4"
                fill="#e6f5f1"
              />

              <rect
                x="283"
                y="0"
                width="34"
                height="160"
                rx="3"
                fill="#e8f6f2"
              />

              {/* RIGHT BUILDINGS */}
              <rect
                x="350"
                y="50"
                width="58"
                height="110"
                rx="3"
                fill="#e0f1ed"
              />

              <rect
                x="420"
                y="72"
                width="46"
                height="88"
                rx="3"
                fill="#edf8f5"
              />

              <rect
                x="480"
                y="38"
                width="65"
                height="122"
                rx="3"
                fill="#e3f3ef"
              />

              <rect
                x="555"
                y="65"
                width="55"
                height="95"
                rx="3"
                fill="#eaf7f3"
              />

              <rect
                x="620"
                y="25"
                width="55"
                height="135"
                rx="3"
                fill="#e1f2ed"
              />

              {/* WINDOWS */}
              <g fill="#ffffff" opacity="0.75">
                <rect x="280" y="28" width="7" height="9" rx="1" />
                <rect x="302" y="28" width="7" height="9" rx="1" />
                <rect x="280" y="47" width="7" height="9" rx="1" />
                <rect x="302" y="47" width="7" height="9" rx="1" />
                <rect x="280" y="66" width="7" height="9" rx="1" />
                <rect x="302" y="66" width="7" height="9" rx="1" />

                <rect x="495" y="55" width="7" height="9" rx="1" />
                <rect x="515" y="55" width="7" height="9" rx="1" />
                <rect x="495" y="74" width="7" height="9" rx="1" />
                <rect x="515" y="74" width="7" height="9" rx="1" />
                <rect x="495" y="93" width="7" height="9" rx="1" />
                <rect x="515" y="93" width="7" height="9" rx="1" />
              </g>
            </svg>
          </div>
        </div>

        {/* =======================================================
            GROUND SHADOW
            ======================================================= */}
        <div
          className="
            absolute
            bottom-[72px]
            left-1/2
            -translate-x-1/2
            w-[285px]
            h-[15px]
            rounded-full
            bg-slate-300/35
            blur-md
            animate-ground-shadow
          "
        />

        {/* =======================================================
            SPEED LINES BEHIND TRUCK
            ======================================================= */}
        <div className="absolute bottom-[125px] left-[20px] z-20">
          <div className="animate-speed-1 w-[75px] h-[3px] rounded-full bg-emerald-400/80 mb-3" />
          <div className="animate-speed-2 w-[105px] h-[2px] rounded-full bg-emerald-300/60 mb-3" />
          <div className="animate-speed-3 w-[55px] h-[2px] rounded-full bg-emerald-400/50" />
        </div>

        {/* =======================================================
            MOVING GROCERY TRUCK
            ======================================================= */}
        <div className="absolute bottom-[83px] left-1/2 -translate-x-1/2 z-30">
          <div className="animate-truck-drive">

            <svg
              width="285"
              height="145"
              viewBox="0 0 285 145"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="truckGreen"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0" stopColor="#20c978" />
                  <stop offset="1" stopColor="#079447" />
                </linearGradient>

                <linearGradient
                  id="truckDark"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0" stopColor="#075c38" />
                  <stop offset="1" stopColor="#023a25" />
                </linearGradient>

                <linearGradient
                  id="windowGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0" stopColor="#dffaf2" />
                  <stop offset="1" stopColor="#9bd9ca" />
                </linearGradient>

                <filter
                  id="truckShadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="5"
                    stdDeviation="4"
                    floodColor="#064e3b"
                    floodOpacity="0.20"
                  />
                </filter>
              </defs>

              <g filter="url(#truckShadow)">

                {/* ==========================================
                    TRUCK BODY
                    ========================================== */}
                <rect
                  x="20"
                  y="45"
                  width="172"
                  height="72"
                  rx="7"
                  fill="url(#truckGreen)"
                />

                {/* Cargo top edge */}
                <rect
                  x="20"
                  y="44"
                  width="172"
                  height="6"
                  rx="3"
                  fill="#078c4b"
                />

                {/* Cargo side highlight */}
                <rect
                  x="27"
                  y="52"
                  width="4"
                  height="55"
                  rx="2"
                  fill="#5ce39b"
                  opacity="0.35"
                />

                {/* Cargo subtle panels */}
                <path
                  d="M55 48V114"
                  stroke="#087c47"
                  strokeWidth="1"
                  opacity="0.35"
                />

                <path
                  d="M88 48V114"
                  stroke="#087c47"
                  strokeWidth="1"
                  opacity="0.35"
                />

                <path
                  d="M121 48V114"
                  stroke="#087c47"
                  strokeWidth="1"
                  opacity="0.35"
                />

                <path
                  d="M154 48V114"
                  stroke="#087c47"
                  strokeWidth="1"
                  opacity="0.35"
                />

                {/* ==========================================
                    CK LOGO
                    ========================================== */}
                <g transform="translate(80 66)">
                  <path
                    d="
                      M28 4
                      C17 -2 4 4 2 16
                      C0 28 9 37 20 37
                      C25 37 30 35 34 31
                    "
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />

                  <path
                    d="
                      M34 5
                      L47 18
                      L34 31
                    "
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* leaf */}
                  <path
                    d="
                      M24 43
                      C38 34 52 35 61 29
                      C54 43 40 49 24 43Z
                    "
                    fill="#b9ed38"
                  />

                  <path
                    d="M28 42C38 39 46 35 56 31"
                    stroke="#087c47"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </g>

                {/* ==========================================
                    CAB
                    ========================================== */}
                <path
                  d="
                    M192 59
                    H220
                    C227 59 233 63 237 70
                    L251 94
                    C254 100 250 108 243 108
                    H192
                    Z
                  "
                  fill="url(#truckDark)"
                />

                {/* Windshield */}
                <path
                  d="
                    M198 64
                    H218
                    C222 64 226 67 229 72
                    L239 89
                    H198
                    Z
                  "
                  fill="url(#windowGradient)"
                />

                {/* Windshield divider */}
                <path
                  d="M218 64L229 89"
                  stroke="#ffffff"
                  strokeWidth="2"
                  opacity="0.6"
                />

                {/* Driver window */}
                <path
                  d="
                    M198 64
                    H217
                    L226 89
                    H198
                    Z
                  "
                  fill="#b8eee1"
                  opacity="0.55"
                />

                {/* Door */}
                <path
                  d="M198 92V109"
                  stroke="#064b31"
                  strokeWidth="1.5"
                />

                {/* Door handle */}
                <rect
                  x="202"
                  y="95"
                  width="9"
                  height="2"
                  rx="1"
                  fill="#8ce5c4"
                />

                {/* Mirror */}
                <rect
                  x="228"
                  y="67"
                  width="7"
                  height="3"
                  rx="1"
                  fill="#064b31"
                />

                {/* Front bumper */}
                <path
                  d="
                    M240 96
                    H263
                    C267 96 270 100 270 104
                    V110
                    H239
                    Z
                  "
                  fill="#12352a"
                />

                {/* Headlight */}
                <rect
                  x="252"
                  y="96"
                  width="9"
                  height="7"
                  rx="2"
                  fill="#fff4a8"
                />

                {/* Headlight glow */}
                <path
                  d="M261 98L282 93L282 108L261 103Z"
                  fill="#fef08a"
                  opacity="0.12"
                />

                {/* ==========================================
                    ROOF GROCERY LOAD
                    ========================================== */}
                <g className="animate-grocery-bounce">

                  {/* leafy greens */}
                  <path
                    d="
                      M42 44
                      C33 38 34 27 41 25
                      C39 18 46 15 51 21
                      C55 13 63 18 62 26
                      C70 22 75 30 70 38
                      C65 44 55 46 42 44Z
                    "
                    fill="#16a34a"
                  />

                  <path
                    d="M48 42C48 31 51 24 55 19"
                    stroke="#0f7a39"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* banana */}
                  <path
                    d="
                      M61 39
                      C70 25 82 23 89 30
                      C84 43 73 48 61 39Z
                    "
                    fill="#facc15"
                  />

                  {/* red apple */}
                  <circle
                    cx="83"
                    cy="31"
                    r="10"
                    fill="#ef4444"
                  />

                  <path
                    d="M83 21C84 17 88 16 91 18"
                    stroke="#166534"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* tomato */}
                  <circle
                    cx="102"
                    cy="34"
                    r="9"
                    fill="#f97316"
                  />

                  {/* green pepper */}
                  <circle
                    cx="114"
                    cy="29"
                    r="8"
                    fill="#22c55e"
                  />

                  {/* bottle */}
                  <rect
                    x="122"
                    y="19"
                    width="12"
                    height="26"
                    rx="4"
                    fill="#38bdf8"
                  />

                  <rect
                    x="125"
                    y="15"
                    width="6"
                    height="6"
                    rx="2"
                    fill="#0ea5e9"
                  />

                  {/* grocery box */}
                  <path
                    d="M138 27L159 27L163 43L140 43Z"
                    fill="#f59e0b"
                  />

                  <path
                    d="M141 28L158 28"
                    stroke="#92400e"
                    strokeWidth="2"
                  />

                  {/* rice/flour bag */}
                  <path
                    d="
                      M164 20
                      L184 20
                      L188 44
                      L160 44
                      Z
                    "
                    fill="#f8fafc"
                  />

                  <path
                    d="M164 25H185"
                    stroke="#d6d3d1"
                    strokeWidth="2"
                  />

                  <circle
                    cx="174"
                    cy="34"
                    r="5"
                    fill="#fde68a"
                  />
                </g>

                {/* cargo bottom highlight */}
                <rect
                  x="20"
                  y="113"
                  width="172"
                  height="5"
                  rx="2"
                  fill="#087a46"
                />

                {/* ==========================================
                    UNDERCARRIAGE
                    ========================================== */}
                <rect
                  x="15"
                  y="116"
                  width="250"
                  height="7"
                  rx="3"
                  fill="#0f172a"
                />

                {/* ==========================================
                    REAR LIGHT
                    ========================================== */}
                <rect
                  x="17"
                  y="96"
                  width="5"
                  height="10"
                  rx="1"
                  fill="#fb7185"
                />

                {/* ==========================================
                    WHEELS
                    ========================================== */}
                <g className="animate-wheel">
                  <circle
                    cx="65"
                    cy="118"
                    r="21"
                    fill="#172033"
                  />

                  <circle
                    cx="65"
                    cy="118"
                    r="13"
                    fill="#d9f99d"
                  />

                  <circle
                    cx="65"
                    cy="118"
                    r="9"
                    fill="#22c55e"
                  />

                  <circle
                    cx="65"
                    cy="118"
                    r="4"
                    fill="#f8fafc"
                  />

                  <path
                    d="M65 108V128M55 118H75"
                    stroke="#a3e635"
                    strokeWidth="2"
                  />
                </g>

                <g className="animate-wheel">
                  <circle
                    cx="218"
                    cy="118"
                    r="21"
                    fill="#172033"
                  />

                  <circle
                    cx="218"
                    cy="118"
                    r="13"
                    fill="#d9f99d"
                  />

                  <circle
                    cx="218"
                    cy="118"
                    r="9"
                    fill="#22c55e"
                  />

                  <circle
                    cx="218"
                    cy="118"
                    r="4"
                    fill="#f8fafc"
                  />

                  <path
                    d="M218 108V128M208 118H228"
                    stroke="#a3e635"
                    strokeWidth="2"
                  />
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* =======================================================
            ROAD
            ======================================================= */}
        <div className="absolute bottom-[63px] left-0 w-full z-40">

          {/* road shadow/top edge */}
          <div className="h-[3px] w-full bg-slate-400/60 rounded-full" />

          {/* asphalt */}
          <div className="relative h-[17px] w-full bg-slate-800 overflow-hidden rounded-sm">

            <div className="absolute inset-0 flex items-center animate-road">
              <div
                className="
                  shrink-0
                  w-[760px]
                  h-[3px]
                  opacity-90
                  bg-[repeating-linear-gradient(
                    90deg,
                    white 0px,
                    white 22px,
                    transparent 22px,
                    transparent 48px
                  )]
                "
              />
            </div>

          </div>

          {/* bottom edge */}
          <div className="h-[2px] w-full bg-slate-950 rounded-b-sm" />
        </div>

        {/* =======================================================
            SMALL FLOATING LEAVES
            ======================================================= */}
        <div className="absolute bottom-[178px] left-[45px] z-40 animate-leaf-one">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              d="
                M3 15
                C3 7 8 2 16 2
                C16 10 11 15 3 15Z
              "
              fill="#34d399"
            />
            <path
              d="M4 14C8 10 11 7 15 4"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="absolute bottom-[190px] left-[25px] z-40 animate-leaf-two">
          <svg width="13" height="13" viewBox="0 0 13 13">
            <path
              d="
                M2 11
                C2 5 6 2 11 2
                C11 7 7 11 2 11Z
              "
              fill="#6ee7b7"
            />
          </svg>
        </div>
      </div>

      {/* =========================================================
          HOME-ONLY STATUS
          ========================================================= */}
      {showStatus && (
        <div
          className="
            mt-1
            flex
            flex-col
            items-center
            text-center
            max-w-[330px]
            animate-status-in
          "
        >
          {/* Progress dots */}
          <div className="flex items-center gap-3 mb-5">

            <span className="relative flex h-3 w-3">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
              <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
            </span>

            <span className="h-[3px] w-10 rounded-full bg-emerald-500" />

            <span className="relative flex h-3 w-3">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
              <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
            </span>

            <span className="h-[3px] w-10 rounded-full bg-emerald-500" />

            <span className="relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </span>

            <span className="h-[3px] w-10 rounded-full bg-slate-200" />

            <span className="h-3 w-3 rounded-full bg-slate-200" />

            <span className="h-[3px] w-10 rounded-full bg-slate-200" />

            <span className="h-3 w-3 rounded-full bg-slate-200" />

          </div>

          {/* Current status */}
          <div
            className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              bg-emerald-50
              border
              border-emerald-100
              shadow-sm
            "
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-600" />
            </span>

            <p className="text-[12px] font-bold text-emerald-950 tracking-tight">
              {activeMessage}
            </p>
          </div>

          <p className="mt-2 text-[11px] font-medium text-slate-400">
            {subtext}
          </p>
        </div>
      )}

      {/* =========================================================
          ANIMATIONS
          ========================================================= */}
      <style>{`

        /* ---------------------------------------------------------
           TRUCK MOVEMENT
           --------------------------------------------------------- */

        @keyframes truckDrive {
          0%, 100% {
            transform: translate3d(-13px, 0, 0);
          }

          50% {
            transform: translate3d(13px, 0, 0);
          }
        }

        .animate-truck-drive {
          animation: truckDrive 1.8s ease-in-out infinite;
          will-change: transform;
        }


        /* ---------------------------------------------------------
           WHEELS
           --------------------------------------------------------- */

        @keyframes wheelSpin {
          from {
            transform: rotate(0deg);
            transform-origin: center;
          }

          to {
            transform: rotate(360deg);
            transform-origin: center;
          }
        }

        .animate-wheel {
          animation: wheelSpin 0.42s linear infinite;
        }


        /* ---------------------------------------------------------
           CITY PARALLAX
           --------------------------------------------------------- */

        @keyframes cityMove {
          0% {
            transform: translate3d(0, 0, 0);
          }

          100% {
            transform: translate3d(-340px, 0, 0);
          }
        }

        .animate-city {
          animation: cityMove 5s linear infinite;
          will-change: transform;
        }


        /* ---------------------------------------------------------
           ROAD MOVEMENT
           --------------------------------------------------------- */

        @keyframes roadMove {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-48px, 0, 0);
          }
        }

        .animate-road {
          animation: roadMove 0.42s linear infinite;
          will-change: transform;
        }


        /* ---------------------------------------------------------
           GROCERY BOUNCE
           --------------------------------------------------------- */

        @keyframes groceryBounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-2px) rotate(-0.5deg);
          }
        }

        .animate-grocery-bounce {
          transform-origin: bottom center;
          animation: groceryBounce 0.65s ease-in-out infinite;
        }


        /* ---------------------------------------------------------
           GROUND SHADOW
           --------------------------------------------------------- */

        @keyframes groundShadow {
          0%, 100% {
            transform: translateX(-50%) scaleX(1);
            opacity: 0.32;
          }

          50% {
            transform: translateX(-50%) scaleX(0.9);
            opacity: 0.2;
          }
        }

        .animate-ground-shadow {
          animation: groundShadow 0.65s ease-in-out infinite;
        }


        /* ---------------------------------------------------------
           SPEED LINES
           --------------------------------------------------------- */

        @keyframes speedOne {
          0% {
            transform: translateX(30px);
            opacity: 0;
          }

          30% {
            opacity: 1;
          }

          100% {
            transform: translateX(-55px);
            opacity: 0;
          }
        }

        .animate-speed-1 {
          animation: speedOne 0.75s ease-out infinite;
        }


        @keyframes speedTwo {
          0% {
            transform: translateX(45px);
            opacity: 0;
          }

          35% {
            opacity: 0.8;
          }

          100% {
            transform: translateX(-75px);
            opacity: 0;
          }
        }

        .animate-speed-2 {
          animation: speedTwo 0.9s ease-out infinite 0.15s;
        }


        @keyframes speedThree {
          0% {
            transform: translateX(25px);
            opacity: 0;
          }

          35% {
            opacity: 0.7;
          }

          100% {
            transform: translateX(-65px);
            opacity: 0;
          }
        }

        .animate-speed-3 {
          animation: speedThree 0.8s ease-out infinite 0.3s;
        }


        /* ---------------------------------------------------------
           ROUTE
           --------------------------------------------------------- */

        @keyframes routeMove {
          0% {
            stroke-dashoffset: 0;
          }

          100% {
            stroke-dashoffset: -40;
          }
        }

        .animate-route {
          animation: routeMove 1.6s linear infinite;
        }


        /* ---------------------------------------------------------
           LOCATION PIN
           --------------------------------------------------------- */

        @keyframes pinBounce {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        .animate-pin {
          animation: pinBounce 1.5s ease-in-out infinite;
        }


        /* ---------------------------------------------------------
           CLOUDS
           --------------------------------------------------------- */

        @keyframes cloudLeft {
          0%, 100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(8px);
          }
        }

        .animate-cloud-left {
          animation: cloudLeft 5s ease-in-out infinite;
        }


        @keyframes cloudRight {
          0%, 100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(-10px);
          }
        }

        .animate-cloud-right {
          animation: cloudRight 6s ease-in-out infinite;
        }


        /* ---------------------------------------------------------
           FLOATING LEAVES
           --------------------------------------------------------- */

        @keyframes leafOne {
          0% {
            transform: translate3d(20px, 0, 0) rotate(0deg);
            opacity: 0;
          }

          30% {
            opacity: 0.9;
          }

          100% {
            transform: translate3d(-45px, -15px, 0) rotate(-70deg);
            opacity: 0;
          }
        }

        .animate-leaf-one {
          animation: leafOne 1.2s ease-out infinite;
        }


        @keyframes leafTwo {
          0% {
            transform: translate3d(15px, 0, 0) rotate(0deg);
            opacity: 0;
          }

          35% {
            opacity: 0.8;
          }

          100% {
            transform: translate3d(-40px, -10px, 0) rotate(80deg);
            opacity: 0;
          }
        }

        .animate-leaf-two {
          animation: leafTwo 1.5s ease-out infinite 0.4s;
        }


        /* ---------------------------------------------------------
           STATUS FADE
           --------------------------------------------------------- */

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
          animation: statusIn 0.3s ease-out forwards;
        }


        /* ---------------------------------------------------------
           ACCESSIBILITY
           --------------------------------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .animate-truck-drive,
          .animate-wheel,
          .animate-city,
          .animate-road,
          .animate-grocery-bounce,
          .animate-ground-shadow,
          .animate-speed-1,
          .animate-speed-2,
          .animate-speed-3,
          .animate-route,
          .animate-pin,
          .animate-cloud-left,
          .animate-cloud-right,
          .animate-leaf-one,
          .animate-leaf-two {
            animation: none !important;
          }
        }

      `}</style>
    </div>
  );
});