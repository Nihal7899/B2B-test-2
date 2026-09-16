import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertOctagon, Loader2, RotateCcw, Package, Search, CreditCard } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';

interface FailedRefundOrder {
  id: string;
  order_number: string;
  total: number;
  created_at: string;
  recipient_name: string;
  needsRetry: boolean;
  isProcessing: boolean;
}

export default function RefundManager() {
  const [orders, setOrders] = useState<FailedRefundOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadFailedRefunds = async () => {
    setLoading(true);
    try {
      // Fetch all cancelled orders and their payments
      const { data: cancelledOrders } = await supabase
        .from('orders')
        .select('id, order_number, total, created_at, address_id')
        .eq('status', 'cancelled')
        .order('created_at', { ascending: false });

      if (!cancelledOrders) return;

      const orderIds = cancelledOrders.map(o => o.id);
      const addressIds = cancelledOrders.map(o => o.address_id).filter(Boolean);

      const [paymentsRes, addressRes] = await Promise.all([
        orderIds.length > 0 ? supabase.from('payments').select('order_id, provider, status').in('order_id', orderIds) : Promise.resolve({ data: [] }),
        addressIds.length > 0 ? supabase.from('addresses').select('id, recipient_name').in('id', addressIds) : Promise.resolve({ data: [] })
      ]);

      const addressMap = Object.fromEntries((addressRes.data || []).map(a => [a.id, a.recipient_name]));
      const allPayments = paymentsRes.data || [];

      const failedList: FailedRefundOrder[] = [];

      cancelledOrders.forEach(ord => {
        const orderPayments = allPayments.filter(p => p.order_id === ord.id);
        let needsRefundRetry = false;
        let isProcessingRefund = false;

        orderPayments.forEach(p => {
          const status = (p.status || '').toLowerCase();
          const provider = (p.provider || '').toLowerCase();

          if (status === 'processing_refund') isProcessingRefund = true;
          if (status === 'refund_failed' || (provider === 'razorpay' && (status === 'paid' || status === 'completed'))) {
            needsRefundRetry = true;
          }
        });

        if (needsRefundRetry || isProcessingRefund) {
          failedList.push({
            id: ord.id,
            order_number: ord.order_number,
            total: Number(ord.total),
            created_at: ord.created_at,
            recipient_name: ord.address_id ? addressMap[ord.address_id] : 'Unknown',
            needsRetry: needsRefundRetry,
            isProcessing: isProcessingRefund
          });
        }
      });

      setOrders(failedList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFailedRefunds();
  }, []);

  const handleRetryRefund = async (orderId: string) => {
    setActionOrderId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('razorpay', {
        body: { action: 'refund_razorpay_payment', order_id: orderId }
      });
      
      if (error || data?.error) {
        setToastNotification({ message: data?.error || 'Retry failed. Check Razorpay dashboard.', type: 'error' });
      } else {
        setToastNotification({ message: 'Refund retry processed successfully', type: 'success' });
        await loadFailedRefunds();
      }
    } catch {
      setToastNotification({ message: 'Network error during refund retry', type: 'error' });
    } finally {
      setActionOrderId(null);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.recipient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {toastNotification && (
        <div className="fixed top-4 inset-x-4 z-[500] max-w-sm mx-auto">
          <Toast message={toastNotification.message} type={toastNotification.type} onClose={() => setToastNotification(null)} />
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
            <CreditCard className="text-brand-600" />
            Critical Refund Management
          </h2>
          <p className="text-sm text-ink-500">Manage and retry failed Razorpay refunds for cancelled orders.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-3 text-ink-400" />
          <input
            type="text"
            placeholder="Search order or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-ink-200 text-sm focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} />
          </div>
          <h3 className="text-lg font-bold text-ink-900">All Clear!</h3>
          <p className="text-ink-500 text-sm mt-1">There are no pending or failed refunds requiring attention.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map(ord => (
            <div key={ord.id} className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-ink-900">{ord.order_number}</h4>
                    <p className="text-xs text-ink-500">{ord.recipient_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink-900">₹{ord.total.toFixed(2)}</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${ord.needsRetry ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {ord.isProcessing ? (
                      <Loader2 size={16} className="text-amber-600 animate-spin" />
                    ) : (
                      <AlertOctagon size={16} className="text-red-600" />
                    )}
                    <div>
                      <p className={`text-xs font-bold ${ord.needsRetry ? 'text-red-900' : 'text-amber-900'}`}>
                        {ord.needsRetry ? 'Refund Required' : 'Processing Refund'}
                      </p>
                      <p className={`text-[10px] ${ord.needsRetry ? 'text-red-700' : 'text-amber-700'}`}>
                        {ord.needsRetry ? 'Razorpay payment is captured. Manual retry needed.' : 'Communicating with gateway...'}
                      </p>
                    </div>
                  </div>
                  {ord.needsRetry && (
                    <button 
                      onClick={() => handleRetryRefund(ord.id)}
                      disabled={actionOrderId === ord.id}
                      className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition"
                    >
                      {actionOrderId === ord.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
