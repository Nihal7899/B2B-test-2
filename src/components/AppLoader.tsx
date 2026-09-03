import React, { useState, useEffect } from 'react';

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
    if (!showStatus || message) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1250);
    return () => clearInterval(interval);
  }, [showStatus, message, messages]);

  const activeMessage = message || messages[msgIndex];

  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-105' : 'scale-90 sm:scale-95';

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen
          ? 'fixed inset-0 z-50 animate-fade-in px-6'
          : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center w-72 h-48 overflow-hidden rounded-2xl ${scaleClass}`}>
        {/* Ambient Produce Glow */}
        <div className="absolute h-36 w-56 rounded-full bg-emerald-100/40 blur-2xl pointer-events-none" />

        {/* ----------------- PARALLAX LAYER 1: SEAMLESS MOVING CITY BUILDINGS ----------------- */}
        <div className="absolute bottom-9 left-0 w-full h-18 overflow-hidden pointer-events-none z-0">
          <div className="flex w-[560px] animate-skyline-scroll opacity-45">
            {/* Seamless Repeating Skyline Segment A */}
            <svg viewBox="0 0 280 70" className="w-[280px] h-[70px] shrink-0" fill="none">
              {/* Distant Silhouettes (Lighter) */}
              <rect x="15" y="18" width="34" height="52" rx="1" fill="#cbd5e1" />
              <rect x="58" y="10" width="28" height="60" rx="1" fill="#cbd5e1" />
              <rect x="108" y="24" width="40" height="46" rx="1" fill="#cbd5e1" />
              <rect x="168" y="14" width="32" height="56" rx="1" fill="#cbd5e1" />
              <rect x="220" y="20" width="38" height="50" rx="1" fill="#cbd5e1" />

              {/* Foreground Storefronts & Warehouses (Medium Tint) */}
              <rect x="0" y="32" width="22" height="38" fill="#94a3b8" />
              <rect x="36" y="28" width="30" height="42" rx="1" fill="#94a3b8" />
              {/* Warehouse Window Rows */}
              <circle cx="43" cy="36" r="1.5" fill="#ffffff" />
              <circle cx="51" cy="36" r="1.5" fill="#ffffff" />
              <circle cx="59" cy="36" r="1.5" fill="#ffffff" />
              <circle cx="43" cy="44" r="1.5" fill="#ffffff" />
              <circle cx="51" cy="44" r="1.5" fill="#ffffff" />
              <circle cx="59" cy="44" r="1.5" fill="#ffffff" />

              {/* Central Wholesale Hub Building with Flat Roof Awning */}
              <rect x="78" y="22" width="38" height="48" rx="1" fill="#64748b" />
              <rect x="74" y="20" width="46" height="3" fill="#475569" />
              <rect x="84" y="28" width="8" height="6" rx="0.5" fill="#fef3c7" opacity="0.8" />
              <rect x="100" y="28" width="8" height="6" rx="0.5" fill="#fef3c7" opacity="0.8" />
              <rect x="84" y="38" width="8" height="6" rx="0.5" fill="#ffffff" opacity="0.6" />
              <rect x="100" y="38" width="8" height="6" rx="0.5" fill="#ffffff" opacity="0.6" />

              {/* Industrial Silo / Grain Tank */}
              <rect x="154" y="30" width="20" height="40" rx="4" fill="#94a3b8" />
              <ellipse cx="164" cy="30" rx="10" ry="3" fill="#cbd5e1" />

              {/* Commercial HoReCa Depot */}
              <rect x="194" y="26" width="36" height="44" rx="1" fill="#64748b" />
              <rect x="200" y="32" width="24" height="4" rx="0.5" fill="#59D9B6" opacity="0.6" />
              <rect x="246" y="35" width="34" height="35" fill="#94a3b8" />
            </svg>

            {/* Identical Clone Segment B (Guarantees Seamless Infinity Loop) */}
            <svg viewBox="0 0 280 70" className="w-[280px] h-[70px] shrink-0" fill="none">
              <rect x="15" y="18" width="34" height="52" rx="1" fill="#cbd5e1" />
              <rect x="58" y="10" width="28" height="60" rx="1" fill="#cbd5e1" />
              <rect x="108" y="24" width="40" height="46" rx="1" fill="#cbd5e1" />
              <rect x="168" y="14" width="32" height="56" rx="1" fill="#cbd5e1" />
              <rect x="220" y="20" width="38" height="50" rx="1" fill="#cbd5e1" />

              <rect x="0" y="32" width="22" height="38" fill="#94a3b8" />
              <rect x="36" y="28" width="30" height="42" rx="1" fill="#94a3b8" />
              <circle cx="43" cy="36" r="1.5" fill="#ffffff" />
              <circle cx="51" cy="36" r="1.5" fill="#ffffff" />
              <circle cx="59" cy="36" r="1.5" fill="#ffffff" />
              <circle cx="43" cy="44" r="1.5" fill="#ffffff" />
              <circle cx="51" cy="44" r="1.5" fill="#ffffff" />
              <circle cx="59" cy="44" r="1.5" fill="#ffffff" />

              <rect x="78" y="22" width="38" height="48" rx="1" fill="#64748b" />
              <rect x="74" y="20" width="46" height="3" fill="#475569" />
              <rect x="84" y="28" width="8" height="6" rx="0.5" fill="#fef3c7" opacity="0.8" />
              <rect x="100" y="28" width="8" height="6" rx="0.5" fill="#fef3c7" opacity="0.8" />
              <rect x="84" y="38" width="8" height="6" rx="0.5" fill="#ffffff" opacity="0.6" />
              <rect x="100" y="38" width="8" height="6" rx="0.5" fill="#ffffff" opacity="0.6" />

              <rect x="154" y="30" width="20" height="40" rx="4" fill="#94a3b8" />
              <ellipse cx="164" cy="30" rx="10" ry="3" fill="#cbd5e1" />

              <rect x="194" y="26" width="36" height="44" rx="1" fill="#64748b" />
              <rect x="200" y="32" width="24" height="4" rx="0.5" fill="#59D9B6" opacity="0.6" />
              <rect x="246" y="35" width="34" height="35" fill="#94a3b8" />
            </svg>
          </div>
        </div>

        {/* ----------------- SPEED WIND & FRESHNESS PARTICLES ----------------- */}
        <div className="absolute top-11 left-1 z-0 animate-trail-leaf-1 pointer-events-none">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-emerald-500 drop-shadow-xs" fill="currentColor">
            <path d="M10 2C5 2 2 7 2 12C2 17 7 18 10 18C15 18 18 13 18 8C18 3 15 2 10 2Z" />
            <path d="M6 14C8 11 11 8 14 6" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="absolute top-18 left-3 z-0 animate-trail-leaf-2 pointer-events-none">
          <svg viewBox="0 0 20 20" className="h-3 w-3 text-emerald-400 drop-shadow-xs" fill="currentColor">
            <path d="M10 2C5 2 2 7 2 12C2 17 7 18 10 18C15 18 18 13 18 8C18 3 15 2 10 2Z" />
          </svg>
        </div>
        <div className="absolute top-14 -left-1 z-0 animate-trail-citrus pointer-events-none">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 drop-shadow-xs" fill="none">
            <circle cx="12" cy="12" r="10" fill="#f59e0b" />
            <circle cx="12" cy="12" r="8.5" fill="#fef3c7" />
            <circle cx="12" cy="12" r="7" fill="#fbbf24" />
            <path d="M12 5V19M5 12H19" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>

        {/* ----------------- LAYER 2: THE COMMERCIAL CARGO TRUCK ----------------- */}
        <div className="relative z-10 animate-truck-drive">
          <svg
            className="w-56 h-28 drop-shadow-md"
            viewBox="0 0 200 95"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="boxContainerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#03543a" />
                <stop offset="100%" stopColor="#012419" />
              </linearGradient>
              <linearGradient id="lowCabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#02402c" />
                <stop offset="100%" stopColor="#011810" />
              </linearGradient>
              <linearGradient id="deflectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#046243" />
                <stop offset="100%" stopColor="#02402c" />
              </linearGradient>
              <linearGradient id="burlapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </linearGradient>
              <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="truckLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#59D9B6" />
                <stop offset="100%" stopColor="#58D5A5" />
              </linearGradient>
            </defs>

            {/* Headlight Beam */}
            <polygon points="186,63 200,59 200,69" fill="url(#headlightBeam)" opacity="0.6" />

            {/* Roof-Mounted Produce Cargo */}
            <g className="animate-roof-cargo">
              <rect x="22" y="8" width="46" height="2" rx="1" fill="#475569" />
              <ellipse cx="36" cy="6.5" rx="8" ry="4" fill="url(#burlapGrad)" />
              <rect x="48" y="4" width="16" height="6" rx="1" fill="#b45309" />
              <ellipse cx="53" cy="3.5" rx="3.5" ry="2" fill="#22c55e" />
              <ellipse cx="60" cy="3" rx="3.5" ry="2" fill="#16a34a" />
            </g>

            {/* Tall Freight Box Container */}
            <rect x="14" y="10" width="112" height="58" rx="4" fill="url(#boxContainerGrad)" />
            <path
              d="M26 12V66M38 12V66M50 12V66M62 12V66M74 12V66M86 12V66M98 12V66M110 12V66M122 12V66"
              stroke="#012015"
              strokeWidth="1.2"
              opacity="0.3"
            />
            <rect x="14" y="9" width="112" height="3" rx="1" fill="#046243" />
            <rect x="14" y="10" width="112" height="0.8" fill="#59D9B6" opacity="0.5" />
            <rect x="14" y="65" width="112" height="3" fill="#59D9B6" />

            {/* Cold-Chain Digital Monitor (-2°C) */}
            <g transform="translate(20, 52)">
              <rect x="0" y="0" width="21" height="8.5" rx="1.5" fill="#011b13" stroke="#046243" strokeWidth="0.7" />
              <text x="2.5" y="6.4" fill="#59D9B6" fontSize="5.2" fontWeight="bold" fontFamily="monospace">
                -2°C
              </text>
              <circle cx="16.5" cy="4.2" r="1" fill="#38bdf8" />
            </g>

            {/* CAFKART SPLASH LOGO: CENTERED FORWARD ON CONTAINER */}
            <g transform="translate(68, 17) scale(0.024)">
              <path
                d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
                fill="#FFFFFF"
                fillRule="evenodd"
              />
              <path
                d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
                fill="url(#truckLogoGrad)"
                fillRule="evenodd"
              />
            </g>

            {/* Roof Wind Deflector */}
            <path d="M126 12L146 34H126V12Z" fill="url(#deflectorGrad)" />
            <path d="M126 13L144 33" stroke="#59D9B6" strokeWidth="1.2" opacity="0.6" />

            {/* Low Cabin Structure */}
            <path d="M126 34H154C158 34 161.5 36.5 163.5 40L174 58C175.5 61 173.5 66 169.5 66H126V34Z" fill="url(#lowCabGrad)" />
            <path d="M132 38H152C154.5 38 156.8 39.8 157.8 42.2L166 54H132V38Z" fill="#a7f3d0" opacity="0.85" />
            <path d="M149 39L158 52H154L146 39H149Z" fill="#ffffff" opacity="0.6" />

            {/* Side Mirror & Bumper */}
            <rect x="156" y="44" width="2.5" height="6" rx="1.2" fill="#02402c" />
            <rect x="156" y="46" width="4" height="1.5" rx="0.5" fill="#64748b" />
            <path d="M170 58H184C187 58 189 60 189 63V68H166L170 58Z" fill="#0f172a" />
            <rect x="185" y="60" width="4" height="4" rx="1" fill="#fef08a" />
            <rect x="178" y="64" width="9" height="1.5" rx="0.7" fill="#475569" />

            {/* Undercarriage Chassis with 15L Oil Tin */}
            <path d="M10 68H24C26 68 28 66 28 64C28 53 37 45 46 45C55 45 64 53 64 64C64 66 66 68 68 68H140C142 68 144 66 144 64C144 53 153 45 162 45C171 45 180 53 180 64C180 66 182 68 184 68H190V72H10V68Z" fill="#0f172a" />
            <g transform="translate(98, 56)">
              <rect x="0" y="2" width="8.5" height="9.5" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="0.5" />
              <rect x="2.5" y="0.5" width="3.5" height="1.5" rx="0.5" fill="#b45309" />
              <circle cx="4.2" cy="6.8" r="1.8" fill="#fef3c7" />
            </g>

            {/* EXACTLY TWO TYRES */}
            <g className="animate-spin-wheel origin-[46px_68px]">
              <circle cx="46" cy="68" r="14" fill="#1e293b" />
              <circle cx="46" cy="68" r="8.5" fill="#15803d" />
              <circle cx="46" cy="68" r="7.5" fill="#fef08a" />
              <line x1="46" y1="60.5" x2="46" y2="75.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="38.5" y1="68" x2="53.5" y2="68" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="46" cy="68" r="3" fill="#ffffff" />
            </g>
            <g className="animate-spin-wheel origin-[162px_68px]">
              <circle cx="162" cy="68" r="14" fill="#1e293b" />
              <circle cx="162" cy="68" r="8.5" fill="#15803d" />
              <circle cx="162" cy="68" r="7.5" fill="#fef08a" />
              <line x1="162" y1="60.5" x2="162" y2="75.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="154.5" y1="68" x2="169.5" y2="68" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="162" cy="68" r="3" fill="#ffffff" />
            </g>
          </svg>
        </div>

        {/* ----------------- LAYER 3: SOLID STRUCTURED HIGH-CONTRAST ROADWAY ----------------- */}
        <div className="relative -mt-3.5 w-60 z-20 flex flex-col items-center">
          {/* Concrete Road Curb Line */}
          <div className="h-[2px] w-full bg-[#64748b] rounded-t-sm" />
          {/* Main Asphalt Road Strip */}
          <div className="h-3 w-full bg-[#1e293b] flex items-center justify-center overflow-hidden shadow-inner">
            {/* Rapid High-Visibility White Highway Lane Divider Dashes */}
            <div className="animate-road-speed h-[2.5px] w-full bg-[repeating-linear-gradient(90deg,#ffffff_0px,#ffffff_14px,transparent_14px,transparent_28px)] opacity-90" />
          </div>
          {/* Road Bottom Border */}
          <div className="h-[1.5px] w-full bg-[#0f172a]" />
        </div>

        {/* Dynamic Ground Shadow */}
        <div className="h-1.5 w-48 rounded-full bg-slate-500/30 blur-xs animate-shadow-run mt-0.5" />
      </div>

      {/* ----------------- STATUS BADGE (HomeScreen Only) ----------------- */}
      {showStatus && (
        <div className="mt-3 flex flex-col items-center text-center max-w-xs animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
            <p className="text-xs font-black text-emerald-950 tracking-tight transition-all duration-300">
              {activeMessage}
            </p>
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-slate-400">
            {subtext}
          </p>
        </div>
      )}

      {/* GPU Keyframe Animations */}
      <style>{`
        @keyframes skylineScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-280px, 0, 0); }
        }
        .animate-skyline-scroll {
          animation: skylineScroll 4.5s linear infinite;
        }

        @keyframes truckDrive {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-1.5px) rotate(-0.3deg); }
          50% { transform: translateY(0.5px) rotate(0.2deg); }
          75% { transform: translateY(-1px) rotate(-0.15deg); }
        }
        .animate-truck-drive {
          animation: truckDrive 0.65s ease-in-out infinite;
        }

        @keyframes roofCargo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.2px) rotate(-0.8deg); }
        }
        .animate-roof-cargo {
          animation: roofCargo 0.65s ease-in-out infinite 0.05s;
        }

        @keyframes spinWheel {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-wheel {
          animation: spinWheel 0.38s linear infinite;
        }

        @keyframes roadSpeed {
          0% { transform: translateX(0); }
          100% { transform: translateX(-28px); }
        }
        .animate-road-speed {
          animation: roadSpeed 0.28s linear infinite;
        }

        @keyframes shadowRun {
          0%, 100% { transform: scaleX(1); opacity: 0.35; }
          50% { transform: scaleX(0.92); opacity: 0.2; }
        }
        .animate-shadow-run {
          animation: shadowRun 0.65s ease-in-out infinite;
        }

        @keyframes trailLeaf1 {
          0% { transform: translate3d(24px, 0, 0) scale(0.6) rotate(0deg); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translate3d(-36px, 12px, 0) scale(1) rotate(-80deg); opacity: 0; }
        }
        .animate-trail-leaf-1 {
          animation: trailLeaf1 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        @keyframes trailLeaf2 {
          0% { transform: translate3d(20px, 0, 0) scale(0.5) rotate(0deg); opacity: 0; }
          40% { opacity: 0.85; }
          100% { transform: translate3d(-30px, 8px, 0) scale(0.9) rotate(70deg); opacity: 0; }
        }
        .animate-trail-leaf-2 {
          animation: trailLeaf2 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite 0.4s;
        }

        @keyframes trailCitrus {
          0% { transform: translate3d(22px, 0, 0) scale(0.6) rotate(0deg); opacity: 0; }
          30% { opacity: 0.9; }
          100% { transform: translate3d(-34px, 16px, 0) scale(0.9) rotate(180deg); opacity: 0; }
        }
        .animate-trail-citrus {
          animation: trailCitrus 1.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite 0.2s;
        }

        @keyframes sparkleTrail {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(90deg); opacity: 1; }
        }
        .animate-sparkle-trail {
          animation: sparkleTrail 1.5s ease-in-out infinite 0.3s;
        }

        @keyframes wind1 {
          0% { transform: translateX(15px); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateX(-35px); opacity: 0; }
        }
        .animate-wind-1 {
          animation: wind1 0.7s linear infinite 0.1s;
        }

        @keyframes wind2 {
          0% { transform: translateX(20px); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translateX(-40px); opacity: 0; }
        }
        .animate-wind-2 {
          animation: wind2 0.55s linear infinite 0.25s;
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
