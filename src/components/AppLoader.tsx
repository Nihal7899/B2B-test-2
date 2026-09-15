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
    size === 'sm'
      ? 'scale-75'
      : size === 'lg'
        ? 'scale-105'
        : 'scale-95 sm:scale-100';

  const progressPercent =
    (msgIndex / (HOME_MESSAGES.length - 1)) * 100;

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 animate-fade-in px-4'
          : 'w-full py-8'
      } ${className}`}
    >
      <div
        className={`relative flex flex-col items-center justify-center ${scaleClass}`}
      >
        {/* ============================================================
            MAIN LOADING STAGE
        ============================================================ */}
        <div className="relative w-[370px] h-[300px] max-w-[100vw] overflow-hidden">

          {/* ============================================================
              BACKGROUND — SKY
          ============================================================ */}
          <svg
            viewBox="0 0 740 300"
            className="absolute inset-0 w-[740px] h-full z-0 animate-loader-background"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="skyGradientA"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="72%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f5fbf7" />
              </linearGradient>

              <linearGradient
                id="buildingFadeA"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#e9f5ed" />
                <stop offset="100%" stopColor="#d7ebe0" />
              </linearGradient>
            </defs>

            <rect
              width="740"
              height="300"
              fill="url(#skyGradientA)"
            />

            {/* --------------------------------------------------------
                SOFT CLOUDS
            -------------------------------------------------------- */}
            <g opacity="0.75">

              <g transform="translate(58 38)">
                <path
                  d="M0 17C0 11 5 7 11 7C13 7 15 7.5 17 9C19 4 24 1 30 1C38 1 44 7 44 15C48 15 51 18 51 21C51 24 48 27 44 27H7C3 27 0 23 0 17Z"
                  fill="#e4f1e9"
                />
              </g>

              <g transform="translate(280 30) scale(.85)">
                <path
                  d="M0 17C0 11 5 7 11 7C13 7 15 7.5 17 9C19 4 24 1 30 1C38 1 44 7 44 15C48 15 51 18 51 21C51 24 48 27 44 27H7C3 27 0 23 0 17Z"
                  fill="#e0efe6"
                />
              </g>

              <g transform="translate(525 42) scale(.9)">
                <path
                  d="M0 17C0 11 5 7 11 7C13 7 15 7.5 17 9C19 4 24 1 30 1C38 1 44 7 44 15C48 15 51 18 51 21C51 24 48 27 44 27H7C3 27 0 23 0 17Z"
                  fill="#e6f3eb"
                />
              </g>

            </g>

            {/* ========================================================
                DISTANT CITY
            ======================================================== */}
            <g opacity="0.62">

              {/* Far buildings */}
              <rect
                x="8"
                y="130"
                width="44"
                height="108"
                rx="2"
                fill="#e5f2e9"
              />

              <rect
                x="60"
                y="108"
                width="57"
                height="130"
                rx="3"
                fill="#deefe5"
              />

              <rect
                x="125"
                y="145"
                width="46"
                height="93"
                rx="3"
                fill="#e7f3eb"
              />

              <rect
                x="181"
                y="118"
                width="64"
                height="120"
                rx="3"
                fill="#dceee3"
              />

              <rect
                x="258"
                y="142"
                width="48"
                height="96"
                rx="3"
                fill="#e5f2e9"
              />

              <rect
                x="317"
                y="125"
                width="59"
                height="113"
                rx="3"
                fill="#dceee4"
              />

              <rect
                x="392"
                y="143"
                width="46"
                height="95"
                rx="3"
                fill="#e6f2e9"
              />

              <rect
                x="451"
                y="112"
                width="64"
                height="126"
                rx="3"
                fill="#deefe5"
              />

              <rect
                x="528"
                y="138"
                width="50"
                height="100"
                rx="3"
                fill="#e7f3eb"
              />

              <rect
                x="590"
                y="105"
                width="58"
                height="133"
                rx="3"
                fill="#dceee3"
              />

              <rect
                x="662"
                y="132"
                width="54"
                height="106"
                rx="3"
                fill="#e5f2e9"
              />

              {/* Building windows */}
              <g fill="#f7fbf8" opacity="0.85">

                <rect x="70" y="121" width="8" height="13" rx="1" />
                <rect x="84" y="121" width="8" height="13" rx="1" />
                <rect x="98" y="121" width="8" height="13" rx="1" />

                <rect x="70" y="143" width="8" height="13" rx="1" />
                <rect x="84" y="143" width="8" height="13" rx="1" />
                <rect x="98" y="143" width="8" height="13" rx="1" />

                <rect x="193" y="132" width="9" height="13" rx="1" />
                <rect x="210" y="132" width="9" height="13" rx="1" />
                <rect x="227" y="132" width="9" height="13" rx="1" />

                <rect x="193" y="154" width="9" height="13" rx="1" />
                <rect x="210" y="154" width="9" height="13" rx="1" />
                <rect x="227" y="154" width="9" height="13" rx="1" />

                <rect x="328" y="139" width="9" height="13" rx="1" />
                <rect x="345" y="139" width="9" height="13" rx="1" />

                <rect x="461" y="125" width="9" height="14" rx="1" />
                <rect x="479" y="125" width="9" height="14" rx="1" />
                <rect x="497" y="125" width="9" height="14" rx="1" />

                <rect x="600" y="119" width="10" height="15" rx="1" />
                <rect x="619" y="119" width="10" height="15" rx="1" />
                <rect x="638" y="119" width="10" height="15" rx="1" />

              </g>

              {/* Rooftop details */}
              <rect
                x="73"
                y="101"
                width="30"
                height="7"
                rx="2"
                fill="#cce5d5"
              />

              <rect
                x="200"
                y="108"
                width="28"
                height="10"
                rx="2"
                fill="#c8e2d1"
              />

              <rect
                x="605"
                y="95"
                width="38"
                height="10"
                rx="2"
                fill="#c8e2d1"
              />

            </g>

            {/* ========================================================
                WAREHOUSE
            ======================================================== */}
            <g transform="translate(500 126)">

              {/* Roof */}
              <path
                d="M-12 32L88 0L188 32V43H-12V32Z"
                fill="#d4eade"
              />

              <path
                d="M-3 32L88 5L179 32"
                fill="none"
                stroke="#55b987"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Warehouse building */}
              <rect
                x="8"
                y="42"
                width="160"
                height="112"
                rx="3"
                fill="#e2f0e7"
              />

              {/* Green horizontal trim */}
              <rect
                x="8"
                y="45"
                width="160"
                height="7"
                fill="#c5dfcf"
              />

              {/* Warehouse windows */}
              <rect
                x="28"
                y="65"
                width="25"
                height="24"
                rx="2"
                fill="#f7fbf8"
              />

              <rect
                x="61"
                y="65"
                width="25"
                height="24"
                rx="2"
                fill="#f7fbf8"
              />

              {/* Main shutter */}
              <rect
                x="105"
                y="73"
                width="43"
                height="81"
                rx="2"
                fill="#c8e1d1"
              />

              <path
                d="M105 86H148M105 99H148M105 112H148M105 125H148M105 138H148"
                stroke="#b2d4c0"
                strokeWidth="2"
              />

              {/* Warehouse logo */}
              <g transform="translate(28 27)">
                <path
                  d="M0 16C8 4 15 0 22 0C18 9 13 15 4 20"
                  fill="#39a86f"
                />

                <path
                  d="M9 20C18 13 25 11 32 12C28 20 19 25 10 26"
                  fill="#58bd83"
                />

                <text
                  x="39"
                  y="20"
                  fontSize="14"
                  fontWeight="700"
                  fill="#31956a"
                  fontFamily="Arial, sans-serif"
                >
                  CafKart
                </text>
              </g>

              {/* Boxes */}
              <g transform="translate(157 122)">
                <rect
                  x="0"
                  y="0"
                  width="22"
                  height="20"
                  rx="2"
                  fill="#d5b887"
                />

                <rect
                  x="20"
                  y="-10"
                  width="22"
                  height="30"
                  rx="2"
                  fill="#dfc99d"
                />

                <path
                  d="M3 3H19M23 -7H39"
                  stroke="#c39e62"
                  strokeWidth="2"
                />
              </g>

              {/* Small forklift */}
              <g transform="translate(186 121)">
                <rect
                  x="0"
                  y="12"
                  width="25"
                  height="16"
                  rx="3"
                  fill="#6bb78e"
                />

                <rect
                  x="5"
                  y="4"
                  width="15"
                  height="10"
                  rx="2"
                  fill="#8bc8a5"
                />

                <circle
                  cx="7"
                  cy="30"
                  r="5"
                  fill="#334155"
                />

                <circle
                  cx="22"
                  cy="30"
                  r="5"
                  fill="#334155"
                />

                <path
                  d="M26 9V28M26 28H38"
                  stroke="#334155"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

            </g>

            {/* ========================================================
                TREES
            ======================================================== */}
            <g opacity="0.72">

              <g transform="translate(28 190)">
                <rect
                  x="15"
                  y="26"
                  width="5"
                  height="22"
                  rx="2"
                  fill="#a9cdb6"
                />

                <circle
                  cx="17"
                  cy="20"
                  r="15"
                  fill="#c8e3d2"
                />

                <circle
                  cx="8"
                  cy="25"
                  r="9"
                  fill="#d3e9db"
                />

                <circle
                  cx="26"
                  cy="26"
                  r="9"
                  fill="#c3dfcd"
                />
              </g>

              <g transform="translate(458 190)">
                <rect
                  x="15"
                  y="26"
                  width="5"
                  height="22"
                  rx="2"
                  fill="#a9cdb6"
                />

                <circle
                  cx="17"
                  cy="20"
                  r="15"
                  fill="#c8e3d2"
                />

                <circle
                  cx="8"
                  cy="25"
                  r="9"
                  fill="#d3e9db"
                />

                <circle
                  cx="26"
                  cy="26"
                  r="9"
                  fill="#c3dfcd"
                />
              </g>

            </g>

            {/* ========================================================
                GROUND
            ======================================================== */}
            <rect
              x="0"
              y="238"
              width="740"
              height="62"
              fill="#f7fbf8"
            />

            <rect
              x="0"
              y="238"
              width="740"
              height="2"
              fill="#d8ebe0"
            />

            <path
              d="M0 256H740"
              stroke="#e4f1e9"
              strokeWidth="2"
            />

            <path
              d="M0 276H740"
              stroke="#edf6f0"
              strokeWidth="3"
            />
          </svg>

          {/* ============================================================
              MOTION LINES — IN FRONT OF BACKGROUND, BEHIND TRUCK
          ============================================================ */}
          <svg
            viewBox="0 0 370 300"
            className="absolute inset-0 w-full h-full z-5 pointer-events-none"
          >
            <g className="animate-speed-lines">
              <line
                x1="22"
                y1="194"
                x2="92"
                y2="194"
                stroke="#45bc7d"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <line
                x1="5"
                y1="204"
                x2="77"
                y2="204"
                stroke="#45bc7d"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <line
                x1="32"
                y1="214"
                x2="87"
                y2="214"
                stroke="#45bc7d"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <line
                x1="14"
                y1="224"
                x2="66"
                y2="224"
                stroke="#69c993"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          </svg>

          {/* ============================================================
              TRUCK
          ============================================================ */}
          <svg
            viewBox="0 0 520 280"
            className="absolute left-[-75px] top-[24px] w-[520px] h-[280px] z-10 pointer-events-none overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>

              {/* Truck green */}
              <linearGradient
                id="truckGreen"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#20c76a"
                />
                <stop
                  offset="100%"
                  stopColor="#12a957"
                />
              </linearGradient>

              {/* Cabin gradient */}
              <linearGradient
                id="cabinGreen"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#ffffff"
                />
                <stop
                  offset="50%"
                  stopColor="#f8fcfa"
                />
                <stop
                  offset="100%"
                  stopColor="#d9eee2"
                />
              </linearGradient>

              {/* Glass */}
              <linearGradient
                id="glassGradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#c8f2dc"
                />
                <stop
                  offset="55%"
                  stopColor="#9edfc0"
                />
                <stop
                  offset="100%"
                  stopColor="#68b998"
                />
              </linearGradient>

              {/* Cargo highlight */}
              <linearGradient
                id="cargoHighlight"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#2fd475"
                  stopOpacity="0.9"
                />
                <stop
                  offset="100%"
                  stopColor="#13ad5b"
                  stopOpacity="0"
                />
              </linearGradient>

              {/* Shadow */}
              <radialGradient
                id="truckGroundShadow"
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop
                  offset="0%"
                  stopColor="#355e4d"
                  stopOpacity="0.28"
                />
                <stop
                  offset="100%"
                  stopColor="#355e4d"
                  stopOpacity="0"
                />
              </radialGradient>
            </defs>

            {/* ==========================================================
                GROUND SHADOW
            ========================================================== */}
            <ellipse
              cx="274"
              cy="238"
              rx="160"
              ry="10"
              fill="url(#truckGroundShadow)"
            />

            {/* ==========================================================
                WHOLE TRUCK BODY
            ========================================================== */}
            <g className="animate-truck-body">

              {/* ========================================================
                  CARGO BODY
              ======================================================== */}
              <path
                d="M70 101
                   Q70 95 76 95
                   H330
                   Q337 95 337 102
                   V206
                   H70
                   Z"
                fill="url(#truckGreen)"
              />

              {/* Top edge */}
              <rect
                x="70"
                y="95"
                width="267"
                height="7"
                rx="3"
                fill="#0f9950"
              />

              {/* Bottom dark rail */}
              <rect
                x="70"
                y="201"
                width="267"
                height="9"
                rx="2"
                fill="#078847"
              />

              {/* Cargo highlight */}
              <rect
                x="77"
                y="106"
                width="252"
                height="65"
                rx="5"
                fill="url(#cargoHighlight)"
              />

              {/* Subtle side graphic */}
              <path
                d="M276 102
                   C316 117 334 141 337 179
                   C311 164 288 143 276 102Z"
                fill="#0a974b"
                opacity="0.42"
              />

              <path
                d="M297 102
                   C322 117 335 139 337 157
                   C318 149 305 130 297 102Z"
                fill="#62df93"
                opacity="0.24"
              />

              {/* ========================================================
                  CAFKART LOGO
              ======================================================== */}
              <g transform="translate(150 133)">

                {/* Leaf icon */}
                <g transform="translate(0 2)">
                  <path
                    d="M25 0
                       C13 2 5 10 4 22
                       C15 21 23 14 25 0Z"
                    fill="#ffffff"
                  />

                  <path
                    d="M5 25
                       C11 17 17 11 25 6"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  <path
                    d="M10 23
                       C17 23 23 19 28 13
                       C27 23 20 29 10 29Z"
                    fill="#dff9e9"
                    opacity="0.95"
                  />
                </g>

                <text
                  x="36"
                  y="22"
                  fontSize="25"
                  fontWeight="800"
                  fill="#ffffff"
                  fontFamily="Arial, Helvetica, sans-serif"
                  letterSpacing="-0.8"
                >
                  CafKart
                </text>

                <text
                  x="38"
                  y="40"
                  fontSize="10"
                  fontWeight="600"
                  fill="#eafff2"
                  fontFamily="Arial, Helvetica, sans-serif"
                  letterSpacing="0.5"
                >
                  B2B GROCERY SOLUTIONS
                </text>
              </g>

              {/* ========================================================
                  GROCERIES — BACK ROW
              ======================================================== */}
              <g className="animate-produce-jiggle">

                {/* Green grocery bag */}
                <g transform="translate(105 71)">
                  <path
                    d="M0 14
                       Q0 8 6 7
                       H31
                       Q37 8 37 14
                       L34 39
                       H3
                       Z"
                    fill="#159447"
                  />

                  <path
                    d="M8 8
                       C8 0 28 0 29 8"
                    fill="none"
                    stroke="#0b6f37"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <path
                    d="M8 21H29"
                    stroke="#5bd98e"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>

                {/* Cooking oil bottle */}
                <g transform="translate(208 65)">
                  <rect
                    x="7"
                    y="8"
                    width="20"
                    height="42"
                    rx="5"
                    fill="#f2c230"
                  />

                  <rect
                    x="11"
                    y="1"
                    width="12"
                    height="10"
                    rx="2"
                    fill="#d69e18"
                  />

                  <rect
                    x="9"
                    y="24"
                    width="16"
                    height="14"
                    rx="2"
                    fill="#fff7d6"
                  />

                  <circle
                    cx="17"
                    cy="31"
                    r="4"
                    fill="#e9b629"
                  />
                </g>

                {/* Milk carton */}
                <g transform="translate(238 72)">
                  <path
                    d="M2 10L12 2L29 8V47H2Z"
                    fill="#ffffff"
                    stroke="#d6e1dc"
                    strokeWidth="1.2"
                  />

                  <path
                    d="M2 10L12 2L29 8"
                    fill="#3ca9d6"
                  />

                  <rect
                    x="3"
                    y="24"
                    width="25"
                    height="15"
                    fill="#3ba8d3"
                  />

                  <text
                    x="7"
                    y="35"
                    fontSize="8"
                    fontWeight="800"
                    fill="#ffffff"
                    fontFamily="Arial, sans-serif"
                  >
                    MILK
                  </text>
                </g>

                {/* Orange/red packaged grocery */}
                <g transform="translate(274 78)">
                  <path
                    d="M0 7L15 0L30 7V43H0Z"
                    fill="#e76828"
                  />

                  <path
                    d="M0 7L15 0L30 7"
                    fill="#d84d18"
                  />

                  <circle
                    cx="15"
                    cy="23"
                    r="6"
                    fill="#fff0d7"
                  />

                  <circle
                    cx="15"
                    cy="23"
                    r="2.5"
                    fill="#ea6826"
                  />
                </g>

                {/* Green packaged grocery */}
                <g transform="translate(308 76)">
                  <path
                    d="M0 8L12 1L25 8V44H0Z"
                    fill="#38a96a"
                  />

                  <path
                    d="M0 8L12 1L25 8"
                    fill="#248c53"
                  />

                  <circle
                    cx="12.5"
                    cy="23"
                    r="6"
                    fill="#dff6e7"
                  />

                  <path
                    d="M9 23C11 18 15 18 17 23"
                    stroke="#37a866"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </g>

                {/* ======================================================
                    BANANAS
                ====================================================== */}
                <g transform="translate(90 83) rotate(-10)">

                  <path
                    d="M0 33
                       C15 36 31 30 39 16
                       C41 12 42 7 40 3
                       C37 6 35 11 31 14
                       C23 23 13 28 0 33Z"
                    fill="#f4c928"
                  />

                  <path
                    d="M5 29
                       C18 31 30 24 36 12
                       C37 9 38 5 36 1
                       C33 5 31 9 27 12
                       C19 20 11 24 5 29Z"
                    fill="#ffe25b"
                  />

                  <path
                    d="M39 5L42 2"
                    stroke="#739c27"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  <circle
                    cx="1"
                    cy="33"
                    r="2"
                    fill="#68420b"
                  />
                </g>

                {/* ======================================================
                    LEAFY GREENS
                ====================================================== */}
                <g transform="translate(133 79)">

                  <ellipse
                    cx="18"
                    cy="22"
                    rx="19"
                    ry="22"
                    fill="#168d48"
                  />

                  <ellipse
                    cx="8"
                    cy="20"
                    rx="12"
                    ry="16"
                    fill="#22a957"
                  />

                  <ellipse
                    cx="28"
                    cy="15"
                    rx="12"
                    ry="16"
                    fill="#2db866"
                  />

                  <path
                    d="M18 39C18 29 19 18 24 9"
                    stroke="#8ee3ad"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <path
                    d="M17 30C11 27 7 22 5 17"
                    stroke="#76d99d"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </g>

                {/* ======================================================
                    RED TOMATOES
                ====================================================== */}
                <g transform="translate(157 101)">

                  <circle
                    cx="10"
                    cy="11"
                    r="10"
                    fill="#e83c3c"
                  />

                  <circle
                    cx="28"
                    cy="9"
                    r="9"
                    fill="#ef4b43"
                  />

                  <circle
                    cx="44"
                    cy="13"
                    r="10"
                    fill="#d92e35"
                  />

                  <path
                    d="M10 2L7 0M10 2L13 0M28 1L25 0M28 1L31 0M44 4L41 1M44 4L47 1"
                    stroke="#247b3e"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <circle
                    cx="7"
                    cy="8"
                    r="2"
                    fill="#ffaaaa"
                    opacity="0.7"
                  />
                </g>

                {/* ======================================================
                    BROCCOLI
                ====================================================== */}
                <g transform="translate(187 94)">

                  <rect
                    x="14"
                    y="18"
                    width="9"
                    height="18"
                    rx="3"
                    fill="#77a948"
                  />

                  <circle
                    cx="13"
                    cy="14"
                    r="10"
                    fill="#178b4b"
                  />

                  <circle
                    cx="23"
                    cy="10"
                    r="11"
                    fill="#1c9b51"
                  />

                  <circle
                    cx="32"
                    cy="16"
                    r="10"
                    fill="#168345"
                  />

                  <circle
                    cx="22"
                    cy="20"
                    r="10"
                    fill="#249e56"
                  />
                </g>

                {/* ======================================================
                    RED PACKET
                ====================================================== */}
                <g transform="translate(122 64) rotate(-12)">

                  <path
                    d="M0 6L12 0L27 5L24 44H3Z"
                    fill="#e95625"
                  />

                  <path
                    d="M3 8L13 3L24 8"
                    fill="#d7461c"
                  />

                  <circle
                    cx="14"
                    cy="24"
                    r="6"
                    fill="#fff0db"
                  />

                  <path
                    d="M11 24C14 20 17 20 19 24"
                    fill="none"
                    stroke="#e95625"
                    strokeWidth="1.5"
                  />
                </g>

              </g>

              {/* ========================================================
                  REAR BODY DETAIL
              ======================================================== */}
              <rect
                x="70"
                y="179"
                width="267"
                height="22"
                fill="#0da452"
                opacity="0.55"
              />

              {/* ========================================================
                  CABIN
              ======================================================== */}
              <path
                d="M337 111
                   H381
                   Q393 111 401 122
                   L429 163
                   Q434 170 430 181
                   H337
                   Z"
                fill="url(#cabinGreen)"
              />

              {/* Green lower cabin */}
              <path
                d="M337 167
                   H431
                   L435 184
                   H337
                   Z"
                fill="#087b45"
              />

              {/* Cabin roof green accent */}
              <path
                d="M337 111
                   H381
                   Q393 111 401 122
                   L406 129
                   H337Z"
                fill="#0e9c51"
              />

              {/* Windshield */}
              <path
                d="M375 119
                   H388
                   Q393 120 397 126
                   L414 151
                   H375
                   Z"
                fill="url(#glassGradient)"
              />

              {/* Side window */}
              <path
                d="M344 119
                   H371
                   V151
                   H344Z"
                fill="url(#glassGradient)"
              />

              {/* Window divider */}
              <line
                x1="374"
                y1="118"
                x2="374"
                y2="153"
                stroke="#0b6040"
                strokeWidth="3"
              />

              {/* Window shine */}
              <path
                d="M349 122H368"
                stroke="#e8fff3"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Door outline */}
              <path
                d="M341 154V198H397V154"
                fill="none"
                stroke="#087744"
                strokeWidth="2"
              />

              {/* Door handle */}
              <rect
                x="381"
                y="164"
                width="10"
                height="3"
                rx="1.5"
                fill="#064e36"
              />

              {/* Side mirror */}
              <path
                d="M406 135H419"
                stroke="#0b3d2d"
                strokeWidth="4"
                strokeLinecap="round"
              />

              <rect
                x="416"
                y="130"
                width="9"
                height="13"
                rx="3"
                fill="#153d32"
              />

              {/* Front grille */}
              <path
                d="M421 169H438V181H421Z"
                fill="#153d32"
              />

              <line
                x1="424"
                y1="172"
                x2="435"
                y2="172"
                stroke="#9ce1bd"
                strokeWidth="1"
              />

              <line
                x1="424"
                y1="176"
                x2="435"
                y2="176"
                stroke="#9ce1bd"
                strokeWidth="1"
              />

              {/* Headlight */}
              <path
                d="M427 157L436 159V168H427Z"
                fill="#fff3ba"
              />

              <path
                d="M429 159L435 160"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Bumper */}
              <path
                d="M418 181H439
                   Q444 181 444 186
                   H416Z"
                fill="#172b27"
              />

              {/* ========================================================
                  CHASSIS
              ======================================================== */}
              <rect
                x="78"
                y="200"
                width="364"
                height="14"
                rx="4"
                fill="#182d29"
              />

              <rect
                x="105"
                y="211"
                width="275"
                height="8"
                rx="3"
                fill="#253a35"
              />

              {/* Rear mudguard */}
              <path
                d="M91 211
                   Q91 184 119 184
                   Q147 184 147 211"
                fill="#162b27"
              />

              {/* Front mudguard */}
              <path
                d="M347 211
                   Q347 184 375 184
                   Q403 184 403 211"
                fill="#162b27"
              />

              {/* ========================================================
                  REAR WHEEL
              ======================================================== */}
              <g
                className="wheel-rear"
                style={{
                  transformOrigin: '119px 211px',
                }}
              >
                <circle
                  cx="119"
                  cy="211"
                  r="25"
                  fill="#172b2c"
                />

                <circle
                  cx="119"
                  cy="211"
                  r="18"
                  fill="#334155"
                />

                <circle
                  cx="119"
                  cy="211"
                  r="13"
                  fill="#dce4e1"
                />

                {/* Alloy spokes */}
                <g
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line
                    x1="119"
                    y1="200"
                    x2="119"
                    y2="222"
                  />
                  <line
                    x1="108"
                    y1="211"
                    x2="130"
                    y2="211"
                  />
                  <line
                    x1="111"
                    y1="203"
                    x2="127"
                    y2="219"
                  />
                  <line
                    x1="111"
                    y1="219"
                    x2="127"
                    y2="203"
                  />
                </g>

                <circle
                  cx="119"
                  cy="211"
                  r="5"
                  fill="#1c3030"
                />

                <circle
                  cx="119"
                  cy="211"
                  r="2"
                  fill="#94a3b8"
                />
              </g>

              {/* ========================================================
                  FRONT WHEEL
              ======================================================== */}
              <g
                className="wheel-front"
                style={{
                  transformOrigin: '375px 211px',
                }}
              >
                <circle
                  cx="375"
                  cy="211"
                  r="25"
                  fill="#172b2c"
                />

                <circle
                  cx="375"
                  cy="211"
                  r="18"
                  fill="#334155"
                />

                <circle
                  cx="375"
                  cy="211"
                  r="13"
                  fill="#dce4e1"
                />

                <g
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line
                    x1="375"
                    y1="200"
                    x2="375"
                    y2="222"
                  />
                  <line
                    x1="364"
                    y1="211"
                    x2="386"
                    y2="211"
                  />
                  <line
                    x1="367"
                    y1="203"
                    x2="383"
                    y2="219"
                  />
                  <line
                    x1="367"
                    y1="219"
                    x2="383"
                    y2="203"
                  />
                </g>

                <circle
                  cx="375"
                  cy="211"
                  r="5"
                  fill="#1c3030"
                />

                <circle
                  cx="375"
                  cy="211"
                  r="2"
                  fill="#94a3b8"
                />
              </g>

              {/* ========================================================
                  SMALL LIGHTS / DETAILS
              ======================================================== */}
              <rect
                x="326"
                y="188"
                width="7"
                height="4"
                rx="1"
                fill="#f4b740"
              />

              <rect
                x="433"
                y="175"
                width="5"
                height="5"
                rx="1"
                fill="#f5a623"
              />

              <circle
                cx="339"
                cy="214"
                r="2"
                fill="#64748b"
              />

            </g>
          </svg>
        </div>

        {/* ============================================================
            STATUS / STEP INDICATOR
        ============================================================ */}
        {showStatus && (
          <div className="mt-1 flex flex-col items-center justify-center animate-fade-in">

            <div className="relative flex items-center justify-between w-52 mb-3">

              {/* Base track */}
              <div
                className="absolute top-1/2 left-0 right-0 h-[2.5px] -translate-y-1/2 bg-[#cbd5e1] z-0"
              />

              {/* Progress */}
              <div
                className="absolute top-1/2 left-0 h-[2.5px] -translate-y-1/2 bg-[#22c55e] z-0 transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                }}
              />

              {HOME_MESSAGES.map((_, idx) => {
                const isCompleted = idx < msgIndex;
                const isActive = idx === msgIndex;

                return (
                  <div
                    key={idx}
                    className="relative z-10 flex items-center justify-center w-5 h-5"
                  >
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

            <div className="h-6 flex items-center justify-center">
              <p
                key={msgIndex}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight animate-text-fade"
              >
                {HOME_MESSAGES[msgIndex]}
                <span className="text-emerald-500 text-sm">
                  🍃
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ==============================================================
          ANIMATIONS
      ============================================================== */}
      <style>{`

        /* ------------------------------------------------------------
           BACKGROUND PARALLAX
           Moves the city/warehouse backwards continuously.
        ------------------------------------------------------------ */
        @keyframes loaderBackgroundScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }

          100% {
            transform: translate3d(-370px, 0, 0);
          }
        }

        .animate-loader-background {
          animation: loaderBackgroundScroll 9s linear infinite;
        }

        /* ------------------------------------------------------------
           TRUCK SUSPENSION
        ------------------------------------------------------------ */
        @keyframes truckBodyBounce {
          0%,
          100% {
            transform: translateY(0);
          }

          25% {
            transform: translateY(-1px);
          }

          50% {
            transform: translateY(-2px);
          }

          75% {
            transform: translateY(-0.5px);
          }
        }

        .animate-truck-body {
          animation: truckBodyBounce 0.65s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center bottom;
        }

        /* ------------------------------------------------------------
           GROCERY LOAD MOVEMENT
        ------------------------------------------------------------ */
        @keyframes produceJiggle {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          25% {
            transform: translateY(-0.7px) rotate(-0.2deg);
          }

          50% {
            transform: translateY(-1.4px) rotate(0.35deg);
          }

          75% {
            transform: translateY(-0.5px) rotate(-0.15deg);
          }
        }

        .animate-produce-jiggle {
          animation: produceJiggle 0.65s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center bottom;
        }

        /* ------------------------------------------------------------
           WHEELS
        ------------------------------------------------------------ */
        @keyframes spinWheelAnim {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .wheel-rear,
        .wheel-front {
          animation: spinWheelAnim 0.42s linear infinite;
          transform-box: fill-box;
        }

        /* ------------------------------------------------------------
           MOTION LINES
        ------------------------------------------------------------ */
        @keyframes speedLines {
          0% {
            opacity: 0.95;
            transform: translateX(10px);
          }

          50% {
            opacity: 0.45;
            transform: translateX(-3px);
          }

          100% {
            opacity: 0.95;
            transform: translateX(10px);
          }
        }

        .animate-speed-lines {
          animation: speedLines 0.55s ease-in-out infinite;
        }

        /* ------------------------------------------------------------
           MESSAGE
        ------------------------------------------------------------ */
        @keyframes textFade {
          0% {
            opacity: 0;
            transform: translateY(3px);
          }

          10% {
            opacity: 1;
            transform: translateY(0);
          }

          90% {
            opacity: 1;
            transform: translateY(0);
          }

          100% {
            opacity: 0;
            transform: translateY(-3px);
          }
        }

        .animate-text-fade {
          animation: textFade 1.8s ease-in-out infinite;
        }

        /* ------------------------------------------------------------
           LOADER ENTRANCE
        ------------------------------------------------------------ */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }

        /* ------------------------------------------------------------
           REDUCE MOTION ACCESSIBILITY
        ------------------------------------------------------------ */
        @media (prefers-reduced-motion: reduce) {
          .animate-loader-background,
          .animate-truck-body,
          .animate-produce-jiggle,
          .wheel-rear,
          .wheel-front,
          .animate-speed-lines,
          .animate-text-fade {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});