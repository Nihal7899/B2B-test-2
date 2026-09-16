import React, { useEffect, useState } from 'react';

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
  'Optimizing supply chain routes...',
  'Sourcing farm-fresh produce...',
  'Palletizing B2B inventory...',
  'Routing your express store delivery...',
  'Quality checking fresh harvests...',
  'Securing fleet for transit...',
  'Syncing warehouse logistics...',
  'Finalizing wholesale dispatch...',
];

/* =========================================================
   INLINE CLOUDS
   ========================================================= */

function Clouds() {
  return (
    <div className="absolute top-[6px] left-0 w-full h-[100px] overflow-hidden pointer-events-none z-0">
      <div className="flex w-[1260px] animate-clouds-scroll opacity-60">
        {[1, 2, 3].map((key) => (
          <svg
            key={key}
            viewBox="0 0 420 50"
            className="w-[420px] h-[50px] shrink-0"
            fill="none"
          >
            <path
              d="M40 28C40 22 45 18 51 18C53 18 55 18.8 56.5 20C58.5 15.5 63 13 68 13C75 13 81 18.5 81 25.5C83 25.5 85 27.5 85 29.5C85 32 83 34 80.5 34H44C41.8 34 40 31.5 40 28Z"
              fill="#e2efe6"
            />

            <path
              d="M190 22C190 16.5 194.5 12 200 12C201.8 12 203.5 12.6 205 13.8C207 9.8 211 7.5 215.5 7.5C222 7.5 227 12.5 227 19C229 19 231 21 231 23C231 25.5 229 27.5 226.5 27.5H194C191.8 27.5 190 25 190 22Z"
              fill="#d9ebdf"
            />

            <path
              d="M330 25C330 20 334 16 339 16C340.5 16 342 16.5 343.5 17.5C345 14 349 12 353 12C359 12 364 16.5 364 22.5C365.5 22.5 367 24 367 26C367 28.5 365 30.5 363 30.5H334C331.8 30.5 330 28.2 330 25Z"
              fill="#e2efe6"
            />
          </svg>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   INLINE CITY
   ========================================================= */

function Skyline() {
  return (
    <div className="absolute bottom-[56px] left-0 w-full h-[400px] overflow-hidden pointer-events-none z-0 flex items-end">
      <div className="flex w-[1260px] animate-skyline-scroll opacity-85">
        {[1, 2, 3].map((key) => (
          <svg
            key={key}
            viewBox="0 0 420 190"
            className="w-[420px] h-[190px] shrink-0"
            fill="none"
          >
            {/* Building 1 */}
            <rect x="0" y="52" width="60" height="138" rx="3" fill="#d9ebdf" />
            <rect x="6" y="58" width="48" height="6" rx="1" fill="#c3decc" />

            {[74, 82, 90, 98].map((y) => (
              <line
                key={y}
                x1="12"
                y1={y}
                x2="48"
                y2={y}
                stroke="#f0f7f2"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            ))}

            <rect x="15" y="116" width="30" height="40" rx="1.5" fill="#cbe3d3" />

            {/* Building 2 */}
            <rect x="68" y="22" width="56" height="168" rx="2" fill="#e2efe6" />
            <rect x="74" y="26" width="44" height="4" fill="#cbe3d3" />

            <line
              x1="78"
              y1="10"
              x2="78"
              y2="22"
              stroke="#b1d3bc"
              strokeWidth="2"
            />

            <line
              x1="114"
              y1="10"
              x2="114"
              y2="22"
              stroke="#b1d3bc"
              strokeWidth="2"
            />

            {[38, 60, 82].map((y) =>
              [76, 91, 106].map((x) => (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="10"
                  height="15"
                  rx="1"
                  fill="#f0f7f2"
                />
              ))
            )}

            {/* Building 3 */}
            <rect
              x="132"
              y="68"
              width="66"
              height="122"
              rx="3"
              fill="#d9ebdf"
            />

            <path
              d="M129 78H201L197 90H133L129 78Z"
              fill="#c3decc"
            />

            <path
              d="M134 90C134 92.5 136.5 94 139 94C141.5 94 144 92.5 144 90H134Z"
              fill="#b1d3bc"
            />

            <path
              d="M144 90C144 92.5 146.5 94 149 94C151.5 94 154 92.5 154 90H144Z"
              fill="#b1d3bc"
            />

            <path
              d="M154 90C154 92.5 156.5 94 159 94C161.5 94 164 92.5 164 90H154Z"
              fill="#b1d3bc"
            />

            <path
              d="M164 90C164 92.5 166.5 94 169 94C171.5 94 174 92.5 174 90H164Z"
              fill="#b1d3bc"
            />

            <path
              d="M174 90C174 92.5 176.5 94 179 94C181.5 94 184 92.5 184 90H174Z"
              fill="#b1d3bc"
            />

            <path
              d="M184 90C184 92.5 186.5 94 189 94C191.5 94 194 92.5 194 90H184Z"
              fill="#b1d3bc"
            />

            {[143, 160, 177].map((x) => (
              <path
                key={x}
                d={`M${x} 118V106C${x} 103 ${x + 2} 101 ${x + 5} 101C${x + 8} 101 ${
                  x + 10
                } 103 ${x + 10} 106V118H${x}Z`}
                fill="#f0f7f2"
              />
            ))}

            {/* Building 4 */}
            <rect x="206" y="50" width="68" height="140" fill="#cbe3d3" />
            <rect x="216" y="24" width="48" height="26" fill="#d9ebdf" />
            <rect x="228" y="8" width="24" height="16" fill="#e2efe6" />

            <line
              x1="240"
              y1="-4"
              x2="240"
              y2="8"
              stroke="#b1d3bc"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {[224, 240, 256].map((x) =>
              [62, 78, 94].map((y) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="2.2"
                  fill="#f0f7f2"
                />
              ))
            )}

            {/* Tall narrow buildings */}
            <rect x="282" y="55" width="28" height="135" fill="#e2efe6" />
            <ellipse cx="296" cy="55" rx="14" ry="7" fill="#d9ebdf" />

            <rect x="314" y="45" width="30" height="145" fill="#d9ebdf" />
            <ellipse cx="329" cy="45" rx="15" ry="8" fill="#cbe3d3" />

            <rect x="296" y="68" width="33" height="4" fill="#b1d3bc" />

            {/* Building 5 */}
            <rect
              x="352"
              y="40"
              width="60"
              height="150"
              rx="2"
              fill="#cbe3d3"
            />

            <rect
              x="360"
              y="45"
              width="44"
              height="4"
              fill="#b1d3bc"
            />

            {[56, 80].map((y) =>
              [362, 382].map((x) => (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width="10"
                  height="16"
                  rx="1"
                  fill="#f0f7f2"
                />
              ))
            )}
          </svg>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   GROCERY LOAD
   IMPORTANT:
   This is a separate SVG group so it can animate independently.
   ========================================================= */

function GroceryLoad() {
  return (
    <g id="grocery-load" className="animate-produce-jiggle">
      {/* Lettuce */}
      <circle cx="280" cy="350" r="35" fill="url(#lettuceGrad1)" />
      <circle cx="315" cy="330" r="40" fill="url(#lettuceGrad2)" />
      <circle cx="355" cy="350" r="35" fill="url(#lettuceGrad1)" />

      {/* Wooden crate */}
      <path
        d="M400 400L450 400L465 300L415 315Z"
        fill="#D4A373"
      />

      <path
        d="M410 295L460 280L465 300L415 315Z"
        fill="#BC8A5F"
      />

      <ellipse
        cx="430"
        cy="350"
        rx="12"
        ry="12"
        fill="#E76F51"
        transform="rotate(-15 430 350)"
      />

      <ellipse
        cx="430"
        cy="350"
        rx="5"
        ry="5"
        fill="#F4A261"
        transform="rotate(-15 430 350)"
      />

      {/* Milk */}
      <g transform="translate(385 360) rotate(12)">
        <rect
          x="-18"
          y="-60"
          width="36"
          height="100"
          rx="6"
          fill="url(#milkGrad)"
        />

        <rect
          x="-18"
          y="-20"
          width="36"
          height="35"
          fill="#2196F3"
        />

        <circle cx="0" cy="-2" r="8" fill="#FFFFFF" />
        <circle cx="0" cy="-2" r="4" fill="#2196F3" />

        <rect
          x="-10"
          y="-75"
          width="20"
          height="20"
          fill="#E3F2FD"
        />

        <rect
          x="-12"
          y="-80"
          width="24"
          height="10"
          rx="3"
          fill="#0D47A1"
        />

        <path
          d="M-12 -50L-12 30"
          stroke="#FFFFFF"
          strokeWidth="3"
          opacity=".6"
          strokeLinecap="round"
        />
      </g>

      {/* Baguette */}
      <g transform="translate(350 345) rotate(25)">
        <ellipse
          cx="0"
          cy="0"
          rx="20"
          ry="70"
          fill="url(#baguetteGrad)"
        />

        <path
          d="M-10 -40Q0 -35 12 -25"
          fill="none"
          stroke="#5D4037"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M-12 -10Q0 -5 12 5"
          fill="none"
          stroke="#5D4037"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M-12 20Q0 25 12 35"
          fill="none"
          stroke="#5D4037"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <ellipse
          cx="-8"
          cy="0"
          rx="4"
          ry="55"
          fill="#FFFFFF"
          opacity=".3"
        />
      </g>

      {/* Red peppers */}
      <g>
        <ellipse
          cx="315"
          cy="375"
          rx="20"
          ry="28"
          fill="url(#pepperGrad)"
        />

        <ellipse
          cx="295"
          cy="385"
          rx="18"
          ry="25"
          fill="url(#pepperGrad)"
        />

        <ellipse
          cx="335"
          cy="385"
          rx="18"
          ry="25"
          fill="url(#pepperGrad)"
        />

        <path
          d="M315 348Q320 335 330 340"
          fill="none"
          stroke="#1B5E20"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <ellipse
          cx="308"
          cy="360"
          rx="4"
          ry="10"
          fill="#FFFFFF"
          opacity=".5"
          transform="rotate(-15 308 360)"
        />
      </g>

      {/* Tomato */}
      <g>
        <circle
          cx="365"
          cy="390"
          r="24"
          fill="url(#tomatoGrad)"
        />

        <path
          d="M365 366L358 373M365 366L372 373M365 366L365 375M365 366L360 361"
          stroke="#1B5E20"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <ellipse
          cx="355"
          cy="378"
          rx="6"
          ry="4"
          fill="#FFFFFF"
          opacity=".5"
          transform="rotate(-30 355 378)"
        />
      </g>

      {/* Bananas */}
      <g>
        <path
          d="M235 340C240 390 270 405 295 395C290 365 260 350 235 340Z"
          fill="#FBC02D"
        />

        <path
          d="M245 330C255 380 285 395 310 385C305 355 275 340 245 330Z"
          fill="#FFF176"
        />

        <path
          d="M235 340C240 390 270 405 295 395"
          fill="none"
          stroke="#F57F17"
          strokeWidth="2"
        />

        <path
          d="M235 340L225 330L240 325Z"
          fill="#8BC34A"
        />
      </g>
    </g>
  );
}

/* =========================================================
   WHEEL
   Each wheel is independent and can rotate.
   ========================================================= */

function Wheel({
  cx,
  cy,
  id,
}: {
  cx: number;
  cy: number;
  id: string;
}) {
  return (
    <g
      id={id}
      className="wheel"
      style={{
        transformBox: 'fill-box',
        transformOrigin: 'center',
      }}
    >
      {/* Outer tyre */}
      <circle
        cx={cx}
        cy={cy}
        r="95"
        fill="#0D1520"
        stroke="#293A4E"
        strokeWidth="13"
      />

      {/* Inner tyre */}
      <circle
        cx={cx}
        cy={cy}
        r="72"
        fill="url(#tire)"
        stroke="#3A4B5E"
        strokeWidth="7"
      />

      {/* Alloy */}
      <circle
        cx={cx}
        cy={cy}
        r="50"
        fill="url(#metal)"
        stroke="#6E7C8C"
        strokeWidth="4"
      />

      {/* Alloy spokes */}
      <g fill="#2C3B4C">
        <path
          d={`M${cx - 9} ${cy - 47}L${cx} ${cy}L${cx + 9} ${cy - 47}Q${cx} ${cy - 52} ${cx - 9} ${cy - 47}Z`}
        />

        <path
          d={`M${cx + 43} ${cy - 26}L${cx} ${cy}L${cx + 41} ${cy + 7}Q${cx + 47} ${cy - 11} ${cx + 43} ${cy - 26}Z`}
        />

        <path
          d={`M${cx + 33} ${cy + 39}L${cx} ${cy}L${cx - 7} ${cy + 45}Q${cx + 14} ${cy + 49} ${cx + 33} ${cy + 39}Z`}
        />

        <path
          d={`M${cx - 43} ${cy + 37}L${cx} ${cy}L${cx - 41} ${cy - 7}Q${cx - 47} ${cy + 16} ${cx - 43} ${cy + 37}Z`}
        />

        <path
          d={`M${cx - 42} ${cy - 37}L${cx} ${cy}L${cx + 7} ${cy - 45}Q${cx - 18} ${cy - 46} ${cx - 42} ${cy - 37}Z`}
        />
      </g>

      {/* Green hub */}
      <circle
        cx={cx}
        cy={cy}
        r="19"
        fill="#18B66A"
        stroke="#E4EBF1"
        strokeWidth="5"
      />

      <circle
        cx={cx}
        cy={cy}
        r="7"
        fill="#075B3A"
      />
    </g>
  );
}

/* =========================================================
   TRUCK
   Everything is inline and separated into groups.
   ========================================================= */

function Truck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-50 -350 1500 1100"
      className="w-full h-auto"
      fill="none"
      role="img"
      aria-label="Modern dark green grocery delivery truck"
    >
      <defs>
        <linearGradient
          id="greenBody"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#55D16D" />
          <stop offset=".42" stopColor="#39BA53" />
          <stop offset="1" stopColor="#258E3C" />
        </linearGradient>

        <linearGradient
          id="greenCab"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#097C44" />
          <stop offset=".55" stopColor="#04572F" />
          <stop offset="1" stopColor="#023D20" />
        </linearGradient>

        <linearGradient
          id="glass"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#EAFBFF" />
          <stop offset=".27" stopColor="#A8DBE9" />
          <stop offset=".72" stopColor="#4A89AC" />
          <stop offset="1" stopColor="#214C69" />
        </linearGradient>

        <linearGradient
          id="glassDark"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#D7F7FF" />
          <stop offset=".45" stopColor="#79B8D3" />
          <stop offset="1" stopColor="#244A67" />
        </linearGradient>

        <linearGradient
          id="metal"
          x1="0"
          y1="0"
          x2=".9"
          y2="1"
        >
          <stop offset="0" stopColor="#F7FAFD" />
          <stop offset=".35" stopColor="#B9C5D1" />
          <stop offset=".65" stopColor="#788697" />
          <stop offset="1" stopColor="#3D4856" />
        </linearGradient>

        <linearGradient
          id="tire"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#273548" />
          <stop offset=".5" stopColor="#121C29" />
          <stop offset="1" stopColor="#070C13" />
        </linearGradient>

        <linearGradient
          id="bumper"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" stopColor="#324255" />
          <stop offset="1" stopColor="#172333" />
        </linearGradient>

        <linearGradient
          id="lamp"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".58" stopColor="#FFF5BC" />
          <stop offset="1" stopColor="#F5CF63" />
        </linearGradient>

        <radialGradient
          id="tomatoGrad"
          cx="30%"
          cy="30%"
          r="70%"
        >
          <stop offset="0%" stopColor="#FF8A80" />
          <stop offset="40%" stopColor="#E53935" />
          <stop offset="80%" stopColor="#C62828" />
          <stop offset="100%" stopColor="#8E0000" />
        </radialGradient>

        <radialGradient
          id="pepperGrad"
          cx="35%"
          cy="30%"
          r="70%"
        >
          <stop offset="0%" stopColor="#FF5252" />
          <stop offset="50%" stopColor="#D32F2F" />
          <stop offset="100%" stopColor="#B71C1C" />
        </radialGradient>

        <linearGradient
          id="baguetteGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFCC80" />
          <stop offset="40%" stopColor="#E68A00" />
          <stop offset="80%" stopColor="#B35900" />
          <stop offset="100%" stopColor="#663300" />
        </linearGradient>

        <linearGradient
          id="milkGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="80%" stopColor="#F0F8FF" />
          <stop offset="100%" stopColor="#D0E4F5" />
        </linearGradient>

        <radialGradient
          id="lettuceGrad1"
          cx="40%"
          cy="40%"
          r="60%"
        >
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="70%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#2E7D32" />
        </radialGradient>

        <radialGradient
          id="lettuceGrad2"
          cx="30%"
          cy="30%"
          r="60%"
        >
          <stop offset="0%" stopColor="#AED581" />
          <stop offset="80%" stopColor="#689F38" />
          <stop offset="100%" stopColor="#33691E" />
        </radialGradient>
      </defs>

      {/* =====================================================
          SPEED LINES
          ===================================================== */}

      <g
        id="speed-lines"
        className="animate-speed-lines"
        fill="none"
        strokeLinecap="round"
      >
        <path
          d="M80 300H240"
          stroke="#1AAF69"
          strokeWidth="14"
        />

        <path
          d="M45 347H265"
          stroke="#48D18A"
          strokeWidth="10"
        />

        <path
          d="M105 390H235"
          stroke="#0B7C4B"
          strokeWidth="9"
        />

        <path
          d="M145 430H220"
          stroke="#68E5A2"
          strokeWidth="7"
        />
      </g>

      {/* =====================================================
          MOVING TRUCK BODY
          Wheels remain outside this group.
          ===================================================== */}

      <g id="truck-body" className="animate-truck-body">

        {/* Grocery load sits behind cargo box */}
        <g transform="translate(-360 -920) scale(2.66)">
          <GroceryLoad />
        </g>

        {/* ===================================================
            CARGO BOX
            =================================================== */}

        <g id="cargo-container">
          <path
            d="M252 94Q252 72 274 72H850Q872 72 872 95V517Q872 538 850 538H272Q248 538 248 515V118Q248 94 252 94Z"
            fill="url(#greenBody)"
            stroke="#064F34"
            strokeWidth="8"
          />

          <path
            d="M269 99H850"
            stroke="#B7F4D2"
            strokeWidth="6"
            strokeLinecap="round"
            opacity=".58"
          />

          <path
            d="M270 122V485"
            stroke="#D6F8E5"
            strokeWidth="3"
            opacity=".12"
          />

          <path
            d="M250 447C415 415 604 385 752 419C809 432 843 407 871 367V516H250Z"
            fill="#0B7648"
            opacity=".28"
          />

          <path
            d="M267 148H516"
            stroke="#E4FFF0"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".1"
          />

          <path
            d="M272 500Q440 464 622 482Q754 495 855 455"
            fill="none"
            stroke="#6CE6A6"
            strokeWidth="5"
            opacity=".32"
          />

          <path
            d="M838 108V505"
            stroke="#064F34"
            strokeWidth="5"
            opacity=".34"
          />
        </g>

        {/* ===================================================
            CHASSIS
            =================================================== */}

        <g id="chassis">
          <path
            d="M238 514H919Q942 514 960 533L978 559H220L229 534Q232 514 238 514Z"
            fill="#142233"
            stroke="#0B1725"
            strokeWidth="6"
          />

          <path
            d="M236 531H947"
            stroke="#5C6C7E"
            strokeWidth="7"
            opacity=".6"
          />
        </g>

        {/* ===================================================
            DRIVER CABIN
            =================================================== */}

        <g id="driver-cabin">
          <path
            d="M850 164Q850 134 880 134H1000Q1066 134 1100 187L1198 345Q1208 361 1208 382V511Q1208 538 1181 538H850Z"
            fill="url(#greenCab)"
            stroke="#064F34"
            strokeWidth="8"
          />

          {/* Main windshield */}
          <path
            d="M880 154H992Q1034 154 1059 193L1099 258H878Z"
            fill="url(#glass)"
            stroke="#172C3E"
            strokeWidth="9"
          />

          {/* Glass reflection */}
          <path
            d="M890 165H977Q1009 165 1028 193L1052 228"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
            opacity=".28"
          />

          {/* Side glass */}
          <path
            d="M1110 218L1175 323Q1181 333 1183 347H1107Z"
            fill="url(#glassDark)"
            stroke="#172C3E"
            strokeWidth="9"
          />

          {/* Door divider */}
          <path
            d="M1099 258V373"
            stroke="#0E5B3E"
            strokeWidth="11"
          />

          <path
            d="M862 392Q995 375 1172 406"
            fill="none"
            stroke="#8FEABA"
            strokeWidth="5"
            opacity=".28"
          />

          <path
            d="M866 264V501Q866 518 883 522H1060V263"
            fill="none"
            stroke="#075B3C"
            strokeWidth="5"
            opacity=".48"
          />

          {/* Door handle */}
          <path
            d="M895 320H959"
            stroke="#102232"
            strokeWidth="12"
            strokeLinecap="round"
          />

          <path
            d="M900 320H950"
            stroke="#88D8B0"
            strokeWidth="3"
            strokeLinecap="round"
            opacity=".35"
          />

          {/* Mirror */}
          <g id="mirror">
            <rect
              x="1054"
              y="267"
              width="30"
              height="69"
              rx="12"
              fill="#182637"
            />

            <rect
              x="1078"
              y="276"
              width="45"
              height="24"
              rx="10"
              fill="#182637"
            />

            <rect
              x="1085"
              y="281"
              width="31"
              height="14"
              rx="7"
              fill="#5A6D82"
            />

            <path
              d="M1086 285H1110"
              stroke="#CBE9F2"
              strokeWidth="2"
              opacity=".4"
            />
          </g>

          {/* Lower door details */}
          <path
            d="M1125 424H1174"
            stroke="#0A5238"
            strokeWidth="9"
            strokeLinecap="round"
          />

          <path
            d="M1134 440H1160"
            stroke="#9FF0BE"
            strokeWidth="3"
            opacity=".32"
            strokeLinecap="round"
          />

          {/* Headlights */}
          <g id="headlights">
            <path
              d="M1158 353Q1158 340 1170 343L1192 349Q1202 351 1203 362V399Q1203 410 1191 410L1169 405Q1158 402 1158 390Z"
              fill="url(#lamp)"
              stroke="#253547"
              strokeWidth="7"
            />

            <path
              d="M1167 355L1192 362V393L1167 387Z"
              fill="#FFF9CF"
              opacity=".8"
            />

            <rect
              x="1167"
              y="421"
              width="32"
              height="19"
              rx="6"
              fill="#FFAD28"
              stroke="#A35A12"
              strokeWidth="4"
            />
          </g>

          {/* Front bumper */}
          <path
            d="M1128 475Q1165 462 1202 475V518H1128Z"
            fill="#132231"
          />

          <path
            d="M1141 490H1192"
            stroke="#526275"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".65"
          />

          <path
            d="M1141 502H1179"
            stroke="#526275"
            strokeWidth="5"
            strokeLinecap="round"
            opacity=".4"
          />
        </g>

        {/* ===================================================
            WHEEL ARCHES
            =================================================== */}

        <g id="wheel-arches" fill="#172535">
          <path
            d="M277 545Q277 431 385 431Q493 431 493 545H459Q453 470 385 470Q317 470 311 545Z"
          />

          <path
            d="M913 545Q913 431 1021 431Q1129 431 1129 545H1095Q1089 470 1021 470Q953 470 947 545Z"
          />
        </g>

        {/* ===================================================
            BUMPERS
            =================================================== */}

        <g id="bumpers">
          <path
            d="M1124 510H1220V550H1115Q1104 550 1104 537V525Q1104 510 1124 510Z"
            fill="url(#bumper)"
            stroke="#0C1826"
            strokeWidth="5"
          />

          <path
            d="M1131 527H1204"
            stroke="#6C7C8D"
            strokeWidth="6"
            strokeLinecap="round"
            opacity=".65"
          />

          <path
            d="M193 510H286V548H187Q176 548 176 536V524Q176 510 193 510Z"
            fill="url(#bumper)"
            stroke="#0C1826"
            strokeWidth="5"
          />
        </g>

        {/* Body highlights */}
        <g id="ui-highlights" fill="none" strokeLinecap="round">
          <path
            d="M277 147H836"
            stroke="#D7FFE7"
            strokeWidth="3"
            opacity=".22"
          />

          <path
            d="M861 147H996"
            stroke="#D7FFE7"
            strokeWidth="3"
            opacity=".18"
          />
        </g>
      </g>

      {/* =====================================================
          WHEELS ARE OUTSIDE TRUCK BODY
          So suspension doesn't move their contact point.
          ===================================================== */}

      <Wheel
        cx={385}
        cy={541}
        id="rear-wheel"
      />

      <Wheel
        cx={1021}
        cy={541}
        id="front-wheel"
      />
    </svg>
  );
}

/* =========================================================
   MAIN APP LOADER
   ========================================================= */

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
      setMsgIndex(
        (prev) => (prev + 1) % HOME_MESSAGES.length
      );
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
        className={`relative flex flex-col items-center justify-center w-full ${scaleClass}`}
      >
        {/* =====================================================
            MAIN VIEWPORT
            ===================================================== */}

        <div className="relative w-full max-w-[800px] h-[448px] sm:h-[480px] flex items-end justify-center overflow-hidden pb-5">

          {/* Clouds */}
          <Clouds />

          {/* City */}
          <Skyline />

          {/* =================================================
              TRUCK
              ================================================= */}

          <div className="relative z-10 w-[304px] sm:w-[360px] pointer-events-none translate-y-5">
            <Truck />
          </div>
        </div>

        {/* =====================================================
            STATUS / PROGRESS
            ===================================================== */}

        {showStatus && (
          <div className="mt-8 flex flex-col items-center justify-center animate-fade-in">

            <div className="relative flex items-center justify-between w-64 mb-3">

              {/* Background line */}
              <div className="absolute top-1/2 left-0 right-0 h-[2.5px] -translate-y-1/2 bg-[#cbd5e1] z-0" />

              {/* Progress line */}
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
                      <div className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-[#22c55e] bg-white transition-all duration-300 scale-110 shadow-xs">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e] animate-pulse" />
                      </div>
                    ) : isCompleted ? (
                      <div className="h-3.5 w-3.5 rounded-full bg-[#22c55e] transition-all duration-300" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full bg-[#cbd5e1] transition-all duration-300" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="h-6 flex items-center justify-center">
              <p
                key={msgIndex}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-800 tracking-tight animate-text-fade"
              >
                {HOME_MESSAGES[msgIndex]}
                <span className="text-emerald-500 text-base">
                  🍃
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================
          ANIMATIONS
          ======================================================= */}

      <style>{`

        /* =====================================================
           BUILDINGS
           ===================================================== */

        @keyframes skylineInfiniteScroll {
          0% {
            transform: translate3d(0, 0, 0);
          }

          100% {
            transform: translate3d(-420px, 0, 0);
          }
        }

        .animate-skyline-scroll {
          animation: skylineInfiniteScroll 5.6s linear infinite;
        }

        /* =====================================================
           CLOUDS
           ===================================================== */

        @keyframes cloudsDrift {
          0% {
            transform: translate3d(0, 0, 0);
          }

          100% {
            transform: translate3d(-420px, 0, 0);
          }
        }

        .animate-clouds-scroll {
          animation: cloudsDrift 10s linear infinite;
        }

        /* =====================================================
           WHEELS
           ===================================================== */

        @keyframes spinWheelAnim {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .wheel {
          animation: spinWheelAnim 0.35s linear infinite;
        }

        /* =====================================================
           TRUCK BODY SUSPENSION
           ===================================================== */

        @keyframes truckBodyBounce {
          0%,
          100% {
            transform: translateY(0);
          }

          30% {
            transform: translateY(-4px);
          }

          65% {
            transform: translateY(2px);
          }
        }

        .animate-truck-body {
          animation: truckBodyBounce 0.65s ease-in-out infinite;
        }

        /* =====================================================
           GROCERY LOAD
           ===================================================== */

        @keyframes produceJiggle {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-4px) rotate(-1.5deg);
          }
        }

        .animate-produce-jiggle {
          animation: produceJiggle 0.65s ease-in-out infinite 0.1s;
        }

        /* =====================================================
           SPEED LINES
           ===================================================== */

        @keyframes speedLines {
          0%,
          100% {
            opacity: 0.85;
            transform: translateX(0);
          }

          50% {
            opacity: 0.15;
            transform: translateX(-32px);
          }
        }

        .animate-speed-lines {
          animation: speedLines 0.4s ease-in-out infinite;
        }

        /* =====================================================
           STATUS TEXT
           ===================================================== */

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

        /* =====================================================
           LOADER FADE
           ===================================================== */

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

      `}</style>
    </div>
  );
});