// src/screens/GSTReportScreen.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  Receipt,
  Download,
  Calendar,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import { getInvoiceConfig } from '@/services/invoice.service';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// ─── Universal Download Helper (Web + Capacitor iOS / Android) ────────
const downloadExcel = async (wb: XLSX.WorkBook, filename: string) => {
  try {
    const isCapacitorNative =
      typeof (window as any).Capacitor !== 'undefined' &&
      (window as any).Capacitor?.isNativePlatform?.();

    if (isCapacitorNative) {
      const wboutBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const fileName = `${filename}.xlsx`;

      let Filesystem = (window as any).Capacitor?.Plugins?.Filesystem;
      let Directory = (window as any).Capacitor?.Plugins?.Directory || { Cache: 'CACHE' };
      let Share = (window as any).Capacitor?.Plugins?.Share;

      if (!Filesystem) {
        try {
          const fsModule = await import('@capacitor/filesystem');
          Filesystem = fsModule.Filesystem;
          Directory = fsModule.Directory;
        } catch {}
      }
      if (!Share) {
        try {
          const shareModule = await import('@capacitor/share');
          Share = shareModule.Share;
        } catch {}
      }

      if (Filesystem) {
        const fileResult = await Filesystem.writeFile({
          path: fileName,
          data: wboutBase64,
          directory: Directory.Cache,
          recursive: true,
        });
        if (Share) {
          await Share.share({
            title: fileName,
            url: fileResult.uri,
            dialogTitle: 'Export GST Report',
          });
          toast.success('Report ready to open/share!');
          return;
        }
      }
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Excel downloaded!');
  } catch (err) {
    console.error('Download error:', err);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Excel downloaded!');
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Types ──────────────────────────────────────────────────────────
type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'range';

interface GSTReport {
  id: string;
  invoice_number: string;
  created_at: string;
  customer_name: string;
  customer_phone?: string;
  customer_gst?: string;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  total_gst: number;
  grand_total: number;
}

interface GSTReportScreenProps {
  onBack: () => void;
}

export function GSTReportScreen({ onBack }: GSTReportScreenProps) {
  const { user, profile } = useAuth();

  const [period, setPeriod] = useState<DateFilter>('month');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rangeStart, setRangeStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rangeEnd, setRangeEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [gstReport, setGstReport] = useState<GSTReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [gstSummary, setGstSummary] = useState({
    grossSubtotal: 0,
    totalDiscount: 0,
    totalDelivery: 0,
    taxableValue: 0,
    totalCGST: 0,
    totalSGST: 0,
    totalGST: 0,
    grandTotal: 0,
  });

  // Vendor info (from invoice config)
  const [vendorGst, setVendorGst] = useState('');
  const [vendorName, setVendorName] = useState('');
  // Customer's default business GST (fallback)
  const [defaultBusinessGst, setDefaultBusinessGst] = useState('');

  // ── Load vendor GST from invoice config ──
  useEffect(() => {
    void (async () => {
      try {
        const cfg = await getInvoiceConfig();
        setVendorGst(cfg?.company_gst || '');
        setVendorName(cfg?.company_name || '');
      } catch (e) {
        console.warn('Failed to load invoice config:', e);
      }
    })();
  }, []);

  // ── Load customer's default business GST (fallback) ──
  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from('businesses')
        .select('gstin, is_default, created_at')
        .eq('owner_user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.gstin) setDefaultBusinessGst(data.gstin);
    })();
  }, [user]);

  const dateFilterLabel = useCallback(() => {
    switch (period) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return customDate;
      case 'range': return `${rangeStart}_to_${rangeEnd}`;
      default: return 'This Month';
    }
  }, [period, customDate, rangeStart, rangeEnd]);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let from: Date, to: Date | null = null;
    switch (period) {
      case 'today':
        from = new Date(now); from.setHours(0, 0, 0, 0); break;
      case 'yesterday':
        from = new Date(now); from.setDate(now.getDate() - 1); from.setHours(0, 0, 0, 0);
        to = new Date(now); to.setDate(now.getDate() - 1); to.setHours(23, 59, 59, 999);
        break;
      case 'week':
        from = new Date(now); from.setDate(now.getDate() - 7); from.setHours(0, 0, 0, 0); break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1); break;
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
    return { fromUTC: from.toISOString(), toUTC: to ? to.toISOString() : null };
  }, [period, customDate, rangeStart, rangeEnd]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { fromUTC, toUTC } = getDateRange();
      let query = supabase
        .from('orders')
        .select(
          'id, total, created_at, updated_at, user_id, order_number, subtotal, discount, delivery_fee, gst_amount, cgst_amount, sgst_amount, business_snapshot, billing_address_snapshot'
        )
        .eq('status', 'delivered')
        .eq('user_id', user.id)               // ← ONLY the current customer
        .gte('updated_at', fromUTC)           // ← filter by UPDATED_AT (same as admin)
        .order('updated_at', { ascending: true });

      if (toUTC) query = query.lte('updated_at', toUTC);

      const { data: orders, error } = await query;
      if (error) throw error;

      const fallbackName =
        profile?.business_name?.trim() ||
        profile?.full_name?.trim() ||
        profile?.personal_name?.trim() ||
        'Customer';
      const fallbackPhone = profile?.phone || '';

      const gstData: GSTReport[] = (orders || []).map((o) => {
        const subtotal = Number(o.subtotal || 0);
        const discount = Number(o.discount || 0);
        const deliveryFee = Number(o.delivery_fee || 0);
        const deliveryTaxable = deliveryFee > 0 ? deliveryFee / 1.18 : 0;
        const deliveryCgst = deliveryFee > 0 ? (deliveryFee - deliveryTaxable) / 2 : 0;

        const netTaxableValue = Math.max(0, subtotal - discount) + deliveryTaxable;
        const cgst = Number(o.cgst_amount || 0) + deliveryCgst;
        const sgst = Number(o.sgst_amount || 0) + deliveryCgst;
        const totalGst = cgst + sgst;

        // ── Customer GST resolution (matches gstBill.ts priority) ──
        const bizSnap = (o as any).business_snapshot as
          | { business_name?: string; gstin?: string | null }
          | null | undefined;
        const billSnap = (o as any).billing_address_snapshot as
          | { business_name?: string; gstin?: string | null }
          | null | undefined;

        let custName = bizSnap?.business_name || fallbackName;
        let custGst = bizSnap?.gstin || '';

        // billing_address_snapshot overrides (this was the missing piece)
        if (billSnap?.business_name) custName = billSnap.business_name;
        if (billSnap?.gstin) custGst = billSnap.gstin;

        // Final fallback: user's default business GST
        if (!custGst) custGst = defaultBusinessGst;

        return {
          id: o.id,
          invoice_number: o.order_number,
          created_at: o.created_at,
          customer_name: custName,
          customer_phone: fallbackPhone,
          customer_gst: custGst,
          subtotal,
          discount,
          delivery_fee: deliveryFee,
          taxable_value: netTaxableValue,
          cgst,
          sgst,
          total_gst: totalGst,
          grand_total: Number(o.total || 0),
        };
      });

      setGstReport(gstData);

      const sum = gstData.reduce(
        (s, i) => ({
          grossSubtotal: s.grossSubtotal + i.subtotal,
          totalDiscount: s.totalDiscount + i.discount,
          totalDelivery: s.totalDelivery + i.delivery_fee,
          taxableValue: s.taxableValue + i.taxable_value,
          totalCGST: s.totalCGST + i.cgst,
          totalSGST: s.totalSGST + i.sgst,
          totalGST: s.totalGST + i.total_gst,
          grandTotal: s.grandTotal + i.grand_total,
        }),
        {
          grossSubtotal: 0, totalDiscount: 0, totalDelivery: 0,
          taxableValue: 0, totalCGST: 0, totalSGST: 0, totalGST: 0, grandTotal: 0,
        }
      );
      setGstSummary(sum);
    } catch (err) {
      console.error('Failed to load customer GST report:', err);
      toast.error('Failed to load GST report');
    } finally {
      setLoading(false);
    }
  }, [user, profile, getDateRange, defaultBusinessGst]);

  useEffect(() => {
    void load();
  }, [load, period, customDate, rangeStart, rangeEnd]);

  // ─── Executive GST Excel Export (same 2 sheets as admin) ────────
  const exportGSTToExcel = async () => {
    if (gstReport.length === 0) {
      toast.error('No GST data to export');
      return;
    }
    setExporting(true);
    try {
      // ─── 1. GST Summary Sheet ──────────────────────────────
      const summaryData = gstReport.map((g) => ({
        'Invoice No': g.invoice_number,
        'Invoice Date': new Date(g.created_at).toLocaleDateString('en-IN'),
        'Vendor Name': vendorName || '-',
        'Vendor GSTIN': vendorGst || '-',
        'Customer Name': g.customer_name,
        'Customer Phone': g.customer_phone || '-',
        'Customer GSTIN': g.customer_gst || 'Unregistered',
        'Gross Total (₹)': Number(g.subtotal.toFixed(2)),
        'Discount (₹)': g.discount > 0 ? -Number(g.discount.toFixed(2)) : 0,
        'Delivery Fee (₹)': Number(g.delivery_fee.toFixed(2)),
        'Assessable Taxable (₹)': Number(g.taxable_value.toFixed(2)),
        'CGST (₹)': Number(g.cgst.toFixed(2)),
        'SGST (₹)': Number(g.sgst.toFixed(2)),
        'Total GST (₹)': Number(g.total_gst.toFixed(2)),
        'Invoice Grand Total (₹)': Number(g.grand_total.toFixed(2)),
      }));

      summaryData.push({
        'Invoice No': 'TOTAL RECONCILIATION',
        'Invoice Date': '',
        'Vendor Name': '',
        'Vendor GSTIN': '',
        'Customer Name': '',
        'Customer Phone': '',
        'Customer GSTIN': '',
        'Gross Total (₹)': Number(gstSummary.grossSubtotal.toFixed(2)),
        'Discount (₹)': -Number(gstSummary.totalDiscount.toFixed(2)),
        'Delivery Fee (₹)': Number(gstSummary.totalDelivery.toFixed(2)),
        'Assessable Taxable (₹)': Number(gstSummary.taxableValue.toFixed(2)),
        'CGST (₹)': Number(gstSummary.totalCGST.toFixed(2)),
        'SGST (₹)': Number(gstSummary.totalSGST.toFixed(2)),
        'Total GST (₹)': Number(gstSummary.totalGST.toFixed(2)),
        'Invoice Grand Total (₹)': Number(gstSummary.grandTotal.toFixed(2)),
      });

      // ─── 2. GST Details Sheet (Bill-like structure) ──────
      const orderIds = gstReport.map((g) => g.id);
      const detailsData: any[] = [];

      if (orderIds.length > 0) {
        const { data: items, error } = await supabase
          .from('order_items')
          .select('order_id, product_code, product_name, hsn_code, gst_percentage, quantity, unit_price, line_total')
          .in('order_id', orderIds);

        if (!error && items) {
          const itemsByOrder: Record<string, any[]> = {};
          items.forEach((item) => {
            if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
            itemsByOrder[item.order_id].push(item);
          });

          gstReport.forEach((g) => {
            const invItems = itemsByOrder[g.id] || [];
            const rawSubtotal = invItems.reduce((sum, it) => sum + Number(it.line_total || 0), 0);

            // Bill Header
            detailsData.push({
              'Record Type': 'INVOICE HEADER',
              'Invoice No': g.invoice_number,
              'Vendor GSTIN': vendorGst || '-',
              'Date': new Date(g.created_at).toLocaleDateString('en-IN'),
              'Customer / Consignee': g.customer_name,
              'GSTIN': g.customer_gst || 'Unregistered',
              'Item Description': '--- TAX INVOICE DETAILS ---',
              'HSN/SAC': '',
              'Qty': '',
              'Unit Rate (₹)': '',
              'Gross Amount (₹)': '',
              'Discount (₹)': '',
              'Taxable Value (₹)': '',
              'GST%': '',
              'CGST (₹)': '',
              'SGST (₹)': '',
              'Row Total (₹)': '',
            });

            // Items
            invItems.forEach((item, idx) => {
              const lineTotal = Number(item.line_total || 0);
              const unitPrice = Number(item.unit_price || 0);
              const gstRate = Number(item.gst_percentage || 0);
              const itemDiscount = rawSubtotal > 0 ? (lineTotal / rawSubtotal) * g.discount : 0;
              const taxableValue = Math.max(0, lineTotal - itemDiscount);
              const gstAmount = (gstRate * taxableValue) / 100;
              const cgst = gstAmount / 2;
              const sgst = gstAmount / 2;

              detailsData.push({
                'Record Type': `Item #${idx + 1}`,
                'Invoice No': g.invoice_number,
                'Vendor GSTIN': vendorGst || '-',
                'Date': '',
                'Customer / Consignee': '',
                'GSTIN': '',
                'Item Description': item.product_name,
                'HSN/SAC': item.hsn_code || '-',
                'Qty': item.quantity,
                'Unit Rate (₹)': Number(unitPrice.toFixed(2)),
                'Gross Amount (₹)': Number(lineTotal.toFixed(2)),
                'Discount (₹)': itemDiscount > 0 ? -Number(itemDiscount.toFixed(2)) : 0,
                'Taxable Value (₹)': Number(taxableValue.toFixed(2)),
                'GST%': `${gstRate}%`,
                'CGST (₹)': Number(cgst.toFixed(2)),
                'SGST (₹)': Number(sgst.toFixed(2)),
                'Row Total (₹)': Number((taxableValue + gstAmount).toFixed(2)),
              });
            });

            // Delivery row
            if (g.delivery_fee > 0) {
              const delTaxable = g.delivery_fee / 1.18;
              const delGst = g.delivery_fee - delTaxable;
              detailsData.push({
                'Record Type': 'Service',
                'Invoice No': g.invoice_number,
                'Vendor GSTIN': vendorGst || '-',
                'Date': '',
                'Customer / Consignee': '',
                'GSTIN': '',
                'Item Description': 'Delivery & Fulfillment Service',
                'HSN/SAC': '9968',
                'Qty': 1,
                'Unit Rate (₹)': Number(delTaxable.toFixed(2)),
                'Gross Amount (₹)': Number(delTaxable.toFixed(2)),
                'Discount (₹)': 0,
                'Taxable Value (₹)': Number(delTaxable.toFixed(2)),
                'GST%': '18%',
                'CGST (₹)': Number((delGst / 2).toFixed(2)),
                'SGST (₹)': Number((delGst / 2).toFixed(2)),
                'Row Total (₹)': Number(g.delivery_fee.toFixed(2)),
              });
            }

            // Bill Summary
            detailsData.push({
              'Record Type': 'BILL SUMMARY',
              'Invoice No': g.invoice_number,
              'Vendor GSTIN': vendorGst || '-',
              'Date': '',
              'Customer / Consignee': 'TOTALS FOR INVOICE',
              'GSTIN': '',
              'Item Description': '',
              'HSN/SAC': '',
              'Qty': '',
              'Unit Rate (₹)': '',
              'Gross Amount (₹)': Number(g.subtotal.toFixed(2)),
              'Discount (₹)': g.discount > 0 ? -Number(g.discount.toFixed(2)) : 0,
              'Taxable Value (₹)': Number(g.taxable_value.toFixed(2)),
              'GST%': '',
              'CGST (₹)': Number(g.cgst.toFixed(2)),
              'SGST (₹)': Number(g.sgst.toFixed(2)),
              'Row Total (₹)': Number(g.grand_total.toFixed(2)),
            });

            // Spacer
            detailsData.push({
              'Record Type': '', 'Invoice No': '', 'Vendor GSTIN': '', 'Date': '',
              'Customer / Consignee': '', 'GSTIN': '', 'Item Description': '',
              'HSN/SAC': '', 'Qty': '', 'Unit Rate (₹)': '', 'Gross Amount (₹)': '',
              'Discount (₹)': '', 'Taxable Value (₹)': '', 'GST%': '',
              'CGST (₹)': '', 'SGST (₹)': '', 'Row Total (₹)': '',
            });
          });
        }
      }

      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      const ws2 = XLSX.utils.json_to_sheet(detailsData);

      // Optimized Column Widths
      ws1['!cols'] = [
        { wch: 18 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 25 },
        { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
        { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 22 },
      ];
      ws2['!cols'] = [
        { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 25 },
        { wch: 18 }, { wch: 34 }, { wch: 12 }, { wch: 8 }, { wch: 14 },
        { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 16 },
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'GST Summary');
      XLSX.utils.book_append_sheet(wb, ws2, 'GST Details');

      await downloadExcel(wb, `GST_Report_${dateFilterLabel()}`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export GST report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="safe-top px-4 pb-12 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600 shadow-xs active:scale-95 transition"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">GST Reports</h1>
          <p className="text-xs text-ink-500 mt-0.5">Tax invoices & input credit summary</p>
        </div>
        <span className="text-[10px] bg-ink-100 px-2.5 py-1 rounded-full text-ink-600 font-semibold">
          {dateFilterLabel()}
        </span>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap gap-1.5">
        {(['today', 'yesterday', 'week', 'month'] as const).map((f) => (
          <button
            key={f}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              period === f
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
            onClick={() => { setPeriod(f); setShowDatePicker(false); }}
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
          onClick={() => { setPeriod('custom'); setShowDatePicker(true); }}
        >
          <Calendar size={14} /> Custom
        </button>
        <button
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 ${
            period === 'range'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
          }`}
          onClick={() => { setPeriod('range'); setShowDatePicker(true); }}
        >
          <Calendar size={14} /> Range
        </button>
      </div>

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
            onClick={() => { void load(); setShowDatePicker(false); }}
            className="h-9 px-4 rounded-lg bg-brand-600 text-white text-sm font-bold"
          >
            Apply
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          label="Taxable Value"
          value={formatCurrency(gstSummary.taxableValue)}
          gradient="linear-gradient(135deg, #1d4ed8, #8b5cf6)"
        />
        <SummaryCard
          label="Total GST"
          value={formatCurrency(gstSummary.totalGST)}
          gradient="linear-gradient(135deg, #dc2626, #f87171)"
        />
        <SummaryCard
          label="CGST"
          value={formatCurrency(gstSummary.totalCGST)}
          gradient="linear-gradient(135deg, #059669, #34d399)"
        />
        <SummaryCard
          label="SGST"
          value={formatCurrency(gstSummary.totalSGST)}
          gradient="linear-gradient(135deg, #d97706, #fbbf24)"
        />
      </div>

      {/* Invoice List */}
      <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
          <span className="text-sm font-bold text-ink-800 flex items-center gap-2">
            <Receipt size={16} className="text-brand-600" /> GST Invoices
          </span>
          {gstReport.length > 0 && (
            <button
              onClick={exportGSTToExcel}
              disabled={exporting}
              className="h-8 px-3 rounded-lg bg-brand-50 text-brand-600 text-xs font-bold flex items-center gap-1 hover:bg-brand-100 disabled:opacity-50"
            >
              <Download size={14} /> {exporting ? 'Exporting…' : 'Excel'}
            </button>
          )}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
            </div>
          ) : gstReport.length === 0 ? (
            <div className="text-center py-8 text-ink-400">
              <FileText size={40} className="mx-auto opacity-30" />
              <p className="text-sm mt-2">No GST invoices in this period</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {gstReport.map((inv) => (
                <div
                  key={inv.id}
                  className="border border-ink-100 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-ink-500 truncate">{inv.invoice_number}</p>
                      <p className="text-[11px] text-ink-400 mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-black text-ink-900 shrink-0">
                      {formatCurrency(inv.grand_total)}
                    </span>
                  </div>

                  {inv.customer_name && (
                    <p className="text-[11px] text-ink-500 truncate">
                      {inv.customer_name}
                      {inv.customer_gst ? ` · GSTIN ${inv.customer_gst}` : ''}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-dashed border-ink-100">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-ink-400 font-bold">Taxable</p>
                      <p className="text-xs font-semibold text-ink-800">{formatCurrency(inv.taxable_value)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-ink-400 font-bold">CGST</p>
                      <p className="text-xs font-semibold text-ink-800">{formatCurrency(inv.cgst)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-ink-400 font-bold">SGST</p>
                      <p className="text-xs font-semibold text-ink-800">{formatCurrency(inv.sgst)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────
function SummaryCard({
  label,
  value,
  gradient,
}: {
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div
      className="rounded-2xl p-3.5 text-white"
      style={{ background: gradient }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">{label}</p>
      <p className="text-lg font-extrabold mt-1 tracking-tight">{value}</p>
    </div>
  );
}

export default GSTReportScreen;