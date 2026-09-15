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

  // Reusable CafKart Logo Component using your exact paths
  const CafKartLogo = ({ fill }: { fill: string }) => (
    <>
      <path d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z" fill={fill} fillRule="evenodd" />
      <path d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z" fill={fill} fillRule="evenodd" />
    </>
  );

  // Reusable Background Layer Component (City, Trees, Warehouse)
  const BackgroundLayer = () => (
    <g>
      {/* Background City Skyline */}
      <rect x="50" y="160" width="80" height="150" fill="#EAF2ED" />
      <rect x="150" y="140" width="60" height="170" fill="#DFEAE3" />
      <rect x="230" y="190" width="90" height="120" fill="#EAF2ED" />
      <rect x="340" y="150" width="70" height="160" fill="#DFEAE3" />
      <rect x="430" y="210" width="80" height="100" fill="#EAF2ED" />
      <rect x="530" y="170" width="70" height="140" fill="#DFEAE3" />

      {/* Layered Trees */}
      <circle cx="120" cy="270" r="45" fill="#C6E2D2" />
      <circle cx="160" cy="285" r="35" fill="#B0D7C1" />
      <circle cx="280" cy="260" r="50" fill="#C6E2D2" />
      <circle cx="330" cy="280" r="30" fill="#B0D7C1" />
      <circle cx="480" cy="275" r="40" fill="#C6E2D2" />

      {/* Scattered Clouds */}
      <path d="M180 80 Q190 60 210 60 Q230 60 240 80 Q255 80 255 95 Q255 110 240 110 H170 Q155 110 155 95 Q155 80 170 80 Z" fill="#EEF4F1" />
      <path d="M520 100 Q530 85 550 85 Q570 85 580 100 Q595 100 595 115 Q595 130 580 130 H510 Q495 130 495 115 Q495 100 510 100 Z" fill="#EEF4F1" />
      <path d="M1000 70 Q1010 50 1030 50 Q1050 50 1060 70 Q1075 70 1075 85 Q1075 100 1060 100 H990 Q975 100 975 85 Q975 70 990 70 Z" fill="#EEF4F1" />

      {/* Warehouse Section */}
      <rect x="750" y="160" width="380" height="150" fill="#EDF4F0" />
      <polygon points="730,160 940,90 1150,160" fill="#E2EBE5" />
      <polygon points="730,160 940,90 1150,160" fill="none" stroke="#9FD3B6" strokeWidth="8" strokeLinejoin="round" />
      
      {/* Warehouse Garage Door */}
      <rect x="800" y="220" width="120" height="90" fill="#CFDFD6" />
      <path d="M 800 240 H 920 M 800 260 H 920 M 800 280 H 920 M 800 300 H 920" stroke="#B8CCBE" strokeWidth="2" />
      
      {/* CafKart Logo on Warehouse */}
      <g transform="translate(845, 175) scale(0.016)">
        <CafKartLogo fill="#139D4B" />
      </g>
      <text x="895" y="202" fill="#139D4B" fontSize="16" fontWeight="bold">CafKart</text>

      {/* Stacked Pallet Boxes */}
      <rect x="950" y="270" width="35" height="40" fill="#E1C48B" />
      <rect x="950" y="230" width="35" height="40" fill="#D6B577" />
      <rect x="990" y="260" width="45" height="50" fill="#E1C48B" />
      
      {/* Forklift */}
      <path d="M1060 275 H1090 A 4 4 0 0 1 1094 279 V305 H1060 Z" fill="#49A67D" />
      <path d="M1065 275 V245 H1085 V275" fill="none" stroke="#2B3A4A" strokeWidth="3" />
      <circle cx="1070" cy="305" r="7" fill="#1A242F" />
      <circle cx="1088" cy="305" r="7" fill="#1A242F" />
      <path d="M1094 305 H1114" stroke="#2B3A4A" strokeWidth="3" />

      {/* Ground Layer */}
      <rect x="0" y="310" width="1400" height="90" fill="#F4F8F6" />
      <rect x="0" y="310" width="1400" height="4" fill="#E6EDE9" />
    </g>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white select-none ${
        fullScreen ? 'fixed inset-0 z-50 animate-fade-in px-6' : 'w-full py-8'
      } ${className}`}
    >
      <div className={`relative flex flex-col items-center justify-center w-full max-w-5xl ${scaleClass}`}>
        
        {/* Main Stage Viewport (Responsive & Panoramic) */}
        <div className="relative w-full aspect-[21/9] min-h-[300px] max-h-[450px] flex items-center justify-center overflow-hidden">
          
          <svg viewBox="0 0 800 400" className="absolute w-full h-full pointer-events-none z-0">
            {/* 1. SEAMLESS SCROLLING BACKGROUND LAYER */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="-1400 0"
                dur="18s"
                repeatCount="indefinite"
              />
              <BackgroundLayer />
              {/* Duplicate for infinite seamless looping */}
              <g transform="translate(1400, 0)">
                <BackgroundLayer />
              </g>
            </g>

            {/* 2. STATIC FOREGROUND SCENE (Centered Truck) */}
            
            {/* Ground Shadow under Truck */}
            <ellipse cx="400" cy="325" rx="170" ry="7" fill="#D9E3DF" />
            
            {/* Speed Lines */}
            <g className="animate-speed-lines">
              <line x1="100" y1="260" x2="190" y2="260" stroke="#139D4B" strokeWidth="6" strokeLinecap="round" />
              <line x1="120" y1="275" x2="200" y2="275" stroke="#139D4B" strokeWidth="6" strokeLinecap="round" />
              <line x1="140" y1="290" x2="210" y2="290" stroke="#139D4B" strokeWidth="6" strokeLinecap="round" />
            </g>

            {/* 3. TRUCK BODY & GROCERIES (BOUNCING SUSPENSION) */}
            <g className="animate-truck-bounce">
              
              {/* GROCERY CRATES ON TOP */}
              {/* Left Crate */}
              <rect x="255" y="140" width="80" height="30" fill="#D2A855" />
              <circle cx="270" cy="120" r="18" fill="#41A02E" />
              <circle cx="290" cy="125" r="22" fill="#64C83D" />
              <circle cx="310" cy="130" r="12" fill="#ED4535" />
              <circle cx="325" cy="135" r="10" fill="#F27C38" />
              <rect x="255" y="145" width="80" height="5" fill="#E5A866" />
              <rect x="255" y="155" width="80" height="5" fill="#E5A866" />
              <rect x="260" y="140" width="5" height="30" fill="#E5A866" />
              <rect x="325" y="140" width="5" height="30" fill="#E5A866" />

              {/* Middle Section (Paper Bag, Oil, Broccoli, Bananas) */}
              {/* Paper Bag */}
              <polygon points="340,90 348,85 358,95 375,85 375,170 340,170" fill="#F4EDE4" />
              <rect x="346" y="120" width="22" height="15" fill="#64C83D" />
              {/* Oil Bottle */}
              <rect x="382" y="95" width="20" height="75" rx="3" fill="#F2C94C" />
              <rect x="387" y="85" width="10" height="10" rx="2" fill="#F27C38" />
              {/* Broccoli & Bananas */}
              <circle cx="370" cy="140" r="15" fill="#2E7940" />
              <circle cx="385" cy="145" r="12" fill="#3AA856" />
              <path d="M 378 165 Q 388 135 405 140 Q 398 155 385 170 Z" fill="#F2C94C" />
              <path d="M 383 165 Q 393 145 408 145 Q 403 160 390 170 Z" fill="#F5D76E" />

              {/* Right Section (Milk, Boxes, Small Crate) */}
              <polygon points="415,100 440,100 440,170 415,170" fill="#1778F2" />
              <polygon points="415,100 427,85 440,100" fill="#1778F2" />
              <rect x="415" y="130" width="25" height="20" fill="#FFFFFF" />
              <text x="427.5" y="144" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#1778F2">MILK</text>
              <rect x="445" y="115" width="22" height="55" rx="2" fill="#ED4535" />
              <rect x="470" y="115" width="25" height="55" rx="2" fill="#E3A863" />
              {/* Front Crate */}
              <ellipse cx="470" cy="145" rx="20" ry="12" fill="#64C83D" />
              <rect x="440" y="150" width="60" height="20" fill="#E5A866" />
              <rect x="440" y="153" width="60" height="4" fill="#D2A855" />
              <rect x="440" y="161" width="60" height="4" fill="#D2A855" />

              {/* TRUCK BOX */}
              <rect x="250" y="170" width="230" height="105" rx="4" fill="#139D4B" />
              
              {/* Dynamic Sweeping Leaf Graphics on Box */}
              <path d="M 360 275 C 400 275 430 240 440 170 H 480 V 275 Z" fill="#0E813F" />
              <path d="M 410 275 C 440 275 460 250 470 200 H 480 V 275 Z" fill="#0A6C34" />

              {/* CafKart Logo & Text centered perfectly on Box */}
              <g transform="translate(280, 207) scale(0.02)">
                <CafKartLogo fill="#FFFFFF" />
              </g>
              <text x="325" y="228" fill="#FFFFFF" fontSize="24" fontWeight="bold">CafKart</text>
              <text x="365" y="245" fill="#FFFFFF" fontSize="12" fontWeight="600" textAnchor="middle">B2B Grocery Solutions</text>

              {/* TRUCK CABIN */}
              {/* White Upper Section */}
              <path d="M 480 170 H 540 C 565 170 580 195 590 225 L 600 265 H 480 Z" fill="#FFFFFF" />
              {/* Dark Green Lower Swoop */}
              <path d="M 480 240 C 530 240 560 250 595 255 L 600 265 C 600 270 595 275 585 275 H 480 Z" fill="#065F28" />
              {/* Window */}
              <path d="M 490 180 H 535 C 550 180 565 195 570 220 L 575 235 H 490 Z" fill="#1E293B" />
              
              {/* CHASSIS & LOWER BODY */}
              <rect x="260" y="275" width="310" height="15" rx="4" fill="#1E293B" />
              <path d="M 555 275 H 585 C 590 275 592 278 592 285 V 295 H 555 Z" fill="#1E293B" />
              <rect x="585" y="280" width="6" height="10" fill="#F2C94C" rx="2" />
              {/* Gas Tank */}
              <rect x="360" y="280" width="70" height="18" fill="#3A4B5C" rx="3" />
              {/* Protective Mudguards (Hides wheels clipping on bounce) */}
              <path d="M 290 275 A 35 35 0 0 1 360 275" fill="none" stroke="#1E293B" strokeWidth="8" />
              <path d="M 495 275 A 35 35 0 0 1 565 275" fill="none" stroke="#1E293B" strokeWidth="8" />
            </g>

            {/* 4. VISIBLY SPINNING STATIC WHEELS (No Bounce) */}
            {/* Rear Wheel (cx=325, cy=290) */}
            <g className="animate-wheel-spin" style={{ transformOrigin: '325px 290px' }}>
              <circle cx="325" cy="290" r="22" fill="#111827" />
              <circle cx="325" cy="290" r="14" fill="#CBD5E1" />
              <circle cx="325" cy="290" r="8" fill="#94A3B8" />
              {/* Lug Nuts */}
              <circle cx="325" cy="281" r="2" fill="#1E293B" />
              <circle cx="325" cy="299" r="2" fill="#1E293B" />
              <circle cx="316" cy="290" r="2" fill="#1E293B" />
              <circle cx="334" cy="290" r="2" fill="#1E293B" />
            </g>

            {/* Front Wheel (cx=530, cy=290) */}
            <g className="animate-wheel-spin" style={{ transformOrigin: '530px 290px' }}>
              <circle cx="530" cy="290" r="22" fill="#111827" />
              <circle cx="530" cy="290" r="14" fill="#CBD5E1" />
              <circle cx="530" cy="290" r="8" fill="#94A3B8" />
              {/* Lug Nuts */}
              <circle cx="530" cy="281" r="2" fill="#1E293B" />
              <circle cx="530" cy="299" r="2" fill="#1E293B" />
              <circle cx="521" cy="290" r="2" fill="#1E293B" />
              <circle cx="539" cy="290" r="2" fill="#1E293B" />
            </g>

          </svg>
        </div>

        {/* ========================================================= */}
        {/* 5. DYNAMIC 5-STEP STEPPER & ROTATING WHOLESALE STATUS     */}
        {/* ========================================================= */}
        {showStatus && (
          <div className="mt-4 flex flex-col items-center justify-center animate-fade-in">
            {/* Dynamic 5-Step Stepper Line */}
            <div className="relative flex items-center justify-between w-64 mb-4">
              {/* Base Inactive Grey Track */}
              <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 bg-[#cbd5e1] z-0" />

              {/* Dynamic Animated Green Progress Fill */}
              <div
                className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 bg-[#139D4B] z-0 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Dynamic Animated Progress Nodes */}
              {HOME_MESSAGES.map((_, idx) => {
                const isCompleted = idx < msgIndex;
                const isActive = idx === msgIndex;

                return (
                  <div key={idx} className="relative z-10 flex items-center justify-center w-5 h-5">
                    {isActive ? (
                      <div className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-[#139D4B] bg-white transition-all duration-300 scale-110 shadow-xs">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#139D4B] animate-pulse" />
                      </div>
                    ) : isCompleted ? (
                      <div className="h-3.5 w-3.5 rounded-full bg-[#139D4B] transition-all duration-300" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full bg-[#cbd5e1] transition-all duration-300" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Dynamic Rotating Message Box */}
            <div className="h-6 flex items-center justify-center">
              <p
                key={msgIndex}
                className="flex items-center gap-1.5 text-sm font-bold text-slate-800 tracking-tight animate-text-fade"
              >
                {HOME_MESSAGES[msgIndex]}
                <span className="text-green-600 text-sm">🍃</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* GPU Keyframe Animations */}
      <style>{`
        /* Wheel Spin */
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-wheel-spin {
          animation: wheelSpin 0.5s linear infinite;
        }

        /* Truck Body Suspension Bounce */
        @keyframes truckBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        .animate-truck-bounce {
          animation: truckBounce 0.6s ease-in-out infinite;
        }

        /* Pulsing Wind/Speed Lines */
        @keyframes speedLinesMove {
          0% { transform: translateX(0px); opacity: 0.9; }
          100% { transform: translateX(-40px); opacity: 0; }
        }
        .animate-speed-lines line {
          animation: speedLinesMove 0.8s linear infinite;
        }
        .animate-speed-lines line:nth-child(1) { animation-delay: 0s; }
        .animate-speed-lines line:nth-child(2) { animation-delay: 0.2s; }
        .animate-speed-lines line:nth-child(3) { animation-delay: 0.4s; }

        /* Text Transition */
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
