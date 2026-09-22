import { useEffect, useState, useCallback } from 'react';
import {
  Wallet as WalletIcon,
  Package,
  MapPin,
  Heart,
  Shield,
  Truck,
  Warehouse,
  LogOut,
  ChevronRight,
  Phone,
  Building2,
  RefreshCw,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/auth';
import { fetchWallet } from '@/services/wallet';
import type { Wallet, ScreenName } from '@/types';

interface AccountScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export function AccountScreen({ onNavigate }: AccountScreenProps) {
  const { user, profile, role, signOut } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWalletData = useCallback(async () => {
    try {
      const data = await fetchWallet();
      setWallet(data);
    } catch (err) {
      console.error('Failed to fetch wallet in AccountScreen:', err);
    } finally {
      setWalletLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWalletData();
  }, [loadWalletData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadWalletData();
  };

  const displayName =
    profile?.full_name?.trim() ||
    profile?.personal_name?.trim() ||
    profile?.business_name?.trim() ||
    'Valued Merchant';

  const isStaff = role === 'admin' || role === 'warehouse_manager' || role === 'delivery_partner';

  return (
    <div className="safe-top px-4 pb-12 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Account & Settings</h1>
          <p className="text-xs text-ink-500 mt-0.5">Manage your profile & business preferences</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center text-ink-600 shadow-xs active:scale-95 transition-transform"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-brand-600' : ''} />
        </button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white border border-ink-100 rounded-3xl p-4 shadow-card flex items-center gap-3.5">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black text-ink-900 truncate">{displayName}</h2>
            {profile?.registration_status === 'registered' && (
              <BadgeCheck size={16} className="text-brand-600 shrink-0" />
            )}
          </div>
          {profile?.business_name && profile.business_name !== displayName && (
            <p className="text-xs font-semibold text-ink-600 flex items-center gap-1 mt-0.5 truncate">
              <Building2 size={13} className="text-ink-400 shrink-0" />
              {profile.business_name}
            </p>
          )}
          <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
            <Phone size={12} className="shrink-0" />
            {profile?.phone || user?.phone || user?.email || 'No contact linked'}
          </p>
        </div>
      </div>

      {/* B2B Prepaid Wallet Preview Card */}
      <div
        onClick={() => onNavigate('wallet')}
        className="rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-4 text-white shadow-lg cursor-pointer active:scale-[0.99] transition-transform relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-brand-500/30 backdrop-blur-md flex items-center justify-center border border-brand-400/30">
                <WalletIcon size={14} className="text-brand-300" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200">B2B Commercial Wallet</span>
            </div>
            <div className="pt-1">
              <p className="text-[10px] text-brand-300">Available Balance</p>
              <p className="text-2xl font-black tracking-tight mt-0.5">
                {walletLoading
                  ? 'Loading...'
                  : `₹${(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs font-bold text-white border border-white/10 backdrop-blur-xs transition">
            <span>Manage</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-brand-700/40 blur-xl pointer-events-none" />
      </div>

      {/* Strict Role-Based Management Consoles */}
      {isStaff && (
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider px-1">Management Portal</p>
          <div className="bg-white border border-ink-100 rounded-2xl divide-y divide-ink-50 shadow-card overflow-hidden">
            {role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-900">Admin Control Center</p>
                    <p className="text-[10px] text-ink-400">System settings, catalog & platform controls</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-400" />
              </button>
            )}

            {role === 'warehouse_manager' && (
              <button
                onClick={() => onNavigate('warehouse')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Warehouse size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-900">Warehouse Panel</p>
                    <p className="text-[10px] text-ink-400">Inventory deduction, stock & dispatch</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-400" />
              </button>
            )}

            {role === 'delivery_partner' && (
              <button
                onClick={() => onNavigate('delivery')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-900">Delivery Panel</p>
                    <p className="text-[10px] text-ink-400">Assigned dispatches & cash settlement</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Orders & Details Navigation */}
      <div className="space-y-2">
        <p className="text-[11px] font-extrabold text-ink-400 uppercase tracking-wider px-1">Orders & Details</p>
        <div className="bg-white border border-ink-100 rounded-2xl divide-y divide-ink-50 shadow-card overflow-hidden">
          <button
            onClick={() => onNavigate('orders')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink-900">Order History</p>
                <p className="text-[10px] text-ink-400">Track shipments & view invoices</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-400" />
          </button>

          <button
            onClick={() => onNavigate('addresses')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink-900">Delivery Addresses</p>
                <p className="text-[10px] text-ink-400">Manage business outlet locations</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-400" />
          </button>

          <button
            onClick={() => onNavigate('wishlist')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink-900">Saved Wishlist</p>
                <p className="text-[10px] text-ink-400">Favorite products & recurring restocks</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-400" />
          </button>

          <button
            onClick={() => onNavigate('businessRegistration')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-ink-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-ink-900">Business Profile</p>
                <p className="text-[10px] text-ink-400">GSTIN verification & company details</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-ink-400" />
          </button>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={() => void signOut()}
        className="w-full h-12 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 border border-red-200 shadow-xs active:scale-[0.99] transition"
      >
        <LogOut size={16} />
        Sign Out from Account
      </button>
    </div>
  );
}
