import React, { useEffect, useRef, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  BarChart3,
  ArrowLeft,
  Activity,
  Award,
  IndianRupee,
  PieChart as PieChartIcon,
  RefreshCw,
  LogOut,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  LayoutGrid,
  Sparkles,
  Zap,
  Clock,
  Crown,
  FileText,
  Target,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';

// ─── Helpers ─────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCompact(n: number): string {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
  return `₹${v.toFixed(0)}`;
}

function calculateGrowth(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const growth = ((current - previous) / previous) * 100;
  return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
}

function parseDateStr(dateStr: string, format: 'short' | 'long' = 'short') {
  if (!dateStr || dateStr === '-') return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(
    'en-IN',
    format === 'short' ? { day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short' },
  );
}

// ─── Types ───────────────────────────────────────────────────────────

interface InvestorMetrics {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalSales: number;
  revenueGrowth: string;
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  customerGrowth: string;
  todayAOV: number;
  monthlyAOV: number;
  totalDiscounts: number;
  totalDeliveryFees: number;
  bestRevenueDay: { date: string; amount: number };
  bestOrderDay: { date: string; count: number };
  highestAOVDay: { date: string; amount: number };
}

type TabId = 'dashboard' | 'sales' | 'analytics' | 'more';
type ChartType = 'area' | 'line' | 'bar';

// ─── Design Tokens ───────────────────────────────────────────────────

const PIE_COLORS = ['#10b981', '#22d3ee', '#a78bfa', '#fbbf24', '#60a5fa', '#fb7185', '#2dd4bf', '#f472b6', '#84cc16'];

const ACCENT = {
  emerald: '#10b981',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  amber: '#fbbf24',
  blue: '#60a5fa',
  rose: '#fb7185',
  indigo: '#818cf8',
  teal: '#2dd4bf',
};

const NAV_ITEMS: { id: TabId; label: string; hint: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Overview', hint: 'Key metrics', icon: LayoutGrid },
  { id: 'sales', label: 'Revenue', hint: 'Sales detail', icon: IndianRupee },
  { id: 'analytics', label: 'Analytics', hint: 'Deep dive', icon: BarChart3 },
  { id: 'more', label: 'Reports', hint: 'Coming soon', icon: FileText },
];

const TAB_META: Record<TabId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Investor Overview', subtitle: 'Live performance snapshot of the entire operation' },
  sales: { title: 'Revenue Breakdown', subtitle: 'Sales, fees and basket economics' },
  analytics: { title: 'Deep Analytics', subtitle: 'Orders, payments and customer behaviour' },
  more: { title: 'Reports & Exports', subtitle: 'Advanced reporting tools' },
};

// ─── Animation Helpers ───────────────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    let raf = 0;
    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (target - from) * eased;
      setValue(current);
      fromRef.current = current;
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const animated = useCountUp(value);
  return <>{format(animated)}</>;
}

// ─── Brand Mark ──────────────────────────────────────────────────────

function CafKartLogo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1536 1535"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="ckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#59D9B6" />
          <stop offset="100%" stopColor="#58D5A5" />
        </linearGradient>
      </defs>

      {/* White warehouse body */}
      <path
        d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z"
        fill="#FFFFFF"
        fillRule="evenodd"
      />

      {/* Green base bar */}
      <path
        d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z"
        fill="url(#ckGrad)"
        fillRule="evenodd"
      />

      {/* Green dot (right) */}
      <path
        d="M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z"
        fill="url(#ckGrad)"
        fillRule="evenodd"
      />

      {/* Green dot (left) */}
      <path
        d="M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z"
        fill="url(#ckGrad)"
        fillRule="evenodd"
      />

      {/* Green small wedge */}
      <path
        d="M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z"
        fill="url(#ckGrad)"
        fillRule="evenodd"
      />

      {/* Green main checkmark */}
      <path
        d="M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z"
        fill="url(#ckGrad)"
        fillRule="evenodd"
      />
    </svg>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────

export function InvestorScreen({ onBack }: { onBack?: () => void }) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);

  // Chart data
  const [todaySalesData, setTodaySalesData] = useState<any[]>([]);
  const [weeklySalesData, setWeeklySalesData] = useState<any[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<ChartType>('area');

  const fetchMetrics = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.rpc('get_investor_dashboard_data');
      if (error || !data) throw error || new Error('No data returned');

      const daily: any[] = data.dailyStats || [];
      const totals: any = data.totals || {};

      const todayData =
        daily.length > 0 ? daily[daily.length - 1] : { revenue: 0, orders: 0, discounts: 0, delivery_fees: 0, date: '-' };
      const last7Days = daily.slice(-7);

      const weeklySales = last7Days.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
      const weeklyOrders = last7Days.reduce((sum, d) => sum + (Number(d.orders) || 0), 0);

      const monthlySales = daily.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
      const monthlyOrders = daily.reduce((sum, d) => sum + (Number(d.orders) || 0), 0);
      const totalDiscounts = daily.reduce((sum, d) => sum + (Number(d.discounts) || 0), 0);
      const totalDeliveryFees = daily.reduce((sum, d) => sum + (Number(d.delivery_fees) || 0), 0);

      let bestRev = { date: '-', amount: 0 };
      let bestOrd = { date: '-', count: 0 };
      let bestAOV = { date: '-', amount: 0 };

      daily.forEach((d) => {
        const rev = Number(d.revenue) || 0;
        const ord = Number(d.orders) || 0;
        if (rev > bestRev.amount) bestRev = { date: d.date, amount: rev };
        if (ord > bestOrd.count) bestOrd = { date: d.date, count: ord };
        const aov = ord > 0 ? rev / ord : 0;
        if (aov > bestAOV.amount) bestAOV = { date: d.date, amount: aov };
      });

      setMonthlySalesData(daily.map((d) => ({ day: parseDateStr(d.date, 'short'), sales: Number(d.revenue) || 0 })));
      setWeeklySalesData(last7Days.map((d) => ({ day: parseDateStr(d.date, 'long'), sales: Number(d.revenue) || 0 })));

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayOrdersData } = await supabase
        .from('orders')
        .select('created_at, total')
        .eq('status', 'delivered')
        .gte('created_at', todayStart.toISOString());

      const hourlyBuckets = Array.from({ length: 9 }, (_, i) => {
        const hour = 6 + i * 2;
        return { day: `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`, sales: 0 };
      });

      todayOrdersData?.forEach((o) => {
        const d = new Date(o.created_at);
        let h = d.getHours();
        if (h < 6) h = 6;
        if (h > 22) h = 22;
        const bucket = h - (h % 2);
        const label = `${bucket}:00 ${bucket < 12 ? 'AM' : 'PM'}`;
        const found = hourlyBuckets.find((x) => x.day === label);
        if (found) found.sales += Number(o.total) || 0;
      });
      setTodaySalesData(hourlyBuckets);

      const statusObj: Record<string, unknown> = data.statusCounts || {};
      setOrderStatusData(
        Object.entries(statusObj).map(([status, count]) => ({
          day: status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          sales: Number(count) || 0,
        })),
      );

      const payObj: Record<string, unknown> = data.paymentTotals || {};
      setPaymentMethodData(
        Object.entries(payObj).map(([name, value]) => ({ name, value: Number(value) || 0 })),
      );

      setMetrics({
        todaySales: Number(todayData.revenue) || 0,
        weeklySales,
        monthlySales,
        totalSales: Number(totals.lifetimeSales) || 0,
        revenueGrowth: calculateGrowth(monthlySales, Number(data.prev30DaysRevenue) || 0),
        todayOrders: Number(todayData.orders) || 0,
        weeklyOrders,
        monthlyOrders,
        totalOrders: Number(totals.lifetimeOrders) || 0,
        completedOrders: Number(totals.completedOrders) || 0,
        cancelledOrders: Number(totals.cancelledOrders) || 0,
        totalCustomers: Number(data.totalCustomers) || 0,
        activeCustomers: Number(data.activeCustomers30d) || 0,
        newCustomers: Number(data.newCustomers30d) || 0,
        customerGrowth: calculateGrowth(
          Number(data.newCustomers30d) || 0,
          (Number(data.totalCustomers) || 0) - (Number(data.newCustomers30d) || 0),
        ),
        todayAOV: todayData.orders ? (Number(todayData.revenue) || 0) / Number(todayData.orders) : 0,
        monthlyAOV: monthlyOrders ? monthlySales / monthlyOrders : 0,
        totalDiscounts,
        totalDeliveryFees,
        bestRevenueDay: bestRev,
        bestOrderDay: bestOrd,
        highestAOVDay: bestAOV,
      });
    } catch (err) {
      console.error('Investor Dashboard Error:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to top whenever the user switches tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const meta = TAB_META[activeTab];
  const showSkeleton = loading && !metrics;

  return (
    <div className="relative min-h-screen bg-[#060A11] text-slate-100 selection:bg-emerald-500/30 [-webkit-tap-highlight-color:transparent]">
      {/* ─── Ambient Background ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-48 left-1/4 h-[520px] w-[520px] rounded-full bg-emerald-500/[0.09] blur-[130px]" />
        <div className="absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full bg-cyan-500/[0.06] blur-[130px]" />
        <div className="absolute -bottom-32 left-0 h-[420px] w-[420px] rounded-full bg-violet-500/[0.06] blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent 75%)',
          }}
        />
      </div>

      {/* ─── Desktop Sidebar ─── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/[0.06] bg-[#070C14]/80 backdrop-blur-2xl lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <CafKartLogo className="h-9 w-9 drop-shadow-[0_0_12px_rgba(89,217,182,0.35)]" />
          <div className="flex items-baseline leading-none">
            <span className="text-xl font-black tracking-tight text-white">Caf</span>
            <span className="text-xl font-black tracking-tight text-emerald-400">Kart</span>
          </div>
        </div>

        <div className="px-3">
          <p className="px-3 pb-3 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-600">Investor Suite</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                    active ? 'bg-emerald-500/10 text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                  )}
                  <Icon size={17} className={active ? 'text-emerald-400' : 'transition-colors group-hover:text-slate-300'} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-tight">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-slate-500">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-3 p-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.03] to-transparent p-4">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-400/20 blur-2xl" />
            <Sparkles size={16} className="relative text-emerald-400" />
            <p className="relative mt-2 text-[11px] font-bold text-white">Investor Access</p>
            <p className="relative mt-1 text-[10px] leading-relaxed text-slate-400">
              Read-only analytics streamed live from operations.
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070C14]/85 backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Go back"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition active:scale-95"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <CafKartLogo className="h-8 w-8 shrink-0 drop-shadow-[0_0_10px_rgba(89,217,182,0.35)]" />
            <div className="flex items-baseline leading-none">
              <span className="text-lg font-black tracking-tight text-white">Caf</span>
              <span className="text-lg font-black tracking-tight text-emerald-400">Kart</span>
            </div>
            <span className="ml-0.5 shrink-0 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
              Investor
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={fetchMetrics}
              aria-label="Refresh"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-emerald-300 transition active:scale-95"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => void signOut()}
              aria-label="Exit"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/10 text-rose-300 transition active:scale-95"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Content ─── */}
      <div className="lg:pl-[248px]">
        <main className="relative mx-auto max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-14 lg:pt-8">
          {/* Page header */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">Live Data</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[28px]">{meta.title}</h1>
              <p className="mt-1 text-xs text-slate-500">{meta.subtitle}</p>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2">
                <Clock size={14} className="text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-400">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={fetchMetrics}
                className="group flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-[11px] font-bold text-slate-300 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-300 active:scale-[0.97]"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin text-emerald-400' : 'transition-transform group-hover:rotate-180'} />
                Refresh
              </button>
            </div>
          </div>

          {/* ─── Body ─── */}
          {showSkeleton ? (
            <SkeletonState />
          ) : !metrics ? (
            <EmptyState onRetry={fetchMetrics} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  metrics={metrics}
                  todaySalesData={todaySalesData}
                  weeklySalesData={weeklySalesData}
                  monthlySalesData={monthlySalesData}
                  chartType={chartType}
                  setChartType={setChartType}
                />
              )}

              {activeTab === 'sales' && (
                <SalesTab
                  metrics={metrics}
                  monthlySalesData={monthlySalesData}
                  weeklySalesData={weeklySalesData}
                  todaySalesData={todaySalesData}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsTab
                  metrics={metrics}
                  orderStatusData={orderStatusData}
                  paymentMethodData={paymentMethodData}
                />
              )}

              {activeTab === 'more' && <MoreTab onBack={onBack} />}
            </>
          )}
        </main>
      </div>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[#070C14]/90 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex h-[4.25rem] max-w-lg items-center justify-around px-2">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                    active ? 'bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_-4px_rgba(16,185,129,0.6)]' : 'text-slate-500'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                </span>
                <span className={`text-[9px] font-bold tracking-tight transition-colors ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─── Dashboard Tab ───────────────────────────────────────────────────

function DashboardTab({
  metrics,
  todaySalesData,
  weeklySalesData,
  monthlySalesData,
  chartType,
  setChartType,
}: {
  metrics: InvestorMetrics;
  todaySalesData: any[];
  weeklySalesData: any[];
  monthlySalesData: any[];
  chartType: ChartType;
  setChartType: (t: ChartType) => void;
}) {
  const revenueSpark = monthlySalesData.map((d) => d.sales);
  const weeklySpark = weeklySalesData.map((d) => d.sales);
  const todaySpark = todaySalesData.map((d) => d.sales);

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Monthly Revenue"
          value={<AnimatedNumber value={metrics.monthlySales} format={formatCurrency} />}
          icon={IndianRupee}
          accent={ACCENT.emerald}
          delta={{ value: metrics.revenueGrowth, positive: metrics.revenueGrowth.startsWith('+') }}
          hint="vs previous 30d"
          spark={revenueSpark}
        />
        <MetricCard
          label="Today's Orders"
          value={<AnimatedNumber value={metrics.todayOrders} format={(n) => Math.round(n).toLocaleString('en-IN')} />}
          icon={Package}
          accent={ACCENT.blue}
          hint={`${formatCurrency(metrics.todaySales)} generated`}
          spark={todaySpark}
        />
        <MetricCard
          label="Total Customers"
          value={<AnimatedNumber value={metrics.totalCustomers} format={(n) => Math.round(n).toLocaleString('en-IN')} />}
          icon={Users}
          accent={ACCENT.violet}
          delta={{ value: metrics.customerGrowth, positive: metrics.customerGrowth.startsWith('+') }}
          hint="vs previous 30d"
        />
        <MetricCard
          label="Monthly AOV"
          value={<AnimatedNumber value={metrics.monthlyAOV} format={formatCurrency} />}
          icon={ShoppingCart}
          accent={ACCENT.cyan}
          hint={`Today ${formatCurrency(metrics.todayAOV)}`}
        />
      </div>

      {/* Hero row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Revenue Momentum"
          subtitle="Daily revenue across the last 30 days"
          icon={TrendingUp}
          accent={ACCENT.emerald}
          action={
            <Segmented
              value={chartType}
              onChange={(v) => setChartType(v as ChartType)}
              options={[
                { value: 'area', label: 'Area', icon: Activity },
                { value: 'bar', label: 'Bar', icon: BarChartIcon },
                { value: 'line', label: 'Line', icon: LineChartIcon },
              ]}
            />
          }
        >
          <DynamicChart data={monthlySalesData} chartType={chartType} color={ACCENT.emerald} id="monthly" height={288} />
        </Panel>

        <Panel title="Performance Pulse" subtitle="Retention & completion health" icon={Target} accent={ACCENT.cyan}>
          <div className="flex items-center justify-around gap-2 py-1">
            <Ring
              value={metrics.activeCustomers}
              max={metrics.totalCustomers}
              color={ACCENT.emerald}
              label="Active"
              sublabel="customers"
            />
            <Ring
              value={metrics.completedOrders}
              max={metrics.totalOrders}
              color={ACCENT.violet}
              label="Fulfilled"
              sublabel="orders"
            />
          </div>

          <div className="mt-5 space-y-3">
            <HighlightRow
              icon={Crown}
              accent={ACCENT.amber}
              label="Best revenue day"
              value={formatCurrency(metrics.bestRevenueDay.amount)}
              sub={parseDateStr(metrics.bestRevenueDay.date, 'long')}
            />
            <HighlightRow
              icon={Flame}
              accent={ACCENT.rose}
              label="Peak order volume"
              value={`${metrics.bestOrderDay.count} orders`}
              sub={parseDateStr(metrics.bestOrderDay.date, 'long')}
            />
            <HighlightRow
              icon={Zap}
              accent={ACCENT.cyan}
              label="Highest AOV"
              value={formatCurrency(metrics.highestAOVDay.amount)}
              sub={parseDateStr(metrics.highestAOVDay.date, 'long')}
            />
          </div>
        </Panel>
      </div>

      {/* Trend row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Today's Sales Trend"
          subtitle="Two-hour buckets since 6 AM"
          icon={Clock}
          accent={ACCENT.blue}
        >
          <DynamicChart data={todaySalesData} chartType={chartType} color={ACCENT.blue} id="today" height={240} />
        </Panel>

        <Panel
          title="Weekly Sales"
          subtitle="Last 7 days performance"
          icon={Calendar}
          accent={ACCENT.violet}
        >
          <DynamicChart data={weeklySalesData} chartType={chartType} color={ACCENT.violet} id="weekly" height={240} />
        </Panel>
      </div>
    </div>
  );
}

// ─── Sales Tab ───────────────────────────────────────────────────────

function SalesTab({
  metrics,
  monthlySalesData,
  weeklySalesData,
  todaySalesData,
}: {
  metrics: InvestorMetrics;
  monthlySalesData: any[];
  weeklySalesData: any[];
  todaySalesData: any[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's Sales"
          value={<AnimatedNumber value={metrics.todaySales} format={formatCurrency} />}
          icon={IndianRupee}
          accent={ACCENT.blue}
          hint="Generated today"
          spark={todaySalesData.map((d) => d.sales)}
        />
        <MetricCard
          label="Weekly Sales"
          value={<AnimatedNumber value={metrics.weeklySales} format={formatCurrency} />}
          icon={Calendar}
          accent={ACCENT.emerald}
          hint="Last 7 days"
          spark={weeklySalesData.map((d) => d.sales)}
        />
        <MetricCard
          label="Lifetime Sales"
          value={<AnimatedNumber value={metrics.totalSales} format={formatCurrency} />}
          icon={Award}
          accent={ACCENT.violet}
          hint="All-time revenue"
          spark={monthlySalesData.map((d) => d.sales)}
        />
        <MetricCard
          label="Today's AOV"
          value={<AnimatedNumber value={metrics.todayAOV} format={formatCurrency} />}
          icon={ShoppingCart}
          accent={ACCENT.cyan}
          hint="Basket size today"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Discounts (30d)"
          value={<AnimatedNumber value={metrics.totalDiscounts} format={formatCurrency} />}
          icon={TrendingDown}
          accent={ACCENT.amber}
          hint="Promotional cost"
        />
        <MetricCard
          label="Delivery Fees (30d)"
          value={<AnimatedNumber value={metrics.totalDeliveryFees} format={formatCurrency} />}
          icon={Package}
          accent={ACCENT.indigo}
          hint="Logistics revenue"
        />
        <MetricCard label="Active Carts" value="—" icon={ShoppingCart} accent="#475569" hint="Coming soon" muted />
        <MetricCard label="Abandoned Carts" value="—" icon={Activity} accent="#475569" hint="Coming soon" muted />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Revenue Distribution"
          subtitle="Daily sales over the last 30 days"
          icon={BarChartIcon}
          accent={ACCENT.emerald}
        >
          <DynamicChart data={monthlySalesData} chartType="bar" color={ACCENT.emerald} id="sales-bar" height={288} />
        </Panel>

        <Panel title="Revenue Quality" subtitle="How revenue is composed" icon={Target} accent={ACCENT.cyan}>
          <div className="space-y-5">
            <ProgressBar
              label="Net Sales (30d)"
              value={metrics.monthlySales}
              max={metrics.monthlySales + metrics.totalDiscounts || 1}
              color={ACCENT.emerald}
              format={formatCurrency}
            />
            <ProgressBar
              label="Discounts Given"
              value={metrics.totalDiscounts}
              max={metrics.monthlySales + metrics.totalDiscounts || 1}
              color={ACCENT.amber}
              format={formatCurrency}
            />
            <ProgressBar
              label="Delivery Fees"
              value={metrics.totalDeliveryFees}
              max={metrics.monthlySales + metrics.totalDeliveryFees || 1}
              color={ACCENT.indigo}
              format={formatCurrency}
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <MiniStat label="Orders (30d)" value={metrics.monthlyOrders.toLocaleString('en-IN')} accent={ACCENT.blue} />
              <MiniStat label="Orders (7d)" value={metrics.weeklyOrders.toLocaleString('en-IN')} accent={ACCENT.violet} />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── Analytics Tab ───────────────────────────────────────────────────

function AnalyticsTab({
  metrics,
  orderStatusData,
  paymentMethodData,
}: {
  metrics: InvestorMetrics;
  orderStatusData: any[];
  paymentMethodData: any[];
}) {
  const paymentTotal = paymentMethodData.reduce((s, p) => s + p.value, 0);
  const visiblePayments = paymentMethodData.filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Orders by Status" subtitle="Distribution over the last 30 days" icon={Package} accent={ACCENT.indigo}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderStatusData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="statusBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tick={{ fill: '#64748b' }}
                  interval={0}
                  angle={-12}
                  dy={8}
                />
                <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: '#64748b' }} width={40} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="sales" name="Orders" fill="url(#statusBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Payment Methods" subtitle="Revenue split by payment channel" icon={PieChartIcon} accent={ACCENT.cyan}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visiblePayments}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#0B111A"
                    strokeWidth={2}
                  >
                    {visiblePayments.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col justify-center space-y-3">
              {visiblePayments.length === 0 && (
                <p className="text-xs text-slate-500">No payment data available.</p>
              )}
              {visiblePayments.map((p, i) => {
                const pct = paymentTotal ? (p.value / paymentTotal) * 100 : 0;
                return (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length], boxShadow: `0 0 10px ${PIE_COLORS[i % PIE_COLORS.length]}` }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium capitalize text-slate-300">{p.name}</span>
                    <span className="shrink-0 text-xs font-bold text-white">{formatCurrency(p.value)}</span>
                    <span className="w-9 shrink-0 text-right text-[10px] font-semibold text-slate-500">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Audience Retention" subtitle="Customer & order health (30 days)" icon={Users} accent={ACCENT.emerald}>
          <div className="space-y-6">
            <ProgressBar label="Active Customers" value={metrics.activeCustomers} max={metrics.totalCustomers || 1} color={ACCENT.emerald} />
            <ProgressBar label="New Signups" value={metrics.newCustomers} max={metrics.totalCustomers || 1} color={ACCENT.blue} />
            <ProgressBar label="Completed Orders" value={metrics.completedOrders} max={metrics.totalOrders || 1} color={ACCENT.violet} />
            <ProgressBar label="Cancelled Orders" value={metrics.cancelledOrders} max={metrics.totalOrders || 1} color={ACCENT.rose} />
          </div>
        </Panel>

        <Panel title="Business Records" subtitle="All-time milestones" icon={Award} accent={ACCENT.amber}>
          <ul className="space-y-1">
            <RecordRow label="Total Historical Orders" value={metrics.totalOrders.toLocaleString('en-IN')} />
            <RecordRow label="Total Registered Users" value={metrics.totalCustomers.toLocaleString('en-IN')} />
            <RecordRow
              label="Best Revenue Day"
              value={formatCurrency(metrics.bestRevenueDay.amount)}
              subtext={parseDateStr(metrics.bestRevenueDay.date, 'long')}
              accent={ACCENT.emerald}
            />
            <RecordRow
              label="Best Order Volume Day"
              value={`${metrics.bestOrderDay.count} Orders`}
              subtext={parseDateStr(metrics.bestOrderDay.date, 'long')}
              accent={ACCENT.blue}
            />
            <RecordRow
              label="Highest AOV Recorded"
              value={formatCurrency(metrics.highestAOVDay.amount)}
              subtext={parseDateStr(metrics.highestAOVDay.date, 'long')}
              accent={ACCENT.violet}
            />
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ─── More Tab ────────────────────────────────────────────────────────

function MoreTab({ onBack }: { onBack?: () => void }) {
  const features = [
    { icon: FileText, title: 'PDF Prospectus', desc: 'Board-ready investor deck export', accent: ACCENT.emerald },
    { icon: Users, title: 'Cohort Analysis', desc: 'Retention curves by signup month', accent: ACCENT.violet },
    { icon: IndianRupee, title: 'Tax Summaries', desc: 'GST-ready financial statements', accent: ACCENT.cyan },
    { icon: TrendingUp, title: 'Forecasting', desc: 'Projected revenue & growth models', accent: ACCENT.amber },
  ];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-emerald-500/[0.09] via-white/[0.02] to-transparent p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-violet-400/10 blur-[80px]" />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-400 shadow-[0_0_40px_-8px_rgba(16,185,129,0.6)]">
          <Sparkles size={28} />
        </div>
        <h2 className="relative mt-5 text-xl font-bold tracking-tight text-white sm:text-2xl">Advanced Reporting Suite</h2>
        <p className="relative mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400 sm:text-sm">
          Detailed prospectus exports, cohort analysis and comprehensive tax summaries are landing in the next release.
        </p>

        <div className="relative mx-auto mt-6 flex max-w-xs items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">66% ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 transition-all duration-300 hover:border-white/[0.14]"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.14] blur-[40px] transition-opacity duration-500 group-hover:opacity-30"
                style={{ background: f.accent }}
              />
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10"
                style={{ background: `${f.accent}1f`, color: f.accent }}
              >
                <Icon size={18} />
              </div>
              <p className="relative mt-3.5 text-sm font-bold text-white">{f.title}</p>
              <p className="relative mt-1 text-[11px] leading-relaxed text-slate-500">{f.desc}</p>
              <span className="relative mt-3 inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Soon
              </span>
            </div>
          );
        })}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="mx-auto flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-5 py-2.5 text-xs font-bold text-slate-300 transition-all hover:border-white/20 hover:text-white active:scale-95"
        >
          <ArrowLeft size={14} /> Back to app
        </button>
      )}
    </div>
  );
}

// ─── Shared UI Pieces ────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  delta,
  hint,
  spark,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  accent: string;
  delta?: { value: string; positive: boolean } | null;
  hint?: string;
  spark?: number[];
  muted?: boolean;
}) {
  const sparkId = `spark-${label.replace(/[^a-z0-9]/gi, '')}`;
  const sparkData = (spark || []).map((v, i) => ({ i, v }));

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-white/[0.012] p-5 transition-all duration-300 hover:border-white/[0.15] hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.16] blur-[42px] transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: accent }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className={`mt-2.5 text-[26px] font-bold leading-none tracking-tight ${muted ? 'text-slate-500' : 'text-white'}`}>
            {value}
          </p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon size={16} />
        </div>
      </div>

      <div className="relative mt-3 flex min-h-[18px] items-center gap-2">
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
              delta.positive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}
          >
            {delta.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {delta.value}
          </span>
        )}
        {hint && <span className="truncate text-[10px] font-medium text-slate-500">{hint}</span>}
      </div>

      {sparkData.length > 1 && (
        <div className="relative -mx-5 -mb-5 mt-3 h-10 opacity-60 transition-opacity duration-300 group-hover:opacity-100">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accent}
                strokeWidth={1.6}
                fill={`url(#${sparkId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  accent = ACCENT.emerald,
  action,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.012] backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10"
            style={{ background: `${accent}1a`, color: accent }}
          >
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-bold text-white">{title}</h3>
            {subtitle && <p className="truncate text-[10px] text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon: React.ElementType }[];
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
      {options.map((o) => {
        const Icon = o.icon;
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all duration-200 ${
              active
                ? 'bg-emerald-500/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Ring({
  value,
  max,
  color,
  label,
  sublabel,
  size = 108,
  stroke = 9,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  sublabel: string;
  size?: number;
  stroke?: number;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
              filter: `drop-shadow(0 0 6px ${color}90)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none text-white">{pct.toFixed(0)}%</span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-500">{sublabel}</span>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}

function HighlightRow({
  icon: Icon,
  accent,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  accent: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/[0.1]">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${accent}1f`, color: accent }}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate text-[13px] font-bold text-white">{value}</p>
      </div>
      {sub && <span className="shrink-0 text-[10px] font-medium text-slate-500">{sub}</span>}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-base font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  color,
  format,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  format?: (n: number) => string;
}) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const display = format ? format(value) : value.toLocaleString('en-IN');

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <span className="shrink-0 text-xs font-bold text-white">
          {display}
          <span className="ml-1.5 text-[10px] font-semibold text-slate-500">({percentage.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 12px ${color}70`,
            transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
    </div>
  );
}

function RecordRow({
  label,
  value,
  subtext,
  accent,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-300">{label}</p>
        {subtext && <p className="mt-0.5 text-[10px] font-medium text-slate-500">{subtext}</p>}
      </div>
      <span
        className="shrink-0 rounded-lg border px-2.5 py-1 text-[13px] font-bold"
        style={
          accent
            ? { color: accent, background: `${accent}14`, borderColor: `${accent}33` }
            : { color: '#e2e8f0', background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }
        }
      >
        {value}
      </span>
    </li>
  );
}

// ─── Charts ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  const raw = payload[0].value;
  const isCurrency = typeof raw === 'number' && raw > 100;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B111A]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">
        {isCurrency ? formatCurrency(raw) : Number(raw).toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function DynamicChart({
  data,
  chartType,
  color,
  id,
  height = 260,
}: {
  data: any[];
  chartType: ChartType;
  color: string;
  id: string;
  height?: number;
}) {
  const gradId = `areaGrad-${id}`;

  const axisProps = {
    tickLine: false,
    axisLine: false,
    fontSize: 10,
    tick: { fill: '#64748b' },
  } as const;

  const shared = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
      <XAxis dataKey="day" {...axisProps} interval="preserveStartEnd" />
      <YAxis {...axisProps} width={52} tickFormatter={(v) => formatCompact(Number(v))} />
      <Tooltip
        content={<ChartTooltip />}
        cursor={chartType === 'bar' ? { fill: 'rgba(255,255,255,0.03)' } : { stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1 }}
      />
    </>
  );

  return (
    <div className="w-full outline-none [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'bar' ? (
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`barGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                <stop offset="100%" stopColor={color} stopOpacity={0.3} />
              </linearGradient>
            </defs>
            {shared}
            <Bar dataKey="sales" name="Revenue" fill={`url(#barGrad-${id})`} radius={[6, 6, 0, 0]} maxBarSize={26} />
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {shared}
            <Line
              type="monotone"
              name="Revenue"
              dataKey="sales"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: '#0B111A', strokeWidth: 2 }}
            />
          </LineChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {shared}
            <Area
              type="monotone"
              name="Revenue"
              dataKey="sales"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradId})`}
              activeDot={{ r: 5, fill: color, stroke: '#0B111A', strokeWidth: 2 }}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ─── States ──────────────────────────────────────────────────────────

function SkeletonState() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[132px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="h-[380px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03] xl:col-span-2" />
        <div className="h-[380px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="h-[320px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
        <div className="h-[320px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
      </div>
    </div>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] py-20">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-400">
        <Activity size={24} />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-white">Unable to load analytics</p>
        <p className="mt-1 text-xs text-slate-500">Please check your connection and try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="mt-1 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/20 active:scale-95"
      >
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}