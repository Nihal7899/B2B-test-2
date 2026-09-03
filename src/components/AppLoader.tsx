import React from 'react';

interface AppLoaderProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export const AppLoader = React.memo(function AppLoader({
  fullScreen = true,
  size = 'md',
  showStatus = false,
  className = '',
}: AppLoaderProps) {
  const scaleClass =
    size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-105' : 'scale-95 sm:scale-100';

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in px-6' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center ${scaleClass}`}>
        {/* Main Stage Viewport */}
        <div className="relative w-88 h-64 flex items-center justify-center overflow-hidden">
          {/* ========================================================= */}
          {/* 1. SEAMLESS MOVING CITY SKYLINE (PANS RIGHT TO LEFT)      */}
          {/* ========================================================= */}
          <div className="absolute top-8 left-0 w-full h-36 overflow-hidden pointer-events-none z-0">
            <div className="flex w-[720px] animate-pan-skyline opacity-85">
              {/* Skyline Segment 1 (Width: 360px) */}
              <svg viewBox="0 0 360 130" className="w-[360px] h-[130px] shrink-0" fill="none">
                {/* Clouds */}
                <path d="M106 60C106 55.5 109.5 52 114 52C115.5 52 117 52.5 118 53.5C119.5 50 123 48 127 48C132.5 48 137 52.5 137 58C138.5 58 140 59.5 140 61C140 63 138.5 64.5 136.5 64.5H109C107.5 64.5 106 63 106 60Z" fill="#e4efe7" />
                <path d="M256 64C256 60 259 57 263 57C264.5 57 265.5 57.5 266.5 58.5C268 55.5 271 54 274.5 54C279 54 283 57.5 283 62C284.5 62 286 63.5 286 65C286 67 284.5 68.5 282.5 68.5H259C257.5 68.5 256 67 256 64Z" fill="#e4efe7" />

                {/* Left Storefront Building with Scalloped Awning */}
                <rect x="68" y="78" width="50" height="52" rx="2" fill="#d9ebdf" />
                <path d="M64 86H122L119 95H67L64 86Z" fill="#c3decc" />
                <path d="M69 95C69 97 71 98.5 73 98.5C75 98.5 77 97 77 95H69Z" fill="#b1d3bc" />
                <path d="M77 95C77 97 79 98.5 81 98.5C83 98.5 85 97 85 95H77Z" fill="#b1d3bc" />
                <path d="M85 95C85 97 87 98.5 89 98.5C91 98.5 93 97 93 95H85Z" fill="#b1d3bc" />
                <path d="M93 95C93 97 95 98.5 97 98.5C99 98.5 101 97 101 95H93Z" fill="#b1d3bc" />
                <path d="M101 95C101 97 103 98.5 105 98.5C107 98.5 109 97 109 95H101Z" fill="#b1d3bc" />
                <path d="M109 95C109 97 111 98.5 113 98.5C115 98.5 117 97 117 95H109Z" fill="#b1d3bc" />
                <rect x="75" y="104" width="9" height="15" rx="1" fill="#eaf3ec" />
                <rect x="88" y="104" width="9" height="15" rx="1" fill="#eaf3ec" />
                <rect x="101" y="104" width="9" height="15" rx="1" fill="#eaf3ec" />

                {/* Tall Central Spire Tower */}
                <path d="M136 68L152 48V130H136V68Z" fill="#e2efe6" />
                <rect x="164" y="38" width="38" height="92" rx="2" fill="#d9ebdf" />
                <rect x="178" y="24" width="10" height="14" fill="#d9ebdf" />
                <line x1="183" y1="16" x2="183" y2="24" stroke="#c3decc" strokeWidth="2" strokeLinecap="round" />
                <circle cx="174" cy="50" r="1.8" fill="#f0f7f2" />
                <circle cx="183" cy="50" r="1.8" fill="#f0f7f2" />
                <circle cx="192" cy="50" r="1.8" fill="#f0f7f2" />
                <circle cx="174" cy="62" r="1.8" fill="#f0f7f2" />
                <circle cx="183" cy="62" r="1.8" fill="#f0f7f2" />
                <circle cx="192" cy="62" r="1.8" fill="#f0f7f2" />
                <circle cx="174" cy="74" r="1.8" fill="#f0f7f2" />
                <circle cx="183" cy="74" r="1.8" fill="#f0f7f2" />
                <circle cx="192" cy="74" r="1.8" fill="#f0f7f2" />

                {/* Right Commercial Outlets & Awning */}
                <rect x="210" y="66" width="32" height="64" rx="2" fill="#e2efe6" />
                <rect x="250" y="76" width="36" height="54" rx="2" fill="#d9ebdf" />
                <path d="M246 86H288L285 95H249L246 86Z" fill="#c3decc" />
                <path d="M251 95C251 97 253 98.5 255 98.5C257 98.5 259 97 259 95H251Z" fill="#b1d3bc" />
                <path d="M259 95C259 97 261 98.5 263 98.5C265 98.5 267 97 267 95H259Z" fill="#b1d3bc" />
                <path d="M267 95C267 97 269 98.5 271 98.5C273 98.5 275 97 275 95H267Z" fill="#b1d3bc" />
                <path d="M275 95C275 97 277 98.5 279 98.5C281 98.5 283 97 283 95H275Z" fill="#b1d3bc" />

                {/* Location Map Pins */}
                <g transform="translate(126, 68) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#c0dbca" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>
                <g transform="translate(266, 70) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#c0dbca" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>
              </svg>

              {/* Skyline Segment 2 (Duplicate for Seamless Loop) */}
              <svg viewBox="0 0 360 130" className="w-[360px] h-[130px] shrink-0" fill="none">
                <path d="M106 60C106 55.5 109.5 52 114 52C115.5 52 117 52.5 118 53.5C119.5 50 123 48 127 48C132.5 48 137 52.5 137 58C138.5 58 140 59.5 140 61C140 63 138.5 64.5 136.5 64.5H109C107.5 64.5 106 63 106 60Z" fill="#e4efe7" />
                <path d="M256 64C256 60 259 57 263 57C264.5 57 265.5 57.5 266.5 58.5C268 55.5 271 54 274.5 54C279 54 283 57.5 283 62C284.5 62 286 63.5 286 65C286 67 284.5 68.5 282.5 68.5H259C257.5 68.5 256 67 256 64Z" fill="#e4efe7" />
                <rect x="68" y="78" width="50" height="52" rx="2" fill="#d9ebdf" />
                <path d="M64 86H122L119 95H67L64 86Z" fill="#c3decc" />
                <path d="M69 95C69 97 71 98.5 73 98.5C75 98.5 77 97 77 95H69Z" fill="#b1d3bc" />
                <path d="M77 95C77 97 79 98.5 81 98.5C83 98.5 85 97 85 95H77Z" fill="#b1d3bc" />
                <path d="M85 95C85 97 87 98.5 89 98.5C91 98.5 93 97 93 95H85Z" fill="#b1d3bc" />
                <path d="M93 95C93 97 95 98.5 97 98.5C99 98.5 101 97 101 95H93Z" fill="#b1d3bc" />
                <path d="M101 95C101 97 103 98.5 105 98.5C107 98.5 109 97 109 95H101Z" fill="#b1d3bc" />
                <path d="M109 95C109 97 111 98.5 113 98.5C115 98.5 117 97 117 95H109Z" fill="#b1d3bc" />
                <rect x="75" y="104" width="9" height="15" rx="1" fill="#eaf3ec" />
                <rect x="88" y="104" width="9" height="15" rx="1" fill="#eaf3ec" />
                <rect x="101" y="104" width="9" height="15" rx="1" fill="#eaf3ec" />
                <path d="M136 68L152 48V130H136V68Z" fill="#e2efe6" />
                <rect x="164" y="38" width="38" height="92" rx="2" fill="#d9ebdf" />
                <rect x="178" y="24" width="10" height="14" fill="#d9ebdf" />
                <line x1="183" y1="16" x2="183" y2="24" stroke="#c3decc" strokeWidth="2" strokeLinecap="round" />
                <circle cx="174" cy="50" r="1.8" fill="#f0f7f2" />
                <circle cx="183" cy="50" r="1.8" fill="#f0f7f2" />
                <circle cx="192" cy="50" r="1.8" fill="#f0f7f2" />
                <circle cx="174" cy="62" r="1.8" fill="#f0f7f2" />
                <circle cx="183" cy="62" r="1.8" fill="#f0f7f2" />
                <circle cx="192" cy="62" r="1.8" fill="#f0f7f2" />
                <circle cx="174" cy="74" r="1.8" fill="#f0f7f2" />
                <circle cx="183" cy="74" r="1.8" fill="#f0f7f2" />
                <circle cx="192" cy="74" r="1.8" fill="#f0f7f2" />
                <rect x="210" y="66" width="32" height="64" rx="2" fill="#e2efe6" />
                <rect x="250" y="76" width="36" height="54" rx="2" fill="#d9ebdf" />
                <path d="M246 86H288L285 95H249L246 86Z" fill="#c3decc" />
                <path d="M251 95C251 97 253 98.5 255 98.5C257 98.5 259 97 259 95H251Z" fill="#b1d3bc" />
                <path d="M259 95C259 97 261 98.5 263 98.5C265 98.5 267 97 267 95H259Z" fill="#b1d3bc" />
                <path d="M267 95C267 97 269 98.5 271 98.5C273 98.5 275 97 275 95H267Z" fill="#b1d3bc" />
                <path d="M275 95C275 97 277 98.5 279 98.5C281 98.5 283 97 283 95H275Z" fill="#b1d3bc" />
                <g transform="translate(126, 68) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#c0dbca" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>
                <g transform="translate(266, 70) scale(0.75)">
                  <path d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z" fill="#c0dbca" />
                  <circle cx="10" cy="9" r="4" fill="#ffffff" />
                </g>
              </svg>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. THE CAFKART GROCERY TRUCK (PROPORTIONAL & CENTERED)    */}
          {/* ========================================================= */}
          <svg
            viewBox="0 0 360 220"
            className="w-full h-full z-10 pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="groundShadowMain" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Trailing Green Wind Streaks */}
            <g className="animate-speed-lines">
              <line x1="42" y1="112" x2="80" y2="112" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="28" y1="120" x2="80" y2="120" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="38" y1="128" x2="80" y2="128" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="50" y1="136" x2="80" y2="136" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" />
            </g>

            {/* Soft Elliptical Ground Shadow directly under tyres */}
            <ellipse cx="180" cy="180" rx="104" ry="5.5" fill="url(#groundShadowMain)" />

            {/* TRUCK BODY & GROCERIES (BOUNCES GENTLY ON SPRINGS) */}
            <g className="animate-truck-body">
              {/* Fresh Groceries Overflowing Out of Top */}
              <g className="animate-produce-jiggle">
                {/* Yellow Banana Cluster */}
                <g transform="translate(84, 82) rotate(-14)">
                  <path d="M12 28C18 31 29 30 35 19C37 15 37 10 36 6C35 6 32 9 29 13C22 21 15 24 12 28Z" fill="#fbbf24" />
                  <path d="M6 25C11 28 22 27 28 17C30 13 30 9 29 5C28 5 26 8 23 11C16 18 9 21 6 25Z" fill="#facc15" />
                  <path d="M28 17L31 14" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="6" cy="25" r="1.5" fill="#78350f" />
                </g>

                {/* Bushy Green Cabbage */}
                <ellipse cx="116" cy="88" rx="13" ry="14" fill="#15803d" />
                <ellipse cx="116" cy="88" rx="10" ry="11" fill="#16a34a" />
                <circle cx="114" cy="85" r="6" fill="#22c55e" />

                {/* Baked Bread Loaf */}
                <rect x="134" y="78" width="11" height="30" rx="5.5" transform="rotate(18 134 78)" fill="#d97706" />
                <line x1="135" y1="87" x2="140" y2="89" stroke="#fef3c7" strokeWidth="1.4" strokeLinecap="round" />
                <line x1="133" y1="94" x2="138" y2="96" stroke="#fef3c7" strokeWidth="1.4" strokeLinecap="round" />

                {/* Red Bell Pepper & Juicy Tomatoes */}
                <circle cx="127" cy="97" r="7" fill="#dc2626" />
                <circle cx="135" cy="98" r="6.5" fill="#ef4444" />
                <circle cx="120" cy="100" r="6" fill="#dc2626" />
                <path d="M127 90V87M135 91.5V88.5" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" />

                {/* Milk Bottle */}
                <g transform="translate(148, 79) rotate(8)">
                  <rect x="0" y="5" width="15" height="24" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                  <rect x="0" y="13" width="15" height="10" fill="#38bdf8" />
                  <circle cx="7.5" cy="18" r="3" fill="#ffffff" />
                  <rect x="4" y="1" width="7" height="4" rx="1" fill="#0284c7" />
                </g>

                {/* Orange Juice Carton */}
                <g transform="translate(164, 84) rotate(14)">
                  <rect x="0" y="4" width="16" height="22" rx="2" fill="#f97316" />
                  <circle cx="8" cy="14" r="3.5" fill="#fed7aa" />
                  <polygon points="0,4 8,0 16,4" fill="#ea580c" />
                </g>
              </g>

              {/* ----------------- EXTENDED CARGO CONTAINER (x=82 to x=210) ----------------- */}
              <rect x="82" y="94" width="128" height="64" rx="5" fill="#22c55e" />
              <rect x="82" y="152" width="128" height="6" fill="#16a34a" />

              {/* CAFKART LOGO: SHIFTED FORWARD TO x=154 (CLEAR OF REAR TYRE AT x=112) */}
              <g transform="translate(154, 107) scale(0.024)">
                <path
                  d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
                  fill="#FFFFFF"
                  fillRule="evenodd"
                />
                <path
                  d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
                  fill="#FFFFFF"
                  fillRule="evenodd"
                />
              </g>

              {/* ----------------- DRIVER CABIN (ATTACHED PROPORTIONALLY) ----------------- */}
              <path
                d="M210 100H238C243 100 247 103 249.5 107.5L263 130C265 133.5 263.5 138 259 138H210V100Z"
                fill="#02402c"
              />

              {/* Windshield & Door Frame */}
              <path
                d="M216 104H236C238.5 104 241 105.8 242 108.5L251 124H216V104Z"
                fill="#a7f3d0"
                opacity="0.9"
              />
              <line x1="233" y1="104" x2="233" y2="124" stroke="#02402c" strokeWidth="2.5" />

              {/* Front Bumper & Amber Turn Signal */}
              <path d="M259 138H272C275 138 277 140.5 277 143.5V148H254L259 138Z" fill="#0f172a" />
              <rect x="270" y="140" width="5" height="5" rx="1" fill="#f59e0b" />

              {/* Chassis Under-rail with Two Wheel Cutouts */}
              <path
                d="M80 156H94C96 156 98 153.5 98 151C98 138 108 128 121 128C134 128 144 138 144 151C144 153.5 146 156 148 156H222C224 156 226 153.5 226 151C226 138 236 128 249 128C262 128 272 138 272 151C272 153.5 274 156 276 156H282V162H80V156Z"
                fill="#0f172a"
              />
            </g>

            {/* ========================================================= */}
            {/* 3. ROTATING ALLOY WHEELS WITH VISIBLE SPOKES (FIXED PIVOT) */}
            {/* ========================================================= */}
            {/* Rear Tyre (Pivot exactly at cx=121, cy=158) */}
            <g className="wheel-rear" style={{ transformOrigin: '121px 158px' }}>
              <circle cx="121" cy="158" r="17" fill="#1e293b" />
              <circle cx="121" cy="158" r="10.5" fill="#e2e8f0" />
              {/* Visible Alloy Spokes That Clearly Spin */}
              <line x1="121" y1="148" x2="121" y2="168" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="111" y1="158" x2="131" y2="158" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="114" y1="151" x2="128" y2="165" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <line x1="114" y1="165" x2="128" y2="151" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <circle cx="121" cy="158" r="4.5" fill="#0f172a" />
            </g>

            {/* Front Tyre (Pivot exactly at cx=249, cy=158) */}
            <g className="wheel-front" style={{ transformOrigin: '249px 158px' }}>
              <circle cx="249" cy="158" r="17" fill="#1e293b" />
              <circle cx="249" cy="158" r="10.5" fill="#e2e8f0" />
              {/* Visible Alloy Spokes That Clearly Spin */}
              <line x1="249" y1="148" x2="249" y2="168" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="239" y1="158" x2="259" y2="158" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="242" y1="151" x2="256" y2="165" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <line x1="242" y1="165" x2="256" y2="151" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <circle cx="249" cy="158" r="4.5" fill="#0f172a" />
            </g>
          </svg>
        </div>

        {/* ========================================================= */}
        {/* 4. SOLID ROAD STEPPER & TAGLINE (HOME SCREEN ONLY)        */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-2 flex flex-col items-center justify-center animate-fade-in">
            {/* 5-Step Progress Track */}
            <div className="relative flex items-center justify-between w-48 mb-3">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-[#cbd5e1] z-0" />
              <div className="absolute top-1/2 left-0 w-1/2 h-[2px] -translate-y-1/2 bg-[#22c55e] z-0" />

              <div className="relative z-10 h-3 w-3 rounded-full bg-[#22c55e]" />
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#22c55e]" />
              <div className="relative z-10 flex items-center justify-center h-4 w-4 rounded-full border-2 border-[#22c55e] bg-white">
                <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
              </div>
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#cbd5e1]" />
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#cbd5e1]" />
            </div>

            {/* Tagline */}
            <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight">
              Delivering Quality, Every Time
              <span className="text-emerald-500 text-sm">🍃</span>
            </p>
          </div>
        )}
      </div>

      {/* GPU Keyframe Animations */}
      <style>{`
        /* Smooth, seamless infinite city pan */
        @keyframes panSkyline {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-360px, 0, 0); }
        }
        .animate-pan-skyline {
          animation: panSkyline 4.8s linear infinite;
        }

        /* Visible 360-degree Wheel Spin */
        @keyframes spinWheelAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .wheel-rear {
          animation: spinWheelAnim 0.42s linear infinite;
        }
        .wheel-front {
          animation: spinWheelAnim 0.42s linear infinite;
        }

        /* Suspension bob on truck body (wheels remain planted) */
        @keyframes truckBodyBounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-1.4px); }
          65% { transform: translateY(0.4px); }
        }
        .animate-truck-body {
          animation: truckBodyBounce 0.65s ease-in-out infinite;
        }

        /* Produce bobbing inside container */
        @keyframes produceJiggle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1.2px) rotate(-0.5deg); }
        }
        .animate-produce-jiggle {
          animation: produceJiggle 0.65s ease-in-out infinite 0.08s;
        }

        /* Speed wind streaks */
        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translateX(0); }
          50% { opacity: 0.35; transform: translateX(-4px); }
        }
        .animate-speed-lines {
          animation: speedLines 0.5s ease-in-out infinite;
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
