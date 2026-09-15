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

// Reusable logo path
const CAFKART_LOGO_PATHS = (
  <>
    <path
      d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </>
);

// Green building colors from your initial version
const BUILDING_COLORS = {
  clouds: "#d9ebdf",
  shadowLayer: "#c3decc",
  storefront: "#d9ebdf",
  storefrontPolygon: "#cbe3d3",
  tallNarrow: "#b1d3bc",
  medium: "#cbe3d3",
  tallCenter: "#e2efe6",
  antenna: "#c3decc",
  rightMid: "#d9ebdf",
  rightSideLower: "#b1d3bc",
  rightStorefront: "#cbe3d3",
  warehouse: "#e2efe6",
  warehouseDoors: "#c3decc"
};

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
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center w-full max-w-2xl px-4 ${scaleClass}`}>
        
        {/* Main Stage Viewport - Limits rendering boundaries so nothing floats away */}
        <div className="relative w-full aspect-[4/3] max-w-[600px] flex items-center justify-center overflow-hidden">
          
          <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-sm">
            <defs>
              {/* Gradients from your SVG */}
              <linearGradient id="truckBoxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4CAF50" />
                <stop offset="15%" stopColor="#38B554" />
                <stop offset="85%" stopColor="#2E9E48" />
                <stop offset="100%" stopColor="#1B632B" />
              </linearGradient>

              <linearGradient id="cabinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1B5E20" />
                <stop offset="20%" stopColor="#125E34" />
                <stop offset="90%" stopColor="#0E4A28" />
                <stop offset="100%" stopColor="#072B16" />
              </linearGradient>

              <linearGradient id="windowReflect" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E0F2F1" />
                <stop offset="30%" stopColor="#B2DFDB" />
                <stop offset="35%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#80CBC4" />
                <stop offset="100%" stopColor="#4DB6AC" />
              </linearGradient>

              <radialGradient id="tireGrad" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#1A1C1E" />
                <stop offset="95%" stopColor="#2B2E33" />
                <stop offset="100%" stopColor="#111111" />
              </radialGradient>

              <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="40%" stopColor="#D9DFE3" />
                <stop offset="60%" stopColor="#9E9E9E" />
                <stop offset="100%" stopColor="#616161" />
              </linearGradient>

              <radialGradient id="dropShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(238,243,239,1)" />
                <stop offset="100%" stopColor="rgba(238,243,239,0)" />
              </radialGradient>

              <radialGradient id="tomatoGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FF8A80" />
                <stop offset="40%" stopColor="#E53935" />
                <stop offset="80%" stopColor="#C62828" />
                <stop offset="100%" stopColor="#8E0000" />
              </radialGradient>

              <radialGradient id="pepperGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FF5252" />
                <stop offset="50%" stopColor="#D32F2F" />
                <stop offset="100%" stopColor="#B71C1C" />
              </radialGradient>

              <linearGradient id="baguetteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFCC80" />
                <stop offset="40%" stopColor="#E68A00" />
                <stop offset="80%" stopColor="#B35900" />
                <stop offset="100%" stopColor="#663300" />
              </linearGradient>

              <linearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4A373" />
                <stop offset="50%" stopColor="#FAEDCD" />
                <stop offset="100%" stopColor="#CCD5AE" />
              </linearGradient>
              
              <linearGradient id="milkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="80%" stopColor="#F0F8FF" />
                <stop offset="100%" stopColor="#D0E4F5" />
              </linearGradient>

              <radialGradient id="lettuceGrad1" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#81C784" />
                <stop offset="70%" stopColor="#4CAF50" />
                <stop offset="100%" stopColor="#2E7D32" />
              </radialGradient>
              
              <radialGradient id="lettuceGrad2" cx="30%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#AED581" />
                <stop offset="80%" stopColor="#689F38" />
                <stop offset="100%" stopColor="#33691E" />
              </radialGradient>
            </defs>

            {/* Solid White Sky / Ground to absolutely guarantee no transparency issues */}
            <rect width="100%" height="100%" fill="#FFFFFF" />

            {/* ========================================================= */}
            {/* INFINITE SCROLLING BUILDINGS (Green Colors Restored)      */}
            {/* ========================================================= */}
            <g className="animate-skyline-scroll">
              
              {/* We duplicate the "city block" so it loops perfectly */}
              {[0, 600, 1200].map((xOffset, index) => (
                <g key={index} transform={`translate(${xOffset}, 0)`}>
                  
                  {/* Clouds */}
                  <rect x="150" y="190" width="50" height="15" rx="7.5" fill={BUILDING_COLORS.clouds} />
                  <rect x="420" y="210" width="45" height="12" rx="6" fill={BUILDING_COLORS.clouds} />

                  {/* Darker Background Shadows */}
                  <g fill={BUILDING_COLORS.shadowLayer}>
                    <rect x="80" y="300" width="40" height="170" rx="2" />
                    <rect x="180" y="240" width="40" height="230" rx="2" />
                    <rect x="315" y="270" width="45" height="200" rx="2" />
                    <rect x="435" y="315" width="45" height="155" rx="2" />
                  </g>

                  {/* Left Storefront (Cafkart Warehouse) */}
                  <rect x="35" y="330" width="50" height="140" rx="2" fill={BUILDING_COLORS.warehouse} />
                  <polygon points="30,330 90,330 85,345 35,345" fill={BUILDING_COLORS.warehouseDoors} />
                  <rect x="45" y="360" width="12" height="15" rx="1" fill="#FFFFFF" />
                  <rect x="65" y="360" width="12" height="15" rx="1" fill="#FFFFFF" />
                  
                  {/* CAFKART WAREHOUSE LOGO */}
                  <g transform="translate(42, 342) scale(0.015)" fill="#1B632B">
                    <svg viewBox="0 100 1500 1200">{CAFKART_LOGO_PATHS}</svg>
                  </g>

                  {/* Tall Narrow Building */}
                  <rect x="125" y="270" width="40" height="200" rx="2" fill={BUILDING_COLORS.tallNarrow} />
                  
                  {/* Medium Building */}
                  <rect x="165" y="310" width="35" height="160" rx="2" fill={BUILDING_COLORS.medium} />

                  {/* Tall Center Building (with antenna & 9 dots) */}
                  <rect x="215" y="200" width="55" height="270" rx="2" fill={BUILDING_COLORS.tallCenter} />
                  <rect x="240" y="170" width="5" height="30" fill={BUILDING_COLORS.antenna} /> 
                  <rect x="225" y="185" width="35" height="15" rx="2" fill={BUILDING_COLORS.antenna} /> 
                  
                  <rect x="225" y="220" width="10" height="12" rx="1" fill="#FFFFFF" />
                  <rect x="250" y="220" width="10" height="12" rx="1" fill="#FFFFFF" />
                  <rect x="225" y="240" width="10" height="12" rx="1" fill="#FFFFFF" />
                  <rect x="250" y="240" width="10" height="12" rx="1" fill="#FFFFFF" />

                  {/* Right Mid Building */}
                  <rect x="280" y="250" width="60" height="220" rx="2" fill={BUILDING_COLORS.rightMid} />

                  {/* Right Side Lower Building */}
                  <rect x="375" y="310" width="50" height="160" rx="2" fill={BUILDING_COLORS.rightSideLower} />

                  {/* Right Storefront */}
                  <rect x="415" y="350" width="50" height="120" rx="2" fill={BUILDING_COLORS.rightStorefront} />
                  <polygon points="410,350 470,350 465,365 415,365" fill={BUILDING_COLORS.storefrontPolygon} />
                  <rect x="425" y="380" width="30" height="25" rx="1" fill="#FFFFFF" />

                  {/* Far Right Edge */}
                  <rect x="475" y="380" width="45" height="90" rx="2" fill={BUILDING_COLORS.shadowLayer} />
                </g>
              ))}
            </g>

            {/* Ground Shadow */}
            <ellipse cx="420" cy="535" rx="220" ry="8" fill="url(#dropShadow)" />

            {/* Speed Lines */}
            <g className="animate-speed-lines" stroke="#38B554" strokeLinecap="round" strokeWidth="3">
              <line x1="130" y1="410" x2="210" y2="410" />
              <line x1="160" y1="435" x2="210" y2="435" />
              <line x1="110" y1="460" x2="210" y2="460" />
              <line x1="180" y1="485" x2="210" y2="485" />
            </g>

            {/* ========================================================= */}
            {/* TRUCK BODY & GROCERIES (Grouped for Suspension Bounce)    */}
            {/* ========================================================= */}
            <g className="animate-truck-body">
              
              {/* GROCERIES - Safely tucked right behind the front box wall */}
              <g className="animate-produce-jiggle">
                {/* Lettuce */}
                <circle cx="280" cy="350" r="35" fill="url(#lettuceGrad1)" />
                <circle cx="315" cy="330" r="40" fill="url(#lettuceGrad2)" />
                <circle cx="355" cy="350" r="35" fill="url(#lettuceGrad1)" />

                {/* Paper Bag */}
                <path d="M 400 400 L 450 400 L 465 300 L 415 315 Z" fill="#D4A373" />
                <path d="M 410 295 L 460 280 L 465 300 L 415 315 Z" fill="#BC8A5F" />
                <ellipse cx="430" cy="350" rx="12" ry="12" fill="#E76F51" transform="rotate(-15 430 350)" />
                <ellipse cx="430" cy="350" rx="5" ry="5" fill="#F4A261" transform="rotate(-15 430 350)" />

                {/* Milk Bottle */}
                <g transform="translate(385, 360) rotate(12)">
                  <rect x="-18" y="-60" width="36" height="100" rx="6" fill="url(#milkGrad)" />
                  <rect x="-18" y="-20" width="36" height="35" fill="#2196F3" />
                  <circle cx="0" cy="-2" r="8" fill="#FFFFFF" />
                  <circle cx="0" cy="-2" r="4" fill="#2196F3" />
                  <rect x="-10" y="-75" width="20" height="20" fill="#E3F2FD" />
                  <rect x="-12" y="-80" width="24" height="10" rx="3" fill="#0D47A1" />
                  <path d="M -12 -50 L -12 30" stroke="#FFFFFF" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                </g>

                {/* Baguette */}
                <g transform="translate(350, 345) rotate(25)">
                  <ellipse cx="0" cy="0" rx="20" ry="70" fill="url(#baguetteGrad)" />
                  <path d="M -10 -40 Q 0 -35 12 -25" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                  <path d="M -12 -10 Q 0 -5 12 5" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                  <path d="M -12 20 Q 0 25 12 35" fill="none" stroke="#5D4037" strokeWidth="4" strokeLinecap="round" />
                  <ellipse cx="-8" cy="0" rx="4" ry="55" fill="#FFFFFF" opacity="0.3" />
                </g>

                {/* Red Peppers */}
                <g>
                  <ellipse cx="315" cy="375" rx="20" ry="28" fill="url(#pepperGrad)" />
                  <ellipse cx="295" cy="385" rx="18" ry="25" fill="url(#pepperGrad)" />
                  <ellipse cx="335" cy="385" rx="18" ry="25" fill="url(#pepperGrad)" />
                  <path d="M 315 348 Q 320 335 330 340" fill="none" stroke="#1B5E20" strokeWidth="5" strokeLinecap="round" />
                  <ellipse cx="308" cy="360" rx="4" ry="10" fill="#FFFFFF" opacity="0.5" transform="rotate(-15 308 360)" />
                  <ellipse cx="328" cy="368" rx="3" ry="8" fill="#FFFFFF" opacity="0.5" transform="rotate(-15 328 368)" />
                </g>

                {/* Tomato */}
                <g>
                  <circle cx="365" cy="390" r="24" fill="url(#tomatoGrad)" />
                  <path d="M 365 366 L 358 373 M 365 366 L 372 373 M 365 366 L 365 375 M 365 366 L 360 361" stroke="#1B5E20" strokeWidth="3" strokeLinecap="round" />
                  <ellipse cx="355" cy="378" rx="6" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-30 355 378)" />
                </g>

                {/* Bananas */}
                <g>
                  <path d="M 235 340 C 240 390 270 405 295 395 C 290 365 260 350 235 340 Z" fill="#FBC02D" />
                  <path d="M 245 330 C 255 380 285 395 310 385 C 305 355 275 340 245 330 Z" fill="#FFF176" />
                  <path d="M 235 340 C 240 390 270 405 295 395" fill="none" stroke="#F57F17" strokeWidth="2" />
                  <path d="M 235 340 L 225 330 L 240 325 Z" fill="#8BC34A" />
                </g>
              </g>

              {/* Main Green Box */}
              <rect x="230" y="380" width="250" height="145" rx="6" fill="url(#truckBoxGrad)" />
              <rect x="230" y="380" width="250" height="4" rx="2" fill="#FFFFFF" opacity="0.4" />
              <rect x="230" y="515" width="250" height="10" rx="3" fill="#000000" opacity="0.3" />
              <line x1="313" y1="385" x2="313" y2="510" stroke="#1B632B" strokeWidth="2" />
              <line x1="315" y1="385" x2="315" y2="510" stroke="#66BB6A" strokeWidth="1" />
              <line x1="396" y1="385" x2="396" y2="510" stroke="#1B632B" strokeWidth="2" />
              <line x1="398" y1="385" x2="398" y2="510" stroke="#66BB6A" strokeWidth="1" />

              {/* PERFECTLY SAFE LOGO ON THE BOX */}
              {/* Center of box is roughly (355, 452). Scaled safely! */}
              <g transform="translate(305, 410) scale(0.065)" fill="#FFFFFF">
                <svg viewBox="0 100 1500 1200">{CAFKART_LOGO_PATHS}</svg>
              </g>

              {/* Truck Cabin Base */}
              <path d="M 478 400 L 530 400 Q 545 400 555 415 L 590 470 Q 595 480 610 480 L 620 480 Q 625 480 625 485 L 625 520 Q 625 525 620 525 L 478 525 Z" fill="url(#cabinGrad)" />
              <rect x="478" y="515" width="147" height="10" fill="#000000" opacity="0.4" />
              <path d="M 478 400 L 530 400 Q 545 400 555 415 L 590 470 L 590 525" fill="none" stroke="#072B16" strokeWidth="3" />
              <path d="M 478 400 L 530 400 Q 545 400 555 415 L 590 470 L 590 525" fill="none" stroke="#2E7D32" strokeWidth="1" transform="translate(1, 0)" />

              {/* Window */}
              <path d="M 488 410 L 525 410 Q 532 410 538 420 L 568 465 L 488 465 Z" fill="url(#windowReflect)" stroke="#1B5E20" strokeWidth="3" strokeLinejoin="round" />
              <path d="M 495 415 L 515 415 L 525 460 L 505 460 Z" fill="#FFFFFF" opacity="0.3" />

              {/* Door Handle */}
              <rect x="495" y="475" width="22" height="6" rx="3" fill="#111111" />
              <rect x="495" y="475" width="22" height="3" rx="1.5" fill="#424242" />

              {/* Front Bumper */}
              <rect x="616" y="505" width="12" height="18" rx="4" fill="#212121" />
              <rect x="616" y="505" width="12" height="5" rx="2" fill="#424242" />

              {/* Headlight */}
              <rect x="618" y="482" width="10" height="16" rx="3" fill="#FFF59D" />
              <rect x="620" y="484" width="6" height="12" rx="2" fill="#FFFFFF" />
              <circle cx="625" cy="490" r="15" fill="#FFF59D" opacity="0.4" />

              {/* Rear Bumper/Light */}
              <rect x="226" y="500" width="8" height="15" rx="2" fill="#212121" />
              <rect x="226" y="490" width="6" height="12" rx="2" fill="#D32F2F" />
              
              {/* Wheel Wells (Bouncing with the body to cover the stationary wheels) */}
              <path d="M 255 525 A 38 38 0 0 1 335 525 Z" fill="#0A0A0A" />
              <path d="M 260 525 A 33 33 0 0 1 330 525 Z" fill="#1A1C1E" />
              <path d="M 505 525 A 38 38 0 0 1 585 525 Z" fill="#0A0A0A" />
              <path d="M 510 525 A 33 33 0 0 1 580 525 Z" fill="#1A1C1E" />
            </g>

            {/* ========================================================= */}
            {/* SPINNING TIRES (Isolated & Grounded)                        */}
            {/* ========================================================= */}
            
            {/* Rear Wheel (Exactly centered at cx=0, cy=0 inside the transform) */}
            <g transform="translate(295, 525)">
              <g className="wheel-spin" style={{ transformOrigin: '0 0' }}>
                <circle cx="0" cy="0" r="30" fill="url(#tireGrad)" />
                <circle cx="0" cy="0" r="23" fill="#000000" />
                <circle cx="0" cy="0" r="18" fill="url(#rimGrad)" />
                <circle cx="0" cy="0" r="12" fill="#424242" />
                <circle cx="0" cy="0" r="8" fill="#E0E0E0" />
                {/* Lug Nuts */}
                <circle cx="0" cy="-4" r="1.5" fill="#212121" />
                <circle cx="3.8" cy="-1.2" r="1.5" fill="#212121" />
                <circle cx="2.4" cy="3.2" r="1.5" fill="#212121" />
                <circle cx="-2.4" cy="3.2" r="1.5" fill="#212121" />
                <circle cx="-3.8" cy="-1.2" r="1.5" fill="#212121" />
              </g>
            </g>

            {/* Front Wheel (Exactly centered at cx=0, cy=0 inside the transform) */}
            <g transform="translate(545, 525)">
              <g className="wheel-spin" style={{ transformOrigin: '0 0' }}>
                <circle cx="0" cy="0" r="30" fill="url(#tireGrad)" />
                <circle cx="0" cy="0" r="23" fill="#000000" />
                <circle cx="0" cy="0" r="18" fill="url(#rimGrad)" />
                <circle cx="0" cy="0" r="12" fill="#424242" />
                <circle cx="0" cy="0" r="8" fill="#E0E0E0" />
                {/* Lug Nuts */}
                <circle cx="0" cy="-4" r="1.5" fill="#212121" />
                <circle cx="3.8" cy="-1.2" r="1.5" fill="#212121" />
                <circle cx="2.4" cy="3.2" r="1.5" fill="#212121" />
                <circle cx="-2.4" cy="3.2" r="1.5" fill="#212121" />
                <circle cx="-3.8" cy="-1.2" r="1.5" fill="#212121" />
              </g>
            </g>

          </svg>
        </div>

        {/* ========================================================= */}
        {/* STATUS BAR (HOME_MESSAGES)                                */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-6 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative flex items-center justify-between w-64 mb-3">
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
        /* Infinite scrolling background buildings */
        @keyframes skylineInfiniteScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-600px); }
        }
        .animate-skyline-scroll {
          animation: skylineInfiniteScroll 5.6s linear infinite;
        }

        /* Seamless Wheel Spin - perfectly rotated around local origin */
        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-spin {
          animation: spinWheelAnim 0.35s linear infinite;
        }

        /* Truck Body Suspension - Only applies to body, not the wheels */
        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-3px); }
          65% { transform: translateY(1.5px); }
        }
        .animate-truck-body {
          animation: truckBodyBounce 0.45s ease-in-out infinite;
        }

        /* Groceries jiggle lightly to feel loose inside the box */
        @keyframes produceJiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-0.8deg); }
        }
        .animate-produce-jiggle {
          transform-origin: 300px 400px; /* Pivots near the base of the groceries */
          animation: produceJiggle 0.45s ease-in-out infinite 0.08s;
        }

        /* Wind Speed Lines passing the truck */
        @keyframes speedLines {
          0%, 100% { opacity: 0.6; transform: translateX(0); }
          50% { opacity: 0.2; transform: translateX(-20px); }
        }
        .animate-speed-lines {
          animation: speedLines 0.5s ease-in-out infinite;
        }

        /* Text transitions */
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
