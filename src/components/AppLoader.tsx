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

// Extracted Logo paths using "currentColor" for clean reusability
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
      <div className={`relative flex flex-col items-center justify-center w-full max-w-lg ${scaleClass}`}>
        
        {/* Main Stage Viewport - Fixed dimensions (w-92 h-80 equivalent) */}
        <div className="relative w-[368px] h-[320px] flex items-center justify-center overflow-hidden">
          
          {/* ========================================================= */}
          {/* 1. SEAMLESS MOVING CLOUDS                                 */}
          {/* ========================================================= */}
          <div className="absolute top-2 left-0 w-full h-16 overflow-hidden pointer-events-none z-0">
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

          {/* ========================================================= */}
          {/* 2. ORIGINAL VARIED ARCHITECTURAL CITY BUILDINGS           */}
          {/* ========================================================= */}
          <div className="absolute top-16 left-0 w-full h-[140px] overflow-hidden pointer-events-none z-0">
            <div className="flex w-[840px] animate-skyline-scroll opacity-85">
              {/* Segment 1 */}
              <svg viewBox="0 0 420 140" className="w-[420px] h-[140px] shrink-0" fill="none">
                {/* CAFKART WAREHOUSE */}
                <rect x="8" y="50" width="100" height="90" rx="2" fill="#d9ebdf" />
                <path d="M4 50 L58 20 L112 50 Z" fill="#c3decc" />
                <path d="M8 50 L58 25 L108 50 Z" fill="#b1d3bc" />
                <rect x="6" y="50" width="104" height="4" fill="#c3decc" />
                
                <rect x="20" y="80" width="24" height="60" rx="1" fill="#cbe3d3" />
                <line x1="20" y1="95" x2="44" y2="95" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="20" y1="110" x2="44" y2="110" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="20" y1="125" x2="44" y2="125" stroke="#b1d3bc" strokeWidth="2" />
                
                <rect x="70" y="80" width="24" height="60" rx="1" fill="#cbe3d3" />
                <line x1="70" y1="95" x2="94" y2="95" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="70" y1="110" x2="94" y2="110" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="70" y1="125" x2="94" y2="125" stroke="#b1d3bc" strokeWidth="2" />
                
                {/* Warehouse Signage */}
                <rect x="18" y="60" width="80" height="16" rx="2" fill="#ffffff" />
                <svg x="18" y="60" width="80" height="16" viewBox="0 100 1500 1200" className="text-green-600">
                  {CAFKART_LOGO_PATHS}
                </svg>

                {/* Building 2 */}
                <rect x="132" y="28" width="56" height="112" rx="3" fill="#d9ebdf" />
                <path d="M129 38H191L187 50H133L129 38Z" fill="#c3decc" />
                <path d="M134 50C134 52 136 54 139 54C141 54 144 52 144 50H134Z" fill="#b1d3bc" />
                <path d="M144 50C144 52 146 54 149 54C151 54 154 52 154 50H144Z" fill="#b1d3bc" />
                <path d="M154 50C154 52 156 54 159 54C161 54 164 52 164 50H154Z" fill="#b1d3bc" />
                <path d="M164 50C164 52 166 54 169 54C171 54 174 52 174 50H164Z" fill="#b1d3bc" />
                <path d="M174 50C174 52 176 54 179 54C181 54 184 52 184 50H174Z" fill="#b1d3bc" />

                {/* Building 3 (Dots) */}
                <rect x="206" y="10" width="60" height="130" fill="#cbe3d3" />
                <rect x="216" y="0" width="40" height="10" fill="#d9ebdf" />
                <circle cx="220" cy="32" r="2.2" fill="#f0f7f2" />
                <circle cx="236" cy="32" r="2.2" fill="#f0f7f2" />
                <circle cx="252" cy="32" r="2.2" fill="#f0f7f2" />
                <circle cx="220" cy="48" r="2.2" fill="#f0f7f2" />
                <circle cx="236" cy="48" r="2.2" fill="#f0f7f2" />
                <circle cx="252" cy="48" r="2.2" fill="#f0f7f2" />
                <circle cx="220" cy="64" r="2.2" fill="#f0f7f2" />
                <circle cx="236" cy="64" r="2.2" fill="#f0f7f2" />
                <circle cx="252" cy="64" r="2.2" fill="#f0f7f2" />

                {/* Building 4 (Antenna) */}
                <rect x="282" y="15" width="28" height="125" fill="#e2efe6" />
                <ellipse cx="296" cy="15" rx="14" ry="7" fill="#d9ebdf" />
                
                {/* Building 5 */}
                <rect x="318" y="5" width="26" height="135" fill="#d9ebdf" />
                <ellipse cx="331" cy="5" rx="13" ry="8" fill="#cbe3d3" />
                <rect x="296" y="38" width="35" height="4" fill="#b1d3bc" /> {/* Bridge */}

                {/* Building 6 */}
                <rect x="352" y="0" width="60" height="140" rx="2" fill="#cbe3d3" />
                <rect x="360" y="5" width="44" height="4" fill="#b1d3bc" />
                <rect x="362" y="16" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="16" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="362" y="40" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="40" width="10" height="16" rx="1" fill="#f0f7f2" />
              </svg>

              {/* Segment 2: Duplicate perfectly loops */}
              <svg viewBox="0 0 420 140" className="w-[420px] h-[140px] shrink-0" fill="none">
                <rect x="8" y="50" width="100" height="90" rx="2" fill="#d9ebdf" />
                <path d="M4 50 L58 20 L112 50 Z" fill="#c3decc" />
                <path d="M8 50 L58 25 L108 50 Z" fill="#b1d3bc" />
                <rect x="6" y="50" width="104" height="4" fill="#c3decc" />
                <rect x="20" y="80" width="24" height="60" rx="1" fill="#cbe3d3" />
                <line x1="20" y1="95" x2="44" y2="95" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="20" y1="110" x2="44" y2="110" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="20" y1="125" x2="44" y2="125" stroke="#b1d3bc" strokeWidth="2" />
                <rect x="70" y="80" width="24" height="60" rx="1" fill="#cbe3d3" />
                <line x1="70" y1="95" x2="94" y2="95" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="70" y1="110" x2="94" y2="110" stroke="#b1d3bc" strokeWidth="2" />
                <line x1="70" y1="125" x2="94" y2="125" stroke="#b1d3bc" strokeWidth="2" />
                <rect x="18" y="60" width="80" height="16" rx="2" fill="#ffffff" />
                <svg x="18" y="60" width="80" height="16" viewBox="0 100 1500 1200" className="text-green-600">
                  {CAFKART_LOGO_PATHS}
                </svg>
                <rect x="132" y="28" width="56" height="112" rx="3" fill="#d9ebdf" />
                <path d="M129 38H191L187 50H133L129 38Z" fill="#c3decc" />
                <path d="M134 50C134 52 136 54 139 54C141 54 144 52 144 50H134Z" fill="#b1d3bc" />
                <path d="M144 50C144 52 146 54 149 54C151 54 154 52 154 50H144Z" fill="#b1d3bc" />
                <path d="M154 50C154 52 156 54 159 54C161 54 164 52 164 50H154Z" fill="#b1d3bc" />
                <path d="M164 50C164 52 166 54 169 54C171 54 174 52 174 50H164Z" fill="#b1d3bc" />
                <path d="M174 50C174 52 176 54 179 54C181 54 184 52 184 50H174Z" fill="#b1d3bc" />
                <rect x="206" y="10" width="60" height="130" fill="#cbe3d3" />
                <rect x="216" y="0" width="40" height="10" fill="#d9ebdf" />
                <circle cx="220" cy="32" r="2.2" fill="#f0f7f2" />
                <circle cx="236" cy="32" r="2.2" fill="#f0f7f2" />
                <circle cx="252" cy="32" r="2.2" fill="#f0f7f2" />
                <circle cx="220" cy="48" r="2.2" fill="#f0f7f2" />
                <circle cx="236" cy="48" r="2.2" fill="#f0f7f2" />
                <circle cx="252" cy="48" r="2.2" fill="#f0f7f2" />
                <circle cx="220" cy="64" r="2.2" fill="#f0f7f2" />
                <circle cx="236" cy="64" r="2.2" fill="#f0f7f2" />
                <circle cx="252" cy="64" r="2.2" fill="#f0f7f2" />
                <rect x="282" y="15" width="28" height="125" fill="#e2efe6" />
                <ellipse cx="296" cy="15" rx="14" ry="7" fill="#d9ebdf" />
                <rect x="318" y="5" width="26" height="135" fill="#d9ebdf" />
                <ellipse cx="331" cy="5" rx="13" ry="8" fill="#cbe3d3" />
                <rect x="296" y="38" width="35" height="4" fill="#b1d3bc" />
                <rect x="352" y="0" width="60" height="140" rx="2" fill="#cbe3d3" />
                <rect x="360" y="5" width="44" height="4" fill="#b1d3bc" />
                <rect x="362" y="16" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="16" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="362" y="40" width="10" height="16" rx="1" fill="#f0f7f2" />
                <rect x="382" y="40" width="10" height="16" rx="1" fill="#f0f7f2" />
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. SOLID GROUND MASK - GUARANTEES NO BUILDINGS UNDER TRUCK */}
          {/* ========================================================= */}
          {/* This solid white block covers the bottom part entirely so no buildings slip through */}
          <div className="absolute bottom-0 left-0 w-full h-[85px] bg-white z-10 pointer-events-none" />

          {/* ========================================================= */}
          {/* 4. PERFECTLY SIZED TRUCK, GROCERIES & WHEELS              */}
          {/* ========================================================= */}
          <div className="absolute bottom-1 w-full flex justify-center z-20 pointer-events-none">
            {/* Constrained width keeps truck perfectly proportional! */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 1500 800" 
              className="w-[340px] h-auto" 
              fill="none"
            >
              <defs>
                <linearGradient id="cabPaint" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#35C878"/>
                  <stop offset="0.55" stopColor="#1DAA5B"/>
                  <stop offset="1" stopColor="#087944"/>
                </linearGradient>
                <linearGradient id="containerPaint" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#2BB96A"/>
                  <stop offset="0.52" stopColor="#149653"/>
                  <stop offset="1" stopColor="#08713F"/>
                </linearGradient>
                <linearGradient id="lowerGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#15884C"/>
                  <stop offset="1" stopColor="#0A5D36"/>
                </linearGradient>
                <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#BFE9FF"/>
                  <stop offset="0.35" stopColor="#74BDE5"/>
                  <stop offset="0.72" stopColor="#2C6790"/>
                  <stop offset="1" stopColor="#173D57"/>
                </linearGradient>
                <linearGradient id="tire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#313B49"/>
                  <stop offset="0.46" stopColor="#151A24"/>
                  <stop offset="1" stopColor="#080B10"/>
                </linearGradient>
                <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F6FAFC"/>
                  <stop offset="0.5" stopColor="#C9D0D7"/>
                  <stop offset="1" stopColor="#858E98"/>
                </linearGradient>
                <linearGradient id="bumper" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#2A3542"/>
                  <stop offset="0.5" stopColor="#101822"/>
                  <stop offset="1" stopColor="#344152"/>
                </linearGradient>
                <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
                  <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#000" floodOpacity="0.28"/>
                </filter>
                <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
                  <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#000" floodOpacity="0.22"/>
                </filter>
                <clipPath id="containerClip">
                  <rect x="205" y="188" width="760" height="380" rx="28"/>
                </clipPath>
                <clipPath id="cabClip">
                  <path d="M950 215H1130C1175 215 1208 238 1230 274L1362 485C1379 513 1387 544 1387 576V589H950V215Z"/>
                </clipPath>
                <radialGradient id="groundShadowMain" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#475569" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Ground Shadow - Anchors the truck firmly */}
              <ellipse cx="800" cy="730" rx="720" ry="25" fill="url(#groundShadowMain)" />

              {/* Trailing Green Speed Streaks */}
              <g className="animate-speed-lines" transform="translate(50, 520) scale(4.5)">
                <line x1="42" y1="20" x2="80" y2="20" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="28" y1="28" x2="80" y2="28" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="38" y1="36" x2="80" y2="36" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              </g>

              {/* ------------------------------------------------------------- */}
              {/* TRUCK BODY & GROCERIES (Bounces cleanly on suspension) */}
              {/* ------------------------------------------------------------- */}
              <g className="animate-truck-body">
                
                {/* GROCERIES: Beautifully scaled and tucked inside the cargo box roof */}
                <g className="animate-produce-jiggle">
                  <svg x="260" y="0" width="550" height="260" viewBox="70 80 120 50" overflow="visible">
                    {/* Baguette */}
                    <g transform="translate(138, 90) rotate(18)">
                      <rect x="0" y="0" width="12" height="34" rx="6" fill="#d97706" />
                      <line x1="2" y1="8" x2="9" y2="11" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="2" y1="16" x2="9" y2="19" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="2" y1="24" x2="9" y2="27" stroke="#fef3c7" strokeWidth="1.6" strokeLinecap="round" />
                    </g>
                    {/* Milk Bottle */}
                    <g transform="translate(154, 92) rotate(8)">
                      <rect x="0" y="6" width="16" height="26" rx="3.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <rect x="0" y="14" width="16" height="11" fill="#0284c7" />
                      <circle cx="8" cy="19.5" r="3.2" fill="#ffffff" />
                      <rect x="4" y="1.5" width="8" height="4.5" rx="1" fill="#38bdf8" />
                    </g>
                    {/* Juice Carton */}
                    <g transform="translate(172, 96) rotate(14)">
                      <rect x="0" y="5" width="17" height="24" rx="2" fill="#ea580c" />
                      <circle cx="8.5" cy="16" r="3.8" fill="#ffedd5" />
                      <polygon points="0,5 8.5,0 17,5" fill="#c2410c" />
                      <circle cx="8.5" cy="16" r="1.8" fill="#ea580c" />
                    </g>
                    {/* Bushy Green Kale */}
                    <ellipse cx="118" cy="106" rx="14" ry="15" fill="#15803d" />
                    <ellipse cx="118" cy="106" rx="11" ry="12" fill="#16a34a" />
                    <circle cx="116" cy="103" r="7" fill="#22c55e" />
                    <path d="M112 99C115 104 120 106 124 104" stroke="#86efac" strokeWidth="1.2" strokeLinecap="round" />
                    {/* Banana Bunch */}
                    <g transform="translate(80, 102) rotate(-14)">
                      <path d="M8 29C16 32 30 30 38 18C40 13 40 8 38 4C37 4 34 8 30 12C22 21 14 24 8 29Z" fill="#eab308" />
                      <path d="M2 26C10 29 23 27 30 16C32 12 32 7 30 3C29 3 27 7 23 10C16 18 8 21 2 26Z" fill="#fde047" />
                      <path d="M30 16L34 13" stroke="#65a30d" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="2.5" cy="26.5" r="1.8" fill="#451a03" />
                      <circle cx="8.5" cy="29.5" r="1.8" fill="#451a03" />
                    </g>
                    {/* Shiny Red Apple */}
                    <g transform="translate(104, 108)">
                      <path d="M12 4C8 1 2 3 1 9C0 16 5 23 12 24C19 23 24 16 23 9C22 3 16 1 12 4Z" fill="#dc2626" />
                      <path d="M6 8C4 11 4 16 7 19" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                      <path d="M12 4C12 1 14 -1 16 -2" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M13 1C17 0 19 2 18 5C15 5 13 3 13 1Z" fill="#22c55e" />
                    </g>
                  </svg>
                </g>

                {/* TRUCK CHASSIS */}
                <g id="chassis">
                  <path d="M175 553H1292C1325 553 1344 568 1352 598L1357 619H156L160 592C163 569 168 558 175 553Z" fill="url(#bumper)"/>
                  <path d="M194 613H1328L1318 647H197L194 613Z" fill="#0A0F16"/>
                  <path d="M375 581H1054" stroke="#556170" strokeWidth="10" strokeLinecap="round" opacity=".5"/>
                  <path d="M687 599H1044" stroke="#070B10" strokeWidth="26" strokeLinecap="round" opacity=".8"/>
                </g>

                {/* BACK CONTAINER */}
                <g id="back-container" filter="url(#softShadow)">
                  <rect x="205" y="188" width="760" height="380" rx="28" fill="url(#containerPaint)" stroke="#0B6338" strokeWidth="8"/>
                  <g clipPath="url(#containerClip)">
                    <path d="M192 194H963V303C889 349 830 392 749 425C655 463 532 487 390 493C316 496 256 494 192 487V194Z" fill="#45D47C" opacity=".18"/>
                    <path d="M192 501C352 548 546 553 709 519C818 496 903 449 989 360V601H192V501Z" fill="#69EA92" opacity=".16"/>
                    <rect x="228" y="221" width="704" height="7" rx="3.5" fill="#8AF0AE" opacity=".18"/>
                    <path d="M920 188L968 231V554L924 568L904 534V242L920 188Z" fill="#0A7440" opacity=".42"/>
                  </g>
                  <path d="M230 211H930" stroke="#83F3AB" strokeWidth="3" opacity=".22"/>
                  <path d="M947 221V540" stroke="#0A5934" strokeWidth="6" opacity=".6"/>
                  <path d="M223 555H933" stroke="#074B2C" strokeWidth="8" opacity=".7"/>
                </g>

                {/* CAFKART LOGO CAREFULLY CENTERED (Safely away from the wheels) */}
                <svg x="440" y="270" width="300" height="200" viewBox="0 100 1500 1200" className="text-white">
                  {CAFKART_LOGO_PATHS}
                </svg>

                {/* DRIVER CABIN */}
                <g id="driver-cabin" filter="url(#shadow)">
                  <path d="M948 214H1129C1173 214 1207 236 1230 272L1360 481C1378 510 1388 544 1388 578V592H947L948 214Z" fill="url(#cabPaint)" stroke="#0A6037" strokeWidth="8"/>
                  <path d="M970 230H1124C1156 230 1182 247 1200 274L1249 353C1217 334 1184 323 1148 322H972L970 230Z" fill="#5BE497" opacity=".16"/>
                  <path d="M1092 250H1130C1151 250 1172 264 1183 282L1244 382H1087L1077 278C1076 263 1081 253 1092 250Z" fill="url(#glass)" stroke="#172636" strokeWidth="10"/>
                  <path d="M1195 287L1254 382H1279L1221 282L1195 287Z" fill="#D7F6FF" opacity=".3"/>
                  <path d="M1216 290L1249 348" stroke="#E6F9FF" strokeWidth="10" strokeLinecap="round" opacity=".25"/>
                  <path d="M977 250H1063C1075 250 1081 258 1082 272L1092 382H984L977 250Z" fill="url(#glass)" stroke="#172636" strokeWidth="10"/>
                  <path d="M991 268L1034 268L1075 382H1006L991 268Z" fill="#E7FAFF" opacity=".18"/>
                  <path d="M987 300L1048 375" stroke="#E9FBFF" strokeWidth="11" strokeLinecap="round" opacity=".16"/>
                  <path d="M1088 248L1087 385" stroke="#0E2431" strokeWidth="11"/>
                  <path d="M1067 375H1105V421H1067C1057 421 1049 413 1049 403V393C1049 383 1057 375 1067 375Z" fill="#1C2734"/>
                  <rect x="1055" y="383" width="23" height="31" rx="9" fill="#344556"/>
                  <path d="M1058 390H1077" stroke="#7E90A2" strokeWidth="4" opacity=".7"/>
                  <path d="M986 392H1100V577H986V392Z" fill="#188C50" opacity=".66"/>
                  <path d="M989 393V578" stroke="#0B6339" strokeWidth="7"/>
                  <path d="M1007 440H1053" stroke="#13212A" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M1009 437H1052" stroke="#3D4A56" strokeWidth="4" strokeLinecap="round" opacity=".85"/>
                  <path d="M1088 405V576" stroke="#2FD57C" strokeWidth="5" opacity=".28"/>
                  <path d="M1208 382H1265C1284 382 1303 391 1313 407L1362 483C1378 509 1387 539 1388 567H1273C1254 567 1238 553 1234 534L1208 382Z" fill="#2BBE69" opacity=".55"/>
                  <path d="M1210 391L1242 559" stroke="#77EAA0" strokeWidth="6" opacity=".14"/>
                  <path d="M1297 427C1314 428 1332 433 1343 442L1361 461C1367 467 1367 476 1360 480L1315 483C1308 483 1303 477 1301 469L1291 441C1288 434 1291 428 1297 427Z" fill="#182531"/>
                  <path d="M1301 434C1316 435 1330 439 1340 447L1350 458C1354 462 1351 469 1345 470L1316 471C1312 470 1309 467 1308 463L1299 441C1297 438 1298 435 1301 434Z" fill="#FFF2BF"/>
                  <path d="M1306 440L1341 459" stroke="#FFFDF2" strokeWidth="6" strokeLinecap="round" opacity=".9"/>
                  <rect x="1344" y="493" width="29" height="24" rx="7" fill="#FFAE22" stroke="#7B4814" strokeWidth="5"/>
                  <path d="M1352 500H1365" stroke="#FFE6A6" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M1254 563H1393V604C1393 616 1383 625 1371 625H1283C1265 625 1253 611 1254 594V563Z" fill="url(#bumper)"/>
                  <path d="M1320 576H1378" stroke="#586573" strokeWidth="8" strokeLinecap="round" opacity=".55"/>
                  <path d="M953 215H1127" stroke="#71E39B" strokeWidth="5" opacity=".5"/>
                  <path d="M962 223H1114" stroke="#E2FFEB" strokeWidth="2" opacity=".25"/>
                </g>

                {/* WHEEL ARCHES (Bounce securely with the truck body over the stationary tires) */}
                <g id="rear-wheel-arch">
                  <path d="M328 591C329 516 384 458 451 458C519 458 575 516 576 591H646V624H258V591H328Z" fill="#0B1119" opacity=".96"/>
                  <path d="M349 590C350 528 394 478 451 478C509 478 554 528 555 590H575C574 513 520 450 451 450C382 450 328 513 327 590H349Z" fill="#28313F"/>
                </g>
                <g id="front-wheel-arch">
                  <path d="M1080 591C1082 515 1135 458 1203 458C1270 458 1324 515 1326 591H1388V624H1010V591H1080Z" fill="#0B1119" opacity=".96"/>
                  <path d="M1101 590C1103 527 1146 478 1203 478C1260 478 1304 527 1306 590H1326C1324 513 1271 450 1203 450C1135 450 1081 513 1080 590H1101Z" fill="#28313F"/>
                </g>

                {/* Subtle Details */}
                <path d="M367 557C384 523 414 501 449 497" stroke="#7B8794" strokeWidth="5" strokeLinecap="round" opacity=".24"/>
                <path d="M1119 557C1136 523 1166 501 1201 497" stroke="#7B8794" strokeWidth="5" strokeLinecap="round" opacity=".24"/>
                <path d="M939 582H1031V624H926C915 624 908 616 908 605V598C908 589 921 582 939 582Z" fill="#1A2530"/>
                <path d="M931 592H1002" stroke="#475361" strokeWidth="5" strokeLinecap="round"/>
                <path d="M183 578H299V624H165C154 624 147 616 147 606V598C147 587 160 578 183 578Z" fill="#1A2530"/>
                <path d="M175 590H269" stroke="#475361" strokeWidth="5" strokeLinecap="round"/>
              </g>

              {/* ------------------------------------------------------------- */}
              {/* SPINNING TIRES (Completely isolated, zero wobble) */}
              {/* ------------------------------------------------------------- */}
              <g id="rear-wheel" className="wheel-rear" style={{ transformOrigin: '451px 604px' }} filter="url(#softShadow)">
                <circle cx="451" cy="604" r="118" fill="#0A0D12"/>
                <circle cx="451" cy="604" r="103" fill="url(#tire)" stroke="#3B4655" strokeWidth="7"/>
                <circle cx="451" cy="604" r="76" fill="#111722" stroke="#596574" strokeWidth="4"/>
                <circle cx="451" cy="604" r="66" fill="url(#rim)"/>
                <circle cx="451" cy="604" r="28" fill="#8C96A2"/>
                <circle cx="451" cy="604" r="15" fill="#15844B" stroke="#0D5E36" strokeWidth="4"/>
                <g fill="#3E4853">
                  <path d="M442 545L459 545L473 587L453 596Z"/>
                  <path d="M503 570L514 582L478 608L468 589Z"/>
                  <path d="M501 635L491 648L463 616L481 606Z"/>
                  <path d="M460 663L443 663L432 621L451 612Z"/>
                  <path d="M399 638L388 626L424 602L434 620Z"/>
                  <path d="M398 574L408 561L438 592L420 602Z"/>
                </g>
                <circle cx="451" cy="604" r="48" fill="none" stroke="#F2F6FA" strokeWidth="3" opacity=".45"/>
                <circle cx="451" cy="604" r="90" fill="none" stroke="#687383" strokeWidth="4" opacity=".28"/>
              </g>

              <g id="front-wheel" className="wheel-front" style={{ transformOrigin: '1203px 604px' }} filter="url(#softShadow)">
                <circle cx="1203" cy="604" r="118" fill="#0A0D12"/>
                <circle cx="1203" cy="604" r="103" fill="url(#tire)" stroke="#3B4655" strokeWidth="7"/>
                <circle cx="1203" cy="604" r="76" fill="#111722" stroke="#596574" strokeWidth="4"/>
                <circle cx="1203" cy="604" r="66" fill="url(#rim)"/>
                <circle cx="1203" cy="604" r="28" fill="#8C96A2"/>
                <circle cx="1203" cy="604" r="15" fill="#15844B" stroke="#0D5E36" strokeWidth="4"/>
                <g fill="#3E4853">
                  <path d="M1194 545L1211 545L1225 587L1205 596Z"/>
                  <path d="M1256 570L1266 582L1230 608L1220 589Z"/>
                  <path d="M1253 635L1243 648L1215 616L1233 606Z"/>
                  <path d="M1212 663L1195 663L1184 621L1203 612Z"/>
                  <path d="M1151 638L1140 626L1176 602L1186 620Z"/>
                  <path d="M1150 574L1160 561L1190 592L1172 602Z"/>
                </g>
                <circle cx="1203" cy="604" r="48" fill="none" stroke="#F2F6FA" strokeWidth="3" opacity=".45"/>
                <circle cx="1203" cy="604" r="90" fill="none" stroke="#687383" strokeWidth="4" opacity=".28"/>
              </g>

            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. DYNAMIC 5-STEP STEPPER & ROTATING WHOLESALE STATUS     */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-4 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative flex items-center justify-between w-60 mb-3">
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
        /* Continuous pan for distinct tall buildings */
        @keyframes skylineInfiniteScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-420px, 0, 0); }
        }
        .animate-skyline-scroll {
          animation: skylineInfiniteScroll 5.6s linear infinite;
        }

        /* Parallax cloud drift */
        @keyframes cloudsDrift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-420px, 0, 0); }
        }
        .animate-clouds-scroll {
          animation: cloudsDrift 10s linear infinite;
        }

        /* Perfectly locked 360-degree alloy wheel spin */
        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-rear {
          animation: spinWheelAnim 0.35s linear infinite;
        }
        .wheel-front {
          animation: spinWheelAnim 0.35s linear infinite;
        }

        /* Realistic suspension bounce for the truck body */
        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
          65% { transform: translateY(3px); }
        }
        .animate-truck-body {
          animation: truckBodyBounce 0.45s ease-in-out infinite;
        }

        /* Produce stack jiggles independently from the roof */
        @keyframes produceJiggle {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-0.5deg); }
        }
        .animate-produce-jiggle {
          transform-origin: 300px 100px;
          animation: produceJiggle 0.45s ease-in-out infinite 0.08s;
        }

        /* Speed wind streaks */
        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translate(50px, 520px) scale(4.5); }
          50% { opacity: 0.35; transform: translate(-30px, 520px) scale(4.5); }
        }
        .animate-speed-lines {
          animation: speedLines 0.5s ease-in-out infinite;
        }

        /* Message switch fade transition */
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