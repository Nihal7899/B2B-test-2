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
    if (!showStatus || message || messages.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => window.clearInterval(timer);
  }, [showStatus, message, messages]);

  const activeMessage =
    message ||
    messages[msgIndex] ||
    DEFAULT_HOME_MESSAGES[0];

  const scaleClass =
    size === 'sm'
      ? 'scale-[0.72]'
      : size === 'lg'
        ? 'scale-[1.08]'
        : 'scale-[0.9] sm:scale-[0.97]';

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        bg-white
        select-none
        overflow-hidden
        ${
          fullScreen
            ? 'fixed inset-0 z-50 px-4'
            : 'relative w-full py-8'
        }
        ${className}
      `}
    >
      {/* =========================================================
          MAIN LOADER STAGE
         ========================================================= */}

      <div
        className={`
          relative
          w-[350px]
          h-[330px]
          ${scaleClass}
        `}
      >
        {/* =======================================================
            SOFT GREEN ATMOSPHERIC GLOW
           ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            top-[65px]
            -translate-x-1/2
            w-[285px]
            h-[175px]
            rounded-full
            bg-emerald-50/80
            blur-3xl
            pointer-events-none
          "
        />

        {/* =======================================================
            CLOUDS
           ======================================================= */}

        <div className="absolute left-[42px] top-[55px] z-0 animate-cloud-a">
          <svg
            width="76"
            height="34"
            viewBox="0 0 76 34"
            fill="none"
          >
            <path
              d="
                M7 27
                C7 20 13 14 20 14
                C22 7 28 3 35 3
                C44 3 50 9 51 16
                C60 15 68 20 68 27
                Z
              "
              fill="#e8f9f3"
            />
          </svg>
        </div>

        <div className="absolute right-[42px] top-[82px] z-0 animate-cloud-b">
          <svg
            width="65"
            height="29"
            viewBox="0 0 65 29"
            fill="none"
          >
            <path
              d="
                M6 23
                C6 17 11 12 18 12
                C20 6 25 3 32 3
                C40 3 46 8 47 15
                C54 14 60 18 60 23
                Z
              "
              fill="#eefbf6"
            />
          </svg>
        </div>

        {/* =======================================================
            CITY BACKGROUND
           ======================================================= */}

        <div
          className="
            absolute
            left-0
            bottom-[77px]
            w-full
            h-[132px]
            overflow-hidden
            pointer-events-none
            z-[1]
          "
        >
          <div className="city-wrapper flex h-full w-[700px]">
            <CityScene />
            <CityScene />
          </div>
        </div>

        {/* =======================================================
            TREES / SOFT FOREGROUND
           ======================================================= */}

        <div className="absolute left-[27px] bottom-[83px] z-[2] opacity-80">
          <svg width="55" height="95" viewBox="0 0 55 95">
            <rect
              x="25"
              y="50"
              width="5"
              height="45"
              fill="#d4ebe2"
            />

            <circle
              cx="27"
              cy="43"
              r="18"
              fill="#dff7ed"
            />

            <circle
              cx="16"
              cy="51"
              r="12"
              fill="#e5f9f1"
            />

            <circle
              cx="39"
              cy="51"
              r="12"
              fill="#d8f4e9"
            />
          </svg>
        </div>

        <div className="absolute right-[18px] bottom-[82px] z-[2] opacity-80">
          <svg width="62" height="96" viewBox="0 0 62 96">
            <rect
              x="29"
              y="54"
              width="5"
              height="42"
              fill="#d4ebe2"
            />

            <circle
              cx="31"
              cy="46"
              r="20"
              fill="#e0f7ed"
            />

            <circle
              cx="18"
              cy="54"
              r="12"
              fill="#d9f3e9"
            />

            <circle
              cx="45"
              cy="54"
              r="13"
              fill="#e6faf2"
            />
          </svg>
        </div>

        {/* =======================================================
            ROUTE ARC BEHIND TRUCK
           ======================================================= */}

        <div className="absolute left-[81px] top-[104px] z-[3] pointer-events-none">
          <svg
            width="205"
            height="105"
            viewBox="0 0 205 105"
            fill="none"
          >
            <path
              d="
                M7 81
                C30 28 77 11 120 27
                C153 39 172 55 198 85
              "
              stroke="#6ee7b7"
              strokeWidth="2.5"
              strokeDasharray="7 8"
              strokeLinecap="round"
              className="animate-route"
            />
          </svg>
        </div>

        {/* =======================================================
            SMALL DELIVERY PIN
            Subtle and behind truck
           ======================================================= */}

        <div className="absolute right-[72px] top-[113px] z-[4] animate-pin">
          <svg
            width="29"
            height="38"
            viewBox="0 0 29 38"
            fill="none"
          >
            <path
              d="
                M14.5 36
                C14.5 36 25.5 23.5 25.5 14
                C25.5 7.1 20.6 2 14.5 2
                C8.4 2 3.5 7.1 3.5 14
                C3.5 23.5 14.5 36 14.5 36Z
              "
              fill="#10b981"
            />

            <circle
              cx="14.5"
              cy="14"
              r="5"
              fill="white"
            />
          </svg>
        </div>

        {/* =======================================================
            SPEED LINES
           ======================================================= */}

        <div
          className="
            absolute
            left-[29px]
            bottom-[126px]
            z-[8]
            pointer-events-none
          "
        >
          <div className="speed-line speed-line-1" />
          <div className="speed-line speed-line-2" />
          <div className="speed-line speed-line-3" />
        </div>

        {/* =======================================================
            GROUNDED TRUCK
           
            IMPORTANT:
            The truck body AND BOTH WHEELS live inside this
            SINGLE wrapper.

            This means there is no possible vertical separation
            between wheels and truck.
           ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            bottom-[74px]
            z-[20]
            w-[330px]
          "
        >
          <div className="truck-drive">
            <TruckIllustration />
          </div>
        </div>

        {/* =======================================================
            ROAD
           
            Wheel centers are designed around the road position.
            The tyre bottoms touch the road surface.
           ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            bottom-[56px]
            z-[30]
            w-[330px]
          "
        >
          {/* Thin road highlight */}
          <div
            className="
              h-[3px]
              w-full
              rounded-full
              bg-slate-400/80
            "
          />

          {/* Asphalt */}
          <div
            className="
              relative
              h-[18px]
              w-full
              overflow-hidden
              bg-slate-800
            "
          >
            <div className="road-dashes" />
          </div>

          {/* Bottom road edge */}
          <div
            className="
              h-[3px]
              w-full
              rounded-b-md
              bg-slate-950
            "
          />
        </div>

        {/* =======================================================
            ROAD CONTACT SHADOW
           ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            bottom-[51px]
            z-[15]
            w-[250px]
            h-[9px]
            rounded-full
            bg-slate-400/20
            blur-md
          "
        />
      </div>

      {/* =========================================================
          HOME-ONLY STATUS
         ========================================================= */}

      {showStatus && (
        <div
          className="
            mt-1
            max-w-[320px]
            flex
            flex-col
            items-center
            text-center
            animate-status
          "
        >
          {/* Progress indicators */}
          <div className="flex items-center gap-2.5 mb-4">

            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <span className="h-[3px] w-9 rounded-full bg-emerald-500" />

            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <span className="h-[3px] w-9 rounded-full bg-emerald-500" />

            <span
              className="
                relative
                flex
                h-4
                w-4
                items-center
                justify-center
                rounded-full
                border-2
                border-emerald-500
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>

            <span className="h-[3px] w-9 rounded-full bg-slate-200" />

            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />

            <span className="h-[3px] w-9 rounded-full bg-slate-200" />

            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />

          </div>

          {/* Current loading message */}
          <div
            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-emerald-100
              bg-emerald-50
              px-4
              py-2
              shadow-sm
            "
          >
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="
                  absolute
                  inset-0
                  rounded-full
                  bg-emerald-400
                  animate-ping
                  opacity-50
                "
              />

              <span
                className="
                  relative
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-emerald-600
                "
              />
            </span>

            <span
              key={activeMessage}
              className="
                text-[11px]
                sm:text-xs
                font-bold
                text-emerald-950
                whitespace-nowrap
                animate-message
              "
            >
              {activeMessage}
            </span>
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

        /* =======================================================
           CITY
           ======================================================= */

        @keyframes cityScroll {
          from {
            transform: translate3d(0, 0, 0);
          }

          to {
            transform: translate3d(-350px, 0, 0);
          }
        }

        .city-wrapper {
          animation: cityScroll 8s linear infinite;
          will-change: transform;
        }


        /* =======================================================
           TRUCK
           
           ONLY HORIZONTAL MOTION.
           NO Y MOVEMENT.
           
           Therefore the truck never jumps away from the road.
           ======================================================= */

        @keyframes truckDrive {
          0%, 100% {
            transform: translate3d(-10px, 0, 0);
          }

          50% {
            transform: translate3d(10px, 0, 0);
          }
        }

        .truck-drive {
          animation: truckDrive 2.2s ease-in-out infinite;
          will-change: transform;
        }


        /* =======================================================
           WHEELS
           ======================================================= */

        @keyframes wheelRotate {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .wheel-spin {
          transform-box: fill-box;
          transform-origin: center;
          animation: wheelRotate 0.48s linear infinite;
        }


        /* =======================================================
           ROAD
           ======================================================= */

        @keyframes roadMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-52px);
          }
        }

        .road-dashes {
          position: absolute;
          left: 0;
          top: 7px;
          width: 600px;
          height: 3px;

          background-image: repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.95) 0px,
            rgba(255,255,255,0.95) 25px,
            transparent 25px,
            transparent 52px
          );

          animation: roadMove 0.45s linear infinite;
          will-change: transform;
        }


        /* =======================================================
           ROUTE
           ======================================================= */

        @keyframes routeMove {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -30;
          }
        }

        .animate-route {
          animation: routeMove 1.5s linear infinite;
        }


        /* =======================================================
           PIN
           ======================================================= */

        @keyframes pinBounce {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        .animate-pin {
          animation: pinBounce 1.8s ease-in-out infinite;
        }


        /* =======================================================
           CLOUDS
           ======================================================= */

        @keyframes cloudA {
          0%, 100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(7px);
          }
        }

        .animate-cloud-a {
          animation: cloudA 5.5s ease-in-out infinite;
        }


        @keyframes cloudB {
          0%, 100% {
            transform: translateX(0);
          }

          50% {
            transform: translateX(-8px);
          }
        }

        .animate-cloud-b {
          animation: cloudB 6.2s ease-in-out infinite;
        }


        /* =======================================================
           SPEED LINES
           ======================================================= */

        .speed-line {
          position: absolute;
          right: 0;
          height: 2px;
          border-radius: 999px;
          background: #34d399;
          opacity: 0;
        }

        .speed-line-1 {
          width: 54px;
          top: 0;
          animation: speedOne 0.85s ease-out infinite;
        }

        .speed-line-2 {
          width: 78px;
          top: 12px;
          opacity: 0.6;
          animation: speedTwo 0.95s ease-out infinite 0.18s;
        }

        .speed-line-3 {
          width: 42px;
          top: 24px;
          opacity: 0.45;
          animation: speedThree 0.8s ease-out infinite 0.3s;
        }

        @keyframes speedOne {
          0% {
            transform: translateX(15px);
            opacity: 0;
          }

          25% {
            opacity: 0.85;
          }

          100% {
            transform: translateX(-70px);
            opacity: 0;
          }
        }

        @keyframes speedTwo {
          0% {
            transform: translateX(20px);
            opacity: 0;
          }

          25% {
            opacity: 0.65;
          }

          100% {
            transform: translateX(-85px);
            opacity: 0;
          }
        }

        @keyframes speedThree {
          0% {
            transform: translateX(12px);
            opacity: 0;
          }

          30% {
            opacity: 0.5;
          }

          100% {
            transform: translateX(-65px);
            opacity: 0;
          }
        }


        /* =======================================================
           STATUS
           ======================================================= */

        @keyframes statusFade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-status {
          animation: statusFade 0.3s ease-out both;
        }


        @keyframes messageFade {
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
          animation: messageFade 0.25s ease-out both;
        }


        /* =======================================================
           REDUCED MOTION
           ======================================================= */

        @media (prefers-reduced-motion: reduce) {
          .city-wrapper,
          .truck-drive,
          .wheel-spin,
          .road-dashes,
          .animate-route,
          .animate-pin,
          .animate-cloud-a,
          .animate-cloud-b,
          .speed-line-1,
          .speed-line-2,
          .speed-line-3 {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});


/* =============================================================
   TRUCK ILLUSTRATION
   ============================================================= */

function TruckIllustration() {
  return (
    <svg
      viewBox="0 0 330 145"
      width="330"
      height="145"
      className="block w-full h-auto overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>

        {/* Cargo */}
        <linearGradient
          id="cargoGradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#19c978"
          />

          <stop
            offset="100%"
            stopColor="#07985a"
          />
        </linearGradient>

        {/* Cargo side */}
        <linearGradient
          id="cargoSideGradient"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#21cc7d"
          />

          <stop
            offset="100%"
            stopColor="#079456"
          />
        </linearGradient>

        {/* Cabin */}
        <linearGradient
          id="cabGradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#0c8b57"
          />

          <stop
            offset="100%"
            stopColor="#034c36"
          />
        </linearGradient>

        {/* Window */}
        <linearGradient
          id="windowGradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#e0fff5"
          />

          <stop
            offset="100%"
            stopColor="#98e8cc"
          />
        </linearGradient>

        {/* Tyre green */}
        <linearGradient
          id="wheelGradient"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#d9f99d"
          />

          <stop
            offset="100%"
            stopColor="#65c82d"
          />
        </linearGradient>

        <filter
          id="truckDropShadow"
          x="-20%"
          y="-20%"
          width="140%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="3"
            floodColor="#064e3b"
            floodOpacity="0.22"
          />
        </filter>
      </defs>


      {/* =======================================================
          EVERYTHING THAT MAKES THE TRUCK IS IN THIS GROUP
          
          The wheels are attached to this same truck unit.
         ======================================================= */}

      <g filter="url(#truckDropShadow)">

        {/* =====================================================
            MAIN CARGO BODY
           ===================================================== */}

        <rect
          x="20"
          y="25"
          width="191"
          height="82"
          rx="5"
          fill="url(#cargoGradient)"
        />

        {/* Cargo upper lip */}
        <rect
          x="20"
          y="23"
          width="191"
          height="7"
          rx="3"
          fill="#078452"
        />

        <rect
          x="27"
          y="25"
          width="177"
          height="2"
          rx="1"
          fill="#65e7b0"
          opacity="0.75"
        />

        {/* =====================================================
            REAR OPEN GROCERY AREA
           
            This is deliberately at the back of the truck,
            not on the roof.
           ===================================================== */}

        <rect
          x="27"
          y="39"
          width="40"
          height="62"
          rx="2"
          fill="#056a45"
          opacity="0.72"
        />

        {/* Rear vertical opening */}
        <rect
          x="30"
          y="42"
          width="34"
          height="56"
          rx="2"
          fill="#034f35"
          opacity="0.72"
        />

        {/* Grocery crate 1 */}
        <rect
          x="33"
          y="75"
          width="28"
          height="20"
          rx="2"
          fill="#14532d"
        />

        <rect
          x="35"
          y="78"
          width="24"
          height="3"
          fill="#22c55e"
        />

        <circle
          cx="40"
          cy="73"
          r="7"
          fill="#ef4444"
        />

        <circle
          cx="49"
          cy="72"
          r="7"
          fill="#f97316"
        />

        <circle
          cx="56"
          cy="75"
          r="6"
          fill="#22c55e"
        />

        {/* Grocery crate 2 */}
        <rect
          x="35"
          y="56"
          width="25"
          height="16"
          rx="2"
          fill="#166534"
        />

        <circle
          cx="40"
          cy="54"
          r="5"
          fill="#facc15"
        />

        <circle
          cx="48"
          cy="53"
          r="5"
          fill="#ef4444"
        />

        <circle
          cx="55"
          cy="55"
          r="5"
          fill="#4ade80"
        />

        {/* =====================================================
            CARGO VERTICAL PANELS
           ===================================================== */}

        <path
          d="M72 31V103"
          stroke="#07824e"
          strokeWidth="1.1"
          opacity="0.55"
        />

        <path
          d="M101 31V103"
          stroke="#07824e"
          strokeWidth="1.1"
          opacity="0.55"
        />

        <path
          d="M130 31V103"
          stroke="#07824e"
          strokeWidth="1.1"
          opacity="0.55"
        />

        <path
          d="M159 31V103"
          stroke="#07824e"
          strokeWidth="1.1"
          opacity="0.55"
        />

        <path
          d="M188 31V103"
          stroke="#07824e"
          strokeWidth="1.1"
          opacity="0.55"
        />

        {/* =====================================================
            SUBTLE GROCERY ICONS INSIDE THE CLOSED BOX
           ===================================================== */}

        {/* Bag */}
        <path
          d="
            M82 62
            L96 62
            L98 96
            L80 96
            Z
          "
          fill="#fef3c7"
          opacity="0.92"
        />

        <path
          d="M84 69H94"
          stroke="#f59e0b"
          strokeWidth="2"
        />

        {/* Bottle */}
        <path
          d="
            M105 60
            H117
            V55
            H113
            V51
            H109
            V55
            H105
            Z

            M105 60
            V96
            H117
            V60
            Z
          "
          fill="#dbeafe"
          opacity="0.95"
        />

        {/* Box */}
        <rect
          x="124"
          y="67"
          width="23"
          height="29"
          rx="2"
          fill="#fbbf24"
        />

        <path
          d="M127 72H144"
          stroke="#fff7ed"
          strokeWidth="3"
        />

        {/* Milk bottle */}
        <path
          d="
            M153 61
            H164
            V57
            H161
            V53
            H156
            V57
            H153
            Z

            M153 61
            V96
            H164
            V61
            Z
          "
          fill="#f8fafc"
        />

        {/* Small fruit */}
        <circle
          cx="176"
          cy="75"
          r="9"
          fill="#ef4444"
        />

        <circle
          cx="188"
          cy="78"
          r="8"
          fill="#f97316"
        />

        <circle
          cx="178"
          cy="88"
          r="7"
          fill="#22c55e"
        />

        {/* =====================================================
            CK LOGO
           ===================================================== */}

        <g transform="translate(103 42)">

          {/* soft logo plate */}
          <circle
            cx="28"
            cy="30"
            r="27"
            fill="#ffffff"
            opacity="0.04"
          />

          {/* C */}
          <path
            d="
              M38 11
              C30 4 17 7 11 16
              C5 25 8 37 17 43
              C25 48 35 45 41 38
            "
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* K */}
          <path
            d="
              M36 11
              L51 26
              L36 42
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
              M33 48
              C43 45 51 40 58 33
              C55 44 45 52 33 53
              Z
            "
            fill="#bef264"
          />

          <path
            d="M35 50C43 47 50 42 56 36"
            stroke="#4d7c0f"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>

        {/* Cargo bottom */}
        <rect
          x="20"
          y="102"
          width="191"
          height="6"
          rx="2"
          fill="#057a4c"
        />

        {/* =====================================================
            CAB
           ===================================================== */}

        <path
          d="
            M211 44
            H245
            C253 44 260 49 264 57
            L280 87
            C283 92 282 101 275 106
            H211
            Z
          "
          fill="url(#cabGradient)"
        />

        {/* Window */}
        <path
          d="
            M219 50
            H241
            C246 50 251 53 254 59
            L263 76
            H219
            Z
          "
          fill="url(#windowGradient)"
        />

        {/* Window shine */}
        <path
          d="M226 53H240"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.8"
        />

        <path
          d="M248 54L256 75"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.55"
        />

        {/* Door */}
        <path
          d="M220 76V102"
          stroke="#075d42"
          strokeWidth="1.5"
        />

        {/* Door handle */}
        <rect
          x="232"
          y="84"
          width="11"
          height="2"
          rx="1"
          fill="#67e8b5"
        />

        {/* Mirror */}
        <path
          d="M254 51H263"
          stroke="#064e3b"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <rect
          x="260"
          y="48"
          width="8"
          height="5"
          rx="2"
          fill="#475569"
        />

        {/* Front bumper */}
        <path
          d="
            M270 96
            H298
            C302 96 304 99 304 102
            V107
            H268
            Z
          "
          fill="#172033"
        />

        {/* Headlight */}
        <rect
          x="280"
          y="89"
          width="11"
          height="7"
          rx="2"
          fill="#fef08a"
        />

        {/* Rear light */}
        <rect
          x="17"
          y="81"
          width="6"
          height="14"
          rx="2"
          fill="#fb7185"
        />

        {/* =====================================================
            UNDERCARRIAGE
           ===================================================== */}

        <rect
          x="20"
          y="105"
          width="280"
          height="9"
          rx="3"
          fill="#14251f"
        />

        {/* =====================================================
            SMALL DELIVERY BOX
           ===================================================== */}

        <rect
          x="171"
          y="94"
          width="13"
          height="13"
          rx="2"
          fill="#f59e0b"
        />

        <rect
          x="174"
          y="91"
          width="7"
          height="4"
          rx="1"
          fill="#b45309"
        />

        <circle
          cx="177.5"
          cy="100"
          r="2"
          fill="#fef3c7"
        />

        {/* =====================================================
            LEFT WHEEL
           
            Center = 61,106
            Radius = 20
            Bottom = 126

            Road top is aligned at the matching ground level.
           ===================================================== */}

        <g
          className="wheel-spin"
          style={{
            transformOrigin: '61px 106px',
          }}
        >
          <circle
            cx="61"
            cy="106"
            r="20"
            fill="#172033"
          />

          <circle
            cx="61"
            cy="106"
            r="13"
            fill="url(#wheelGradient)"
          />

          <circle
            cx="61"
            cy="106"
            r="8"
            fill="#f8fafc"
          />

          <path
            d="M61 98V114M53 106H69"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <circle
            cx="61"
            cy="106"
            r="3"
            fill="#334155"
          />
        </g>

        {/* =====================================================
            RIGHT WHEEL
           
            Center = 242,106
            Radius = 20
            Bottom = 126
           ===================================================== */}

        <g
          className="wheel-spin"
          style={{
            transformOrigin: '242px 106px',
          }}
        >
          <circle
            cx="242"
            cy="106"
            r="20"
            fill="#172033"
          />

          <circle
            cx="242"
            cy="106"
            r="13"
            fill="url(#wheelGradient)"
          />

          <circle
            cx="242"
            cy="106"
            r="8"
            fill="#f8fafc"
          />

          <path
            d="M242 98V114M234 106H250"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <circle
            cx="242"
            cy="106"
            r="3"
            fill="#334155"
          />
        </g>
      </g>
    </svg>
  );
}


/* =============================================================
   CITY BACKGROUND
   ============================================================= */

function CityScene() {
  return (
    <svg
      width="350"
      height="132"
      viewBox="0 0 350 132"
      className="shrink-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Far skyline */}
      <rect
        x="2"
        y="48"
        width="37"
        height="84"
        rx="2"
        fill="#f0faf6"
      />

      <rect
        x="44"
        y="31"
        width="46"
        height="101"
        rx="2"
        fill="#e9f7f2"
      />

      <rect
        x="96"
        y="55"
        width="35"
        height="77"
        rx="2"
        fill="#effaf6"
      />

      {/* Main central building */}
      <rect
        x="139"
        y="20"
        width="55"
        height="112"
        rx="3"
        fill="#e3f4ee"
      />

      <rect
        x="157"
        y="7"
        width="19"
        height="125"
        rx="2"
        fill="#e7f6f1"
      />

      {/* Right skyline */}
      <rect
        x="202"
        y="48"
        width="44"
        height="84"
        rx="2"
        fill="#eaf8f3"
      />

      <rect
        x="253"
        y="35"
        width="53"
        height="97"
        rx="3"
        fill="#e1f3ed"
      />

      <rect
        x="313"
        y="55"
        width="37"
        height="77"
        rx="2"
        fill="#eefaf6"
      />

      {/* Windows */}
      <g
        fill="#ffffff"
        opacity="0.8"
      >
        <rect x="53" y="43" width="7" height="8" rx="1" />
        <rect x="73" y="43" width="7" height="8" rx="1" />

        <rect x="53" y="60" width="7" height="8" rx="1" />
        <rect x="73" y="60" width="7" height="8" rx="1" />

        <rect x="150" y="34" width="7" height="8" rx="1" />
        <rect x="180" y="34" width="7" height="8" rx="1" />

        <rect x="150" y="51" width="7" height="8" rx="1" />
        <rect x="180" y="51" width="7" height="8" rx="1" />

        <rect x="264" y="49" width="7" height="8" rx="1" />
        <rect x="285" y="49" width="7" height="8" rx="1" />

        <rect x="264" y="66" width="7" height="8" rx="1" />
        <rect x="285" y="66" width="7" height="8" rx="1" />
      </g>

      {/* Small distant trees */}
      <circle
        cx="22"
        cy="113"
        r="15"
        fill="#e0f7ed"
      />

      <circle
        cx="327"
        cy="112"
        r="17"
        fill="#e1f7ed"
      />
    </svg>
  );
}