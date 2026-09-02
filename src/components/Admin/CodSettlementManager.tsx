import { useEffect, useState, useCallback } from 'react';
import {
  Banknote,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  X,
  Loader2,
  Receipt,
  User,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DriverCodSummary {
  delivery_partner_id: string;
  driver_name: string;
  phone: string;
  total_cod_collected: number;
  total_cod_settled: number;
  outstanding_balance: number;
  last_settled_at: string | null;
}

interface SettlementLog {
  id: string;
  amount: number;
  payment_mode: string;
  notes: string;
  created_at: string;
  cleared_by: string;
}

export default function CodSettlementManager() {
  const [summaries, setSummaries] = useState<DriverCodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedDriver, setSelectedDriver] = useState<DriverCodSummary | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank_transfer' | 'upi'>('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const [historyDriver, setHistoryDriver] = useState<DriverCodSummary | null>(null);
  const [historyLogs, setHistoryLogs] = useState<SettlementLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_delivery_partners_cod_summary');
      if (error) throw error;
      setSummaries(
        (data || []).map((row: any) => ({
          ...row,
          total_cod_collected: Number(row.total_cod_collected || 0),
          total_cod_settled: Number(row.total_cod_settled || 0),
          outstanding_balance: Number(row.outstanding_balance || 0),
        }))
      );
    } catch (err: any) {
      console.error('Failed to load COD summaries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const openSettleModal = (driver: DriverCodSummary) => {
    setSelectedDriver(driver);
    setSettleAmount(driver.outstanding_balance > 0 ? driver.outstanding_balance.toString() : '');
    setPaymentMode('cash');
    setNotes('');
    setActionError('');
  };

  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) {
      setActionError('Enter a valid settlement amount greater than 0.');
      return;
    }

    setSubmitting(true);
    setActionError('');

    try {
      const { error } = await supabase.rpc('record_cod_settlement', {
        p_delivery_partner_id: selectedDriver.delivery_partner_id,
        p_amount: amt,
        p_payment_mode: paymentMode,
        p_notes: notes.trim(),
      });

      if (error) throw error;

      // Broadcast clearance over WebSocket so driver's card drops to 0 instantly
      const syncChannel = supabase.channel('delivery_dispatch_sync');
      await syncChannel.send({
        type: 'broadcast',
        event: 'cod_settled',
        payload: { deliveryPartnerId: selectedDriver.delivery_partner_id },
      });

      setSelectedDriver(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to record settlement.');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryDrawer = async (driver: DriverCodSummary) => {
    setHistoryDriver(driver);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_partner_cod_settlements')
        .select('*')
        .eq('delivery_partner_id', driver.delivery_partner_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistoryLogs((data as SettlementLog[]) || []);
    } catch (err) {
      console.error('Failed to fetch settlement logs:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const totalOutstandingAll = summaries.reduce((acc, curr) => acc + curr.outstanding_balance, 0);
  const totalSettledAll = summaries.reduce((acc, curr) => acc + curr.total_cod_settled, 0);
  const totalCollectedAll = summaries.reduce((acc, curr) => acc + curr.total_cod_collected, 0);

  const filteredSummaries = summaries.filter(
    (s) =>
      s.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-ink-100 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight flex items-center gap-2">
            <Banknote size={22} className="text-brand-600" />
            COD Settlements & Clearances
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            Audit doorstep cash collections and reconcile deposits from delivery partners.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-9 px-3 rounded-xl bg-white border border-ink-200 text-ink-700 text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin text-brand-600' : ''} />
          Refresh
        </button>
      </div>

      {/* Aggregate Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className="rounded-2xl p-4 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)' }}
        >
          <div className="flex items-center justify-between opacity-90 text-[11px] font-extrabold uppercase">
            <span>Total Outstanding COD</span>
            <AlertCircle size={16} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            ₹{totalOutstandingAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] mt-1 opacity-80 font-medium">Cash currently held by delivery fleet</p>
        </div>

        <div
          className="rounded-2xl p-4 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #047857, #10b981)' }}
        >
          <div className="flex items-center justify-between opacity-90 text-[11px] font-extrabold uppercase">
            <span>Total Cleared to Date</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            ₹{totalSettledAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] mt-1 opacity-80 font-medium">Reconciled deposits received by admin</p>
        </div>

        <div
          className="rounded-2xl p-4 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}
        >
          <div className="flex items-center justify-between opacity-90 text-[11px] font-extrabold uppercase">
            <span>Total Lifetime Collections</span>
            <Receipt size={16} />
          </div>
          <div className="text-2xl font-black mt-2 tracking-tight">
            ₹{totalCollectedAll.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] mt-1 opacity-80 font-medium">Delivered cash-on-delivery volume</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-ink-400" />
        <input
          type="text"
          placeholder="Search partner by name or contact number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-ink-200 text-xs font-semibold outline-none focus:border-brand-500 shadow-xs"
        />
      </div>

      {/* Partner Ledger */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-white border border-ink-100 rounded-2xl p-12 text-center text-ink-400 space-y-2">
          <User size={36} className="mx-auto text-ink-300" />
          <p className="text-sm font-bold text-ink-800">No delivery partners found</p>
          <p className="text-xs">Ensure staff profiles have the delivery_partner role assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredSummaries.map((driver) => {
            const hasDue = driver.outstanding_balance > 0.01;

            return (
              <div
                key={driver.delivery_partner_id}
                className={`bg-white border rounded-2xl p-4 shadow-card flex flex-col justify-between space-y-3.5 transition-all ${
                  hasDue ? 'border-amber-300 ring-1 ring-amber-100' : 'border-ink-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-black text-ink-900 flex items-center gap-1.5">
                        {driver.driver_name}
                      </h2>
                      <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Phone size={12} className="text-ink-400" /> {driver.phone || 'No phone'}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase rounded-full px-2.5 py-1 ${
                        hasDue ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {hasDue ? 'Pending Due' : 'All Cleared'}
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-ink-50 border border-ink-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ink-400">Total COD</p>
                      <p className="text-xs font-black text-ink-800 mt-0.5">
                        ₹{driver.total_cod_collected.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ink-400">Deposited</p>
                      <p className="text-xs font-black text-emerald-700 mt-0.5">
                        ₹{driver.total_cod_settled.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-amber-700">Due Cash</p>
                      <p className="text-xs font-black text-amber-900 mt-0.5">
                        ₹{driver.outstanding_balance.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {driver.last_settled_at && (
                    <p className="text-[10px] text-ink-400 mt-2 flex items-center gap-1">
                      <Clock size={11} /> Last cleared:{' '}
                      {new Date(driver.last_settled_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-ink-50">
                  <button
                    onClick={() => openSettleModal(driver)}
                    className="flex-1 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft active:scale-98 transition"
                  >
                    <ArrowDownLeft size={14} /> Clear / Settle Cash
                  </button>

                  <button
                    onClick={() => void openHistoryDrawer(driver)}
                    className="h-9 px-3 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 text-ink-700 text-xs font-bold shadow-xs active:scale-98 transition"
                  >
                    History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settle Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-ink-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-ink-900">Record COD Settlement</h3>
                <p className="text-[11px] text-ink-500">
                  Reconcile cash received from {selectedDriver.driver_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="h-8 w-8 rounded-xl bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
                {actionError}
              </div>
            )}

            <form onSubmit={handleRecordSettlement} className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex justify-between items-center text-xs">
                <span className="text-amber-800 font-bold">Outstanding Balance:</span>
                <span className="text-sm font-black text-amber-900">
                  ₹{selectedDriver.outstanding_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-ink-700">
                  <label>Amount Received (₹)</label>
                  <button
                    type="button"
                    onClick={() => setSettleAmount(selectedDriver.outstanding_balance.toString())}
                    className="text-[10px] text-brand-600 hover:underline"
                  >
                    Clear Full Balance
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 5000"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-ink-200 text-sm font-black outline-none focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-700">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-ink-200 text-xs font-semibold outline-none focus:border-brand-500"
                >
                  <option value="cash">Direct Cash Handover</option>
                  <option value="upi">UPI Transfer</option>
                  <option value="bank_transfer">Bank Deposit / IMPS</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-ink-700">Notes / Reference No. (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Received by Warehouse Lead / Bank Txn ID"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-ink-200 text-xs font-semibold outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDriver(null)}
                  className="flex-1 h-10 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      {historyDriver && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-ink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-ink-900">Settlement Logs</h3>
                <p className="text-[11px] text-ink-500">{historyDriver.driver_name}</p>
              </div>
              <button
                onClick={() => setHistoryDriver(null)}
                className="h-8 w-8 rounded-xl bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {historyLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 size={24} className="animate-spin text-brand-600" />
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="text-center py-8 text-ink-400 text-xs">
                No recorded settlements for this delivery partner.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1 divide-y divide-ink-50">
                {historyLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex justify-between items-start text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-ink-900">
                        <span>₹{Number(log.amount).toLocaleString('en-IN')}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.payment_mode.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      {log.notes && (
                        <p className="text-[11px] text-ink-600 mt-1 italic">&ldquo;{log.notes}&rdquo;</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setHistoryDriver(null)}
              className="w-full h-10 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-800 text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
