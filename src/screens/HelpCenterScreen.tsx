import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Loader2,
  MessageCircle,
  Phone,
  Search,
  Package,
  Truck,
  CreditCard,
  Building2,
  Sparkles,
  Headphones,
  ShieldQuestion,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  MapPin,
  XCircle,
  Receipt,
  Wallet,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  CircleDot,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchActiveFaqs, type Faq } from '@/services/catalog';

/* ─────────────────────────  meta  ───────────────────────── */

const CATEGORY_META: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  order_action: {
    label: 'Order Support',
    icon: Zap,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  orders: {
    label: 'Orders & Returns',
    icon: Package,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  delivery: {
    label: 'Delivery',
    icon: Truck,
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  payments: {
    label: 'Payments & Refunds',
    icon: CreditCard,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  business: {
    label: 'Business & GST',
    icon: Building2,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  general: {
    label: 'General',
    icon: Sparkles,
    color: 'text-brand-700',
    bg: 'bg-brand-50',
    border: 'border-brand-200',
  },
  account: {
    label: 'Account',
    icon: HelpCircle,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
};

const CATEGORY_ORDER = [
  'order_action',
  'orders',
  'delivery',
  'payments',
  'business',
  'account',
  'general',
];

/* ─────────────────────────  helpers  ───────────────────────── */

function isSupportOnline(): boolean {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + 5 * 60 + 30) % (24 * 60);
  const hour = Math.floor(istMinutes / 60);
  return hour >= 9 && hour < 21;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
}

/* ─────────────────────────  screen  ───────────────────────── */

export default function HelpCenterScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialOrderId = params.get('orderId') || '';
  const initialOrderNumber = params.get('orderNumber') || '';

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialOrderNumber ? 'order_action' : null,
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  // Order context
  const [attachedOrderId, setAttachedOrderId] = useState(initialOrderId);
  const [attachedOrderNumber, setAttachedOrderNumber] = useState(initialOrderNumber);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  // Problem form
  const [problem, setProblem] = useState('');
  const [copied, setCopied] = useState(false);

  const fromOrder = Boolean(attachedOrderId || attachedOrderNumber);
  const online = isSupportOnline();

  /* ── load faqs + settings ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [faqData, settingsRes] = await Promise.all([
          fetchActiveFaqs(),
          supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['support_phone', 'support_whatsapp']),
        ]);
        if (cancelled) return;
        setFaqs(faqData);
        settingsRes.data?.forEach((row: any) => {
          if (row.key === 'support_phone' && row.value?.number)
            setPhoneNumber(String(row.value.number));
          if (row.key === 'support_whatsapp' && row.value?.number)
            setWhatsappNumber(String(row.value.number));
        });
      } catch (e) {
        console.warn('Help center load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── load recent orders (only when no order attached) ── */
  useEffect(() => {
    if (initialOrderId || initialOrderNumber) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, status, total')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setRecentOrders(data as RecentOrder[]);
    })();
  }, [initialOrderId, initialOrderNumber]);

  /* ── visible + grouped faqs ── */
  const visibleFaqs = useMemo(() => {
    return faqs.filter((f) => {
      if (f.category === 'order_action' && !fromOrder) return false;
      if (activeCategory && f.category !== activeCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    });
  }, [faqs, search, fromOrder, activeCategory]);

  const grouped = useMemo(() => {
    const map: Record<string, Faq[]> = {};
    visibleFaqs.forEach((f) => {
      if (!map[f.category]) map[f.category] = [];
      map[f.category].push(f);
    });
    return map;
  }, [visibleFaqs]);

  const orderedCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => grouped[c]?.length),
    [grouped],
  );

  const availableCategories = useMemo(() => {
    const present = new Set(faqs.map((f) => f.category));
    if (!fromOrder) present.delete('order_action');
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [faqs, fromOrder]);

  /* ── message builder ── */
  const buildMessage = () => {
    const lines: string[] = [];
    lines.push('Hi Support Team 👋');
    if (attachedOrderNumber) {
      lines.push('');
      lines.push(`📦 *Order:* ${attachedOrderNumber}`);
    }
    if (problem.trim()) {
      lines.push('');
      lines.push('📝 *Issue:*');
      lines.push(problem.trim());
    }
    if (!attachedOrderNumber && !problem.trim()) {
      lines.push('');
      lines.push('I need help with the following:');
    }
    lines.push('');
    lines.push('Please assist. Thank you!');
    return lines.join('\n');
  };

  const handleWhatsApp = () => {
    if (!whatsappNumber) return;
    const digits = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    if (!phoneNumber) return;
    window.location.href = `tel:${phoneNumber.replace(/\s/g, '')}`;
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(buildMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  /* ── faq feedback ── */
  const submitFeedback = async (faqId: string, helpful: boolean) => {
    setFeedbackGiven((p) => ({ ...p, [faqId]: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('faq_feedback').insert({
        faq_id: faqId,
        user_id: user?.id ?? null,
        helpful,
      });
    } catch (e) {
      console.warn('FAQ feedback failed', e);
    }
  };

  /* ── quick actions ── */
  interface QuickAction {
    id: string;
    label: string;
    subtitle: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    action: () => void;
  }

  const quickActions: QuickAction[] = useMemo(() => {
    const acts: QuickAction[] = [];

    if (fromOrder) {
      acts.push(
        {
          id: 'cancel',
          label: 'Cancel order',
          subtitle: 'Stop before dispatch',
          icon: XCircle,
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
          action: () => {
            setProblem('I would like to cancel this order.');
            setTimeout(() => document.getElementById('help-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
          },
        },
        {
          id: 'address',
          label: 'Change address',
          subtitle: 'Update delivery location',
          icon: MapPin,
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          action: () => {
            setProblem('I need to change the delivery address for this order.');
            setTimeout(() => document.getElementById('help-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
          },
        },
        {
          id: 'delay',
          label: 'Delivery delay',
          subtitle: 'Report a late delivery',
          icon: Truck,
          color: 'text-sky-700',
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          action: () => {
            setProblem('My delivery is delayed. Please check the status.');
            setTimeout(() => document.getElementById('help-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
          },
        },
      );
    } else {
      acts.push(
        {
          id: 'track',
          label: 'Track order',
          subtitle: 'View live status',
          icon: Truck,
          color: 'text-sky-700',
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          action: () => navigate('/orders'),
        },
        {
          id: 'invoice',
          label: 'GST invoice',
          subtitle: 'Download bill',
          icon: Receipt,
          color: 'text-indigo-700',
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          action: () => navigate('/orders'),
        },
        {
          id: 'wallet',
          label: 'Wallet help',
          subtitle: 'Balance & refunds',
          icon: Wallet,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          action: () => navigate('/wallet'),
        },
      );
    }

    return acts;
  }, [fromOrder, navigate]);

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-brand-600" />
      </div>
    );
  }

  const hasContact = Boolean(phoneNumber || whatsappNumber);

  return (
    <div className="safe-top pt-1 px-4 pb-10 space-y-4 max-w-lg mx-auto">
      {/* ─── Header ───────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center shadow-xs active:scale-95 transition shrink-0 mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Help Center</h1>
          <p className="text-xs text-ink-500 mt-0.5">
            Answers, guidance & support — all in one place
          </p>
        </div>
      </div>

      {/* ─── Hero + Live Status ───────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-5 text-white shadow-lg shadow-brand-900/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-brand-500/25 backdrop-blur-md flex items-center justify-center border border-brand-400/30 shrink-0">
              <Headphones size={20} className="text-brand-100" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">How can we help you today?</p>
              <p className="text-[11px] text-brand-200 mt-0.5 leading-relaxed">
                Browse answers or start a chat with our support team
              </p>
            </div>
          </div>

          {/* Status row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                online
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                  : 'bg-white/10 border-white/20 text-white/80'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  online ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'
                }`}
              />
              {online ? 'Support online now' : 'Support offline'}
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-white/90">
              <Clock size={10} />
              Avg reply · under 10 min
            </div>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-brand-500/25 blur-2xl pointer-events-none" />
      </div>

      {/* ─── Search ───────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs — e.g., refund, GST, cancel..."
          className="w-full h-12 pl-10 pr-10 rounded-2xl bg-white border border-ink-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50 shadow-xs"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center"
          >
            <X size={13} className="text-ink-600" />
          </button>
        )}
      </div>

      {/* ─── Order context banner ─────────────────── */}
      {fromOrder && attachedOrderNumber && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Package size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Regarding your order
            </p>
            <p className="text-sm font-bold text-amber-900 mt-0.5 truncate">
              {attachedOrderNumber}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              This order number will be included in your chat automatically.
            </p>
          </div>
          <button
            onClick={() => {
              setAttachedOrderId('');
              setAttachedOrderNumber('');
            }}
            className="h-7 w-7 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-amber-700 hover:bg-amber-100"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ─── Quick actions ────────────────────────── */}
      {quickActions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider px-1">
            {fromOrder ? 'Common order actions' : 'Quick actions'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.id}
                  onClick={qa.action}
                  className={`text-left rounded-2xl border bg-white p-3 hover:shadow-md active:scale-[0.97] transition ${qa.border}`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl ${qa.bg} ${qa.color} flex items-center justify-center border ${qa.border}`}
                  >
                    <Icon size={15} />
                  </div>
                  <p className="text-[11px] font-black text-ink-900 mt-2 leading-tight">
                    {qa.label}
                  </p>
                  <p className="text-[10px] text-ink-400 mt-0.5 leading-tight">
                    {qa.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Category pills ───────────────────────── */}
      {availableCategories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 h-8 px-3 rounded-full text-[11px] font-black border transition ${
              activeCategory === null
                ? 'bg-ink-900 text-white border-ink-900'
                : 'bg-white text-ink-600 border-ink-200 hover:bg-ink-50'
            }`}
          >
            All topics
          </button>
          {availableCategories.map((cat) => {
            const meta = CATEGORY_META[cat] ?? CATEGORY_META.general;
            const Icon = meta.icon;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 h-8 pl-2 pr-3 rounded-full text-[11px] font-black border flex items-center gap-1.5 transition ${
                  active
                    ? `${meta.bg} ${meta.color} ${meta.border}`
                    : 'bg-white text-ink-600 border-ink-200 hover:bg-ink-50'
                }`}
              >
                <Icon size={12} />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── FAQ list ─────────────────────────────── */}
      {orderedCategories.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white border border-ink-100">
          <ShieldQuestion size={28} className="mx-auto text-ink-300 mb-2" />
          <p className="text-sm font-bold text-ink-700">No matching FAQs</p>
          <p className="text-xs text-ink-400 mt-1">
            Try a different search, or contact us below.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedCategories.map((cat) => {
            const meta = CATEGORY_META[cat] ?? CATEGORY_META.general;
            const Icon = meta.icon;
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div
                    className={`h-6 w-6 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center`}
                  >
                    <Icon size={12} className={meta.color} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
                    {meta.label}
                  </p>
                </div>
                <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden divide-y divide-ink-100">
                  {grouped[cat].map((f) => {
                    const open = openId === f.id;
                    const feedback = feedbackGiven[f.id];
                    return (
                      <div key={f.id}>
                        <button
                          onClick={() => setOpenId(open ? null : f.id)}
                          className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-ink-50/60 transition"
                        >
                          <p className="flex-1 text-sm font-bold text-ink-900 leading-snug pr-2">
                            {f.question}
                          </p>
                          <ChevronDown
                            size={16}
                            className={`shrink-0 mt-0.5 transition-transform ${
                              open ? 'rotate-180 text-brand-600' : 'text-ink-400'
                            }`}
                          />
                        </button>

                        {open && (
                          <div className="px-4 pb-4">
                            <p className="text-[13px] text-ink-600 leading-relaxed whitespace-pre-line">
                              {f.answer}
                            </p>

                            {/* Helpful feedback */}
                            <div className="mt-4 pt-3 border-t border-dashed border-ink-100 flex items-center justify-between gap-3">
                              {feedback ? (
                                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                                  <CheckCircle2 size={13} /> Thanks for your feedback
                                </p>
                              ) : (
                                <>
                                  <p className="text-[11px] font-bold text-ink-500">
                                    Was this helpful?
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => submitFeedback(f.id, true)}
                                      className="h-7 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 text-[11px] font-bold"
                                    >
                                      <ThumbsUp size={11} /> Yes
                                    </button>
                                    <button
                                      onClick={() => submitFeedback(f.id, false)}
                                      className="h-7 px-2.5 rounded-lg bg-ink-50 border border-ink-200 text-ink-600 hover:bg-ink-100 flex items-center gap-1 text-[11px] font-bold"
                                    >
                                      <ThumbsDown size={11} /> No
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Recent orders picker (when no order) ── */}
      {!fromOrder && recentOrders.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider px-1">
            Attach an order (optional)
          </p>
          <div className="space-y-1.5">
            {recentOrders.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setAttachedOrderId(o.id);
                  setAttachedOrderNumber(o.order_number);
                  setActiveCategory('order_action');
                }}
                className="w-full bg-white border border-ink-100 hover:border-brand-200 rounded-2xl p-3 flex items-center gap-3 text-left transition"
              >
                <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 shrink-0">
                  <Package size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-ink-900 truncate">
                    {o.order_number}
                  </p>
                  <p className="text-[10px] text-ink-400 capitalize mt-0.5">
                    {o.status.replace(/_/g, ' ')} · ₹{Number(o.total).toFixed(0)}
                  </p>
                </div>
                <ChevronRight size={15} className="text-ink-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Still need help ──────────────────────── */}
      <div id="help-form" className="space-y-2 scroll-mt-4">
        <p className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider px-1">
          Still need help?
        </p>
        <div className="rounded-3xl bg-white border border-ink-100 shadow-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 shrink-0">
              <MessageCircle size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-ink-900">Describe your issue</p>
              <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">
                We'll pre-fill it in WhatsApp so you don't have to type twice. Or call us directly
                if you prefer.
              </p>
            </div>
          </div>

          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={4}
            placeholder={
              fromOrder
                ? 'E.g., I want to cancel this order / change my delivery address...'
                : 'Type your question or issue here...'
            }
            className="w-full rounded-2xl border border-ink-200 px-3.5 py-3 text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50 resize-none"
          />

          {/* Message preview */}
          {(problem.trim() || attachedOrderNumber) && (
            <div className="rounded-2xl bg-ink-50 border border-ink-100 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                  <CircleDot size={9} className="text-emerald-500" />
                  Preview of your message
                </p>
                <button
                  onClick={handleCopyMessage}
                  className="text-[10px] font-black uppercase tracking-wider text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check size={11} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={11} /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] text-ink-700 leading-relaxed whitespace-pre-wrap font-sans">
                {buildMessage()}
              </pre>
            </div>
          )}

          {!hasContact ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
              Support contact is not configured yet. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {whatsappNumber && (
                <button
                  onClick={handleWhatsApp}
                  className="h-12 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-[0.99] transition"
                >
                  <MessageCircle size={17} />
                  {fromOrder ? 'Chat about this order' : 'Chat on WhatsApp'}
                </button>
              )}
              {phoneNumber && (
                <button
                  onClick={handleCall}
                  className="h-12 rounded-2xl bg-white border border-ink-200 hover:bg-ink-50 text-ink-800 text-sm font-black flex items-center justify-center gap-2 active:scale-[0.99] transition"
                >
                  <Phone size={16} className="text-brand-600" />
                  Call {phoneNumber}
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-ink-400 text-center">
            Typical response time · <span className="font-black text-ink-600">under 10 minutes</span>{' '}
            during support hours
          </p>
        </div>
      </div>

      {/* ─── Support info footer ──────────────────── */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          Support hours
        </p>
        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-800">
          <Clock size={13} className="text-slate-500" />
          Monday – Sunday · 9:00 AM to 9:00 PM IST
        </div>
        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-800">
          <MessageCircle size={13} className="text-green-600" />
          WhatsApp replies may arrive outside these hours
        </div>
        {!online && (
          <div className="flex items-start gap-2 pt-2 border-t border-slate-200 mt-2">
            <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Support is currently offline. You can still send a message — we'll reply first thing
              when we're back.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}