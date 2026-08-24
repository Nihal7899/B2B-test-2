// src/components/AdminInvoices.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Printer, Loader2, Search, X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import type { DbOrder } from '@/services/catalog';

// --- Helpers ---
const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const SkeletonCard = () => (
  <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-4 w-32 bg-ink-200 rounded" />
        <div className="h-3 w-24 bg-ink-100 rounded" />
        <div className="h-3 w-20 bg-ink-100 rounded" />
      </div>
      <div className="h-9 w-24 bg-ink-200 rounded-lg" />
    </div>
  </div>
);

// --- Main Component ---
export default function AdminInvoices() {
  const [orders, setOrders] = useState<(DbOrder & { customer_name: string })[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Printing
  const [printing, setPrinting] = useState<string | null>(null);

  const LIMIT = 20;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // --- Compute date range from filter type ---
  const getDateRange = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let start: Date, end: Date;
    switch (filterType) {
      case 'today':
        start = today;
        end = tomorrow;
        break;
      case 'yesterday':
        start = yesterday;
        end = today;
        break;
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        start = weekAgo;
        end = now;
        break;
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        start = monthAgo;
        end = now;
        break;
      }
      case 'custom':
        if (customStart && customEnd) {
          start = new Date(customStart);
          end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
        } else {
          start = today;
          end = tomorrow;
        }
        break;
      default:
        start = today;
        end = tomorrow;
    }
    return { start, end };
  }, [filterType, customStart, customEnd]);

  // --- Fetch logic ---
  const fetchOrders = useCallback(async (reset: boolean) => {
    if (reset) {
      setListLoading(true);
      setOrders([]);
      setHasMore(true);
      setTotalCount(null);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    const offset = reset ? 0 : page * LIMIT;
    const search = debouncedSearch.trim();
    const { start, end } = getDateRange();

    try {
      let userIds: string[] | null = null;
      if (search) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .ilike('full_name', `%${search}%`);
        if (profiles && profiles.length > 0) {
          userIds = profiles.map(p => p.id);
        } else {
          userIds = [];
        }
      }

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .in('status', ['confirmed', 'packed', 'ready_for_pickup', 'out_for_delivery', 'delivered'])
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (search) {
        if (userIds && userIds.length > 0) {
          query = query.or(`order_number.ilike.%${search}%, user_id.in.(${userIds.join(',')})`);
        } else {
          query = query.ilike('order_number', `%${search}%`);
        }
      }

      const { data, count, error } = await query.range(offset, offset + LIMIT - 1);

      if (error) throw error;
      const total = count || 0;
      setTotalCount(total);

      if (!data || data.length === 0) {
        if (reset) setOrders([]);
        setHasMore(false);
        return;
      }

      const userIdsFromOrders = data.map(o => o.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIdsFromOrders);
      const nameMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name || 'Customer']));

      const enriched = data.map(o => ({
        ...o,
        customer_name: nameMap[o.user_id] || 'Customer',
      }));

      if (reset) {
        setOrders(enriched);
        setPage(1);
      } else {
        setOrders(prev => [...prev, ...enriched]);
        setPage(prev => prev + 1);
      }

      const loadedCount = reset ? enriched.length : orders.length + enriched.length;
      setHasMore(loadedCount < total);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      if (reset) {
        setListLoading(false);
        setInitialLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, filterType, customStart, customEnd, page, LIMIT, orders.length, getDateRange]);

  useEffect(() => {
    setPage(0);
    fetchOrders(true);
  }, [debouncedSearch, filterType, customStart, customEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || listLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchOrders(false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, listLoading, fetchOrders]);

  const handlePrint = async (orderId: string, orderNumber?: string) => {
    setPrinting(orderId);
    try {
      const html = await buildGstBillHtml(orderId);
      await printHtml(html, orderNumber || `Invoice_${orderId.slice(0, 8)}`);
    } catch (err) {
      console.error('Print Error:', err);
      alert('Failed to generate bill.');
    } finally {
      setPrinting(null);
    }
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700',
    packed: 'bg-amber-100 text-amber-700',
    ready_for_pickup: 'bg-indigo-100 text-indigo-700',
    out_for_delivery: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
  };

  const showSkeletons = initialLoading || listLoading;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-ink-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order number or customer name..."
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-ink-200 bg-white text-sm outline-none focus:border-brand-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X size={16} className="text-ink-400 hover:text-ink-600" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['today', 'yesterday', 'week', 'month'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as typeof filterType)}
              className={`h-8 px-3 rounded-full text-xs font-semibold capitalize transition ${
                filterType === type
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={() => setFilterType('custom')}
            className={`h-8 px-3 rounded-full text-xs font-semibold transition ${
              filterType === 'custom'
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            Custom
          </button>
          {filterType === 'custom' && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 px-2 rounded-lg border border-ink-200 text-xs outline-none focus:border-brand-500"
              />
              <span className="text-xs text-ink-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 px-2 rounded-lg border border-ink-200 text-xs outline-none focus:border-brand-500"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          {totalCount !== null && `${totalCount} invoice${totalCount !== 1 ? 's' : ''}`}
          {orders.length > 0 && ` · showing ${orders.length}`}
        </span>
        {loadingMore && <Loader2 size={14} className="animate-spin text-brand-500" />}
      </div>

      <div className="space-y-3">
        {showSkeletons
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : orders.map((order) => {
              const statusLabel = order.status.replace(/_/g, ' ');
              const statusColor = statusColors[order.status] || 'bg-gray-100 text-gray-700';
              return (
                <div
                  key={order.id}
                  className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink-800 truncate">{order.order_number}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5">
                      {order.customer_name} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-ink-400 mt-1">
                      ₹{Number(order.total).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={() => void handlePrint(order.id, order.order_number)}
                    disabled={printing === order.id}
                    className="h-9 px-4 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-60 hover:bg-brand-700 transition"
                  >
                    {printing === order.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Printer size={14} />
                    )}
                    Print Bill
                  </button>
                </div>
              );
            })}
      </div>

      {hasMore && !showSkeletons && (
        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          {loadingMore && <Loader2 size={18} className="animate-spin text-brand-500" />}
        </div>
      )}

      {!hasMore && orders.length > 0 && !showSkeletons && (
        <p className="text-center text-xs text-ink-400 pt-2">No more invoices</p>
      )}
    </div>
  );
}
