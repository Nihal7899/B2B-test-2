import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  PhoneCall,
  Navigation,
  Banknote,
  CreditCard,
  RefreshCw,
  Clock,
  LayoutDashboard,
  User,
  LogOut,
  Sparkles,
  Wifi,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
  Store,
  ChevronRight,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import type { DbOrder, DbOrderItem, DbAddress } from '@/services/catalog';
import { SlideToConfirm } from '@/components/SlideToConfirm';
import { Toast } from '@/components/ui/Toast';
import { StaffRegistrationModal } from '@/components/StaffRegistrationModal';

interface DeliveryScreenProps {
  onBack?: () => void;
  isDedicatedRole?: boolean;
  initialTab?: 'dashboard' | 'pending' | 'picked_up' | 'delivered' | 'account';
}

export interface DeliveryPaymentSummary {
  walletPaid: number;
  onlinePaid: number;
  codPaid: number;
  totalPaid: number;
  amountToCollect: number;
  isFullyPaid: boolean;
  isSplit: boolean;
  providers: string[];
}

interface SettlementRecord {
  id: string;
  amount: number;
  payment_mode: string;
  notes: string;
  created_at: string;
}

interface ToastNotification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

function DeliveryTruckGraphic({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="truckBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f5132" />
          <stop offset="100%" stopColor="#083824" />
        </linearGradient>
        <linearGradient id="mintAccent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#59D9B6" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id="speedLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#59D9B6" stopOpacity="0" />
          <stop offset="100%" stopColor="#59D9B6" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      <line x1="10" y1="42" x2="80" y2="42" stroke="url(#speedLine)" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="58" x2="100" y2="58" stroke="url(#speedLine)" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="16" y1="74" x2="92" y2="74" stroke="url(#speedLine)" strokeWidth="2.5" strokeLinecap="round" />

      <ellipse cx="150" cy="106" rx="72" ry="7" fill="#021c14" fillOpacity="0.5" />

      <rect x="85" y="28" width="85" height="64" rx="10" fill="url(#truckBodyGrad)" stroke="#1a6e49" strokeWidth="1.5" />
      <path d="M 85 80 L 170 80" stroke="#125838" strokeWidth="2" />
      
      <circle cx="127" cy="55" r="14" fill="#042a1b" stroke="#59D9B6" strokeWidth="1.5" />
      <path d="M 122 55 L 126 51 L 133 58" stroke="#59D9B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      <path
        d="M 168 45 L 186 45 C 196 45 204 53 207 63 L 213 82 C 214 86 211 92 206 92 L 168 92 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 174 50 L 187 50 C 193 50 198 55 200 62 L 204 72 L 174 72 Z"
        fill="#1e293b"
      />
      <rect x="209" y="80" width="4" height="7" rx="2" fill="#59D9B6" />
      <rect x="174" y="80" width="28" height="3" rx="1.5" fill="url(#mintAccent)" />

      <circle cx="114" cy="95" r="14" fill="#0f172a" />
      <circle cx="114" cy="95" r="8" fill="#334155" />
      <circle cx="114" cy="95" r="4" fill="#59D9B6" />

      <circle cx="190" cy="95" r="14" fill="#0f172a" />
      <circle cx="190" cy="95" r="8" fill="#334155" />
      <circle cx="190" cy="95" r="4" fill="#59D9B6" />

      <g transform="translate(216, 26)">
        <circle cx="10" cy="10" r="10" fill="#0a382c" stroke="#59D9B6" strokeWidth="1.5" />
        <circle cx="10" cy="9" r="4" fill="#59D9B6" />
        <path d="M 10 13 L 10 17" stroke="#59D9B6" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function DeliveryScreen({
  onBack,
  isDedicatedRole = false,
  initialTab = 'dashboard',
}: DeliveryScreenProps) {
  const { user, profile, refreshProfile, logout } = useAuth();
  const [navTab, setNavTab] = useState<'dashboard' | 'pending' | 'picked_up' | 'delivered' | 'account'>(initialTab);
  const [assignments, setAssignments] = useState<
    {
      assignment: { id: string; order_id: string; status: string; picked_up_at: string | null; delivered_at: string | null };
      order: DbOrder;
      items: DbOrderItem[];
      address: DbAddress | null;
      paymentSummary: DeliveryPaymentSummary;
    }[]
  >([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<ToastNotification | null>(null);

  useEffect(() => {
    if (initialTab && initialTab !== navTab) {
      setNavTab(initialTab);
    }
  }, [initialTab]);

  const isStaffUnregistered = !profile?.staff_registration_status || profile.staff_registration_status === 'unregistered';

  const showToast = (message: string, type: ToastNotification['type'] = 'info') => {
    setToastNotification({ message, type });
  };

  const load = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [assignRes, settlementsRes] = await Promise.all([
        supabase
          .from('delivery_assignments')
          .select('*')
          .eq('delivery_partner_id', authUser.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('delivery_partner_cod_settlements')
          .select('id, amount, payment_mode, notes, created_at')
          .eq('delivery_partner_id', authUser.id)
          .order('created_at', { ascending: false }),
      ]);

      if (settlementsRes.data) {
        setSettlements(
          settlementsRes.data.map((s) => ({
            ...s,
            amount: Number(s.amount) || 0,
          }))
        );
      }

      const assignData = assignRes.data;
      if (!assignData || assignData.length === 0) {
        setAssignments([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const orderIds = assignData.map((a) => a.order_id);
      const activeOrderIds = assignData
        .filter((a) => a.status === 'ready_for_pickup' || a.status === 'out_for_delivery')
        .map((a) => a.order_id);

      const [ordersRes, itemsRes, paymentsRes] = await Promise.all([
        supabase.from('orders').select('*').in('id', orderIds),
        activeOrderIds.length > 0
          ? supabase.from('order_items').select('*').in('order_id', activeOrderIds)
          : Promise.resolve({ data: [] }),
        supabase.from('payments').select('id, order_id, provider, status, amount').in('order_id', orderIds),
      ]);

      const ordersMap = Object.fromEntries((ordersRes.data || []).map((o) => [o.id, o]));
      const addressIds = (ordersRes.data || []).map((o) => o.address_id).filter(Boolean);

      let addressMap: Record<string, DbAddress> = {};
      if (addressIds.length > 0) {
        const { data: addrData } = await supabase
          .from('addresses')
          .select('*')
          .in('id', addressIds);
        addressMap = Object.fromEntries((addrData || []).map((a) => [a.id, a]));
      }

      const itemsMap: Record<string, DbOrderItem[]> = {};
      (itemsRes.data || []).forEach((item) => {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push(item);
      });

      const paymentsMap: Record<string, DeliveryPaymentSummary> = {};
      const allPayments = paymentsRes.data || [];

      (ordersRes.data || []).forEach((ord) => {
        let walletPaid = 0;
        let onlinePaid = 0;
        let codPaid = 0;
        const providers: string[] = [];

        const relatedPayments = allPayments.filter((p) => p.order_id === ord.id);

        relatedPayments.forEach((p) => {
          const pStatus = (p.status || '').toLowerCase();
          const pProvider = (p.provider || '').toLowerCase();
          const amt = Number(p.amount) || 0;

          if (!providers.includes(pProvider)) providers.push(pProvider);

          if (pStatus === 'paid' || pStatus === 'completed') {
            if (pProvider === 'wallet') walletPaid += amt;
            else if (pProvider === 'razorpay') onlinePaid += amt;
            else if (pProvider === 'cod') codPaid += amt;
          }
        });

        const orderTotal = Number(ord.total) || 0;
        const totalSettled = walletPaid + onlinePaid + codPaid;
        const pendingToCollect = Math.max(0, orderTotal - totalSettled);

        paymentsMap[ord.id] = {
          walletPaid,
          onlinePaid,
          codPaid,
          totalPaid: totalSettled,
          amountToCollect: pendingToCollect,
          isFullyPaid: pendingToCollect <= 0.01,
          isSplit: providers.length > 1,
          providers,
        };
      });

      const results = assignData
        .map((a) => {
          const order = ordersMap[a.order_id] as DbOrder | undefined;
          if (!order) return null;

          const summary = paymentsMap[order.id] || {
            walletPaid: 0,
            onlinePaid: 0,
            codPaid: 0,
            totalPaid: 0,
            amountToCollect: Number(order.total),
            isFullyPaid: false,
            isSplit: false,
            providers: [],
          };

          if (a.status === 'delivered') {
            summary.amountToCollect = 0;
            summary.isFullyPaid = true;
          }

          return {
            assignment: a,
            order,
            items: itemsMap[order.id] || [],
            address: order.address_id ? addressMap[order.address_id] || null : null,
            paymentSummary: summary,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      setAssignments(results);
    } catch (err) {
      console.error('Error in load:', err);
      showToast('Could not load deliveries', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();

    let assignChannel: ReturnType<typeof supabase.channel> | null = null;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    let dispatchChannel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) return;

      assignChannel = supabase
        .channel(`driver_deliveries_${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_assignments',
            filter: `delivery_partner_id=eq.${authUser.id}`,
          },
          () => {
            void load();
            void refreshProfile();
          }
        )
        .subscribe();

      profileChannel = supabase
        .channel(`driver_profile_${authUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${authUser.id}`,
          },
          () => {
            void refreshProfile();
          }
        )
        .subscribe();

      dispatchChannel = supabase
        .channel('delivery_dispatch_sync')
        .on('broadcast', { event: 'assignment_changed' }, ({ payload }) => {
          if (payload?.previousDriverId === authUser.id || payload?.newDriverId === authUser.id) {
            void load();
          }
        })
        .on('broadcast', { event: 'cod_settled' }, ({ payload }) => {
          if (payload?.deliveryPartnerId === authUser.id) {
            void refreshProfile();
            void load();
            showToast('COD balance cleared by admin', 'success');
          }
        })
        .subscribe();
    });

    return () => {
      if (assignChannel) void supabase.removeChannel(assignChannel);
      if (profileChannel) void supabase.removeChannel(profileChannel);
      if (dispatchChannel) void supabase.removeChannel(dispatchChannel);
    };
  }, [load, refreshProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    void Promise.all([load(), refreshProfile()]).then(() => {
      showToast('Queue & balance refreshed', 'info');
    });
  };

  const completeDelivery = async (
    assignmentId: string,
    orderNumber: string,
    targetStatus: 'out_for_delivery' | 'delivered',
    collectedAmount = 0
  ) => {
    setProcessingId(assignmentId);
    try {
      const { error } = await supabase.rpc('complete_delivery', {
        p_assignment_id: assignmentId,
        p_status: targetStatus,
      });

      if (error) {
        showToast(`Could not update: ${error.message}`, 'error');
      } else {
        if (targetStatus === 'out_for_delivery') {
          showToast(`Order ${orderNumber} marked Out for Delivery!`, 'success');
        } else {
          showToast(
            collectedAmount > 0
              ? `Delivered! ₹${collectedAmount.toLocaleString('en-IN')} added to cash-in-hand.`
              : `Order ${orderNumber} delivered successfully!`,
            'success'
          );
        }
        await Promise.all([load(), refreshProfile()]);
      }
    } catch (err: any) {
      showToast(err?.message || 'Action failed. Please retry.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingList = useMemo(
    () => assignments.filter((a) => a.assignment.status === 'ready_for_pickup'),
    [assignments]
  );

  const pickedUpList = useMemo(
    () => assignments.filter((a) => a.assignment.status === 'out_for_delivery'),
    [assignments]
  );

  const deliveredList = useMemo(
    () => assignments.filter((a) => a.assignment.status === 'delivered'),
    [assignments]
  );

  const netCodCashToDeposit = Number(profile?.current_cod_balance ?? 0);
  const totalSettledWithAdmin = useMemo(() => {
    return settlements.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [settlements]);

  const routeOutstandingCod = useMemo(() => {
    return [...pendingList, ...pickedUpList].reduce(
      (acc, curr) => acc + (curr.paymentSummary.amountToCollect || 0),
      0
    );
  }, [pendingList, pickedUpList]);

  const currentOrderList = useMemo(() => {
    if (navTab === 'pending') return pendingList;
    if (navTab === 'picked_up') return pickedUpList;
    if (navTab === 'delivered') return deliveredList;
    return [];
  }, [navTab, pendingList, pickedUpList, deliveredList]);

  // Primary active delivery assignment for Dashboard spotlight
  const activeSpotlight = useMemo(() => {
    return pickedUpList[0] || pendingList[0] || assignments[0] || null;
  }, [pickedUpList, pendingList, assignments]);

  const isProcessing = (id: string) => processingId === id;

  const driverDisplayName =
    profile?.full_name?.trim() ||
    profile?.personal_name?.trim() ||
    profile?.business_name?.trim() ||
    'Delivery Partner';

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f4f7f5] gap-3">
        <div className="h-10 w-10 rounded-full border-3 border-emerald-300 border-t-emerald-700 animate-spin" />
        <p className="text-xs font-black text-slate-500 tracking-wider uppercase">Loading Fleet Logistics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col justify-between pb-28">
      {toastNotification && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <Toast
            message={toastNotification.message}
            type={toastNotification.type}
            onClose={() => setToastNotification(null)}
          />
        </div>
      )}

      <div>
        {/* Curving Forest Green Hero Header */}
        <header className="relative bg-gradient-to-b from-[#063a2c] via-[#094736] to-[#0d5944] text-white pt-[max(1rem,env(safe-area-inset-top))] pb-8 px-4 sm:px-6 shadow-md rounded-b-[36px] overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#59D9B6]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl mx-auto relative z-10 space-y-4">
            {/* Top Branding Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {!isDedicatedRole && onBack && (
                  <button
                    onClick={onBack}
                    className="h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white active:scale-95 transition-all shadow-xs"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}

                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                    <Truck size={20} className="text-[#59D9B6]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black tracking-tight text-white">Caf</span>
                      <span className="text-lg font-black tracking-tight text-[#59D9B6]">Kart</span>
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-200/80">
                      FLEET LOGISTICS
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Pill & Action Icons */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-[#59D9B6] border border-emerald-400/30 text-[11px] font-black">
                  <span className="h-2 w-2 rounded-full bg-[#59D9B6] animate-pulse" />
                  Online
                  <ChevronRight size={13} className="opacity-70" />
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-emerald-200 active:scale-95 transition-all"
                  title="Refresh Queue"
                >
                  <RefreshCw size={15} className={refreshing ? 'animate-spin text-white' : ''} />
                </button>
              </div>
            </div>

            {/* Greeting + Custom Delivery Truck Graphic */}
            <div className="flex items-center justify-between pt-1">
              <div className="max-w-[56%]">
                <p className="text-xs font-semibold text-emerald-200/90">{timeGreeting},</p>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                  {driverDisplayName}
                </h1>
                <p className="text-[11px] font-medium text-emerald-300/80 mt-0.5 flex items-center gap-1">
                  Let's keep the orders moving 🚚
                </p>
              </div>

              <div className="w-[44%] max-w-[170px] -mr-1">
                <DeliveryTruckGraphic className="w-full h-auto drop-shadow-md" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="px-4 sm:px-6 -mt-3 max-w-xl mx-auto space-y-4 relative z-20">
          {/* TAB 1: REDESIGNED DASHBOARD (Matches Reference 1000506822.png & 1000506821.png) */}
          {navTab === 'dashboard' && (
            <div className="space-y-4">
              {activeSpotlight ? (
                <>
                  {/* Spotlight Active / Pending Order Card */}
                  <div className="rounded-[28px] p-5 text-white shadow-xl relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#084938] to-[#04281f] border border-emerald-500/30 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/25 text-[#59D9B6] px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                          {activeSpotlight.assignment.status === 'out_for_delivery'
                            ? 'IN TRANSIT'
                            : 'PENDING ORDER'}
                        </span>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-1.5">
                          {activeSpotlight.order.order_number}
                        </h2>
                        <p className="text-[11px] text-emerald-200/80 font-medium mt-0.5">
                          Assigned: {new Date(activeSpotlight.order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·{' '}
                          <span className="font-bold text-white uppercase">
                            {activeSpotlight.paymentSummary.codPaid > 0 || activeSpotlight.paymentSummary.amountToCollect > 0 ? 'COD' : 'PREPAID'}
                          </span>
                        </p>
                      </div>

                      {/* Total Amount Tag Button */}
                      <button
                        onClick={() => setNavTab('pending')}
                        className="bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 text-right flex items-center gap-1.5 group hover:border-emerald-400/50 transition-all"
                      >
                        <span className="text-sm sm:text-base font-black tracking-tight text-white">
                          ₹{Number(activeSpotlight.order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <ChevronRight size={15} className="text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Step Flow Banner */}
                    <div className="rounded-2xl bg-black/25 backdrop-blur-sm p-3 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/25 border border-emerald-400/30 flex items-center justify-center shrink-0">
                          <Store size={18} className="text-[#59D9B6]" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">Collect Cash / UPI</p>
                          <p className="text-[10px] text-emerald-200/75">before handing over goods</p>
                        </div>
                      </div>

                      {/* Flow Arrow Indicator */}
                      <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-[#59D9B6] shrink-0">
                        <ArrowRight size={13} strokeWidth={2.5} />
                      </div>

                      <div className="flex items-center gap-2.5 text-right">
                        <div>
                          <p className="text-xs font-black text-white">Deliver to</p>
                          <p className="text-[10px] text-emerald-200/75 truncate max-w-[70px]">Customer</p>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/25 border border-emerald-400/30 flex items-center justify-center shrink-0">
                          <Package size={18} className="text-[#59D9B6]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Quick Metrics Strip */}
                  <div className="bg-white border border-slate-200/80 rounded-[24px] p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">Order Details</span>
                      <button
                        onClick={() => setNavTab(activeSpotlight.assignment.status === 'out_for_delivery' ? 'picked_up' : 'pending')}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                      >
                        View All <ChevronRight size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50/80 rounded-2xl p-2.5 flex flex-col items-center text-center border border-slate-100">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#0a382c] flex items-center justify-center mb-1">
                          <Package size={16} />
                        </div>
                        <span className="text-xs font-black text-slate-800">
                          {activeSpotlight.items.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Items</span>
                      </div>

                      <div className="bg-slate-50/80 rounded-2xl p-2.5 flex flex-col items-center text-center border border-slate-100">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#0a382c] flex items-center justify-center mb-1">
                          <Banknote size={16} />
                        </div>
                        <span className="text-xs font-black text-slate-800 truncate max-w-full">
                          ₹{Number(activeSpotlight.order.total).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Total Amount</span>
                      </div>

                      <div className="bg-slate-50/80 rounded-2xl p-2.5 flex flex-col items-center text-center border border-slate-100">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#0a382c] flex items-center justify-center mb-1">
                          <MapPin size={16} />
                        </div>
                        <span className="text-xs font-black text-slate-800">Local</span>
                        <span className="text-[10px] text-slate-400 font-medium">Dispatch Run</span>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Location Card */}
                  <div className="bg-white border border-slate-200/80 rounded-[24px] p-4 shadow-sm flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#0a382c] flex items-center justify-center shrink-0 border border-emerald-200/60 mt-0.5">
                        <Store size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900">Pickup Location</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate">
                          Central Warehouse Hub · Talapady
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast('Opening pickup route...', 'info')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-black text-slate-800 shadow-2xs active:scale-95 transition-all shrink-0"
                    >
                      <Navigation size={13} className="text-emerald-700" />
                      Navigate
                    </button>
                  </div>

                  {/* Delivery Location Card */}
                  {activeSpotlight.address && (
                    <div className="bg-white border border-slate-200/80 rounded-[24px] p-4 shadow-sm flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#0a382c] flex items-center justify-center shrink-0 border border-emerald-200/60 mt-0.5">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {activeSpotlight.address.label || 'Delivery'} · {activeSpotlight.address.recipient_name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate">
                            {activeSpotlight.address.line1}, {activeSpotlight.address.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`tel:${activeSpotlight.address.phone}`}
                          className="h-9 w-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200/60 active:scale-95 transition-all"
                          title="Call Customer"
                        >
                          <PhoneCall size={14} />
                        </a>
                        {activeSpotlight.address.latitude && activeSpotlight.address.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${activeSpotlight.address.latitude},${activeSpotlight.address.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-black text-slate-800 shadow-2xs active:scale-95 transition-all"
                          >
                            <Navigation size={13} className="text-sky-700" />
                            Navigate
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cash / UPI Collection Summary Bar */}
                  <div className="bg-white border border-slate-200/80 rounded-[24px] p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-[#0a382c] flex items-center justify-center shrink-0 border border-emerald-200/60">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">Cash / UPI Collection</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {activeSpotlight.paymentSummary.isFullyPaid
                            ? 'Order already prepaid'
                            : `Collect ₹${activeSpotlight.paymentSummary.amountToCollect.toFixed(2)} before handover`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400" />
                  </div>
                </>
              ) : (
                /* Empty state when no orders are queued */
                <div className="bg-white rounded-[28px] border border-slate-200/70 p-8 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#0a382c] border border-emerald-100">
                    <Truck size={30} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-3">All Caught Up!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                    No active dispatches right now. Stand by for upcoming delivery assignments.
                  </p>
                </div>
              )}

              {/* Safety & Driver Encouragement Banner */}
              <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-200/60 p-4 flex items-center gap-3.5 shadow-2xs">
                <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900">Stay Safe & On Time</p>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    Your efforts keep our customers happy 💚
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TABS 2, 3, 4: ORDERS QUEUE */}
          {(navTab === 'pending' || navTab === 'picked_up' || navTab === 'delivered') && (
            <div>
              {currentOrderList.length === 0 ? (
                <div className="bg-white rounded-[28px] border border-slate-200/70 p-10 flex flex-col items-center justify-center text-center shadow-sm">
                  <div className="h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-[#0a382c] border border-emerald-100">
                    <Truck size={36} strokeWidth={1.75} />
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-4">No packages in this queue</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                    {navTab === 'pending'
                      ? 'No pending pick ups waiting at the hub.'
                      : navTab === 'picked_up'
                      ? 'No parcels currently in transit. Pick up pending orders to begin route.'
                      : 'Delivered orders will appear here once confirmed.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrderList.map(({ assignment, order, items, address, paymentSummary: pay }) => {
                    const isCurrentProcessing = isProcessing(assignment.id);
                    const isDelivered = assignment.status === 'delivered';

                    return (
                      <div
                        key={assignment.id}
                        className="bg-white border border-slate-200/80 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4 hover:border-emerald-200 transition-all"
                      >
                        {/* 1. Header Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center shadow-xs">
                              <Package size={20} strokeWidth={2.2} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight">{order.order_number}</p>
                              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                Assigned: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-black uppercase rounded-full px-3 py-1 tracking-wider inline-flex items-center gap-1.5 ${
                              isDelivered
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : assignment.status === 'out_for_delivery'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isDelivered ? 'bg-emerald-600' : assignment.status === 'out_for_delivery' ? 'bg-sky-600' : 'bg-emerald-600'
                              }`}
                            />
                            {assignment.status === 'ready_for_pickup' ? 'READY FOR PICKUP' : assignment.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* 2. Doorstep COD Collection Banner */}
                        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#0a4d3a] to-[#0e634b] text-white shadow-sm border border-emerald-600/30">
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                                <Wallet size={20} className="text-[#59D9B6]" />
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wider font-black text-white">
                                  {pay.isFullyPaid || isDelivered ? 'PAYMENT SETTLED' : 'COLLECT DOORSTEP CASH (COD)'}
                                </p>
                                <p className="text-[11px] text-emerald-200/90 font-medium mt-0.5">
                                  {pay.isFullyPaid || isDelivered
                                    ? 'Prepaid in Full — Do not collect cash'
                                    : 'Collect cash / UPI before handing over goods'}
                                </p>
                              </div>
                            </div>

                            <div className="bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 text-right shrink-0">
                              <p className="text-base font-black tracking-tight text-white">
                                {pay.isFullyPaid || isDelivered
                                  ? '₹0.00'
                                  : `₹${pay.amountToCollect.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 3. Package Contents Section */}
                        {items.length > 0 && (
                          <div className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <Package size={15} className="text-slate-500" />
                                Package Contents
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100/70 text-emerald-800 px-2.5 py-0.5 rounded-full">
                                {items.reduce((acc, it) => acc + (it.quantity || 1), 0)} Items
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-xs py-2">
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <div className="h-7 w-7 rounded-lg bg-emerald-50 text-[#0a382c] font-black text-[10px] flex items-center justify-center shrink-0 border border-emerald-200/50">
                                      ×{item.quantity}
                                    </div>
                                    <span className="text-slate-700 font-semibold truncate">
                                      {item.brand ? `${item.brand} ` : ''}{item.product_name}
                                    </span>
                                  </div>
                                  <span className="font-black text-slate-900 whitespace-nowrap">
                                    ₹{Number(item.line_total).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center text-xs font-black">
                              <span className="text-slate-600 flex items-center gap-1.5">
                                <Banknote size={14} className="text-emerald-700" /> Total Order Bill
                              </span>
                              <span className="text-emerald-800 text-sm font-black">
                                ₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 4. Customer Address & One-Tap Actions */}
                        {address && (
                          <div className="rounded-2xl bg-white border border-slate-200/90 p-4 space-y-3.5 shadow-xs">
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#0a382c] flex items-center justify-center shrink-0 border border-emerald-200/60 mt-0.5">
                                <MapPin size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-black text-slate-900 truncate">
                                    {address.label || 'Delivery'} · {address.recipient_name}
                                  </p>
                                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                                </div>
                                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
                                  {address.line1}
                                  {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} - {address.postal_code}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 pt-1">
                              <a
                                href={`tel:${address.phone}`}
                                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 text-emerald-900 text-xs font-black active:scale-[0.98] transition-all"
                              >
                                <PhoneCall size={15} className="text-emerald-700" />
                                Call
                              </a>
                              {address.latitude && address.longitude && (
                                <a
                                  href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-300/80 text-sky-900 text-xs font-black active:scale-[0.98] transition-all"
                                >
                                  <Navigation size={15} className="text-sky-700" />
                                  GPS Navigate
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 5. Slide to Confirm Button */}
                        <div className="pt-1">
                          {assignment.status === 'ready_for_pickup' && (
                            <SlideToConfirm
                              label="Slide to confirm pickup"
                              onConfirm={() =>
                                completeDelivery(
                                  assignment.id,
                                  order.order_number,
                                  'out_for_delivery'
                                )
                              }
                              isLoading={isCurrentProcessing}
                              disabled={isCurrentProcessing}
                            />
                          )}

                          {assignment.status === 'out_for_delivery' && (
                            <SlideToConfirm
                              label={
                                pay.amountToCollect > 0
                                  ? `Collect ₹${pay.amountToCollect.toFixed(0)} & slide to deliver`
                                  : 'Slide to confirm delivery'
                              }
                              onConfirm={() =>
                                completeDelivery(
                                  assignment.id,
                                  order.order_number,
                                  'delivered',
                                  pay.amountToCollect
                                )
                              }
                              isLoading={isCurrentProcessing}
                              disabled={isCurrentProcessing}
                            />
                          )}

                          {isDelivered && (
                            <div className="h-12 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black flex items-center justify-center gap-2 border border-emerald-200">
                              <CheckCircle2 size={18} className="text-emerald-600" />
                              Delivered & Settled Successfully
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DRIVER ACCOUNT */}
          {navTab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-[28px] p-5 shadow-sm flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center font-black text-2xl shadow-md shrink-0 border border-emerald-900">
                  {driverDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-slate-900 truncate">{driverDisplayName}</h2>
                    <span className="bg-emerald-100 text-emerald-900 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                      FLEET
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    {profile?.phone || user?.phone || 'No mobile linked'}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-[24px] p-4 shadow-sm space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Net Cash to Deposit</span>
                  <span className="font-black text-amber-700">₹{netCodCashToDeposit.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-semibold">Handed Over to Admin</span>
                  <span className="font-black text-emerald-700">₹{totalSettledWithAdmin.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-semibold">Total Completed Runs</span>
                  <span className="font-black text-emerald-600">{deliveredList.length}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => void logout({ scope: 'local' })}
                  className="w-full h-12 rounded-2xl bg-white hover:bg-red-50 text-red-600 font-black text-xs flex items-center justify-center gap-2 border border-red-200 shadow-xs active:scale-[0.98] transition-all"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] safe-bottom">
        <div className="max-w-xl mx-auto flex items-center justify-around h-16 px-2">
          <button
            onClick={() => setNavTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              navTab === 'dashboard' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard size={20} strokeWidth={navTab === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Dashboard</span>
            {navTab === 'dashboard' && <span className="h-1 w-6 rounded-full bg-[#0a382c] -mb-1" />}
          </button>

          <button
            onClick={() => setNavTab('pending')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              navTab === 'pending' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Clock size={20} strokeWidth={navTab === 'pending' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Pending</span>
            {pendingList.length > 0 && (
              <span className="absolute top-1.5 right-4 bg-amber-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                {pendingList.length}
              </span>
            )}
            {navTab === 'pending' && <span className="h-1 w-6 rounded-full bg-[#0a382c] -mb-1" />}
          </button>

          <button
            onClick={() => setNavTab('picked_up')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 relative transition-colors ${
              navTab === 'picked_up' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Truck size={20} strokeWidth={navTab === 'picked_up' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Picked Up</span>
            {pickedUpList.length > 0 && (
              <span className="absolute top-1.5 right-4 bg-sky-500 text-white text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center shadow-xs">
                {pickedUpList.length}
              </span>
            )}
            {navTab === 'picked_up' && <span className="h-1 w-6 rounded-full bg-[#0a382c] -mb-1" />}
          </button>

          <button
            onClick={() => setNavTab('delivered')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              navTab === 'delivered' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 size={20} strokeWidth={navTab === 'delivered' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Delivered</span>
            {navTab === 'delivered' && <span className="h-1 w-6 rounded-full bg-emerald-700 -mb-1" />}
          </button>

          <button
            onClick={() => setNavTab('account')}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              navTab === 'account' ? 'text-[#0a382c]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <User size={20} strokeWidth={navTab === 'account' ? 2.5 : 2} />
            <span className="text-[10px] font-black tracking-tight">Account</span>
            {navTab === 'account' && <span className="h-1 w-6 rounded-full bg-[#0a382c] -mb-1" />}
          </button>
        </div>
      </nav>

      <StaffRegistrationModal isOpen={isStaffUnregistered} />
    </div>
  );
}
