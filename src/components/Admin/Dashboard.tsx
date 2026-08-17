// src/components/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  ReceiptText,
  Calendar,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';

// ─── Helpers (UTC ↔ IST) ─────────────────────────────────────────────

// Format currency in INR
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// IST offset in milliseconds
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

// Convert a UTC date to an IST date (returns a new Date object set to IST time)
function toIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET);
}

// Get the UTC start and end of a day in IST for a given offset from today
function getDayRangeUTC(offsetDays = 0): { startUTC: Date; endUTC: Date } {
  const nowUTC = new Date();
  const nowIST = toIST(nowUTC);
  // Use UTC getters to avoid local timezone interference
  const y = nowIST.getUTCFullYear();
  const m = nowIST.getUTCMonth();
  const d = nowIST.getUTCDate();
  const istMidnightAsUTCValue = Date.UTC(y, m, d + offsetDays, 0, 0, 0, 0);
  const startUTC = new Date(istMidnightAsUTCValue - IST_OFFSET);
  const endUTC = new Date(startUTC);
  endUTC.setUTCDate(endUTC.getUTCDate() + 1);
  return { startUTC, endUTC };
}

// Get IST date string (YYYY-MM-DD) from a UTC Date
function getISTDateStr(utcDate: Date): string {
  const ist = toIST(utcDate);
  return ist.toISOString().split('T')[0];
}

// ─── Types ────────────────────────────────────────────────────────────
interface DashboardStats {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  todayOrders: number;
  totalProducts: number;
  totalUsers: number;
}

interface HourlySales { hour: string; sales: number; }
interface DailySales { day: string; sales: number; }
interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
}
interface RecentOrder {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  total: number;
}

// ─── Main Component ──────────────────────────────────────────────────
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todaySalesData, setTodaySalesData] = useState<HourlySales[]>([]);
  const [weeklySalesData, setWeeklySalesData] = useState<DailySales[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // ─── 1. Fetch delivered orders for the last 30 days (UTC) ──
        const thirtyDaysAgoUTC = getDayRangeUTC(-29).startUTC;
        const { data: deliveredOrders, error: delErr } = await supabase
          .from('orders')
          .select('id, total, created_at, user_id')
          .eq('status', 'delivered')
          .gte('created_at', thirtyDaysAgoUTC.toISOString())
          .order('created_at', { ascending: true });

        if (delErr) throw delErr;

        // ─── 2. Compute stats ──────────────────────────────────────
        const todayRange = getDayRangeUTC(0);
        const todayDateStr = getISTDateStr(todayRange.startUTC);

        const weekStart = getDayRangeUTC(-6).startUTC;
        const weekEnd = getDayRangeUTC(0).endUTC;
        const weekStartStr = getISTDateStr(weekStart);
        const weekEndStr = getISTDateStr(weekEnd);

        const monthStart = getDayRangeUTC(-29).startUTC;
        const monthEnd = getDayRangeUTC(0).endUTC;
        const monthStartStr = getISTDateStr(monthStart);
        const monthEndStr = getISTDateStr(monthEnd);

        let todaySales = 0,
            weeklySales = 0,
            monthlySales = 0;

        deliveredOrders?.forEach((order) => {
          const orderDate = new Date(order.created_at);
          const dateStr = getISTDateStr(orderDate);
          const amount = Number(order.total);
          if (dateStr === todayDateStr) todaySales += amount;
          if (dateStr >= weekStartStr && dateStr <= weekEndStr) weeklySales += amount;
          if (dateStr >= monthStartStr && dateStr <= monthEndStr) monthlySales += amount;
        });

        // Today's orders (all statuses)
        const { count: todayOrders, error: todayOrdersErr } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayRange.startUTC.toISOString())
          .lt('created_at', todayRange.endUTC.toISOString());
        if (todayOrdersErr) throw todayOrdersErr;

        // Total active products
        const { count: totalProducts, error: productsErr } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        if (productsErr) throw productsErr;

        // Total users
        const { count: totalUsers, error: usersErr } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (usersErr) throw usersErr;

        setStats({
          todaySales,
          weeklySales,
          monthlySales,
          todayOrders: todayOrders || 0,
          totalProducts: totalProducts || 0,
          totalUsers: totalUsers || 0,
        });

        // ─── 3. Chart data ─────────────────────────────────────────

        // 3a. Today's hourly sales (2‑hour buckets from 6 AM to 10 PM)
        const hourlyBuckets = Array.from({ length: 9 }, (_, i) => {
          const hour = 6 + i * 2;
          const label = `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`;
          return { hour: label, sales: 0 };
        });
        const todayStartIST = toIST(todayRange.startUTC);
        const todayEndIST = toIST(todayRange.endUTC);
        deliveredOrders?.forEach((order) => {
          const orderDate = new Date(order.created_at);
          const istDate = toIST(orderDate);
          if (istDate >= todayStartIST && istDate < todayEndIST) {
            let h = istDate.getHours();
            if (h < 6) h = 6;
            if (h > 22) h = 22;
            const bucket = h - (h % 2);
            const label = `${bucket}:00 ${bucket < 12 ? 'AM' : 'PM'}`;
            const found = hourlyBuckets.find((item) => item.hour === label);
            if (found) found.sales += Number(order.total);
          }
        });
        setTodaySalesData(hourlyBuckets);

        // 3b. Weekly sales (last 7 days, daily)
        const weeklyMap: Record<string, number> = {};
        const weekStartDate = weekStart;
        const weekEndDate = weekEnd;
        let current = new Date(weekStartDate);
        while (current < weekEndDate) {
          const key = getISTDateStr(current);
          weeklyMap[key] = 0;
          current.setDate(current.getDate() + 1);
        }
        deliveredOrders?.forEach((order) => {
          const orderDate = new Date(order.created_at);
          const istDate = toIST(orderDate);
          if (istDate >= toIST(weekStartDate) && istDate < toIST(weekEndDate)) {
            const key = getISTDateStr(orderDate);
            if (weeklyMap[key] !== undefined) {
              weeklyMap[key] += Number(order.total);
            }
          }
        });
        const weeklyArray = Object.entries(weeklyMap).map(([date, sales]) => ({
          day: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
          sales,
        }));
        setWeeklySalesData(weeklyArray);

        // 3c. Monthly sales (last 30 days, daily)
        const monthlyMap: Record<string, number> = {};
        const monthStartDate = monthStart;
        const monthEndDate = monthEnd;
        current = new Date(monthStartDate);
        while (current < monthEndDate) {
          const key = getISTDateStr(current);
          monthlyMap[key] = 0;
          current.setDate(current.getDate() + 1);
        }
        deliveredOrders?.forEach((order) => {
          const orderDate = new Date(order.created_at);
          const istDate = toIST(orderDate);
          if (istDate >= toIST(monthStartDate) && istDate < toIST(monthEndDate)) {
            const key = getISTDateStr(orderDate);
            if (monthlyMap[key] !== undefined) {
              monthlyMap[key] += Number(order.total);
            }
          }
        });
        const monthlyArray = Object.entries(monthlyMap).map(([date, sales]) => ({
          day: new Date(date).toLocaleDateString('en-IN', { day: 'numeric' }),
          sales,
        }));
        setMonthlySalesData(monthlyArray);

        // ─── 4. Top Products ──────────────────────────────────────
        const deliveredOrderIds = (deliveredOrders || []).map((o) => o.id);
        if (deliveredOrderIds.length > 0) {
          const { data: orderItems, error: itemsErr } = await supabase
            .from('order_items')
            .select(`
              product_id,
              quantity,
              line_total,
              products (name)
            `)
            .in('order_id', deliveredOrderIds);

          if (!itemsErr && orderItems) {
            const prodMap: Record<string, TopProduct> = {};
            orderItems.forEach((item) => {
              const id = item.product_id;
              if (!prodMap[id]) {
                prodMap[id] = {
                  product_id: id,
                  product_name: item.products?.name || 'Unknown',
                  total_qty: 0,
                  total_revenue: 0,
                };
              }
              prodMap[id].total_qty += item.quantity;
              prodMap[id].total_revenue += Number(item.line_total);
            });
            const sorted = Object.values(prodMap)
              .sort((a, b) => b.total_qty - a.total_qty)
              .slice(0, 5);
            setTopProducts(sorted);
          }
        }

        // ─── 5. Recent Orders ─────────────────────────────────────
        const { data: recent, error: recentErr } = await supabase
          .from('orders')
          .select('id, order_number, created_at, total, user_id')
          .order('created_at', { ascending: false })
          .limit(5);
        if (!recentErr && recent) {
          const userIds = recent.map((o) => o.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || 'Customer']));
          const enriched = recent.map((o) => ({
            ...o,
            customer_name: nameMap[o.user_id] || 'Customer',
            total: Number(o.total),
          }));
          setRecentOrders(enriched);
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const todayUTC = new Date();
  const todayIST = toIST(todayUTC);
  const formattedDate = todayIST.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3 text-xs text-ink-500 mt-1">
            <Calendar size={14} />
            <span>{formattedDate}</span>
            <span className="opacity-30">•</span>
            <Clock size={14} />
            <span>{todayIST.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        {/* Removed New Bill button */}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <GradientStatCard
          label="Today's Sales"
          value={formatCurrency(stats?.todaySales ?? 0)}
          icon={<TrendingUp size={20} />}
          gradient="linear-gradient(135deg, #1a56db, #3b82f6)"
          subtitle="+12.5% vs yesterday"
          trend="up"
        />
        <GradientStatCard
          label="Weekly Sales"
          value={formatCurrency(stats?.weeklySales ?? 0)}
          icon={<ReceiptText size={20} />}
          gradient="linear-gradient(135deg, #047857, #10b981)"
          subtitle="Last 7 days"
          trend="up"
        />
        <GradientStatCard
          label="Monthly Sales"
          value={formatCurrency(stats?.monthlySales ?? 0)}
          icon={<ShoppingCart size={20} />}
          gradient="linear-gradient(135deg, #6d28d9, #8b5cf6)"
          subtitle="Current month"
          trend="up"
        />
        <GradientStatCard
          label="Today's Orders"
          value={String(stats?.todayOrders ?? 0)}
          icon={<ShoppingCart size={20} />}
          gradient="linear-gradient(135deg, #0e7490, #22d3ee)"
          subtitle="All statuses"
          trend="neutral"
        />
        <GradientStatCard
          label="Total Products"
          value={String(stats?.totalProducts ?? 0)}
          icon={<Package size={20} />}
          gradient="linear-gradient(135deg, #b45309, #f59e0b)"
          subtitle="Active"
          trend="neutral"
        />
        <GradientStatCard
          label="Total Users"
          value={String(stats?.totalUsers ?? 0)}
          icon={<Users size={20} />}
          gradient="linear-gradient(135deg, #4b5563, #9ca3af)"
          subtitle="Registered"
          trend="neutral"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Today's Sales Trend" icon={<Clock size={16} />} color="#3b82f6" gradient="linear-gradient(135deg, #1a56db, #60a5fa)">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={todaySalesData}>
              <defs>
                <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v as number) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} fill="url(#todayGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Sales (Last 7 Days)" icon={<Calendar size={16} />} color="#8b5cf6" gradient="linear-gradient(135deg, #6d28d9, #a78bfa)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v as number) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 7, fill: '#6d28d9' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard title="Monthly Sales (Last 30 Days)" icon={<BarChart3 size={16} />} color="#059669" gradient="linear-gradient(135deg, #047857, #34d399)">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlySalesData}>
              <defs>
                <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v as number) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Area type="monotone" dataKey="sales" stroke="#059669" strokeWidth={2.5} fill="url(#monthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Products */}
        <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 bg-ink-50/50 flex items-center justify-between">
            <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
              <Package size={16} className="text-brand-600" />
              Top Products
            </span>
            {/* Removed View All link */}
          </div>
          <div className="p-4 space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-4">No product sales yet</p>
            ) : (
              topProducts.map((p) => (
                <div key={p.product_id} className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-ink-500">{p.total_qty} units sold</p>
                  </div>
                  <span className="text-sm font-bold text-ink-900">{formatCurrency(p.total_revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 bg-ink-50/50 flex items-center justify-between">
            <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
              <ReceiptText size={16} className="text-brand-600" />
              Recent Orders
            </span>
            <Link to="/invoices" className="text-xs font-semibold text-brand-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-4">No orders yet</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{order.order_number}</p>
                    <p className="text-xs text-ink-500">{order.customer_name}</p>
                  </div>
                  <span className="text-sm font-bold text-ink-900">{formatCurrency(order.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub‑components ──────────────────────────────────────────────────

function GradientStatCard({
  label,
  value,
  icon,
  gradient,
  subtitle,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor = trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : '#9ca3af';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–';

  return (
    <div
      className="rounded-2xl p-4 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-default"
      style={{ background: gradient }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold opacity-85 uppercase tracking-wider">{label}</span>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="text-2xl font-extrabold mt-1.5 tracking-tight">{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1 mt-1.5 text-xs opacity-80">
          <span style={{ color: trendColor }}>{trendIcon}</span>
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  icon,
  color,
  gradient,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-ink-100 bg-ink-50/50 flex items-center justify-between">
        <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          {title}
        </span>
        <span className="w-2 h-2 rounded-full" style={{ background: gradient }} />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}