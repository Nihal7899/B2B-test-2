import { supabase } from '@/lib/supabase';
import type { Wallet, WalletTransaction } from '@/types';

export async function fetchWallet(): Promise<Wallet | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }

  if (!data) {
    const { data: newWallet } = await supabase
      .from('wallets')
      .insert({ user_id: user.id, balance: 0 })
      .select()
      .single();
    return newWallet as Wallet;
  }

  return data as Wallet;
}

export async function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wallet transactions:', error);
    return [];
  }
  return data as WalletTransaction[];
}

export async function topupWalletRpc(amount: number, referenceId: string, description: string) {
  const { data, error } = await supabase.rpc('topup_wallet', {
    p_amount: amount,
    p_reference_id: referenceId,
    p_description: description,
  });
  if (error) throw error;
  return data;
}

export async function payWithWalletRpc(orderId: string, amount: number) {
  const { data, error } = await supabase.rpc('pay_with_wallet', {
    p_order_id: orderId,
    p_amount: amount,
  });
  if (error) throw error;
  return data;
}

export async function refundWalletRpc(orderId: string, reason = 'Order cancelled') {
  const { data, error } = await supabase.rpc('refund_wallet_payment', {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
}
