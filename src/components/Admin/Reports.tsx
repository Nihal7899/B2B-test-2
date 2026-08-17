// src/components/Admin/Reports.tsx
import { useState, useEffect } from 'react';
import {
  BarChart2,
  Package,
  Calendar,
  Receipt,
  FileText,
  TrendingUp,
  Download,
  Search,
  X,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

// ─── Helpers (same as Dashboard) ──────────────────────────────────────
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function toIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET);
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

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'range';
type ReportTab = 'daily' | 'products' | 'individual' | 'gst' | 'stock';

interface SaleRow {
  date: string;
  count: number;
  total: number;
}

interface ProductSale {
  product_id: string;
  product_code: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
  invoice_count: number;
}

interface IndividualProductSale {
  invoice_number: string;
  created_at: string;
  customer_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface GSTReport {
  invoice_number: string;
  created_at: string;
  customer_name: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  total_gst: number;
  grand_total: number;
}

interface StockItem {
  id: string;
  product_code: string;
  name: string;
  stock: number;
  stock_threshold: number;
}

export default function Reports() {
  const [period, setPeriod] = useState<DateFilter>('month');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rangeStart, setRangeStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rangeEnd, setRangeEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportTab>('daily');
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ total: 0, count: 0, avgOrder: 0, productsSold: 0 });

  // Individual product
  const [individualProductId, setIndividualProductId] = useState('');
  const [individualSales, setIndividualSales] = useState<IndividualProductSale[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; product_code: string; name: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // GST
  const [gstReport, setGstReport] = useState<GSTReport[]>([]);
  const [gstSummary, setGstSummary] = useState({ subtotal: 0, totalCGST: 0, totalSGST: 0, totalGST: 0, grandTotal: 0 });

  // Stock
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  // Load product list for search
  useEffect(() => {
    supabase
      .from('products')
      .select('id, product_code, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) setAllProducts(data);
      });
  }, []);

  // Trigger reload on filter change
  useEffect(() => {
    load();
  }, [period, customDate, rangeStart, rangeEnd, activeTab]);

  const getDateRange = () => {
    const now = new Date();
    let from: Date, to: Date | null = null;

    switch (period) {
      case 'today':
        from = new Date(now); from.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        from = new Date(now); from.setDate(now.getDate() - 1); from.setHours(0, 0, 0, 0);
        to = new Date(now); to.setDate(now.getDate() - 1); to.setHours(23, 59, 59, 999);
        break;
      case 'week':
        from = new Date(now); from.setDate(now.getDate() - 7); from.setHours(0, 0, 0, 0);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        from = new Date(customDate); from.setHours(0, 0, 0, 0);
        to = new Date(customDate); to.setHours(23, 59, 59, 999);
        break;
      case 'range':
        from = new Date(rangeStart); from.setHours(0, 0, 0, 0);
        to = new Date(rangeEnd); to.setHours(23, 59, 59, 999);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    // Convert to UTC for Supabase
    return { fromUTC: from.toISOString(), toUTC: to ? to.toISOString() : null };
  };

  const load = async () => {
    setLoading(true);
    try {
      const { fromUTC, toUTC } = getDateRange();
      let query = supabase
        .from('orders')
        .select('id, total, created_at, updated_at, user_id, order_number, subtotal, gst_amount, cgst_amount, sgst_amount')
        .eq('status', 'delivered')
        .gte('updated_at', fromUTC)
        .order('updated_at', { ascending: true });

      if (toUTC) query = query.lte('updated_at', toUTC);

      const { data: orders, error } = await query;
      if (error) throw error;

      // --- Daily grouping ---
      const byDate: Record<string, { count: number; total: number }> = {};
      orders?.forEach((order) => {
        // Use updated_at for grouping (as per spec)
        const istDateStr = getISTDateStr(new Date(order.updated_at));
        if (!byDate[istDateStr]) byDate[istDateStr] = { count: 0, total: 0 };
        byDate[istDateStr].count++;
        byDate[istDateStr].total += Number(order.total);
      });
      const r: SaleRow[] = Object.entries(byDate).map(([date, v]) => ({ date, ...v }));
      setRows(r);

      const total = orders?.reduce((s, i) => s + Number(i.total), 0) || 0;
      setSummary({
        total,
        count: orders?.length || 0,
        avgOrder: orders?.length ? total / orders.length : 0,
        productsSold: 0, // will compute later
      });

      // --- Product sales ---
      const orderIds = orders?.map((o) => o.id) || [];
      if (orderIds.length > 0) {
        const { data: items, error: itemsErr } = await supabase
          .from('order_items')
          .select('product_id, product_code, product_name, quantity, line_total, order_id')
          .in('order_id', orderIds);

        if (!itemsErr && items) {
          const byProduct: Record<string, ProductSale> = {};
          items.forEach((item) => {
            const id = item.product_id;
            if (!byProduct[id]) {
              byProduct[id] = {
                product_id: id,
                product_code: item.product_code || '',
                product_name: item.product_name,
                total_qty: 0,
                total_revenue: 0,
                invoice_count: 0,
              };
            }
            byProduct[id].total_qty += item.quantity;
            byProduct[id].total_revenue += Number(item.line_total);
            byProduct[id].invoice_count++;
          });
          const sorted = Object.values(byProduct).sort((a, b) => b.total_revenue - a.total_revenue);
          setProductSales(sorted);
          setSummary((prev) => ({ ...prev, productsSold: sorted.length }));
        }
      } else {
        setProductSales([]);
      }

      // --- GST report (orders with gst_amount > 0) ---
      const gstOrders = orders?.filter((o) => (o.gst_amount || 0) > 0) || [];
      const gstData: GSTReport[] = gstOrders.map((o) => ({
        invoice_number: o.order_number,
        created_at: o.created_at, // use created_at for bill date
        customer_name: '', // will fetch later
        subtotal: o.subtotal || 0,
        cgst: o.cgst_amount || 0,
        sgst: o.sgst_amount || 0,
        total_gst: o.gst_amount || 0,
        grand_total: o.total || 0,
      }));

      // Fetch customer names for all orders
      if (orders?.length) {
        const userIds = orders.map((o) => o.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, business_name')
          .in('id', userIds);
        const { data: businesses } = await supabase
          .from('businesses')
          .select('owner_user_id, business_name')
          .in('owner_user_id', userIds);
        const nameMap = new Map();
        profiles?.forEach((p) => {
          nameMap.set(p.id, p.business_name || p.full_name || 'Customer');
        });
        businesses?.forEach((b) => {
          nameMap.set(b.owner_user_id, b.business_name);
        });

        // Update gstData with customer names
        gstData.forEach((g) => {
          const order = orders.find((o) => o.order_number === g.invoice_number);
          if (order) {
            g.customer_name = nameMap.get(order.user_id) || 'Customer';
          }
        });
        // Also update daily rows? Not needed.
      }

      setGstReport(gstData);
      const gstSum = gstData.reduce(
        (s, i) => ({
          subtotal: s.subtotal + i.subtotal,
          totalCGST: s.totalCGST + i.cgst,
          totalSGST: s.totalSGST + i.sgst,
          totalGST: s.totalGST + i.total_gst,
          grandTotal: s.grandTotal + i.grand_total,
        }),
        { subtotal: 0, totalCGST: 0, totalSGST: 0, totalGST: 0, grandTotal: 0 }
      );
      setGstSummary(gstSum);

      // --- Individual product sales (if product selected) ---
      if (individualProductId && orderIds.length > 0) {
        const { data: indItems, error: indErr } = await supabase
          .from('order_items')
          .select('order_id, quantity, unit_price, line_total, orders(order_number, created_at)')
          .eq('product_id', individualProductId)
          .in('order_id', orderIds);

        if (!indErr && indItems) {
          const indSales: IndividualProductSale[] = indItems.map((item) => ({
            invoice_number: (item.orders as any)?.order_number || '',
            created_at: (item.orders as any)?.created_at || '',
            customer_name: '', // could fetch from order user if needed, but we omit for simplicity
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.line_total,
          }));
          // Attach customer names – we can do a second query, but we'll skip for brevity
          setIndividualSales(indSales);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadStockReport = async () => {
    setStockLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, product_code, name, stock_quantity, moq')
        .eq('is_active', true)
        .order('product_code', { ascending: true });
      if (error) throw error;
      setStockData(
        (data || []).map((p) => ({
          id: p.id,
          product_code: p.product_code || '',
          name: p.name,
          stock: p.stock_quantity,
          stock_threshold: p.moq || 5,
        }))
      );
    } catch (e) {
      console.error(e);
      toast.error('Failed to load stock report');
    } finally {
      setStockLoading(false);
    }
  };

  // ─── Export functions ──────────────────────────────────────────────

  const exportStockToExcel = () => {
    if (stockData.length === 0) {
      toast.error('No stock data to export');
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      stockData.map((p) => ({
        'Product Code': p.product_code,
        'Name': p.name,
        'Stock': p.stock,
        'Threshold': p.stock_threshold,
        'Status': p.stock <= 0 ? 'Out of Stock' : p.stock <= p.stock_threshold ? 'Low Stock' : 'In Stock',
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Report');
    downloadExcel(wb, `Stock_Report_${dateFilterLabel()}`);
  };

  const exportGSTToExcel = () => {
    if (gstReport.length === 0) {
      toast.error('No GST data to export');
      return;
    }
    const wb = XLSX.utils.book_new();
    const data = gstReport.map((g) => ({
      'Invoice': g.invoice_number,
      'Date': new Date(g.created_at).toLocaleDateString('en-IN'),
      'Customer': g.customer_name,
      'Subtotal': g.subtotal,
      'CGST': g.cgst,
      'SGST': g.sgst,
      'Total GST': g.total_gst,
      'Grand Total': g.grand_total,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'GST Report');
    downloadExcel(wb, `GST_Report_${dateFilterLabel()}`);
  };

  const downloadExcel = (wb: XLSX.WorkBook, filename: string) => {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `${filename}.xlsx`;
    if (Capacitor.isNativePlatform()) {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(wbout)));
      Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Documents,
      })
        .then(() => {
          Share.share({
            title: 'Report',
            text: 'Excel report',
            url: fileName,
            dialogTitle: 'Share report',
          });
        })
        .catch(() => toast.error('Failed to save file'));
    } else {
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded!');
    }
  };

  const dateFilterLabel = () => {
    switch (period) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return customDate;
      case 'range': return `${rangeStart}_to_${rangeEnd}`;
      default: return 'This Month';
    }
  };

  // ─── UI ─────────────────────────────────────────────────────────────

  const filteredProducts = productSearch
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.product_code?.includes(productSearch)
      )
    : allProducts.slice(0, 20);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <BarChart2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Reports</h1>
            <p className="text-xs text-ink-500 mt-0.5">Sales analytics & insights</p>
          </div>
        </div>
        <span className="text-xs bg-ink-100 px-3 py-1.5 rounded-full text-ink-600 font-medium">
          {dateFilterLabel()}
        </span>
      </div>

      {/* Date Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {(['today', 'yesterday', 'week', 'month'] as const).map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              period === f
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
            onClick={() => {
              setPeriod(f);
              setShowDatePicker(false);
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 ${
            period === 'custom'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
          }`}
          onClick={() => {
            setPeriod('custom');
            setShowDatePicker(true);
          }}
        >
          <Calendar size={14} /> Custom
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 ${
            period === 'range'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
          }`}
          onClick={() => {
            setPeriod('range');
            setShowDatePicker(true);
          }}
        >
          <Calendar size={14} /> Range
        </button>
      </div>

      {/* Date picker */}
      {showDatePicker && (period === 'custom' || period === 'range') && (
        <div className="bg-white border border-ink-200 rounded-xl p-3 flex flex-wrap items-center gap-2">
          {period === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="h-9 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
            />
          )}
          {period === 'range' && (
            <>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="h-9 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              />
              <span className="text-ink-400">→</span>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="h-9 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
              />
            </>
          )}
          <button
            onClick={() => {
              load();
              setShowDatePicker(false);
            }}
            className="h-9 px-4 rounded-lg bg-brand-600 text-white text-sm font-bold"
          >
            Apply
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Sales"
          value={formatCurrency(summary.total)}
          icon={<ShoppingBag size={18} />}
          gradient="linear-gradient(135deg, #1d4ed8, #8b5cf6)"
        />
        <StatCard
          label="Invoices"
          value={String(summary.count)}
          icon={<FileText size={18} />}
          gradient="linear-gradient(135deg, #059669, #34d399)"
        />
        <StatCard
          label="Avg. Order"
          value={formatCurrency(summary.avgOrder)}
          icon={<Award size={18} />}
          gradient="linear-gradient(135deg, #d97706, #fbbf24)"
        />
        <StatCard
          label="Products Sold"
          value={String(summary.productsSold)}
          icon={<Package size={18} />}
          gradient="linear-gradient(135deg, #dc2626, #f87171)"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-ink-100 pb-1">
        {(['daily', 'products', 'individual', 'gst', 'stock'] as const).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-t-xl text-sm font-bold transition ${
              activeTab === tab
                ? 'bg-brand-600 text-white'
                : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50'
            }`}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'stock') loadStockReport();
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ─── Daily Tab ────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
              <BarChart2 size={16} className="text-brand-600" /> Sales by Day
            </span>
            <span className="text-xs text-ink-500">{rows.length} days</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-8 text-ink-400">
                <BarChart2 size={40} className="mx-auto opacity-30" />
                <p className="text-sm mt-2">No sales data</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => (
                  <div key={row.date}>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-600">{row.date}</span>
                      <span className="text-ink-500">{row.count} inv · {formatCurrency(row.total)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-ink-100 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${(row.total / (Math.max(...rows.map((r) => r.total)) || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Products Tab ────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
              <Package size={16} className="text-brand-600" /> Top Products
            </span>
            <span className="text-xs text-ink-500">{productSales.length} products</span>
          </div>
          <div className="p-4 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
              </div>
            ) : productSales.length === 0 ? (
              <div className="text-center py-8 text-ink-400">
                <Package size={40} className="mx-auto opacity-30" />
                <p className="text-sm mt-2">No product sales</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                    <th className="pb-2 font-semibold">Code</th>
                    <th className="pb-2 font-semibold">Product</th>
                    <th className="pb-2 font-semibold text-right">Qty</th>
                    <th className="pb-2 font-semibold text-right">Invoices</th>
                    <th className="pb-2 font-semibold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {productSales.slice(0, 20).map((p) => (
                    <tr key={p.product_id} className="border-b border-ink-50 last:border-0">
                      <td className="py-2 font-mono text-xs text-ink-500">#{p.product_code || p.product_id.slice(0, 6)}</td>
                      <td className="py-2 text-ink-800 font-medium">{p.product_name}</td>
                      <td className="py-2 text-right text-ink-600">{p.total_qty}</td>
                      <td className="py-2 text-right text-ink-600">{p.invoice_count}</td>
                      <td className="py-2 text-right font-bold text-ink-900">{formatCurrency(p.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Individual Tab ──────────────────────────────────────────── */}
      {activeTab === 'individual' && (
        <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100">
            <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-600" /> Individual Product Sales
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Search product by name or code..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-ink-200 text-sm outline-none focus:border-brand-500"
              />
              {productSearch && (
                <button
                  onClick={() => {
                    setProductSearch('');
                    setIndividualProductId('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {productSearch && (
              <div className="max-h-48 overflow-y-auto border border-ink-100 rounded-xl">
                {filteredProducts.slice(0, 10).map((p) => (
                  <button
                    key={p.id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-ink-50 flex items-center gap-2 ${
                      individualProductId === p.id ? 'bg-brand-50 text-brand-700' : ''
                    }`}
                    onClick={() => {
                      setIndividualProductId(p.id);
                      setProductSearch(p.name);
                    }}
                  >
                    <span className="font-mono text-xs text-ink-400">#{p.product_code || p.id.slice(0, 6)}</span>
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
            {!individualProductId && !productSearch && (
              <div className="text-center py-6 text-ink-400">
                <TrendingUp size={40} className="mx-auto opacity-30" />
                <p className="text-sm mt-2">Search and select a product</p>
              </div>
            )}
            {individualProductId && loading && (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
              </div>
            )}
            {individualProductId && individualSales.length === 0 && !loading && (
              <div className="text-center py-6 text-ink-400">No sales for this product</div>
            )}
            {individualProductId && individualSales.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                      <th className="pb-2 font-semibold">Invoice</th>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Qty</th>
                      <th className="pb-2 font-semibold text-right">Unit Price</th>
                      <th className="pb-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualSales.map((sale, idx) => (
                      <tr key={idx} className="border-b border-ink-50 last:border-0">
                        <td className="py-2 font-mono text-xs">{sale.invoice_number}</td>
                        <td className="py-2 text-ink-600">{new Date(sale.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="py-2 text-ink-600">{sale.quantity}</td>
                        <td className="py-2 text-right text-ink-600">{formatCurrency(sale.unit_price)}</td>
                        <td className="py-2 text-right font-bold text-ink-900">{formatCurrency(sale.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── GST Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'gst' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Taxable Value"
              value={formatCurrency(gstSummary.subtotal)}
              gradient="linear-gradient(135deg, #1d4ed8, #8b5cf6)"
            />
            <StatCard
              label="CGST"
              value={formatCurrency(gstSummary.totalCGST)}
              gradient="linear-gradient(135deg, #059669, #34d399)"
            />
            <StatCard
              label="SGST"
              value={formatCurrency(gstSummary.totalSGST)}
              gradient="linear-gradient(135deg, #d97706, #fbbf24)"
            />
            <StatCard
              label="Total Tax"
              value={formatCurrency(gstSummary.totalGST)}
              gradient="linear-gradient(135deg, #dc2626, #f87171)"
            />
          </div>
          <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
                <Receipt size={16} className="text-brand-600" /> GST Invoices
              </span>
              {gstReport.length > 0 && (
                <button
                  onClick={exportGSTToExcel}
                  className="h-8 px-3 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold flex items-center gap-1 hover:bg-brand-100"
                >
                  <Download size={14} /> Excel
                </button>
              )}
            </div>
            <div className="p-4 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
                </div>
              ) : gstReport.length === 0 ? (
                <div className="text-center py-8 text-ink-400">
                  <Receipt size={40} className="mx-auto opacity-30" />
                  <p className="text-sm mt-2">No GST invoices</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                      <th className="pb-2 font-semibold">Invoice</th>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Customer</th>
                      <th className="pb-2 font-semibold text-right">Taxable</th>
                      <th className="pb-2 font-semibold text-right">CGST</th>
                      <th className="pb-2 font-semibold text-right">SGST</th>
                      <th className="pb-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstReport.map((inv) => (
                      <tr key={inv.invoice_number} className="border-b border-ink-50 last:border-0">
                        <td className="py-2 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="py-2 text-ink-600">{new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                        <td className="py-2 text-ink-600">{inv.customer_name}</td>
                        <td className="py-2 text-right text-ink-600">{formatCurrency(inv.subtotal)}</td>
                        <td className="py-2 text-right text-ink-600">{formatCurrency(inv.cgst)}</td>
                        <td className="py-2 text-right text-ink-600">{formatCurrency(inv.sgst)}</td>
                        <td className="py-2 text-right font-bold text-ink-900">{formatCurrency(inv.grand_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-ink-200">
                    <tr>
                      <td colSpan={3} className="py-2 font-bold text-right">Total</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(gstSummary.subtotal)}</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(gstSummary.totalCGST)}</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(gstSummary.totalSGST)}</td>
                      <td className="py-2 text-right font-bold">{formatCurrency(gstSummary.grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Stock Tab ────────────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
              <Package size={16} className="text-brand-600" /> Stock Report (All Categories)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500">{stockData.length} products</span>
              <button
                onClick={exportStockToExcel}
                disabled={stockData.length === 0}
                className="h-8 px-3 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold flex items-center gap-1 hover:bg-brand-100 disabled:opacity-50"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            {stockLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
              </div>
            ) : stockData.length === 0 ? (
              <div className="text-center py-8 text-ink-400">
                <Package size={40} className="mx-auto opacity-30" />
                <p className="text-sm mt-2">No products found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                    <th className="pb-2 font-semibold">Code</th>
                    <th className="pb-2 font-semibold">Name</th>
                    <th className="pb-2 font-semibold text-right">Stock</th>
                    <th className="pb-2 font-semibold text-right">Threshold</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((p) => {
                    const status =
                      p.stock <= 0 ? 'Out of Stock' : p.stock <= p.stock_threshold ? 'Low Stock' : 'In Stock';
                    const color =
                      status === 'Out of Stock'
                        ? 'text-red-600'
                        : status === 'Low Stock'
                        ? 'text-amber-600'
                        : 'text-green-600';
                    return (
                      <tr key={p.id} className="border-b border-ink-50 last:border-0">
                        <td className="py-2 font-mono text-xs text-ink-500">#{p.product_code || p.id.slice(0, 6)}</td>
                        <td className="py-2 text-ink-800">{p.name}</td>
                        <td className="py-2 text-right font-semibold">{p.stock}</td>
                        <td className="py-2 text-right text-ink-500">{p.stock_threshold}</td>
                        <td className={`py-2 text-right font-bold ${color}`}>{status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── StatCard sub‑component ──────────────────────────────────────────
function StatCard({ label, value, icon, gradient }: { label: string; value: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div
      className="rounded-2xl p-4 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-default"
      style={{ background: gradient }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold opacity-85 uppercase tracking-wider">{label}</span>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="text-xl font-extrabold mt-1.5 tracking-tight">{value}</div>
    </div>
  );
}