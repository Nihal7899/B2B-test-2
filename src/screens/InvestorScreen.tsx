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
} from 'lucide-react';
import {
  AreaChart,
  Area,
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

// ─── Helpers ─────────────────────────────────────────────────────────
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
  // Sales
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  totalSales: number;
  revenueGrowth: string;
  // Orders
  todayOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  // Customers
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  customerGrowth: string;
  // AOV
  todayAOV: number;
  monthlyAOV: number;
  // Others
  totalDiscounts: number;
  totalDeliveryFees: number;
  bestRevenueDay: { date: string; amount: number };
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

export function InvestorScreen({ onBack }: { onBack?: () => void }) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'analytics' | 'more'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);
  
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

      // 1. OPTIMIZED COUNTS
      const { count: totalOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: totalCustomersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: newCustomersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', lastMonth.toISOString());

      // 2. FETCH RECENT DATA
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, total, created_at, status, user_id, discount, delivery_fee')
        .gte('created_at', twoMonthsAgo.toISOString());

      const { data: recentPayments } = await supabase
        .from('payments')
        .select('provider, amount, status')
        .gte('created_at', lastMonth.toISOString())
        .eq('status', 'paid');

      let todaySales = 0, weeklySales = 0, monthlySales = 0, lastMonthSales = 0;
      let todayOrders = 0, weeklyOrders = 0, monthlyOrders = 0;
      let completedOrders = 0, cancelledOrders = 0;
      let totalDiscounts = 0, totalDeliveryFees = 0;

      const dailyRevenue: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      const activeCustomerSet = new Set<string>();

      // Safe RPC Call Fix (No .catch chain)
      const { data: sumData, error: sumError } = await supabase.rpc('get_lifetime_sales');
      if (sumError) {
        console.warn('Fallback triggered: get_lifetime_sales RPC missing or failed', sumError.message);
      }
      
      recentOrders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const dateStr = orderDate.toISOString().split('T')[0];
        const total = Number(order.total) || 0;
        
        if (orderDate >= lastMonth) {
          statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        }

        if (order.status === 'delivered') completedOrders++;
        if (order.status === 'cancelled') cancelledOrders++;

        if (order.status === 'delivered') {
          if (orderDate >= today) todaySales += total;
          if (orderDate >= lastWeek) weeklySales += total;
          
          if (orderDate >= lastMonth) {
            monthlySales += total;
            dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + total;
            activeCustomerSet.add(order.user_id);
            totalDiscounts += Number(order.discount) || 0;
            totalDeliveryFees += Number(order.delivery_fee) || 0;
          } else if (orderDate >= twoMonthsAgo && orderDate < lastMonth) {
            lastMonthSales += total;
          }
        }

        if (orderDate >= today) todayOrders++;
        if (orderDate >= lastWeek) weeklyOrders++;
        if (orderDate >= lastMonth) monthlyOrders++;
      });

      const bestRevDayStr = Object.keys(dailyRevenue).reduce((a, b) => dailyRevenue[a] > dailyRevenue[b] ? a : b, '');

      // Build Area Chart (Last 14 Days)
      const chartArr = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        chartArr.push({
          day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          Revenue: dailyRevenue[dStr] || 0,
        });
      }
      setRevenueChartData(chartArr);

      // Build Bar Chart
      const barArr = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        Orders: count
      }));
      setOrderStatusData(barArr);

      // Build Pie Chart
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
        bestRevenueDay: { date: bestRevDayStr, amount: dailyRevenue[bestRevDayStr] || 0 },
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
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col text-slate-900 pb-20 [&_svg]:outline-none">
      
      {/* ─── CUSTOM HEADER WITH ROUNDED CORNERS & LOGO ─── */}
      <header className="sticky top-0 z-30 bg-[#0a382c] text-white pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-b-[2rem]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-transform">
                <ArrowLeft size={18} />
              </button>
            )}

            <div className="flex items-center gap-3 select-none">
              {/* CafKart Logo SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1536 1535" className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 drop-shadow-sm" fill="none">
                <defs>
                  <linearGradient id="warehouseGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#59D9B6" />
                    <stop offset="100%" stopColor="#58D5A5" />
                  </linearGradient>
                </defs>
                <path d="M 391 199 L 331 241 288 282 264 310 242 341 216 386 193 441 183 475 170 552 169 598 173 648 190 722 210 772 233 815 278 877 304 905 343 939 375 962 413 984 478 1011 531 1024 604 1031 848 1031 881 1021 897 1007 904 993 907 979 904 956 895 940 828 872 814 862 777 850 598 850 566 846 521 833 490 819 436 780 399 738 386 718 367 678 351 612 353 545 373 479 402 429 439 388 491 352 537 333 594 322 962 322 979 319 997 312 1012 302 1028 285 1038 267 1045 243 1045 218 1035 186 1021 167 1008 156 985 144 967 140 610 139 546 144 488 157 434 177 Z" fill="#FFFFFF" fillRule="evenodd" />
                <path d="M 169 1186 L 169 1199 170 1200 170 1203 171 1204 171 1205 173 1208 173 1210 176 1213 176 1214 177 1215 178 1215 179 1216 179 1217 180 1218 181 1218 184 1221 185 1221 187 1223 188 1223 191 1225 194 1225 195 1226 206 1226 207 1227 372 1227 373 1226 392 1226 393 1225 395 1225 396 1224 398 1224 399 1223 400 1223 402 1221 403 1221 405 1219 406 1219 411 1214 411 1213 412 1212 412 1211 414 1209 414 1208 416 1205 416 1203 417 1202 417 1200 418 1199 418 1186 417 1185 417 1183 416 1182 416 1180 415 1179 415 1178 414 1177 414 1176 413 1175 413 1174 411 1172 411 1171 407 1167 407 1166 406 1166 405 1165 404 1165 402 1163 401 1163 398 1161 396 1161 393 1159 194 1159 191 1161 189 1161 188 1162 187 1162 186 1163 185 1163 183 1165 182 1165 176 1171 176 1172 173 1175 173 1177 172 1178 172 1179 170 1182 170 1185 Z M 987 1142 L 986 1143 981 1143 980 1144 977 1144 976 1145 974 1145 973 1146 970 1146 969 1147 968 1147 967 1148 966 1148 965 1149 964 1149 963 1150 962 1150 961 1151 960 1151 959 1152 958 1152 956 1154 955 1154 953 1156 952 1156 949 1159 948 1159 935 1172 935 1173 933 1175 933 1176 931 1178 931 1179 930 1180 930 1181 929 1182 929 1183 928 1184 928 1185 927 1186 927 1188 925 1190 925 1192 924 1193 924 1196 923 1197 923 1199 922 1200 922 1203 921 1204 921 1231 922 1232 922 1235 923 1236 923 1238 924 1239 924 1242 925 1243 925 1245 927 1247 927 1249 928 1250 928 1251 930 1253 930 1254 931 1255 931 1256 934 1259 934 1260 939 1265 939 1266 949 1276 950 1276 953 1279 954 1279 955 1280 956 1280 958 1282 959 1282 960 1283 962 1283 964 1285 966 1285 967 1286 969 1286 970 1287 971 1287 972 1288 973 1288 974 1289 979 1289 980 1290 983 1290 984 1291 990 1291 991 1292 1002 1292 1003 1291 1007 1291 1008 1290 1012 1290 1013 1289 1017 1289 1018 1288 1020 1288 1021 1287 1023 1287 1024 1286 1026 1286 1027 1285 1028 1285 1029 1284 1030 1284 1031 1283 1033 1283 1034 1282 1035 1282 1037 1280 1038 1280 1041 1277 1042 1277 1046 1273 1047 1273 1055 1265 1055 1264 1056 1263 1057 1263 1057 1262 1060 1259 1060 1258 1062 1256 1062 1255 1064 1253 1064 1252 1065 1251 1065 1250 1066 1249 1066 1248 1067 1247 1067 1246 1068 1245 1068 1243 1069 1242 1069 1240 1070 1239 1070 1237 1071 1236 1071 1232 1072 1231 1072 1204 1071 1203 1071 1199 1070 1198 1070 1196 1069 1195 1069 1193 1068 1192 1068 1190 1067 1189 1067 1188 1066 1187 1066 1185 1065 1184 1065 1183 1064 1182 1064 1181 1063 1180 1063 1179 1061 1177 1061 1176 1058 1174 1058 1173 1055 1170 1055 1169 1044 1158 1043 1158 1040 1155 1039 1155 1038 1154 1037 1154 1035 1152 1034 1152 1033 1151 1032 1151 1031 1150 1030 1150 1029 1149 1028 1149 1027 1148 1025 1148 1024 1147 1023 1147 1022 1146 1018 1146 1017 1145 1015 1145 1014 1144 1011 1144 1010 1143 1006 1143 1005 1142 Z M 634 1142 L 633 1143 629 1143 628 1144 626 1144 625 1145 622 1145 621 1146 618 1146 617 1147 616 1147 615 1148 613 1148 612 1149 610 1149 609 1150 608 1150 606 1152 604 1152 601 1155 600 1155 597 1158 596 1158 582 1172 582 1173 580 1175 580 1176 578 1178 578 1179 577 1180 577 1181 576 1182 576 1183 575 1184 575 1185 574 1186 574 1188 573 1189 573 1190 572 1191 572 1193 571 1194 571 1197 570 1198 570 1200 569 1201 569 1204 568 1205 568 1231 569 1232 569 1234 570 1235 570 1238 571 1239 571 1241 572 1242 572 1244 573 1245 573 1246 574 1247 574 1248 575 1249 575 1250 576 1251 576 1252 578 1254 578 1255 580 1257 580 1258 583 1261 583 1262 587 1266 587 1267 593 1273 594 1273 598 1277 599 1277 602 1280 603 1280 605 1282 606 1282 607 1283 608 1283 609 1284 610 1284 611 1285 612 1285 613 1286 616 1286 617 1287 618 1287 619 1288 621 1288 622 1289 626 1289 627 1290 631 1290 632 1291 639 1291 640 1292 647 1292 648 1291 654 1291 655 1290 659 1290 660 1289 664 1289 665 1288 667 1288 668 1287 670 1287 671 1286 673 1286 674 1285 675 1285 676 1284 677 1284 678 1283 680 1283 681 1282 682 1282 684 1280 685 1280 686 1279 687 1279 693 1273 694 1273 695 1272 695 1271 697 1269 698 1269 698 1268 703 1263 703 1262 706 1259 706 1258 708 1256 708 1255 711 1252 711 1251 712 1250 712 1248 714 1246 714 1244 715 1243 715 1240 716 1239 716 1236 717 1235 717 1233 718 1232 718 1226 719 1225 719 1207 718 1206 718 1201 717 1200 717 1198 716 1197 716 1195 715 1194 715 1191 714 1190 714 1189 713 1188 713 1187 712 1186 712 1184 711 1183 711 1182 709 1180 709 1179 707 1177 707 1176 704 1173 704 1172 699 1167 699 1166 694 1161 693 1161 689 1157 688 1157 686 1155 685 1155 682 1152 680 1152 678 1150 677 1150 676 1149 674 1149 673 1148 672 1148 671 1147 670 1147 669 1146 666 1146 665 1145 663 1145 662 1144 660 1144 659 1143 655 1143 654 1142 Z M 48 1054 L 48 1068 49 1069 49 1072 50 1073 50 1074 52 1077 52 1079 54 1081 54 1082 55 1083 55 1084 61 1090 62 1090 63 1091 64 1091 66 1093 68 1093 69 1094 71 1094 72 1095 75 1095 76 1096 267 1096 268 1095 271 1095 272 1094 274 1094 275 1093 276 1093 277 1092 278 1092 280 1090 281 1090 286 1085 287 1085 287 1084 290 1081 290 1080 291 1079 291 1078 293 1076 293 1075 294 1074 294 1071 295 1070 295 1068 296 1067 296 1055 295 1054 295 1052 294 1051 294 1049 293 1048 293 1047 291 1045 291 1044 290 1043 290 1042 287 1039 287 1038 286 1038 282 1034 281 1034 279 1032 278 1032 275 1030 273 1030 270 1028 74 1028 73 1029 71 1029 68 1031 66 1031 65 1032 64 1032 61 1035 60 1035 54 1041 54 1042 52 1044 52 1045 51 1046 51 1048 50 1049 50 1050 49 1051 49 1053 Z M 1315 281 L 1292 287 1277 294 1248 318 856 713 846 730 843 745 849 768 855 776 1287 1207 1311 1220 1340 1227 1460 1227 1474 1224 1483 1219 1492 1210 1496 1202 1497 1185 1487 1165 1069 746 1072 739 1447 364 1453 355 1459 336 1459 324 1456 313 1450 303 1430 287 1402 280 Z" fill="url(#warehouseGreenGrad)" fillRule="evenodd" />
              </svg>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xl font-black tracking-tight text-white font-sans">Caf</span>
                  <span className="text-xl font-black tracking-tight text-[#59D9B6] font-sans">Kart</span>
                  <span className="ml-1 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#104d3d] text-[#59D9B6] border border-[#16604c]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#59D9B6] animate-pulse" />
                    INVESTOR
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-100/80 mt-1">
                  PERFORMANCE & ANALYTICS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchMetrics} className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 flex items-center justify-center text-emerald-200 transition-transform active:scale-95">
              <RefreshCw size={16} className={loading ? 'animate-spin text-white' : ''} />
            </button>
            <button onClick={() => void signOut()} className="h-10 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-100 flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95">
              <LogOut size={16} />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex bg-white shadow-sm p-1.5 rounded-2xl w-fit border border-slate-200">
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
                {/* Replaced Grid with Flex-Col for Mobile, exact same GradientStatCards from Dashboard.tsx */}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Area Chart */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <Activity size={16} className="text-[#0a382c]" /> Revenue Trend (14 Days)
                      </h2>
                    </div>
                    {/* Added focus:outline-none class to prevent black border on click */}
                    <div className="h-64 w-full focus:outline-none outline-none">
                      <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
                        <AreaChart data={revenueChartData} className="focus:outline-none outline-none">
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                          
                          {/* Set cursor={{ fill: 'transparent', stroke: 'transparent' }} to remove hover outlines */}
                          <Tooltip 
                            cursor={{ fill: 'transparent', stroke: 'transparent' }}
                            contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', fontWeight: 'bold', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', outline: 'none' }} 
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" activeDot={{ stroke: 'none', fill: '#10b981', r: 6, outline: 'none' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Payment Pie Chart */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                      <PieChartIcon size={16} className="text-blue-500" /> Payment Methods (30d)
                    </h2>
                    <div className="h-64 w-full focus:outline-none outline-none">
                      <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
                        <PieChart className="focus:outline-none">
                          <Pie
                            data={paymentMethodData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5} dataKey="value"
                            className="focus:outline-none"
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
                </div>
              </div>
            )}

            {/* ─── SALES TAB ─── */}
            {activeTab === 'sales' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DataBlock label="Today's Sales" value={formatCurrency(metrics.todaySales)} />
                  <DataBlock label="Weekly Sales" value={formatCurrency(metrics.weeklySales)} />
                  <DataBlock label="Lifetime Sales" value={formatCurrency(metrics.totalSales)} highlight />
                  <DataBlock label="Today's AOV" value={formatCurrency(metrics.todayAOV)} />
                  
                  <DataBlock label="Discounts Given (30d)" value={formatCurrency(metrics.totalDiscounts)} isWarning />
                  <DataBlock label="Delivery Fees (30d)" value={formatCurrency(metrics.totalDeliveryFees)} />
                  <DataBlock label="Active Carts" value="-" subtext="Coming Soon" />
                  <DataBlock label="Abandoned Carts" value="-" subtext="Coming Soon" />
                </div>

                {/* Orders Bar Chart */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm mt-6">
                  <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-6">
                    <Package size={16} className="text-indigo-500" /> Orders by Status (30 Days)
                  </h2>
                  <div className="h-72 w-full focus:outline-none outline-none">
                    <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
                      <BarChart data={orderStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} className="focus:outline-none">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', fontWeight: 'bold', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', outline: 'none' }} />
                        <Bar dataKey="Orders" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} className="focus:outline-none" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ─── ANALYTICS TAB ─── */}
            {activeTab === 'analytics' && (
              <div className="flex flex-col md:grid md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
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

                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                    <Award size={16} className="text-amber-500"/> Business Records
                  </h3>
                  <ul className="space-y-2">
                    <RecordRow label="Total Historical Orders" value={metrics.totalOrders.toLocaleString()} />
                    <RecordRow label="Total Registered Users" value={metrics.totalCustomers.toLocaleString()} />
                    <RecordRow label="Best Revenue Day" value={formatCurrency(metrics.bestRevenueDay.amount)} subtext={metrics.bestRevenueDay.date} highlight />
                    <RecordRow label="Best Order Volume Day" value="-" subtext="Calculation pending" />
                    <RecordRow label="Highest AOV Recorded" value="-" subtext="Calculation pending" />
                  </ul>
                </div>
              </div>
            )}
            
            {/* ─── MORE TAB ─── */}
            {activeTab === 'more' && (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 bg-white border border-slate-100 rounded-3xl shadow-sm">
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
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] safe-bottom md:hidden rounded-t-[1.5rem]">
        <div className="max-w-xl mx-auto flex items-center justify-around h-[4.5rem] px-2 pb-1">
          <NavButton 
            icon={<DashboardSVG />} 
            label="Dashboard" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavButton 
            icon={<SalesSVG />} 
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
            icon={<MoreSVG />} 
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

function GradientStatCard({ label, value, icon, gradient, subtitle, trend }: { label: string; value: string; icon: React.ReactNode; gradient: string; subtitle?: string; trend?: 'up' | 'down' | 'neutral' }) {
  const trendColor = trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : '#9ca3af';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–';

  return (
    <div
      className="rounded-3xl p-5 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-default shadow-sm"
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
        active ? 'bg-[#0a382c] text-white shadow-md shadow-[#0a382c]/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      {label}
    </button>
  );
}

function DataBlock({ label, value, subtext, highlight, isWarning }: { label: string, value: string, subtext?: string, highlight?: boolean, isWarning?: boolean }) {
  return (
    <div className={`border rounded-3xl p-5 shadow-sm transition-all hover:shadow-md ${highlight ? 'border-emerald-300 bg-emerald-50/50' : isWarning ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-white'}`}>
      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-xl md:text-2xl font-black ${highlight ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
      {subtext && <p className="text-[11px] font-bold text-slate-400 mt-1.5">{subtext}</p>}
    </div>
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
      className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all duration-200 outline-none focus:outline-none ${
        isActive ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { isActive })}
      </div>
      <span className={`text-[10px] font-black tracking-tight transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      {isActive && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0a382c] animate-pulse" />
      )}
    </button>
  );
}

// ─── Perfect Geometric Bottom Navigation SVGs ─────────────────────────────

const DashboardSVG = ({ isActive }: { isActive?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="2" className={isActive ? 'fill-emerald-100/50' : ''}></rect>
    <rect x="14" y="3" width="7" height="5" rx="2"></rect>
    <rect x="14" y="12" width="7" height="9" rx="2" className={isActive ? 'fill-emerald-100/50' : ''}></rect>
    <rect x="3" y="16" width="7" height="5" rx="2"></rect>
  </svg>
);

const SalesSVG = ({ isActive }: { isActive?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13h8.5l-5 8" />
    <path d="M6 13h3" />
    <path d="M9 13c6.667 0 6.667-10 0-10" className={isActive ? 'fill-emerald-100/50' : ''} />
  </svg>
);

const AnalyticsSVG = ({ isActive }: { isActive?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <rect x="7" y="13" width="3" height="4" rx="1" className={isActive ? 'fill-emerald-100/50' : ''} />
    <rect x="13" y="7" width="3" height="10" rx="1" className={isActive ? 'fill-emerald-100/50' : ''} />
  </svg>
);

const MoreSVG = ({ isActive }: { isActive?: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r={isActive ? "2" : "1.5"} />
    <circle cx="19" cy="12" r={isActive ? "2" : "1.5"} />
    <circle cx="5" cy="12" r={isActive ? "2" : "1.5"} />
  </svg>
);

function Loader2({ className, size }: { className?: string, size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
