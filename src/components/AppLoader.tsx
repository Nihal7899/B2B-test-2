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
        {/* ========================================================= */}
        {/* 1. EXACT SVG VECTOR ILLUSTRATION (MATCHING YOUR IMAGE)    */}
        {/* ========================================================= */}
        <div className="relative w-84 h-64 flex items-center justify-center">
          <svg
            viewBox="0 0 360 250"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Soft Ground Shadow Gradient */}
              <radialGradient id="softGroundGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* ------------------------------------------------------------- */}
            {/* A. SOFT SAGE-MINT CITY SILHOUETTE, CLOUDS & MAP PINS          */}
            {/* ------------------------------------------------------------- */}
            <g opacity="0.8">
              {/* Left Cloud */}
              <path
                d="M106 74C106 69.5 109.5 66 114 66C115.5 66 117 66.5 118 67.5C119.5 64 123 62 127 62C132.5 62 137 66.5 137 72C138.5 72 140 73.5 140 75C140 77 138.5 78.5 136.5 78.5H109C107.5 78.5 106 77 106 74Z"
                fill="#e4efe7"
              />

              {/* Right Cloud */}
              <path
                d="M242 78C242 74 245 71 249 71C250.5 71 251.5 71.5 252.5 72.5C254 69.5 257 68 260.5 68C265 68 269 71.5 269 76C270.5 76 272 77.5 272 79C272 81 270.5 82.5 268.5 82.5H245C243.5 82.5 242 81 242 78Z"
                fill="#e4efe7"
              />

              {/* Left Shop with Scalloped Awning */}
              <rect x="70" y="96" width="46" height="66" rx="2" fill="#d9ebdf" />
              {/* Awning */}
              <path d="M66 104H120L117 113H69L66 104Z" fill="#c3decc" />
              <path d="M71 113C71 115 73 116.5 75 116.5C77 116.5 79 115 79 113H71Z" fill="#b1d3bc" />
              <path d="M79 113C79 115 81 116.5 83 116.5C85 116.5 87 115 87 113H79Z" fill="#b1d3bc" />
              <path d="M87 113C87 115 89 116.5 91 116.5C93 116.5 95 115 95 113H87Z" fill="#b1d3bc" />
              <path d="M95 113C95 115 97 116.5 99 116.5C101 116.5 103 115 103 113H95Z" fill="#b1d3bc" />
              <path d="M103 113C103 115 105 116.5 107 116.5C109 116.5 111 115 111 113H103Z" fill="#b1d3bc" />
              <path d="M111 113C111 115 113 116.5 115 116.5C117 116.5 119 115 119 113H111Z" fill="#b1d3bc" />
              {/* Windows */}
              <rect x="76" y="122" width="8" height="14" rx="1" fill="#eaf3ec" />
              <rect x="89" y="122" width="8" height="14" rx="1" fill="#eaf3ec" />
              <rect x="102" y="122" width="8" height="14" rx="1" fill="#eaf3ec" />

              {/* Center Tall Skyscraper with Spire Antenna */}
              <path d="M136 82L152 62V162H136V82Z" fill="#e2efe6" />
              <rect x="162" y="54" width="34" height="108" rx="2" fill="#d9ebdf" />
              <rect x="174" y="40" width="10" height="14" fill="#d9ebdf" />
              <line x1="179" y1="32" x2="179" y2="40" stroke="#c3decc" strokeWidth="2" strokeLinecap="round" />
              {/* Tower Window Dots */}
              <circle cx="171" cy="64" r="1.5" fill="#f0f7f2" />
              <circle cx="179" cy="64" r="1.5" fill="#f0f7f2" />
              <circle cx="187" cy="64" r="1.5" fill="#f0f7f2" />
              <circle cx="171" cy="74" r="1.5" fill="#f0f7f2" />
              <circle cx="179" cy="74" r="1.5" fill="#f0f7f2" />
              <circle cx="187" cy="74" r="1.5" fill="#f0f7f2" />
              <circle cx="171" cy="84" r="1.5" fill="#f0f7f2" />
              <circle cx="179" cy="84" r="1.5" fill="#f0f7f2" />
              <circle cx="187" cy="84" r="1.5" fill="#f0f7f2" />

              {/* Right Side Buildings */}
              <rect x="204" y="78" width="30" height="84" rx="2" fill="#e2efe6" />
              <rect x="240" y="92" width="32" height="70" rx="2" fill="#d9ebdf" />
              {/* Right Store Scalloped Awning */}
              <path d="M236 104H274L271 113H239L236 104Z" fill="#c3decc" />
              <path d="M241 113C241 115 243 116.5 245 116.5C247 116.5 249 115 249 113H241Z" fill="#b1d3bc" />
              <path d="M249 113C249 115 251 116.5 253 116.5C255 116.5 257 115 257 113H249Z" fill="#b1d3bc" />
              <path d="M257 113C257 115 259 116.5 261 116.5C263 116.5 265 115 265 113H257Z" fill="#b1d3bc" />
              <path d="M265 113C265 115 267 116.5 269 116.5C271 116.5 273 115 273 113H265Z" fill="#b1d3bc" />

              {/* Left Map Pin */}
              <g transform="translate(126, 80) scale(0.7)">
                <path
                  d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z"
                  fill="#c0dbca"
                />
                <circle cx="10" cy="9" r="4" fill="#ffffff" />
              </g>

              {/* Right Map Pin */}
              <g transform="translate(254, 82) scale(0.7)">
                <path
                  d="M10 0C4.5 0 0 4.5 0 10C0 17 10 26 10 26C10 26 20 17 20 10C20 4.5 15.5 0 10 0Z"
                  fill="#c0dbca"
                />
                <circle cx="10" cy="9" r="4" fill="#ffffff" />
              </g>
            </g>

            {/* ------------------------------------------------------------- */}
            {/* B. TRAILING GREEN SPEED STREAKS                               */}
            {/* ------------------------------------------------------------- */}
            <g className="animate-speed-lines">
              <line x1="68" y1="134" x2="108" y2="134" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="56" y1="140" x2="108" y2="140" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="64" y1="146" x2="108" y2="146" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="72" y1="152" x2="108" y2="152" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" />
            </g>

            {/* ------------------------------------------------------------- */}
            {/* C. SOFT HORIZONTAL GROUND SHADOW                              */}
            {/* ------------------------------------------------------------- */}
            <ellipse cx="186" cy="164" rx="92" ry="4.5" fill="url(#softGroundGrad)" />

            {/* ------------------------------------------------------------- */}
            {/* D. THE GROCERY DELIVERY TRUCK                                 */}
            {/* ------------------------------------------------------------- */}
            <g className="animate-truck-gentle">
              {/* 1. FRESH LOADED GROCERIES PILED ON TOP OF CONTAINER */}
              <g className="animate-groceries-bob">
                {/* Yellow Bananas Bunch */}
                <g transform="translate(106, 122) rotate(-14)">
                  <path
                    d="M12 26C17 29 27 28 32 18C34 14 34 10 33 6C32 6 30 9 27 12C21 19 15 22 12 26Z"
                    fill="#fbbf24"
                  />
                  <path
                    d="M6 24C11 27 21 26 26 16C28 12 28 8 27 4C26 4 24 7 21 10C15 17 9 20 6 24Z"
                    fill="#facc15"
                  />
                  <path d="M26 16L29 13" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="6" cy="24" r="1.5" fill="#78350f" />
                </g>

                {/* Bushy Green Cabbage / Kale */}
                <ellipse cx="132" cy="128" rx="11" ry="12" fill="#15803d" />
                <ellipse cx="132" cy="128" rx="9" ry="10" fill="#16a34a" />
                <circle cx="130" cy="126" r="6" fill="#22c55e" />

                {/* Crusty Brown Baguette / Bread Loaf */}
                <rect x="148" y="120" width="10" height="26" rx="5" transform="rotate(18 148 120)" fill="#d97706" />
                <line x1="149" y1="128" x2="153" y2="130" stroke="#fef3c7" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="147" y1="134" x2="151" y2="136" stroke="#fef3c7" strokeWidth="1.2" strokeLinecap="round" />

                {/* Bright Red Bell Pepper & Plump Tomatoes */}
                <circle cx="142" cy="136" r="6.5" fill="#dc2626" />
                <circle cx="149" cy="137" r="6" fill="#ef4444" />
                <circle cx="136" cy="138" r="5.5" fill="#dc2626" />
                <path d="M142 129.5V127M149 131V128.5" stroke="#15803d" strokeWidth="1.6" strokeLinecap="round" />

                {/* Glass Dairy Milk Bottle (White bottle, blue label, blue cap) */}
                <g transform="translate(158, 120) rotate(8)">
                  <rect x="0" y="5" width="14" height="22" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                  <rect x="0" y="12" width="14" height="9" fill="#38bdf8" />
                  <circle cx="7" cy="16.5" r="2.8" fill="#ffffff" />
                  <rect x="3.5" y="1" width="7" height="4" rx="1" fill="#0284c7" />
                </g>

                {/* Orange Grocery / Juice Carton */}
                <g transform="translate(172, 125) rotate(14)">
                  <rect x="0" y="4" width="15" height="19" rx="2" fill="#f97316" />
                  <circle cx="7.5" cy="12.5" r="3.2" fill="#fed7aa" />
                  <polygon points="0,4 7.5,0 15,4" fill="#ea580c" />
                </g>
              </g>

              {/* 2. BRIGHT VIBRANT GREEN CARGO CONTAINER */}
              <rect x="110" y="132" width="94" height="50" rx="5" fill="#22c55e" />
              <rect x="110" y="177" width="94" height="5" fill="#16a34a" />

              {/* EXACT CAFKART LOGO: SOLID CRISP WHITE CENTERED ON GREEN CONTAINER */}
              <g transform="translate(144, 142) scale(0.020)">
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

              {/* 3. DEEP FOREST GREEN DRIVER CABIN */}
              <path
                d="M204 136H228C232 136 235.5 138.5 237.5 142L248 158C249.5 160.5 248 164 245 164H204V136Z"
                fill="#02402c"
              />
              {/* Light Mint Windshield & Door Divider */}
              <path
                d="M209 140H227C229 140 231 141.5 232 143.5L240 155H209V140Z"
                fill="#a7f3d0"
                opacity="0.9"
              />
              <line x1="224" y1="140" x2="224" y2="155" stroke="#02402c" strokeWidth="2.5" />

              {/* Front Lower Bumper & Amber Turn Signal */}
              <path d="M245 158H255C257.5 158 259 160 259 162.5V166H241L245 158Z" fill="#0f172a" />
              <rect x="253" y="159" width="4.5" height="4.5" rx="1" fill="#f59e0b" />

              {/* 4. CHASSIS CUTOUTS */}
              <path
                d="M106 176H126C128 176 130 174 130 172C130 161 140 153 151 153C162 153 172 161 172 172C172 174 174 176 176 176H206C208 176 210 174 210 172C210 161 220 153 231 153C242 153 252 161 252 172C252 174 254 176 256 176H264V180H106V176Z"
                fill="#0f172a"
              />

              {/* 5. TWO WHEELS WITH SILVER ALLOY RIMS */}
              {/* Rear Wheel (x=151, y=172) */}
              <g className="animate-spin-wheel origin-[151px_172px]">
                <circle cx="151" cy="172" r="14" fill="#1e293b" />
                <circle cx="151" cy="172" r="8" fill="#e2e8f0" />
                <circle cx="151" cy="172" r="4" fill="#0f172a" />
              </g>

              {/* Front Wheel (x=231, y=172) */}
              <g className="animate-spin-wheel origin-[231px_172px]">
                <circle cx="231" cy="172" r="14" fill="#1e293b" />
                <circle cx="231" cy="172" r="8" fill="#e2e8f0" />
                <circle cx="231" cy="172" r="4" fill="#0f172a" />
              </g>
            </g>
          </svg>
        </div>

        {/* ========================================================= */}
        {/* 2. SOLID PROGRESS STEPPER & TAGLINE (HOME SCREEN ONLY)    */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-4 flex flex-col items-center justify-center animate-fade-in">
            {/* 5-Node Progress Track */}
            <div className="relative flex items-center justify-between w-48 mb-3">
              {/* Base Inactive Grey Track */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-[#cbd5e1] z-0" />
              {/* Active Green Track Segment */}
              <div className="absolute top-1/2 left-0 w-1/2 h-[2px] -translate-y-1/2 bg-[#22c55e] z-0" />

              {/* Node 1 */}
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#22c55e]" />
              {/* Node 2 */}
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#22c55e]" />
              {/* Node 3 (Active Pulsing Ring) */}
              <div className="relative z-10 flex items-center justify-center h-4 w-4 rounded-full border-2 border-[#22c55e] bg-white">
                <div className="h-2 w-2 rounded-full bg-[#22c55e] animate-pulse" />
              </div>
              {/* Node 4 */}
              <div className="relative z-10 h-3 w-3 rounded-full bg-[#cbd5e1]" />
              {/* Node 5 */}
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
        @keyframes truckGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.2px); }
        }
        .animate-truck-gentle {
          animation: truckGentle 0.75s ease-in-out infinite;
        }

        @keyframes groceriesBob {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1.5px) rotate(-0.4deg); }
        }
        .animate-groceries-bob {
          animation: groceriesBob 0.75s ease-in-out infinite 0.08s;
        }

        @keyframes spinWheel {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-wheel {
          animation: spinWheel 0.4s linear infinite;
        }

        @keyframes speedLines {
          0%, 100% { opacity: 0.85; transform: translateX(0); }
          50% { opacity: 0.45; transform: translateX(-3.5px); }
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
