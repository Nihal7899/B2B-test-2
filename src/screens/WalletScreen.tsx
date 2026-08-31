import { useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, 
  Plus, RefreshCw, ShieldCheck, History, AlertCircle, CheckCircle2, Loader2, CreditCard, Sparkles 
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Checkout } from 'capacitor-razorpay';
import { supabase } from '@/lib/supabase';
import { fetchWallet, fetchWalletTransactions } from '@/services/wallet';
import type { Wallet, WalletTransaction } from '@/types';

interface WalletScreenProps {
  onBack: () => void;
}

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000];

export function WalletScreen({ onBack }: WalletScreenProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  const isNative = Capacitor.isNativePlatform();

  const loadData = useCallback(async () => {
    const [w, txs] = await Promise.all([fetchWallet(), fetchWalletTransactions()]);
    setWallet(w);
    setTransactions(txs);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const handleTopup = async () => {
    const amt = Number(topupAmount);
    if (!amt || amt <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid top-up amount' });
      return;
    }
    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const { data: payData, error: payErr } = await supabase.functions.invoke('razorpay', {
        body: { action: 'create_order', amount: amt, purpose: 'wallet_topup' },
      });

      if (payErr || !payData?.razorpay_order_id) {
        throw new Error('Failed to initialize payment gateway');
      }

      const options = {
        key: payData.key_id,
        amount: Math.round(amt * 100),
        currency: 'INR',
        order_id: payData.razorpay_order_id,
        name: 'Stackknit B2B Wallet',
        description: `Wallet Top-up ₹${amt}`,
        theme: { color: '#065f46' },
      };

      const verifyTopup = async (paymentId: string, signature: string) => {
        const { data: verifyData, error: verifyErr } = await supabase.functions.invoke('razorpay', {
          body: {
            action: 'verify_payment',
            payment_id: paymentId,
            signature: signature,
            razorpay_order_id: payData.razorpay_order_id,
          },
        });

        if (verifyErr || !verifyData?.verified) {
          throw new Error('Top-up verification failed');
        }

        setTopupAmount('');
        setStatusMessage({
          type: 'success',
          text: `Successfully added ₹${amt.toLocaleString('en-IN')} to your B2B Wallet!`,
        });
        void loadData();
      };

      if (isNative) {
        const response: any = await Checkout.open(options);
        const paymentId = response?.razorpay_payment_id || response?.payment_id;
        const signature = response?.razorpay_signature || response?.signature;
        if (paymentId && signature) {
          await verifyTopup(paymentId, signature);
        } else {
          throw new Error('Payment was cancelled');
        }
      } else {
        const rzp = new (window as any).Razorpay({
          ...options,
          handler: async (res: { razorpay_payment_id: string; razorpay_signature: string }) => {
            await verifyTopup(res.razorpay_payment_id, res.razorpay_signature);
          },
        });
        rzp.open();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Top-up failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => filter === 'all' || tx.type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="safe-top px-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-700 active:scale-95 transition-transform">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">B2B Wallet</h1>
            <p className="text-xs text-ink-500">Fast checkout & split settlement</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600">
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-brand-600' : ''} />
        </button>
      </div>

      <section className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-5 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between h-44">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-500/30 backdrop-blur-md flex items-center justify-center border border-brand-400/30">
                <WalletIcon size={18} className="text-brand-300" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-200">Prepaid Commercial Account</span>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={10} /> ACTIVE
            </span>
          </div>

          <div>
            <p className="text-[11px] text-brand-300 font-medium">Available Balance</p>
            <p className="text-3xl font-black tracking-tight mt-0.5">
              ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-brand-800/60 text-[11px] text-brand-300">
            <span>Instant 1-Click Checkout</span>
            <div className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span className="text-white font-semibold">Ledger Secured</span>
            </div>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 h-44 w-44 rounded-full bg-brand-700/40 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-xl pointer-events-none" />
      </section>

      {statusMessage && (
        <div className={`p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-red-500 shrink-0" />}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
        <h2 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
          <Plus size={16} className="text-brand-600" /> Quick Add Funds
        </h2>

        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setTopupAmount(amt.toString())}
              className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                topupAmount === amt.toString() ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' : 'border-ink-200 bg-ink-50 text-ink-700 hover:bg-ink-100'
              }`}
            >
              +₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-sm font-bold text-ink-400">₹</span>
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full h-10 pl-7 pr-3 rounded-xl border border-ink-200 text-sm font-semibold outline-none focus:border-brand-500"
            />
          </div>
          <button
            onClick={handleTopup}
            disabled={isProcessing || !topupAmount}
            className="h-10 px-5 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft hover:bg-brand-700 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 size={15} className="animate-spin" /> : <><CreditCard size={15} /> Recharge</>}
          </button>
        </div>
      </section>

      <section className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-ink-600" />
            <h2 className="text-sm font-bold text-ink-900">Transaction History</h2>
          </div>
          <div className="flex gap-1 bg-ink-100 p-0.5 rounded-lg text-[10px] font-bold">
            {(['all', 'credit', 'debit'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-2 py-0.5 rounded-md capitalize transition-colors ${
                  filter === t ? 'bg-white text-ink-900 shadow-xs' : 'text-ink-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <WalletIcon size={28} className="mx-auto text-ink-300 mb-2" />
            <p className="text-xs font-semibold text-ink-600">No transactions recorded</p>
            <p className="text-[10px] text-ink-400 mt-0.5">Top-up your balance or pay for orders to view history</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100 max-h-80 overflow-y-auto pr-1">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-800 capitalize truncate max-w-[180px]">
                        {tx.description || tx.purpose.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-ink-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-extrabold ${isCredit ? 'text-emerald-600' : 'text-ink-900'}`}>
                      {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-ink-400 font-medium">Bal: ₹{tx.balance_after.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
