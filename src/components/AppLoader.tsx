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
      <div className={`relative flex flex-col items-center justify-center w-72 h-52 ${scaleClass}`}>
        {/* Ambient Subtle Green Glow */}
        <div className="absolute h-40 w-52 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />

        {/* ----------------- SPEED WIND STREAKS (Rear) ----------------- */}
        <div className="absolute top-14 -left-3 flex flex-col gap-2.5 pointer-events-none opacity-60">
          <div className="h-[2px] w-7 bg-gradient-to-l from-emerald-400 to-transparent rounded-full animate-wind-1" />
          <div className="h-[2px] w-12 bg-gradient-to-l from-emerald-500 to-transparent rounded-full animate-wind-2 ml-2" />
          <div className="h-[2px] w-8 bg-gradient-to-l from-emerald-400 to-transparent rounded-full animate-wind-3 ml-1" />
        </div>

        {/* ----------------- THE CAFKART DELIVERY TRUCK ----------------- */}
        <div className="relative z-10 animate-truck-drive">
          <svg
            className="w-56 h-32 drop-shadow-xl"
            viewBox="0 0 220 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Truck Body Emerald Gradient */}
              <linearGradient id="truckBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#03543a" />
                <stop offset="100%" stopColor="#012b1d" />
              </linearGradient>

              {/* Splash Logo Green Gradient */}
              <linearGradient id="truckLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#59D9B6" />
                <stop offset="100%" stopColor="#58D5A5" />
              </linearGradient>

              {/* Headlight Beam Glow */}
              <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>

              {/* Produce Gradients */}
              <radialGradient id="appleGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#ff4d6d" />
                <stop offset="100%" stopColor="#c9184a" />
              </radialGradient>
              <linearGradient id="bananaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffe66d" />
                <stop offset="100%" stopColor="#f4b41a" />
              </linearGradient>
              <linearGradient id="carrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9f1c" />
                <stop offset="100%" stopColor="#e85d04" />
              </linearGradient>
            </defs>

            {/* Headlight Light Cone */}
            <polygon points="208,76 220,70 220,84" fill="url(#headlightBeam)" opacity="0.7" />

            {/* 1. CARGO BED: REAR BACK WALL & ROLL BARS */}
            <rect x="18" y="38" width="108" height="42" rx="6" fill="#011f15" />
            <path d="M22 40V80M44 40V80M66 40V80M88 40V80M110 40V80" stroke="#043a28" strokeWidth="2.5" />
            <rect x="14" y="34" width="116" height="5" rx="2.5" fill="#334155" />

            {/* 2. BOUNCING GROCERIES INSIDE THE TRUCK CARGO BED */}
            <g className="animate-groceries-jostle">
              {/* Lower Wholesale Crates */}
              <rect x="22" y="58" width="46" height="20" rx="3" fill="#b45309" opacity="0.9" />
              <rect x="24" y="60" width="42" height="3" fill="#d97706" />
              <rect x="72" y="58" width="48" height="20" rx="3" fill="#046243" opacity="0.9" />
              <rect x="74" y="60" width="44" height="3" fill="#59D9B6" opacity="0.7" />

              {/* Fresh Farm Produce Stacked & Overflowing */}
              {/* Apples / Tomatoes */}
              <circle cx="32" cy="54" r="7" fill="url(#appleGrad)" />
              <circle cx="43" cy="52" r="7.5" fill="url(#appleGrad)" />
              <path d="M42 45V43M44 44L46 43" stroke="#2d6a4f" strokeWidth="1.5" strokeLinecap="round" />

              {/* Ripe Bananas */}
              <path
                d="M54 50C58 54 68 53 73 44C74 41 74 38 73 35C72 35 70 38 67 40C62 45 57 47 54 50Z"
                fill="url(#bananaGrad)"
              />
              <path d="M73 35L75 33" stroke="#588157" strokeWidth="2" strokeLinecap="round" />

              {/* Carrots with Leafy Tops */}
              <path d="M78 40L83 34M80 37L86 36M81 41L87 39" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
              <path d="M78 39C80 41 80 43 78 45L67 56C65 57 63 56 63 55L75 40C76 38 77 38 78 39Z" fill="url(#carrotGrad)" />

              {/* Crisp Farm Greens (Cabbage / Leafy Lettuce) */}
              <ellipse cx="94" cy="50" rx="9" ry="8" fill="#10b981" />
              <ellipse cx="94" cy="51" rx="7" ry="6" fill="#34d399" />
              <circle cx="94" cy="51" r="4.5" fill="#6ee7b7" />

              {/* Fresh Dairy Milk Bottles */}
              <rect x="105" y="44" width="7" height="15" rx="1.5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
              <rect x="106" y="49" width="5" height="9" fill="#ffffff" />
              <rect x="106.5" y="42" width="4" height="2.5" rx="1" fill="#0284c7" />
            </g>

            {/* 3. LOWER CARGO GATE (Holds crates in place) */}
            <path d="M16 68H126V80C126 82 124 84 122 84H20C18 84 16 82 16 80V68Z" fill="#02402c" />
            <line x1="16" y1="74" x2="126" y2="74" stroke="#046243" strokeWidth="2" />
            <circle cx="22" cy="74" r="2" fill="#59D9B6" />
            <circle cx="120" cy="74" r="2" fill="#59D9B6" />

            {/* 4. DRIVER CABIN (Front) */}
            <path
              d="M126 28H158C162 28 165.5 30.5 167 34.2L182 72C183.5 75.5 181 80 177 80H126V28Z"
              fill="url(#truckBodyGrad)"
            />
            {/* Front Grill & Bumper */}
            <path d="M182 72H200C204 72 207 75 207 79V84H177L182 72Z" fill="#011f15" />
            <rect x="202" y="75" width="5" height="5" rx="1.5" fill="#fef08a" />
            <rect x="194" y="80" width="12" height="2" rx="1" fill="#475569" />

            {/* Aerodynamic Windshield */}
            <path
              d="M132 34H156C158.5 34 160.8 35.8 161.7 38.2L171 60H132V34Z"
              fill="#a7f3d0"
              opacity="0.85"
            />
            {/* Windshield Reflection */}
            <path d="M152 35L163 58H158L148 35H152Z" fill="#ffffff" opacity="0.6" />

            {/* Side Mirror */}
            <rect x="160" y="46" width="3" height="8" rx="1.5" fill="#02402c" />
            <rect x="160" y="48" width="5" height="1.5" rx="0.5" fill="#64748b" />

            {/* 5. CAFKART EMBEDDED LOGO (Driver Door Panel)[span_0](start_span)[span_0](end_span) */}
            <g transform="translate(136, 52)">
              {/* Circular Logo Backplate */}
              <circle cx="12" cy="12" r="11" fill="#012419" stroke="#59D9B6" strokeWidth="1.2" />

              {/* Exact CafKart Splash Emblem Vector Scaled[span_1](start_span)[span_1](end_span) */}
              <g transform="translate(4, 4) scale(0.0105)">
                {/* White Geometric Shape[span_2](start_span)[span_2](end_span) */}
                <path
                  d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
                  fill="#FFFFFF"
                  fillRule="evenodd"
                />
                {/* Green Gradient Emblem Shape[span_3](start_span)[span_3](end_span) */}
                <path
                  d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
                  fill="url(#truckLogoGrad)"
                  fillRule="evenodd"
                />
              </g>
            </g>

            {/* 6. WHEEL WELLS & UNDERCARRIAGE */}
            <path d="M10 84H42C44 84 46 82 46 80C46 70 56 62 66 62C76 62 86 70 86 80C86 82 88 84 90 84H140C142 84 144 82 144 80C144 70 154 62 164 62C174 62 184 70 184 80C184 82 186 84 188 84H208V88H10V84Z" fill="#0f172a" />

            {/* 7. SPINNING ALLOY WHEELS */}
            {/* Rear Wheels */}
            <g className="animate-spin-wheel origin-[66px_84px]">
              <circle cx="66" cy="84" r="16" fill="#1e293b" />
              <circle cx="66" cy="84" r="10" fill="#64748b" />
              <circle cx="66" cy="84" r="4" fill="#f8fafc" />
              <line x1="66" y1="74" x2="66" y2="94" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
              <line x1="56" y1="84" x2="76" y2="84" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Front Wheels */}
            <g className="animate-spin-wheel origin-[164px_84px]">
              <circle cx="164" cy="84" r="16" fill="#1e293b" />
              <circle cx="164" cy="84" r="10" fill="#64748b" />
              <circle cx="164" cy="84" r="4" fill="#f8fafc" />
              <line x1="164" y1="74" x2="164" y2="94" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
              <line x1="154" y1="84" x2="174" y2="84" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>

        {/* ----------------- SPEED ROAD SURFACE ----------------- */}
        <div className="relative -mt-3 h-1.5 w-56 overflow-hidden rounded-full bg-slate-100 flex items-center">
          <div className="animate-road-speed h-full w-full bg-[repeating-linear-gradient(90deg,#02402c_0px,#02402c_16px,transparent_16px,transparent_32px)]" />
        </div>

        {/* Dynamic Ground Shadow */}
        <div className="h-2 w-48 rounded-full bg-slate-400/30 blur-xs animate-shadow-run -mt-1" />
      </div>

      {/* GPU Keyframe Animations */}
      <style>{`
        @keyframes truckDrive {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-0.5deg); }
          50% { transform: translateY(0.5px) rotate(0.3deg); }
          75% { transform: translateY(-1.5px) rotate(-0.3deg); }
        }
        .animate-truck-drive {
          animation: truckDrive 0.65s ease-in-out infinite;
        }

        @keyframes groceriesJostle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px) rotate(1deg); }
        }
        .animate-groceries-jostle {
          animation: groceriesJostle 0.65s ease-in-out infinite 0.08s;
        }

        @keyframes spinWheel {
          100% { transform: rotate(360deg); }
        }
        .animate-spin-wheel {
          animation: spinWheel 0.4s linear infinite;
        }

        @keyframes roadSpeed {
          0% { transform: translateX(0); }
          100% { transform: translateX(-32px); }
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

        @keyframes wind1 {
          0% { transform: translateX(20px); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateX(-40px); opacity: 0; }
        }
        .animate-wind-1 {
          animation: wind1 0.7s linear infinite 0.1s;
        }

        @keyframes wind2 {
          0% { transform: translateX(25px); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translateX(-45px); opacity: 0; }
        }
        .animate-wind-2 {
          animation: wind2 0.55s linear infinite 0.25s;
        }

        @keyframes wind3 {
          0% { transform: translateX(15px); opacity: 0; }
          50% { opacity: 0.7; }
          100% { transform: translateX(-35px); opacity: 0; }
        }
        .animate-wind-3 {
          animation: wind3 0.65s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
});
