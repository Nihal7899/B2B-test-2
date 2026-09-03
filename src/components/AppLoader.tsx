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

  useEffect(() => {
    if (!showStatus || message || messages.length === 0) return;

    const interval = window.setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [showStatus, message, messages]);

  const activeMessage =
    message ||
    messages[msgIndex] ||
    'Preparing your wholesale store...';

  const scaleClass =
    size === 'sm'
      ? 'scale-[0.72]'
      : size === 'lg'
        ? 'scale-[1.08]'
        : 'scale-[0.92] sm:scale-100';

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
          MAIN LOADER
          ========================================================= */}

      <div
        className={[
          'relative',
          'w-[360px] h-[230px]',
          'shrink-0',
          scaleClass,
        ].join(' ')}
      >
        {/* =======================================================
            SOFT BACKGROUND GLOW
            ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            top-[55px]
            -translate-x-1/2
            w-[280px]
            h-[150px]
            rounded-full
            bg-emerald-50
            blur-3xl
            opacity-80
          "
        />

        {/* =======================================================
            CITY / BUILDINGS
            Tall background buildings
            ======================================================= */}

        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 360 230"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* distant buildings */}

          <rect
            x="18"
            y="74"
            width="42"
            height="102"
            rx="3"
            fill="#F1F5F9"
          />

          <rect
            x="65"
            y="50"
            width="48"
            height="126"
            rx="3"
            fill="#E8F0F0"
          />

          <rect
            x="118"
            y="77"
            width="37"
            height="99"
            rx="3"
            fill="#F1F5F9"
          />

          <rect
            x="161"
            y="37"
            width="58"
            height="139"
            rx="3"
            fill="#E8F0F0"
          />

          <rect
            x="225"
            y="62"
            width="45"
            height="114"
            rx="3"
            fill="#F1F5F9"
          />

          <rect
            x="276"
            y="43"
            width="57"
            height="133"
            rx="3"
            fill="#E8F0F0"
          />

          {/* building windows */}

          <g opacity="0.65" fill="#FFFFFF">
            <rect x="75" y="64" width="8" height="8" rx="1" />
            <rect x="94" y="64" width="8" height="8" rx="1" />
            <rect x="75" y="82" width="8" height="8" rx="1" />
            <rect x="94" y="82" width="8" height="8" rx="1" />
            <rect x="75" y="100" width="8" height="8" rx="1" />
            <rect x="94" y="100" width="8" height="8" rx="1" />

            <rect x="174" y="51" width="9" height="8" rx="1" />
            <rect x="193" y="51" width="9" height="8" rx="1" />
            <rect x="174" y="69" width="9" height="8" rx="1" />
            <rect x="193" y="69" width="9" height="8" rx="1" />
            <rect x="174" y="87" width="9" height="8" rx="1" />
            <rect x="193" y="87" width="9" height="8" rx="1" />

            <rect x="290" y="57" width="9" height="8" rx="1" />
            <rect x="309" y="57" width="9" height="8" rx="1" />
            <rect x="290" y="75" width="9" height="8" rx="1" />
            <rect x="309" y="75" width="9" height="8" rx="1" />
          </g>

          {/* small rooftop antennas */}

          <line
            x1="184"
            y1="37"
            x2="184"
            y2="26"
            stroke="#CBD5E1"
            strokeWidth="2"
          />

          <line
            x1="304"
            y1="43"
            x2="304"
            y2="31"
            stroke="#CBD5E1"
            strokeWidth="2"
          />

          {/* subtle ground greenery */}

          <circle cx="32" cy="158" r="17" fill="#ECFDF5" />
          <circle cx="51" cy="157" r="22" fill="#ECFDF5" />

          <circle cx="320" cy="158" r="20" fill="#ECFDF5" />
          <circle cx="338" cy="160" r="16" fill="#ECFDF5" />
        </svg>

        {/* =======================================================
            MOVING PARALLAX ROAD BACKGROUND
            ======================================================= */}

        <div
          className="
            absolute
            left-0
            right-0
            bottom-[27px]
            h-[38px]
            overflow-hidden
            pointer-events-none
          "
        >
          <div className="road-background-scroll flex w-[720px] h-full">
            <svg
              width="360"
              height="38"
              viewBox="0 0 360 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M0 35H360"
                stroke="#DCE7E5"
                strokeWidth="2"
              />

              <path
                d="M0 22H360"
                stroke="#E8F3F1"
                strokeWidth="1"
              />

              <path
                d="M20 18H75"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M112 12H158"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M220 19H282"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M310 11H348"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            <svg
              width="360"
              height="38"
              viewBox="0 0 360 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M0 35H360"
                stroke="#DCE7E5"
                strokeWidth="2"
              />

              <path
                d="M0 22H360"
                stroke="#E8F3F1"
                strokeWidth="1"
              />

              <path
                d="M20 18H75"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M112 12H158"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M220 19H282"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <path
                d="M310 11H348"
                stroke="#D9EFEB"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* =======================================================
            TRUCK
            IMPORTANT:
            - Truck body stays completely stationary.
            - Wheels rotate using SVG animateTransform.
            - No CSS transform is applied to wheel groups.
            ======================================================= */}

        <svg
          className="
            absolute
            left-1/2
            bottom-[39px]
            -translate-x-1/2
            w-[330px]
            h-auto
            z-20
            overflow-visible
          "
          viewBox="0 0 360 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* opaque truck green */}
            <linearGradient
              id="cargoGreen"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0"
                stopColor="#12A96B"
              />
              <stop
                offset="1"
                stopColor="#087A4E"
              />
            </linearGradient>

            <linearGradient
              id="cabGreen"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0"
                stopColor="#087A4E"
              />
              <stop
                offset="1"
                stopColor="#034C35"
              />
            </linearGradient>

            <linearGradient
              id="windowGlass"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0"
                stopColor="#D9FFF2"
              />
              <stop
                offset="1"
                stopColor="#A7EBD5"
              />
            </linearGradient>

            <linearGradient
              id="wheelGreen"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0"
                stopColor="#A3F45A"
              />
              <stop
                offset="1"
                stopColor="#5CCB39"
              />
            </linearGradient>

            <filter
              id="truckShadow"
              x="-30%"
              y="-30%"
              width="160%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="3"
                floodColor="#0F172A"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          {/* =====================================================
              TRUCK GROUND SHADOW
              ===================================================== */}

          <ellipse
            cx="180"
            cy="139"
            rx="137"
            ry="7"
            fill="#64748B"
            opacity="0.18"
          />

          {/* =====================================================
              CARGO BOX
              OPAQUE - NO TRANSPARENCY
              ===================================================== */}

          <g filter="url(#truckShadow)">
            <rect
              x="42"
              y="38"
              width="207"
              height="95"
              rx="6"
              fill="url(#cargoGreen)"
            />

            {/* top edge */}
            <rect
              x="42"
              y="36"
              width="207"
              height="5"
              rx="2.5"
              fill="#07905B"
            />

            <rect
              x="51"
              y="38"
              width="188"
              height="2"
              rx="1"
              fill="#5BE0AF"
              opacity="0.8"
            />

            {/* vertical cargo panel lines */}

            <path
              d="M86 42V130"
              stroke="#056B46"
              strokeWidth="1.4"
              opacity="0.55"
            />

            <path
              d="M128 42V130"
              stroke="#056B46"
              strokeWidth="1.4"
              opacity="0.55"
            />

            <path
              d="M170 42V130"
              stroke="#056B46"
              strokeWidth="1.4"
              opacity="0.55"
            />

            <path
              d="M212 42V130"
              stroke="#056B46"
              strokeWidth="1.4"
              opacity="0.55"
            />

            {/* bottom cargo rail */}

            <rect
              x="42"
              y="127"
              width="207"
              height="7"
              rx="2"
              fill="#05613F"
            />

            <rect
              x="49"
              y="127"
              width="190"
              height="2"
              fill="#5BE0AF"
              opacity="0.75"
            />
          </g>

          {/* =====================================================
              GROCERY PRODUCTS
              INSIDE THE CARGO AREA
              ===================================================== */}

          <g>
            {/* red apple */}
            <circle
              cx="76"
              cy="84"
              r="14"
              fill="#F04444"
            />
            <path
              d="M77 69C78 65 81 63 85 62"
              stroke="#166534"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <ellipse
              cx="84"
              cy="65"
              rx="6"
              ry="3"
              fill="#4ADE80"
              transform="rotate(-25 84 65)"
            />

            {/* orange */}
            <circle
              cx="108"
              cy="99"
              r="15"
              fill="#F97316"
            />

            {/* green apple */}
            <circle
              cx="137"
              cy="83"
              r="15"
              fill="#22C55E"
            />

            {/* tomato */}
            <circle
              cx="165"
              cy="101"
              r="15"
              fill="#EF4444"
            />

            {/* leafy vegetables */}
            <ellipse
              cx="196"
              cy="91"
              rx="13"
              ry="20"
              fill="#16A34A"
            />

            <ellipse
              cx="210"
              cy="91"
              rx="11"
              ry="18"
              fill="#22C55E"
            />

            <path
              d="M192 110C201 96 207 87 217 79"
              stroke="#86EFAC"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* grocery bottle */}
            <rect
              x="222"
              y="72"
              width="13"
              height="37"
              rx="3"
              fill="#38BDF8"
            />

            <rect
              x="225"
              y="67"
              width="7"
              height="7"
              rx="2"
              fill="#0284C7"
            />
          </g>

          {/* =====================================================
              LARGE CENTER LOGO
              KEPT INSIDE THE CARGO BOX
              ===================================================== */}

          <g transform="translate(143 57)">
            {/* logo background shape */}
            <circle
              cx="0"
              cy="25"
              r="27"
              fill="#087A4E"
              opacity="0.45"
            />

            {/* C */}
            <path
              d="
                M14 8
                C5 2 -9 5 -15 14
                C-22 25 -18 39 -7 45
                C4 51 16 48 23 39
              "
              stroke="#FFFFFF"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
            />

            {/* arrow */}
            <path
              d="M15 16L29 29L15 42"
              stroke="#FFFFFF"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* small green accent */}
            <path
              d="M4 51C14 52 25 48 34 42"
              stroke="#B7F34A"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>

          {/* =====================================================
              CAB
              ===================================================== */}

          <path
            d="
              M249 62
              H291
              C302 62 310 68 315 77
              L329 105
              H249
              Z
            "
            fill="url(#cabGreen)"
          />

          {/* windshield */}

          <path
            d="
              M258 68
              H287
              C294 68 299 72 302 78
              L312 96
              H258
              Z
            "
            fill="url(#windowGlass)"
          />

          {/* windshield divider */}

          <path
            d="M289 69L301 96"
            stroke="#FFFFFF"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* side mirror */}

          <rect
            x="309"
            y="72"
            width="13"
            height="5"
            rx="2"
            fill="#334155"
          />

          <circle
            cx="321"
            cy="74.5"
            r="3"
            fill="#475569"
          />

          {/* cabin door */}

          <path
            d="
              M249 98
              H316
              V126
              H249
              Z
            "
            fill="#05613F"
          />

          {/* door line */}

          <path
            d="M294 98V126"
            stroke="#087A4E"
            strokeWidth="1.5"
          />

          {/* door handle */}

          <rect
            x="300"
            y="106"
            width="13"
            height="2.5"
            rx="1"
            fill="#A7F3D0"
          />

          {/* headlight */}

          <rect
            x="322"
            y="104"
            width="8"
            height="10"
            rx="3"
            fill="#FEF08A"
          />

          {/* front bumper */}

          <rect
            x="318"
            y="122"
            width="22"
            height="8"
            rx="3"
            fill="#172033"
          />

          {/* rear bumper */}

          <rect
            x="34"
            y="121"
            width="13"
            height="11"
            rx="3"
            fill="#172033"
          />

          {/* rear red light */}

          <rect
            x="36"
            y="103"
            width="7"
            height="16"
            rx="2"
            fill="#FB7185"
          />

          {/* =====================================================
              WHEELS
              IMPORTANT:
              animateTransform rotates around EXACT CENTER.
              They CANNOT orbit.
              ===================================================== */}

          {/* BACK WHEEL */}

          <g>
            <circle
              cx="88"
              cy="130"
              r="21"
              fill="#172033"
            />

            <circle
              cx="88"
              cy="130"
              r="15"
              fill="#1F2937"
            />

            {/* only this inner wheel rotates */}
            <g>
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 88 130"
                to="360 88 130"
                dur="0.48s"
                repeatCount="indefinite"
              />

              <circle
                cx="88"
                cy="130"
                r="11"
                fill="url(#wheelGreen)"
              />

              <circle
                cx="88"
                cy="130"
                r="6"
                fill="#F8FAFC"
              />

              <path
                d="M88 120V140"
                stroke="#15803D"
                strokeWidth="2"
              />

              <path
                d="M78 130H98"
                stroke="#15803D"
                strokeWidth="2"
              />

              <circle
                cx="88"
                cy="130"
                r="3"
                fill="#334155"
              />
            </g>
          </g>

          {/* FRONT WHEEL */}

          <g>
            <circle
              cx="286"
              cy="130"
              r="21"
              fill="#172033"
            />

            <circle
              cx="286"
              cy="130"
              r="15"
              fill="#1F2937"
            />

            {/* only this inner wheel rotates */}
            <g>
              <animateTransform
                attributeName="transform"
                attributeType="XML"
                type="rotate"
                from="0 286 130"
                to="360 286 130"
                dur="0.48s"
                repeatCount="indefinite"
              />

              <circle
                cx="286"
                cy="130"
                r="11"
                fill="url(#wheelGreen)"
              />

              <circle
                cx="286"
                cy="130"
                r="6"
                fill="#F8FAFC"
              />

              <path
                d="M286 120V140"
                stroke="#15803D"
                strokeWidth="2"
              />

              <path
                d="M276 130H296"
                stroke="#15803D"
                strokeWidth="2"
              />

              <circle
                cx="286"
                cy="130"
                r="3"
                fill="#334155"
              />
            </g>
          </g>

          {/* =====================================================
              SMALL SPEED PARTICLES BEHIND TRUCK
              ===================================================== */}

          <g opacity="0.7">
            <circle
              cx="18"
              cy="91"
              r="3"
              fill="#34D399"
            />

            <circle
              cx="27"
              cy="104"
              r="2"
              fill="#6EE7B7"
            />

            <circle
              cx="13"
              cy="113"
              r="2"
              fill="#A7F3D0"
            />
          </g>
        </svg>

        {/* =======================================================
            ROAD
            TRUCK WHEELS SIT DIRECTLY ON THIS.
            ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            bottom-[17px]
            w-[330px]
            h-[24px]
            z-30
          "
        >
          {/* road top edge */}

          <div
            className="
              absolute
              top-0
              left-0
              right-0
              h-[3px]
              rounded-t-sm
              bg-[#64748B]
            "
          />

          {/* asphalt */}

          <div
            className="
              absolute
              top-[3px]
              left-0
              right-0
              h-[18px]
              rounded-b-sm
              bg-[#172033]
              overflow-hidden
              shadow-sm
            "
          >
            <div className="road-lane-lines absolute inset-y-0 left-0 w-[660px]">
              <div
                className="
                  absolute
                  top-[8px]
                  left-0
                  w-full
                  h-[3px]
                  opacity-95
                  bg-[repeating-linear-gradient(
                    90deg,
                    #FFFFFF 0px,
                    #FFFFFF 32px,
                    transparent 32px,
                    transparent 60px
                  )]
                "
              />
            </div>
          </div>

          {/* road bottom edge */}

          <div
            className="
              absolute
              bottom-0
              left-0
              right-0
              h-[3px]
              rounded-b-sm
              bg-[#0F172A]
            "
          />
        </div>

        {/* =======================================================
            SMALL CONTACT SHADOW
            ======================================================= */}

        <div
          className="
            absolute
            left-1/2
            -translate-x-1/2
            bottom-[12px]
            w-[245px]
            h-[5px]
            rounded-full
            bg-slate-500/20
            blur-sm
            z-10
          "
        />
      </div>

      {/* =========================================================
          HOME STATUS ONLY
          ========================================================= */}

      {showStatus && (
        <div
          className="
            mt-3
            flex
            flex-col
            items-center
            text-center
            max-w-xs
            animate-loader-fade
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              px-3
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
                  opacity-75
                  animate-ping
                "
              />

              <span
                className="
                  relative
                  inline-flex
                  rounded-full
                  h-2
                  w-2
                  bg-emerald-600
                "
              />
            </span>

            <p
              className="
                text-xs
                font-bold
                text-emerald-950
                tracking-tight
              "
            >
              {activeMessage}
            </p>
          </div>

          <p
            className="
              mt-1.5
              text-[11px]
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
        @keyframes roadBackgroundScroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-360px);
          }
        }

        .road-background-scroll {
          animation: roadBackgroundScroll 3.5s linear infinite;
        }

        @keyframes roadLaneScroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-60px);
          }
        }

        .road-lane-lines {
          animation: roadLaneScroll 0.48s linear infinite;
        }

        @keyframes loaderFade {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .animate-loader-fade {
          animation: loaderFade 0.18s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .road-background-scroll,
          .road-lane-lines {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
});