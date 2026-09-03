import React from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  className = '',
}: AppLoaderProps) {
  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-110' : 'scale-100';

  return (
    <div
      className={`flex items-center justify-center bg-white select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 animate-fade-in'
          : 'w-full py-12'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center w-64 h-64 ${scaleClass}`}>
        {/* Ambient Glow */}
        <div className="absolute h-48 w-48 rounded-full bg-emerald-100/60 blur-3xl pointer-events-none" />

        {/* ---------------- LAYER 1: CART BACK WALL (z-10) ---------------- */}
        <div className="absolute bottom-8 w-36 h-28 z-10 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 144 112" className="w-full h-full" fill="none">
            {/* Interior Cavity Depth Shadow */}
            <ellipse cx="72" cy="30" rx="46" ry="14" fill="#011f15" />
            {/* Back Wire Mesh / Inner Slat Grid */}
            <path
              d="M32 28L40 76M52 26L56 78M72 25L72 79M92 26L88 78M112 28L104 76"
              stroke="#034d35"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Cart Handle Back Support */}
            <path
              d="M18 20L32 36"
              stroke="#64748b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="17" cy="19" r="4" fill="#475569" />
          </svg>
        </div>

        {/* ---------------- LAYER 2: FALLING FRUITS (z-20) ---------------- */}
        {/* Positioned between Cart Back (z-10) and Cart Front (z-30) */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-b-3xl">
          {/* 1. CRISP RED APPLE - Arcs from top-left into cart */}
          <div className="absolute left-[20%] top-2 animate-fruit-drop-1">
            <svg viewBox="0 0 40 40" className="h-8 w-8 drop-shadow-md" fill="none">
              <defs>
                <radialGradient id="appleGradLoader" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#ff4d6d" />
                  <stop offset="70%" stopColor="#d90429" />
                  <stop offset="100%" stopColor="#7a0016" />
                </radialGradient>
              </defs>
              <circle cx="20" cy="22" r="13" fill="url(#appleGradLoader)" />
              <path d="M14 16C16 14 19 14 21 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M20 9V5M17 7L20 8L23 6" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* 2. GOLDEN BANANA - Arcs from top-right into cart */}
          <div className="absolute right-[22%] top-0 animate-fruit-drop-2">
            <svg viewBox="0 0 40 40" className="h-9 w-9 drop-shadow-md" fill="none">
              <defs>
                <linearGradient id="bananaGradLoader" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff3b0" />
                  <stop offset="40%" stopColor="#ffd166" />
                  <stop offset="100%" stopColor="#f77f00" />
                </linearGradient>
              </defs>
              <path
                d="M10 26C14 30 24 30 31 20C33 16 33 12 32 8C31 8 29 11 26 13C20 20 14 22 10 26Z"
                fill="url(#bananaGradLoader)"
              />
              <path d="M12 24C17 26 25 24 29 15" stroke="#d48b00" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              <path d="M32 8L35 6" stroke="#588157" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 3. FARM FRESH CARROT - Dives down center-left */}
          <div className="absolute left-[38%] top-1 animate-fruit-drop-3">
            <svg viewBox="0 0 40 40" className="h-8 w-8 drop-shadow-md" fill="none">
              <defs>
                <linearGradient id="carrotGradLoader" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff9f1c" />
                  <stop offset="100%" stopColor="#e85d04" />
                </linearGradient>
              </defs>
              <path d="M28 10L34 5M30 8L36 8M32 12L37 10" stroke="#2d6a4f" strokeWidth="2" strokeLinecap="round" />
              <path d="M28 9C30 11 30 14 27 16L12 31C10 33 8 32 8 30C8 29 10 27 11 25L23 11C25 8 27 8 28 9Z" fill="url(#carrotGradLoader)" />
            </svg>
          </div>

          {/* 4. RIPE AVOCADO - Bounces in center-right */}
          <div className="absolute right-[35%] top-2 animate-fruit-drop-4">
            <svg viewBox="0 0 40 40" className="h-8 w-8 drop-shadow-md" fill="none">
              <path d="M20 7C14 7 10 14 10 23C10 30 14 35 20 35C26 35 30 30 30 23C30 14 26 7 20 7Z" fill="#283618" />
              <path d="M20 9C15 9 12 15 12 23C12 29 15 33 20 33C25 33 28 29 28 23C28 15 25 9 20 9Z" fill="#c3d977" />
              <circle cx="20" cy="24" r="5.5" fill="#603808" />
              <circle cx="18.5" cy="22.5" r="1.5" fill="#ffffff" opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* ---------------- LAYER 3: CART FRONT WALL & CAFKART LOGO (z-30) ---------------- */}
        <div className="absolute bottom-6 w-36 h-28 z-30 flex flex-col items-center justify-center animate-cart-bounce pointer-events-none">
          <div className="relative w-full h-full">
            <svg viewBox="0 0 144 112" className="w-full h-full drop-shadow-xl" fill="none">
              {/* Basket Front Body (Deep CafKart Brand Emerald) */}
              <path
                d="M18 32H126C128.5 32 130 34 129.5 36.5L118 84C117.5 86.5 115 88 112 88H32C29 88 26.5 86.5 26 84L14.5 36.5C14 34 15.5 32 18 32Z"
                fill="url(#cartFrontGrad)"
              />

              {/* Reinforced Upper Rim */}
              <rect x="12" y="28" width="120" height="8" rx="4" fill="#046243" />
              <rect x="14" y="29" width="116" height="2" rx="1" fill="#59D9B6" opacity="0.7" />

              {/* Basket Metal Grid Grooves */}
              <path
                d="M26 48H118M30 64H114M34 78H110"
                stroke="#012b1e"
                strokeWidth="2.5"
                opacity="0.3"
                strokeLinecap="round"
              />

              {/* Wheels Chassis Frame */}
              <path d="M38 88L34 98H110L106 88" stroke="#334155" strokeWidth="3" strokeLinecap="round" />

              {/* Rear Wheel */}
              <circle cx="36" cy="99" r="7" fill="#1e293b" />
              <circle cx="36" cy="99" r="3.5" fill="#94a3b8" />
              <circle cx="36" cy="99" r="1.5" fill="#ffffff" />

              {/* Front Wheel */}
              <circle cx="108" cy="99" r="7" fill="#1e293b" />
              <circle cx="108" cy="99" r="3.5" fill="#94a3b8" />
              <circle cx="108" cy="99" r="1.5" fill="#ffffff" />

              {/* Gradients */}
              <defs>
                <linearGradient id="cartFrontGrad" x1="72" y1="32" x2="72" y2="88" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#02402c" />
                  <stop offset="100%" stopColor="#012217" />
                </linearGradient>
              </defs>
            </svg>

            {/* EMBEDDED CAFKART SPLASH LOGO (Pure Icon, No Text)[span_0](start_span)[span_0](end_span) */}
            <div className="absolute top-[43px] left-1/2 -translate-x-1/2 flex items-center justify-center">
              <div className="h-9 w-9 rounded-full bg-white/10 border border-white/15 p-1 flex items-center justify-center shadow-inner backdrop-blur-2xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1536 1535"
                  className="h-7 w-7"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="cartLogoGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#59D9B6" />
                      <stop offset="100%" stopColor="#58D5A5" />
                    </linearGradient>
                  </defs>

                  {/* Exact Splash White Shape[span_1](start_span)[span_1](end_span) */}
                  <path
                    d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
                    fill="#FFFFFF"
                    fillRule="evenodd"
                  />

                  {/* Exact Splash Green Gradient Shape[span_2](start_span)[span_2](end_span) */}
                  <path
                    d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
                    fill="url(#cartLogoGreen)"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Cart Ground Shadow */}
        <div className="absolute bottom-4 h-2 w-28 rounded-full bg-slate-400/35 blur-xs animate-shadow-pulse" />
      </div>

      {/* Synchronized Keyframes: Fruits Arc High, Fall Inside the Basket & Vanish Behind Front Wall */}
      <style>{`
        @keyframes cartBounce {
          0%, 100% { transform: translateY(0); }
          15% { transform: translateY(2.5px) scale(1.02, 0.98); }
          35% { transform: translateY(-1.5px) scale(0.99, 1.01); }
          50% { transform: translateY(0); }
          65% { transform: translateY(2px) scale(1.02, 0.98); }
          85% { transform: translateY(-1px); }
        }
        .animate-cart-bounce {
          animation: cartBounce 2.4s ease-in-out infinite;
        }

        @keyframes shadowPulse {
          0%, 100% { transform: scaleX(1); opacity: 0.4; }
          15%, 65% { transform: scaleX(1.1); opacity: 0.6; }
          35%, 85% { transform: scaleX(0.92); opacity: 0.3; }
        }
        .animate-shadow-pulse {
          animation: shadowPulse 2.4s ease-in-out infinite;
        }

        /* 1. APPLE: Spawns high-left, arcs into cart, disappears behind front wall */
        @keyframes fruitDrop1 {
          0% {
            transform: translate3d(-30px, -45px, 0) scale(0.4) rotate(-35deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translate3d(-15px, -20px, 0) scale(0.85) rotate(-15deg);
          }
          22% {
            /* Drops right into basket opening */
            transform: translate3d(20px, 48px, 0) scale(0.9) rotate(5deg);
            opacity: 1;
          }
          28% {
            /* Deep inside basket (hidden by front wall) */
            transform: translate3d(22px, 78px, 0) scale(0.55) rotate(15deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
            transform: translate3d(22px, 78px, 0) scale(0.55);
          }
        }
        .animate-fruit-drop-1 {
          animation: fruitDrop1 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite 0s;
        }

        /* 2. BANANA: Spawns high-right, flips down into center of cart */
        @keyframes fruitDrop2 {
          0% {
            transform: translate3d(30px, -45px, 0) scale(0.4) rotate(35deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translate3d(15px, -20px, 0) scale(0.85) rotate(15deg);
          }
          22% {
            transform: translate3d(-18px, 48px, 0) scale(0.9) rotate(-10deg);
            opacity: 1;
          }
          28% {
            transform: translate3d(-20px, 78px, 0) scale(0.55) rotate(-20deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
            transform: translate3d(-20px, 78px, 0) scale(0.55);
          }
        }
        .animate-fruit-drop-2 {
          animation: fruitDrop2 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite 0.6s;
        }

        /* 3. CARROT: Spawns center-left, dives into left side of cart */
        @keyframes fruitDrop3 {
          0% {
            transform: translate3d(-15px, -50px, 0) scale(0.4) rotate(-20deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translate3d(-8px, -22px, 0) scale(0.85) rotate(-5deg);
          }
          22% {
            transform: translate3d(5px, 48px, 0) scale(0.9) rotate(10deg);
            opacity: 1;
          }
          28% {
            transform: translate3d(8px, 78px, 0) scale(0.55) rotate(20deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
            transform: translate3d(8px, 78px, 0) scale(0.55);
          }
        }
        .animate-fruit-drop-3 {
          animation: fruitDrop3 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite 1.2s;
        }

        /* 4. AVOCADO: Spawns center-right, bounces into right side of cart */
        @keyframes fruitDrop4 {
          0% {
            transform: translate3d(15px, -50px, 0) scale(0.4) rotate(20deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translate3d(8px, -22px, 0) scale(0.85) rotate(5deg);
          }
          22% {
            transform: translate3d(-6px, 48px, 0) scale(0.9) rotate(-10deg);
            opacity: 1;
          }
          28% {
            transform: translate3d(-8px, 78px, 0) scale(0.55) rotate(-20deg);
            opacity: 0;
          }
          100% {
            opacity: 0;
            transform: translate3d(-8px, 78px, 0) scale(0.55);
          }
        }
        .animate-fruit-drop-4 {
          animation: fruitDrop4 2.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite 1.8s;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
});
