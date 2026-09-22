import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchActiveFaqs, type Faq } from '@/services/catalog';

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  order_action: { label: 'Order Support', icon: Package, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  orders: { label: 'Orders & Returns', icon: Package, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  delivery: { label: 'Delivery', icon: Truck, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
  payments: { label: 'Payments & Refunds', icon: CreditCard, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  business: { label: 'Business & GST', icon: Building2, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  general: { label: 'General', icon: Sparkles, color: 'text-brand-700', bg: 'bg-brand-50 border-brand-200' },
  account: { label: 'Account', icon: HelpCircle, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

const CATEGORY_ORDER = ['order_action', 'orders', 'delivery', 'payments', 'business', 'account', 'general'];

export default function HelpCenterScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId') || '';
  const orderNumber = params.get('orderNumber') || '';
  const fromOrder = Boolean(orderId || orderNumber);

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [problem, setProblem] = useState('');

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
          if (row.key === 'support_phone' && row.value?.number) {
            setPhoneNumber(String(row.value.number));
          }
          if (row.key === 'support_whatsapp' && row.value?.number) {
            setWhatsappNumber(String(row.value.number));
          }
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

  const visibleFaqs = useMemo(() => {
    return faqs.filter((f) => {
      if (f.category === 'order_action' && !fromOrder) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    });
  }, [faqs, search, fromOrder]);

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
    [grouped]
  );

  const buildMessage = () => {
    const lines: string[] = [];
    if (orderNumber) {
      lines.push(`Hi, I need help with my order ${orderNumber}.`);
    } else {
      lines.push(`Hi, I need help.`);
    }
    if (problem.trim()) {
      lines.push('');
      lines.push(`Problem: ${problem.trim()}`);
    }
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

  const hasContact = Boolean(phoneNumber || whatsappNumber);
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="safe-top pt-1 px-4 pb-8 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center shadow-xs active:scale-95 transition shrink-0 mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Help Center</h1>
          <p className="text-xs text-ink-500 mt-0.5">Find answers or reach out to our support team</p>
        </div>
      </div>

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-5 text-white shadow-lg shadow-brand-900/10 relative overflow-hidden">
        <div className="relative z-10 flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-brand-500/25 backdrop-blur-md flex items-center justify-center border border-brand-400/30 shrink-0">
            <Headphones size={20} className="text-brand-100" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black">How can we help you today?</p>
            <p className="text-[11px] text-brand-200 mt-1 leading-relaxed">
              Browse common questions below, or reach us directly on WhatsApp or call.
            </p>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-brand-500/25 blur-2xl pointer-events-none" />
      </div>

      {/* Order context banner */}
      {fromOrder && orderNumber && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Package size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Regarding Order
            </p>
            <p className="text-sm font-bold text-amber-900 mt-0.5 truncate">{orderNumber}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              This order number will be included in your chat.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full h-11 pl-10 pr-3 rounded-xl bg-white border border-ink-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
        />
      </div>

      {/* FAQ groups */}
      {orderedCategories.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white border border-ink-100">
          <ShieldQuestion size={28} className="mx-auto text-ink-300 mb-2" />
          <p className="text-sm font-bold text-ink-700">No matching FAQs</p>
          <p className="text-xs text-ink-400 mt-1">Try a different search, or contact us below.</p>
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
                    className={`h-6 w-6 rounded-lg ${meta.bg} border flex items-center justify-center`}
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
                    return (
                      <div key={f.id}>
                        <button
                          onClick={() => toggle(f.id)}
                          className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-ink-50 transition"
                        >
                          <p className="flex-1 text-sm font-bold text-ink-900 leading-snug pr-2">
                            {f.question}
                          </p>
                          <ChevronDown
                            size={16}
                            className={`shrink-0 mt-0.5 text-ink-400 transition-transform ${
                              open ? 'rotate-180 text-brand-600' : ''
                            }`}
                          />
                        </button>
                        {open && (
                          <div className="px-4 pb-4 -mt-1">
                            <p className="text-[13px] text-ink-600 leading-relaxed whitespace-pre-line">
                              {f.answer}
                            </p>
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

      {/* Still need help */}
      <div className="rounded-3xl bg-white border border-ink-100 shadow-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 shrink-0">
            <MessageCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-ink-900">Still need help?</p>
            <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">
              Describe your problem below — we'll pre-fill it in WhatsApp for you, or you can call
              us directly.
            </p>
          </div>
        </div>

        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          rows={4}
          placeholder={
            fromOrder
              ? 'E.g., I want to cancel this order / change delivery address...'
              : 'Describe your issue...'
          }
          className="w-full rounded-xl border border-ink-200 px-3.5 py-3 text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50 resize-none"
        />

        {!hasContact ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
            Support contact is not set up yet. Please try again later.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {whatsappNumber && (
              <button
                onClick={handleWhatsApp}
                className="h-12 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-[0.99] transition"
              >
                <MessageCircle size={17} />
                Chat on WhatsApp
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
      </div>
    </div>
  );
}