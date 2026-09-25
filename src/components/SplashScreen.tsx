import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen as CapSplash } from '@capacitor/splash-screen';
import { NavigationBar } from '@capawesome/capacitor-navigation-bar';
import { HomeIndicator } from '@capawesome/capacitor-home-indicator';

interface SplashScreenProps {
  onFinish: () => void;
  isReady?: boolean;
}

export function SplashScreen({ onFinish, isReady = false }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);
  const [showText, setShowText] = useState(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapSplash.hide().catch(console.warn);
      
      const hideSystemNav = async () => {
        try {
          if (Capacitor.getPlatform() === 'android') await NavigationBar.hide();
          if (Capacitor.getPlatform() === 'ios') await HomeIndicator.hide();
        } catch (e) {
          console.warn(e);
        }
      };
      hideSystemNav();
    }

    const bridge = document.getElementById('splash-bridge');
    if (bridge) bridge.remove();

    const textTimer = setTimeout(() => setShowText(true), 150);

    const fallbackTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onFinishRef.current(), 300);
    }, 8000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (!isReady || exiting) return;

    setExiting(true);

    document.documentElement.style.setProperty('background-color', '#fdfdfd', 'important');
    document.body.style.setProperty('background-color', '#fdfdfd', 'important');
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.style.setProperty('background-color', '#fdfdfd', 'important');
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#fdfdfd');

    const doneTimer = setTimeout(() => {
      onFinishRef.current();
    }, 250);

    return () => clearTimeout(doneTimer);
  }, [isReady, exiting]);

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-[#011f1a] transition-opacity duration-250 ease-out ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#5ce5b4]/10 blur-[130px]" />

      <div className="relative w-full h-full select-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1536 1536"
          className="absolute top-1/2 left-1/2 w-[288px] h-[288px] -translate-x-1/2 -translate-y-1/2"
        >
          <g style={{ transformOrigin: 'center', transform: 'scale(0.5)' }}>
            <path d="M 534.0 458.0 L 533.0 459.0 L 524.0 459.0 L 523.0 460.0 L 511.0 460.0 L 507.0 462.0 L 497.0 462.0 L 492.0 464.0 L 484.0 464.0 L 477.0 467.0 L 467.0 468.0 L 463.0 470.0 L 458.0 470.0 L 455.0 472.0 L 448.0 473.0 L 445.0 475.0 L 441.0 475.0 L 431.0 479.0 L 428.0 479.0 L 420.0 483.0 L 417.0 483.0 L 412.0 486.0 L 409.0 486.0 L 407.0 488.0 L 399.0 490.0 L 397.0 492.0 L 394.0 492.0 L 383.0 498.0 L 381.0 498.0 L 379.0 500.0 L 377.0 500.0 L 370.0 505.0 L 368.0 505.0 L 355.0 512.0 L 350.0 516.0 L 348.0 516.0 L 340.0 522.0 L 338.0 522.0 L 327.0 530.0 L 324.0 531.0 L 298.0 552.0 L 294.0 554.0 L 275.0 571.0 L 258.0 588.0 L 244.0 605.0 L 241.0 607.0 L 233.0 619.0 L 230.0 621.0 L 229.0 624.0 L 219.0 636.0 L 206.0 658.0 L 200.0 666.0 L 200.0 668.0 L 196.0 673.0 L 192.0 683.0 L 189.0 686.0 L 187.0 692.0 L 183.0 698.0 L 183.0 701.0 L 181.0 703.0 L 181.0 705.0 L 179.0 707.0 L 179.0 709.0 L 175.0 716.0 L 175.0 719.0 L 173.0 721.0 L 172.0 726.0 L 170.0 728.0 L 170.0 731.0 L 165.0 742.0 L 164.0 748.0 L 162.0 752.0 L 162.0 756.0 L 159.0 760.0 L 159.0 764.0 L 153.0 782.0 L 153.0 787.0 L 151.0 790.0 L 151.0 796.0 L 149.0 799.0 L 147.0 814.0 L 146.0 815.0 L 145.0 830.0 L 144.0 831.0 L 143.0 845.0 L 142.0 846.0 L 143.0 849.0 L 142.0 850.0 L 142.0 857.0 L 141.0 858.0 L 141.0 867.0 L 140.0 868.0 L 140.0 908.0 L 141.0 909.0 L 142.0 929.0 L 143.0 930.0 L 143.0 939.0 L 145.0 946.0 L 146.0 961.0 L 148.0 967.0 L 148.0 972.0 L 151.0 980.0 L 151.0 986.0 L 153.0 990.0 L 153.0 995.0 L 156.0 1001.0 L 156.0 1005.0 L 158.0 1008.0 L 159.0 1016.0 L 162.0 1021.0 L 164.0 1031.0 L 168.0 1039.0 L 170.0 1048.0 L 172.0 1050.0 L 177.0 1064.0 L 181.0 1070.0 L 181.0 1073.0 L 183.0 1075.0 L 183.0 1077.0 L 185.0 1079.0 L 185.0 1081.0 L 187.0 1083.0 L 188.0 1087.0 L 190.0 1089.0 L 200.0 1109.0 L 210.0 1125.0 L 213.0 1128.0 L 214.0 1131.0 L 217.0 1134.0 L 218.0 1137.0 L 220.0 1138.0 L 224.0 1145.0 L 249.0 1176.0 L 279.0 1206.0 L 307.0 1229.0 L 311.0 1231.0 L 312.0 1233.0 L 322.0 1239.0 L 325.0 1242.0 L 327.0 1242.0 L 340.0 1251.0 L 366.0 1266.0 L 368.0 1266.0 L 378.0 1272.0 L 381.0 1272.0 L 387.0 1276.0 L 389.0 1276.0 L 394.0 1279.0 L 397.0 1279.0 L 405.0 1283.0 L 408.0 1283.0 L 411.0 1285.0 L 461.0 1300.0 L 468.0 1300.0 L 472.0 1302.0 L 478.0 1302.0 L 482.0 1304.0 L 487.0 1304.0 L 488.0 1305.0 L 495.0 1305.0 L 496.0 1306.0 L 503.0 1306.0 L 504.0 1307.0 L 514.0 1307.0 L 515.0 1308.0 L 530.0 1308.0 L 531.0 1309.0 L 570.0 1309.0 L 571.0 1308.0 L 585.0 1308.0 L 586.0 1307.0 L 597.0 1307.0 L 598.0 1306.0 L 613.0 1305.0 L 621.0 1302.0 L 628.0 1302.0 L 632.0 1300.0 L 646.0 1298.0 L 653.0 1295.0 L 660.0 1294.0 L 666.0 1291.0 L 669.0 1291.0 L 678.0 1287.0 L 681.0 1287.0 L 688.0 1283.0 L 691.0 1283.0 L 726.0 1267.0 L 759.0 1247.0 L 762.0 1244.0 L 775.0 1236.0 L 794.0 1220.0 L 797.0 1219.0 L 798.0 1214.0 L 783.0 1190.0 L 783.0 1188.0 L 780.0 1185.0 L 777.0 1178.0 L 775.0 1176.0 L 775.0 1174.0 L 772.0 1171.0 L 772.0 1169.0 L 759.0 1149.0 L 756.0 1142.0 L 740.0 1116.0 L 740.0 1114.0 L 737.0 1111.0 L 735.0 1106.0 L 728.0 1096.0 L 720.0 1080.0 L 715.0 1073.0 L 715.0 1071.0 L 705.0 1055.0 L 701.0 1055.0 L 694.0 1062.0 L 677.0 1075.0 L 661.0 1085.0 L 659.0 1085.0 L 645.0 1093.0 L 640.0 1094.0 L 626.0 1100.0 L 623.0 1100.0 L 620.0 1102.0 L 617.0 1102.0 L 614.0 1104.0 L 610.0 1104.0 L 606.0 1106.0 L 601.0 1106.0 L 600.0 1107.0 L 595.0 1107.0 L 591.0 1109.0 L 576.0 1110.0 L 575.0 1111.0 L 538.0 1111.0 L 537.0 1110.0 L 522.0 1109.0 L 521.0 1108.0 L 508.0 1106.0 L 504.0 1104.0 L 500.0 1104.0 L 497.0 1102.0 L 494.0 1102.0 L 485.0 1098.0 L 482.0 1098.0 L 466.0 1090.0 L 464.0 1090.0 L 460.0 1087.0 L 458.0 1087.0 L 443.0 1078.0 L 440.0 1075.0 L 437.0 1074.0 L 436.0 1072.0 L 429.0 1068.0 L 414.0 1055.0 L 396.0 1033.0 L 394.0 1032.0 L 391.0 1027.0 L 389.0 1026.0 L 376.0 1006.0 L 376.0 1004.0 L 373.0 1001.0 L 373.0 999.0 L 368.0 991.0 L 358.0 966.0 L 357.0 960.0 L 355.0 957.0 L 355.0 953.0 L 351.0 943.0 L 351.0 938.0 L 349.0 933.0 L 349.0 926.0 L 346.0 916.0 L 345.0 872.0 L 346.0 871.0 L 347.0 850.0 L 349.0 846.0 L 349.0 838.0 L 351.0 834.0 L 352.0 826.0 L 355.0 819.0 L 357.0 807.0 L 368.0 783.0 L 368.0 780.0 L 388.0 746.0 L 393.0 741.0 L 396.0 736.0 L 398.0 735.0 L 401.0 730.0 L 403.0 729.0 L 419.0 711.0 L 435.0 698.0 L 461.0 681.0 L 463.0 681.0 L 483.0 671.0 L 492.0 669.0 L 500.0 665.0 L 512.0 663.0 L 518.0 660.0 L 525.0 660.0 L 530.0 658.0 L 551.0 657.0 L 552.0 656.0 L 563.0 656.0 L 564.0 657.0 L 571.0 656.0 L 572.0 657.0 L 592.0 658.0 L 597.0 660.0 L 605.0 660.0 L 612.0 663.0 L 617.0 663.0 L 620.0 665.0 L 623.0 665.0 L 626.0 667.0 L 635.0 669.0 L 646.0 675.0 L 653.0 677.0 L 660.0 682.0 L 672.0 688.0 L 696.0 706.0 L 710.0 720.0 L 713.0 720.0 L 721.0 709.0 L 721.0 707.0 L 734.0 689.0 L 742.0 676.0 L 742.0 674.0 L 758.0 651.0 L 762.0 643.0 L 766.0 639.0 L 767.0 635.0 L 772.0 629.0 L 790.0 599.0 L 804.0 579.0 L 813.0 564.0 L 813.0 559.0 L 791.0 539.0 L 784.0 535.0 L 783.0 533.0 L 779.0 531.0 L 775.0 527.0 L 747.0 509.0 L 719.0 494.0 L 712.0 492.0 L 706.0 488.0 L 698.0 486.0 L 693.0 483.0 L 680.0 479.0 L 677.0 477.0 L 666.0 475.0 L 654.0 470.0 L 632.0 466.0 L 628.0 464.0 L 620.0 464.0 L 615.0 462.0 L 606.0 462.0 L 601.0 460.0 L 591.0 460.0 L 590.0 459.0 L 582.0 459.0 L 581.0 458.0 Z" fill="#89c74e"/>
            <path d="M 1322.0 390.0 L 1309.0 387.0 L 1306.0 385.0 L 1299.0 385.0 L 1296.0 383.0 L 1290.0 383.0 L 1274.0 379.0 L 1265.0 379.0 L 1264.0 378.0 L 1256.0 378.0 L 1255.0 377.0 L 1200.0 377.0 L 1199.0 378.0 L 1191.0 378.0 L 1190.0 379.0 L 1181.0 379.0 L 1174.0 381.0 L 1168.0 381.0 L 1164.0 383.0 L 1157.0 383.0 L 1154.0 385.0 L 1146.0 385.0 L 1143.0 387.0 L 1138.0 387.0 L 1134.0 389.0 L 1122.0 391.0 L 1117.0 394.0 L 1113.0 394.0 L 1110.0 396.0 L 1107.0 396.0 L 1104.0 398.0 L 1083.0 405.0 L 1081.0 407.0 L 1076.0 408.0 L 1071.0 411.0 L 1069.0 411.0 L 1067.0 413.0 L 1060.0 415.0 L 1058.0 417.0 L 1048.0 421.0 L 1041.0 426.0 L 1035.0 428.0 L 1004.0 448.0 L 969.0 476.0 L 946.0 499.0 L 943.0 504.0 L 938.0 508.0 L 926.0 523.0 L 906.0 552.0 L 886.0 588.0 L 886.0 590.0 L 883.0 595.0 L 883.0 598.0 L 878.0 606.0 L 877.0 612.0 L 875.0 614.0 L 875.0 616.0 L 872.0 621.0 L 872.0 624.0 L 870.0 626.0 L 870.0 629.0 L 868.0 631.0 L 866.0 640.0 L 864.0 643.0 L 864.0 647.0 L 861.0 651.0 L 861.0 655.0 L 859.0 658.0 L 859.0 662.0 L 855.0 672.0 L 855.0 677.0 L 853.0 681.0 L 853.0 687.0 L 851.0 689.0 L 851.0 694.0 L 849.0 698.0 L 848.0 708.0 L 847.0 709.0 L 847.0 715.0 L 845.0 720.0 L 845.0 729.0 L 842.0 738.0 L 842.0 750.0 L 840.0 756.0 L 840.0 771.0 L 839.0 772.0 L 839.0 786.0 L 838.0 787.0 L 838.0 811.0 L 837.0 812.0 L 837.0 846.0 L 838.0 847.0 L 838.0 1464.0 L 837.0 1466.0 L 839.0 1471.0 L 843.0 1470.0 L 871.0 1449.0 L 884.0 1441.0 L 928.0 1409.0 L 938.0 1403.0 L 945.0 1397.0 L 968.0 1382.0 L 972.0 1378.0 L 975.0 1377.0 L 979.0 1373.0 L 992.0 1365.0 L 1003.0 1356.0 L 1033.0 1336.0 L 1034.0 1334.0 L 1034.0 917.0 L 1035.0 916.0 L 1237.0 916.0 L 1239.0 915.0 L 1239.0 743.0 L 1238.0 742.0 L 1037.0 742.0 L 1035.0 740.0 L 1036.0 738.0 L 1036.0 730.0 L 1038.0 725.0 L 1038.0 721.0 L 1040.0 718.0 L 1040.0 712.0 L 1042.0 709.0 L 1042.0 706.0 L 1045.0 700.0 L 1045.0 697.0 L 1048.0 689.0 L 1057.0 671.0 L 1057.0 669.0 L 1070.0 649.0 L 1089.0 627.0 L 1104.0 613.0 L 1132.0 594.0 L 1134.0 594.0 L 1148.0 586.0 L 1151.0 586.0 L 1156.0 583.0 L 1164.0 581.0 L 1167.0 579.0 L 1170.0 579.0 L 1173.0 577.0 L 1184.0 575.0 L 1188.0 573.0 L 1193.0 573.0 L 1201.0 570.0 L 1209.0 570.0 L 1216.0 568.0 L 1227.0 568.0 L 1228.0 567.0 L 1275.0 567.0 L 1276.0 568.0 L 1289.0 568.0 L 1295.0 570.0 L 1302.0 570.0 L 1309.0 573.0 L 1315.0 573.0 L 1319.0 575.0 L 1321.0 575.0 L 1323.0 573.0 L 1323.0 391.0 Z" fill="#ffffff"/>
            <path d="M 830.0 80.0 L 829.0 81.0 L 820.0 81.0 L 814.0 83.0 L 809.0 83.0 L 805.0 85.0 L 800.0 85.0 L 797.0 87.0 L 793.0 87.0 L 788.0 90.0 L 785.0 90.0 L 767.0 98.0 L 765.0 100.0 L 756.0 104.0 L 736.0 118.0 L 716.0 138.0 L 700.0 160.0 L 697.0 168.0 L 695.0 169.0 L 695.0 171.0 L 690.0 179.0 L 689.0 184.0 L 684.0 195.0 L 684.0 199.0 L 681.0 206.0 L 680.0 215.0 L 678.0 221.0 L 677.0 256.0 L 678.0 257.0 L 678.0 270.0 L 679.0 271.0 L 681.0 286.0 L 684.0 292.0 L 684.0 296.0 L 686.0 299.0 L 686.0 302.0 L 689.0 307.0 L 692.0 316.0 L 710.0 345.0 L 717.0 354.0 L 735.0 372.0 L 739.0 374.0 L 747.0 381.0 L 767.0 393.0 L 791.0 403.0 L 821.0 410.0 L 851.0 411.0 L 852.0 410.0 L 862.0 410.0 L 863.0 409.0 L 884.0 406.0 L 911.0 396.0 L 931.0 385.0 L 938.0 379.0 L 949.0 372.0 L 969.0 352.0 L 978.0 340.0 L 987.0 325.0 L 997.0 304.0 L 1002.0 289.0 L 1006.0 272.0 L 1006.0 262.0 L 1007.0 261.0 L 1007.0 228.0 L 1006.0 227.0 L 1006.0 220.0 L 1004.0 215.0 L 1004.0 209.0 L 1002.0 206.0 L 1002.0 202.0 L 991.0 173.0 L 989.0 171.0 L 980.0 153.0 L 976.0 149.0 L 974.0 145.0 L 963.0 132.0 L 948.0 118.0 L 925.0 102.0 L 916.0 98.0 L 914.0 96.0 L 912.0 96.0 L 910.0 94.0 L 897.0 90.0 L 895.0 88.0 L 892.0 88.0 L 885.0 85.0 L 870.0 83.0 L 865.0 81.0 Z" fill="#89c74e"/>
          </g>
        </svg>

        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 mt-[90px] flex flex-col items-center justify-center w-full transition-all duration-700 ease-out transform-gpu ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <h1 className="mt-2 flex items-center text-4xl sm:text-5xl font-black tracking-tight font-sans">
            <span className="text-[#89c74e]">Caf</span>
            <span className="text-white">Kart</span>
          </h1>

          <div className="mt-3.5 flex items-center gap-2.5">
            <div className="h-[1.5px] w-6 sm:w-8 bg-[#89c74e] rounded-full" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.32em] text-[#D3F6EB]">
              B 2 B . H o R e C a
            </span>
            <div className="h-[1.5px] w-6 sm:w-8 bg-[#89c74e] rounded-full" />
          </div>
        </div>

        <div
          className={`absolute bottom-14 left-1/2 -translate-x-1/2 h-[3px] w-32 overflow-hidden rounded-full bg-white/10 transition-opacity duration-700 delay-300 transform-gpu ${
            showText ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="splash-bar h-full rounded-full bg-gradient-to-r from-[#59D9B6] via-[#9af0d4] to-white" />
        </div>

        <p
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-wider text-[#59D9B6]/70 uppercase w-full text-center transition-opacity duration-700 delay-300 transform-gpu ${
            showText ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Wholesale made simple
        </p>
      </div>
    </div>
  );
}
