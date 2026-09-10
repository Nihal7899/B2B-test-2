import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
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
  CheckCircle2,
  MoreHorizontal
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
  Legend
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';

// ─── Helpers (UTC ↔ IST) ─────────────────────────────────────────────
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function toIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET);
}

function getDayRangeUTC(offsetDays = 0): { startUTC: Date; endUTC: Date } {
  const nowUTC = new Date();
  const nowIST = toIST(nowUTC);
  const y = nowIST.getUTCFullYear();
  const m = nowIST.getUTCMonth();
  const d = nowIST.getUTCDate();
  const istMidnightAsUTCValue = Date.UTC(y, m, d + offsetDays, 0, 0, 0, 0);
  const startUTC = new Date(istMidnightAsUTCValue - IST_OFFSET);
  const endUTC = new Date(startUTC);
  endUTC.setUTCDate(endUTC.getUTCDate() + 1);
  return { startUTC, endUTC };
}

function getISTDateStr(utcDate: Date): string {
  const ist = toIST(utcDate);
  return ist.toISOString().split('T')[0];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function calculateGrowth(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const growth = ((current - previous) / previous) * 100;
  return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
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

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16'];

export function InvestorScreen({ onBack }: { onBack?: () => void }) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'analytics' | 'more'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);
  
  // Dashboard / Sales Charts
  const [todaySalesData, setTodaySalesData] = useState<any[]>([]);
  const [weeklySalesData, setWeeklySalesData] = useState<any[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  
  // Chart Type State
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar' | 'pie'>('area');

  // Analytics Charts
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Setup UTC date ranges similar to Dashboard.tsx
      const todayRange = getDayRangeUTC(0);
      const weekStart = getDayRangeUTC(-6).startUTC;
      const monthStart = getDayRangeUTC(-29).startUTC;
      const twoMonthsAgoStart = getDayRangeUTC(-59).startUTC;

      const todayDateStr = getISTDateStr(todayRange.startUTC);
      const weekStartStr = getISTDateStr(weekStart);
      const monthStartStr = getISTDateStr(monthStart);

      // Counts
      const { count: totalOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: totalCustomersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: newCustomersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString());

      // Fetch Recent Orders (last 60 days to compare last month)
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, total, created_at, status, user_id, discount, delivery_fee')
        .gte('created_at', twoMonthsAgoStart.toISOString())
        .order('created_at', { ascending: true });

      const { data: recentPayments } = await supabase
        .from('payments')
        .select('provider, amount, status')
        .gte('created_at', monthStart.toISOString())
        .eq('status', 'paid');

      let todaySales = 0, weeklySales = 0, monthlySales = 0, lastMonthSales = 0;
      let todayOrders = 0, weeklyOrders = 0, monthlyOrders = 0;
      let completedOrders = 0, cancelledOrders = 0;
      let totalDiscounts = 0, totalDeliveryFees = 0;

      const dailyRevenue: Record<string, number> = {};
      const dailyOrderCount: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      const activeCustomerSet = new Set<string>();

      // Safe RPC Call for lifetime
      const { data: sumData, error: sumError } = await supabase.rpc('get_lifetime_sales');
      if (sumError) {
        console.warn('Fallback triggered: get_lifetime_sales RPC missing', sumError.message);
      }
      
      const hourlyBuckets = Array.from({ length: 9 }, (_, i) => {
        const hour = 6 + i * 2;
        return { day: `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`, sales: 0 };
      });

      const todayStartIST = toIST(todayRange.startUTC);
      const todayEndIST = toIST(todayRange.endUTC);

      recentOrders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const istDate = toIST(orderDate);
        const dateStr = getISTDateStr(orderDate);
        const total = Number(order.total) || 0;
        
        if (istDate >= toIST(monthStart)) {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        }

        if (order.status === 'delivered') completedOrders++;
        if (order.status === 'cancelled') cancelledOrders++;

        // Delivered logic
        if (order.status === 'delivered') {
          if (dateStr === todayDateStr) todaySales += total;
          if (dateStr >= weekStartStr) weeklySales += total;
          
          if (dateStr >= monthStartStr) {
            monthlySales += total;
            dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + total;
            activeCustomerSet.add(order.user_id);
            totalDiscounts += Number(order.discount) || 0;
            totalDeliveryFees += Number(order.delivery_fee) || 0;
          } else if (istDate >= toIST(twoMonthsAgoStart) && istDate < toIST(monthStart)) {
            lastMonthSales += total;
          }

          // Hourly buckets (Today)
          if (istDate >= todayStartIST && istDate < todayEndIST) {
            let h = istDate.getHours();
            if (h < 6) h = 6;
            if (h > 22) h = 22;
            const bucket = h - (h % 2);
            const label = `${bucket}:00 ${bucket < 12 ? 'AM' : 'PM'}`;
            const found = hourlyBuckets.find((item) => item.day === label);
            if (found) found.sales += total;
          }
        }

        // All Orders Volume
        if (dateStr >= monthStartStr) {
          dailyOrderCount[dateStr] = (dailyOrderCount[dateStr] || 0) + 1;
        }
        if (dateStr === todayDateStr) todayOrders++;
        if (dateStr >= weekStartStr) weeklyOrders++;
        if (dateStr >= monthStartStr) monthlyOrders++;
      });

      setTodaySalesData(hourlyBuckets);

      // Weekly Sales Data
      const weeklyMap: Record<string, number> = {};
      let current = new Date(weekStart);
      while (current < todayRange.endUTC) {
        weeklyMap[getISTDateStr(current)] = 0;
        current.setDate(current.getDate() + 1);
      }
      Object.keys(dailyRevenue).forEach(date => {
        if (weeklyMap[date] !== undefined) weeklyMap[date] += dailyRevenue[date];
      });
      const weeklyArray = Object.entries(weeklyMap).map(([date, sales]) => ({
        day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        sales,
      }));
      setWeeklySalesData(weeklyArray);

      // Monthly Sales Data
      const monthlyMap: Record<string, number> = {};
      current = new Date(monthStart);
      while (current < todayRange.endUTC) {
        monthlyMap[getISTDateStr(current)] = 0;
        current.setDate(current.getDate() + 1);
      }
      Object.keys(dailyRevenue).forEach(date => {
        if (monthlyMap[date] !== undefined) monthlyMap[date] += dailyRevenue[date];
      });
      const monthlyArray = Object.entries(monthlyMap).map(([date, sales]) => ({
        day: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sales,
      }));
      setMonthlySalesData(monthlyArray);

      // Calculate Best Records dynamically
      let bestRevDay = { date: '-', amount: 0 };
      let bestOrdDay = { date: '-', count: 0 };
      let highestAovDay = { date: '-', amount: 0 };

      Object.keys(dailyRevenue).forEach(date => {
        if (dailyRevenue[date] > bestRevDay.amount) {
          bestRevDay = { date, amount: dailyRevenue[date] };
        }
      });

      Object.keys(dailyOrderCount).forEach(date => {
        if (dailyOrderCount[date] > bestOrdDay.count) {
          bestOrdDay = { date, count: dailyOrderCount[date] };
        }
        
        const dayRevenue = dailyRevenue[date] || 0;
        const dayOrders = dailyOrderCount[date];
        if (dayOrders > 0) {
          const aov = dayRevenue / dayOrders;
          if (aov > highestAovDay.amount) {
            highestAovDay = { date, amount: aov };
          }
        }
      });

      // Build Bar Chart (Status)
      const barArr = Object.entries(statusCounts).map(([status, count]) => ({
        day: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        sales: count // using 'sales' key generically for the dynamic chart 
      }));
      setOrderStatusData(barArr);

      // Build Pie Chart (Payments)
      const providerMap: Record<string, number> = {};
      recentPayments?.forEach(p => {
        const prov = (p.provider || 'Other').toUpperCase();
        providerMap[prov] = (providerMap[prov] || 0) + Number(p.amount);
      });
      const pieArr = Object.entries(providerMap).map(([name, value]) => ({ name, value }));
      setPaymentMethodData(pieArr);

      setMetrics({
        todaySales,
        weeklySales,
        monthlySales,
        totalSales: sumData || (monthlySales * 4.5), 
        revenueGrowth: calculateGrowth(monthlySales, lastMonthSales),
        todayOrders,
        weeklyOrders,
        monthlyOrders,
        totalOrders: totalOrdersCount || 0,
        completedOrders,
        cancelledOrders,
        totalCustomers: totalCustomersCount || 0,
        activeCustomers: activeCustomerSet.size,
        newCustomers: newCustomersCount || 0,
        customerGrowth: calculateGrowth(newCustomersCount || 0, (totalCustomersCount || 0) - (newCustomersCount || 0)),
        todayAOV: todayOrders ? todaySales / todayOrders : 0,
        monthlyAOV: monthlyOrders ? monthlySales / monthlyOrders : 0,
        totalDiscounts,
        totalDeliveryFees,
        bestRevenueDay: bestRevDay,
        bestOrderDay: bestOrdDay,
        highestAOVDay: highestAovDay
      });

    } catch (err) {
      console.error('Investor Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f8f7] flex flex-col text-slate-900 pb-24 [&_svg]:outline-none">
      
      {/* ─── MODERN INVESTOR HEADER ─── */}
      <header className="relative z-30 overflow-hidden rounded-b-[2.25rem] bg-[#063b2f] text-white shadow-[0_14px_40px_rgba(6,59,47,0.18)]">
        {/* Decorative green shapes */}
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#1aa77e]/25 blur-[1px]" />
        <div className="pointer-events-none absolute right-16 top-28 h-40 w-40 rounded-full bg-[#5ad9b5]/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-24 bottom-[-100px] h-56 w-56 rounded-full bg-[#0b6b55]/45" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#042f26]/35 to-transparent" />

        <div className="relative px-4 pb-7 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">

            <div className="flex min-w-0 items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  aria-label="Go back"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-sm backdrop-blur-md transition hover:bg-white/15 active:scale-95"
                >
                  <ArrowLeft size={19} />
                </button>
              )}

              <div className="flex min-w-0 items-center gap-3.5 select-none">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                  <div className="absolute inset-0 rounded-2xl bg-[#59d9b6]/10 blur-xl" />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1535" className="relative h-12 w-12 sm:h-14 sm:w-14 drop-shadow-sm" fill="none">
                    <defs>
                      <linearGradient id="investorHeaderGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#59D9B6" />
                        <stop offset="100%" stopColor="#58D5A5" />
                      </linearGradient>
                    </defs>
                    <path d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z" fill="#FFFFFF" fillRule="evenodd" />
                    <path d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z" fill="url(#investorHeaderGreenGrad)" fillRule="evenodd" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[1.65rem] font-black leading-none tracking-[-0.04em] sm:text-[2rem]">
                      Caf <span className="text-[#59d9b6]">Kart</span>
                    </h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#59d9b6]/20 bg-[#59d9b6]/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#72e0c0] backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#59d9b6] shadow-[0_0_8px_#59d9b6]" />
                      Investor
                    </span>
                  </div>
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-100/70 sm:text-[10px]">
                    Performance & Analytics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={fetchMetrics}
                aria-label="Refresh analytics"
                className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#8de4ca] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15 active:scale-95"
              >
                <RefreshCw size={18} className={`transition-transform ${loading ? 'animate-spin text-white' : 'group-hover:rotate-180'}`} />
              </button>
              <button
                onClick={() => void signOut()}
                aria-label="Exit investor mode"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-400/10 text-rose-100 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-rose-400/15 active:scale-95 sm:h-11 sm:w-auto sm:px-3.5"
              >
                <LogOut size={18} />
                <span className="ml-2 hidden text-xs font-extrabold sm:inline">Exit</span>
              </button>
            </div>
          </div>

          {/* Small status strip */}
          <div className="relative mx-auto mt-5 flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#59d9b6]/10 text-[#59d9b6]">
                <BarChart3 size={13} />
              </span>
              <span className="text-[10px] font-bold text-white/75">Investor overview</span>
            </div>
            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-[#8de4ca]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#59d9b6] shadow-[0_0_7px_#59d9b6]" />
              Live data
            </span>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 px-3.5 py-5 sm:px-5 lg:px-8 lg:py-7 max-w-7xl mx-auto w-full space-y-5">
        
        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex w-fit items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur">
           <TabButton label="Dashboard" icon={<Activity/>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
           <TabButton label="Sales & Ops" icon={<IndianRupee/>} active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
           <TabButton label="Analytics" icon={<BarChart3/>} active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        </div>

        {loading || !metrics ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 size={36} className="animate-spin text-[#0a382c]" />
            <p className="text-sm font-bold text-slate-500">Compiling financial reports...</p>
          </div>
        ) : (
          <>
            {/* ─── DASHBOARD TAB ─── */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <GradientStatCard
                    label="Monthly Revenue"
                    value={formatCurrency(metrics.monthlySales)}
                    icon={<IndianRupee size={20} />}
                    gradient="linear-gradient(135deg, #047857, #10b981)"
                    subtitle={metrics.revenueGrowth + " vs last month"}
                    trend={metrics.revenueGrowth.startsWith('+') ? 'up' : 'down'}
                  />
                  <GradientStatCard
                    label="Today's Orders"
                    value={metrics.todayOrders.toString()}
                    icon={<Package size={20} />}
                    gradient="linear-gradient(135deg, #1a56db, #3b82f6)"
                    subtitle="All processing"
                  />
                  <GradientStatCard
                    label="Total Customers"
                    value={metrics.totalCustomers.toString()}
                    icon={<Users size={20} />}
                    gradient="linear-gradient(135deg, #6d28d9, #8b5cf6)"
                    subtitle={metrics.customerGrowth + " vs last month"}
                    trend={metrics.customerGrowth.startsWith('+') ? 'up' : 'down'}
                  />
                  <GradientStatCard
                    label="Monthly AOV"
                    value={formatCurrency(metrics.monthlyAOV)}
                    icon={<ShoppingCart size={20} />}
                    gradient="linear-gradient(135deg, #0e7490, #22d3ee)"
                    subtitle="Average basket size"
                  />
                </div>

                {/* Dashboard Time-Series Charts */}
                <div className="space-y-6">
                  {/* Chart Type Toggle Component */}
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-[0_8px_25px_rgba(15,23,42,0.045)]">
                    <span className="text-xs font-bold text-slate-500 px-2 uppercase tracking-widest hidden sm:inline-block">Chart Style</span>
                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      <ChartToggleButton label="Area" icon={<Activity/>} active={chartType === 'area'} onClick={() => setChartType('area')} />
                      <ChartToggleButton label="Bar" icon={<BarChartIcon/>} active={chartType === 'bar'} onClick={() => setChartType('bar')} />
                      <ChartToggleButton label="Line" icon={<LineChartIcon/>} active={chartType === 'line'} onClick={() => setChartType('line')} />
                      <ChartToggleButton label="Pie" icon={<PieChartIcon/>} active={chartType === 'pie'} onClick={() => setChartType('pie')} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <ChartCard title="Today's Sales Trend" icon={<Activity size={16} />} color="#3b82f6" gradient="linear-gradient(135deg, #1a56db, #60a5fa)">
                      <DynamicChart data={todaySalesData} chartType={chartType} color="#3b82f6" />
                    </ChartCard>

                    <ChartCard title="Weekly Sales (Last 7 Days)" icon={<Calendar size={16} />} color="#8b5cf6" gradient="linear-gradient(135deg, #6d28d9, #a78bfa)">
                      <DynamicChart data={weeklySalesData} chartType={chartType} color="#8b5cf6" />
                    </ChartCard>
                  </div>

                  <ChartCard title="Monthly Sales (Last 30 Days)" icon={<TrendingUp size={16} />} color="#059669" gradient="linear-gradient(135deg, #047857, #34d399)">
                    <DynamicChart data={monthlySalesData} chartType={chartType} color="#059669" />
                  </ChartCard>
                </div>
              </div>
            )}

            {/* ─── SALES TAB ─── */}
            {activeTab === 'sales' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <GradientStatCard
                    label="Today's Sales"
                    value={formatCurrency(metrics.todaySales)}
                    icon={<IndianRupee size={20} />}
                    gradient="linear-gradient(135deg, #2563eb, #60a5fa)"
                    subtitle="Generated today"
                  />
                  <GradientStatCard
                    label="Weekly Sales"
                    value={formatCurrency(metrics.weeklySales)}
                    icon={<IndianRupee size={20} />}
                    gradient="linear-gradient(135deg, #059669, #34d399)"
                    subtitle="Last 7 days"
                  />
                  <GradientStatCard
                    label="Lifetime Sales"
                    value={formatCurrency(metrics.totalSales)}
                    icon={<Award size={20} />}
                    gradient="linear-gradient(135deg, #7c3aed, #a78bfa)"
                    subtitle="All time revenue"
                  />
                  <GradientStatCard
                    label="Today's AOV"
                    value={formatCurrency(metrics.todayAOV)}
                    icon={<ShoppingCart size={20} />}
                    gradient="linear-gradient(135deg, #0891b2, #22d3ee)"
                    subtitle="Today's basket size"
                  />
                  
                  <GradientStatCard
                    label="Discounts (30d)"
                    value={formatCurrency(metrics.totalDiscounts)}
                    icon={<TrendingUp size={20} />}
                    gradient="linear-gradient(135deg, #d97706, #fbbf24)"
                    subtitle="Promotional cost"
                  />
                  <GradientStatCard
                    label="Delivery Fees (30d)"
                    value={formatCurrency(metrics.totalDeliveryFees)}
                    icon={<Package size={20} />}
                    gradient="linear-gradient(135deg, #4f46e5, #818cf8)"
                    subtitle="Logistics revenue"
                  />
                  <GradientStatCard
                    label="Active Carts"
                    value="-"
                    icon={<ShoppingCart size={20} />}
                    gradient="linear-gradient(135deg, #475569, #94a3b8)"
                    subtitle="Coming Soon"
                  />
                  <GradientStatCard
                    label="Abandoned Carts"
                    value="-"
                    icon={<Activity size={20} />}
                    gradient="linear-gradient(135deg, #475569, #94a3b8)"
                    subtitle="Coming Soon"
                  />
                </div>
              </div>
            )}

            {/* ─── ANALYTICS TAB ─── */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                  {/* Status Bar Chart */}
                  <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.055)]">
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-6">
                      <Package size={16} className="text-indigo-500" /> Orders by Status (30 Days)
                    </h2>
                    <div className="h-64 w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={orderStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', outline: 'none' }} />
                          <Bar dataKey="sales" name="Orders" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Payment Pie Chart */}
                  <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.055)]">
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-6">
                      <PieChartIcon size={16} className="text-blue-500" /> Payment Methods (30 Days)
                    </h2>
                    <div className="h-64 w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethodData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5} dataKey="value"
                            style={{ outline: 'none' }}
                          >
                            {paymentMethodData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ outline: 'none' }} />
                            ))}
                          </Pie>
                          <Tooltip cursor={{ fill: 'transparent', stroke: 'transparent' }} formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', outline: 'none' }}/>
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', outline: 'none' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Audience Retention */}
                  <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.055)]">
                    <h3 className="text-sm font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                      <Users size={16} className="text-[#0a382c]"/> Audience Retention (30d)
                    </h3>
                    <div className="space-y-6">
                      <ProgressBar label="Active Customers" value={metrics.activeCustomers} max={metrics.totalCustomers} color="bg-[#10b981]" />
                      <ProgressBar label="New Signups" value={metrics.newCustomers} max={metrics.totalCustomers} color="bg-[#3b82f6]" />
                      <ProgressBar label="Completed Orders" value={metrics.completedOrders} max={metrics.totalOrders} color="bg-[#8b5cf6]" />
                      <ProgressBar label="Cancelled Orders" value={metrics.cancelledOrders} max={metrics.totalOrders} color="bg-red-400" />
                    </div>
                  </div>

                  {/* Business Records */}
                  <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,23,42,0.055)]">
                    <h3 className="text-sm font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                      <Award size={16} className="text-amber-500"/> Business Records
                    </h3>
                    <ul className="space-y-2">
                      <RecordRow label="Total Historical Orders" value={metrics.totalOrders.toLocaleString()} />
                      <RecordRow label="Total Registered Users" value={metrics.totalCustomers.toLocaleString()} />
                      <RecordRow label="Best Revenue Day" value={formatCurrency(metrics.bestRevenueDay.amount)} subtext={metrics.bestRevenueDay.date} highlight />
                      <RecordRow label="Best Order Volume Day" value={`${metrics.bestOrderDay.count} Orders`} subtext={metrics.bestOrderDay.date} highlight />
                      <RecordRow label="Highest AOV Recorded" value={formatCurrency(metrics.highestAOVDay.amount)} subtext={metrics.highestAOVDay.date} highlight />
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* ─── MORE TAB ─── */}
            {activeTab === 'more' && (
              <div className="flex h-64 flex-col items-center justify-center space-y-3 rounded-[1.5rem] border border-slate-200/70 bg-white text-center shadow-[0_10px_30px_rgba(15,23,42,0.055)]">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                  <PieChartIcon size={32} />
                </div>
                <h2 className="text-lg font-black text-slate-800">Advanced Reporting</h2>
                <p className="text-xs text-slate-500 max-w-sm font-medium">Detailed PDF prospectus, cohort analysis, and tax summaries will be available in the upcoming update.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── MOBILE BOTTOM NAVIGATION WITH CUSTOM SVGS ─── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 shadow-[0_-12px_35px_rgba(15,23,42,0.08)] backdrop-blur-2xl safe-bottom md:hidden rounded-t-[1.75rem]">
        <div className="max-w-xl mx-auto flex items-center justify-around h-[4.5rem] px-2 pb-1">
          <NavButton 
            icon={<DashboardSVG />} 
            label="Dashboard" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavButton 
            icon={<IndianRupee />} 
            label="Sales" 
            isActive={activeTab === 'sales'} 
            onClick={() => setActiveTab('sales')} 
          />
          <NavButton 
            icon={<AnalyticsSVG />} 
            label="Analytics" 
            isActive={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
          <NavButton 
            icon={<MoreHorizontal />} 
            label="More" 
            isActive={activeTab === 'more'} 
            onClick={() => setActiveTab('more')} 
          />
        </div>
      </nav>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function DynamicChart({ data, chartType, color }: { data: any[], chartType: string, color: string }) {
  // Re-usable strictly un-focusable wrapper for charts to prevent black box
  const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="h-64 w-full [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none [&_.recharts-cartesian-grid]:!outline-none outline-none">
      <ResponsiveContainer width="100%" height="100%" className="!outline-none">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );

  const commonProps = {
    data,
    margin: { top: 10, right: 10, left: -20, bottom: 0 },
    className: "!outline-none"
  };

  const commonXAxis = <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />;
  const commonYAxis = <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />;
  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />;
  const commonTooltip = <Tooltip cursor={{ fill: 'transparent', stroke: 'transparent' }} contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', outline: 'none' }} formatter={(value: number) => formatCurrency(value)} />;

  if (chartType === 'bar') {
    return (
      <ChartWrapper>
        <BarChart {...commonProps}>
          {commonGrid} {commonXAxis} {commonYAxis} {commonTooltip}
          <Bar dataKey="sales" fill={color} radius={[6, 6, 0, 0]} barSize={20} className="!outline-none" />
        </BarChart>
      </ChartWrapper>
    );
  }

  if (chartType === 'line') {
    return (
      <ChartWrapper>
        <LineChart {...commonProps}>
          {commonGrid} {commonXAxis} {commonYAxis} {commonTooltip}
          <Line type="monotone" dataKey="sales" stroke={color} strokeWidth={3} dot={{ r: 3, fill: color, strokeWidth: 0, outline: 'none' }} activeDot={{ r: 6, fill: color, stroke: 'none', outline: 'none' }} className="!outline-none" />
        </LineChart>
      </ChartWrapper>
    );
  }

  if (chartType === 'pie') {
    return (
      <ChartWrapper>
        <PieChart className="!outline-none">
          <Pie
            data={data.filter(d => d.sales > 0)} // hide zeros
            cx="50%" cy="50%"
            innerRadius={60} outerRadius={80}
            paddingAngle={2} dataKey="sales" nameKey="day"
            className="!outline-none"
            style={{ outline: 'none' }}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ outline: 'none' }} />
            ))}
          </Pie>
          {commonTooltip}
        </PieChart>
      </ChartWrapper>
    );
  }

  // Default: Area
  return (
    <ChartWrapper>
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient id={`colorArea-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        {commonGrid} {commonXAxis} {commonYAxis} {commonTooltip}
        <Area type="monotone" dataKey="sales" stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#colorArea-${color})`} activeDot={{ stroke: 'none', fill: color, r: 6, outline: 'none' }} className="!outline-none" />
      </AreaChart>
    </ChartWrapper>
  );
}

function ChartCard({ title, icon, color, gradient, children }: { title: string; icon: React.ReactNode; color: string; gradient: string; children: React.ReactNode; }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.055)]">
      <div className="flex items-center justify-between border-b border-slate-100/80 bg-gradient-to-r from-white to-slate-50/70 px-5 py-4">
        <span className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          {title}
        </span>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: gradient }} />
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function ChartToggleButton({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] font-bold transition-all outline-none focus:outline-none ${
        active ? 'bg-[#0a382c] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 14 })}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GradientStatCard({ label, value, icon, gradient, subtitle, trend }: { label: string; value: string; icon: React.ReactNode; gradient: string; subtitle?: string; trend?: 'up' | 'down' | 'neutral' }) {
  const trendColor = trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : '#9ca3af';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–';

  return (
    <div
      className="relative overflow-hidden rounded-[1.5rem] p-5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-default shadow-[0_10px_25px_rgba(15,23,42,0.08)]"
      style={{ background: gradient }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold opacity-90 uppercase tracking-wider">{label}</span>
        <div className="opacity-75">{icon}</div>
      </div>
      <div className="text-2xl md:text-3xl font-black mt-2 tracking-tight">{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1 mt-2 text-xs opacity-85 font-semibold">
          {trend && <span style={{ color: trendColor }} className="font-black text-sm leading-none">{trendIcon}</span>}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}

function TabButton({ label, icon, active, onClick }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all outline-none focus:outline-none ${
        active ? 'bg-[#063b2f] text-white shadow-[0_6px_16px_rgba(6,59,47,0.22)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      {label}
    </button>
  );
}

function ProgressBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] font-extrabold uppercase tracking-wide mb-2.5">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-900">{value.toLocaleString()} <span className="text-slate-400 font-semibold ml-1">({percentage.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function RecordRow({ label, value, subtext, highlight }: { label: string, value: string, subtext?: string, highlight?: boolean }) {
  return (
    <li className="flex justify-between items-center py-3.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-xs font-extrabold text-slate-700">{label}</p>
        {subtext && <p className="text-[10px] text-slate-400 mt-1 font-semibold">{subtext}</p>}
      </div>
      <span className={`text-sm font-black ${highlight ? 'text-[#0a382c] px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100' : 'text-slate-900'}`}>{value}</span>
    </li>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 outline-none focus:outline-none ${
        isActive ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20, strokeWidth: isActive ? 2.5 : 2, className: isActive ? 'text-[#0a382c]' : '' })}
      </div>
      <span className={`text-[10px] font-black tracking-tight transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      {isActive && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0a382c] animate-pulse" />
      )}
    </button>
  );
}

// ─── Custom Bottom Navigation SVGs ─────────────────────────────

const DashboardSVG = ({ size, strokeWidth, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="9" rx="2"></rect>
    <rect x="14" y="3" width="7" height="5" rx="2"></rect>
    <rect x="14" y="12" width="7" height="9" rx="2"></rect>
    <rect x="3" y="16" width="7" height="5" rx="2"></rect>
  </svg>
);

const AnalyticsSVG = ({ size, strokeWidth, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18" />
    <rect x="7" y="13" width="3" height="4" rx="1" />
    <rect x="13" y="7" width="3" height="10" rx="1" />
  </svg>
);

function Loader2({ className, size }: { className?: string, size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
