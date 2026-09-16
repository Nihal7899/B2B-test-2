import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Tag, 
  Store, 
  Award, 
  LayoutGrid, 
  Package, 
  Percent, 
  Gift, 
  Truck, 
  MapPin, 
  Users, 
  FileText, 
  Settings, 
  Bell,
  BarChart2,
  PenTool,
  MessageSquare,
  Banknote,
  BookOpen,
  CreditCard
} from 'lucide-react';
import { PushNotificationSender } from '@/components/Admin/PushNotificationSender';
import InvoiceSettings from '@/components/InvoiceSettings';
import AdminInvoices from '@/components/AdminInvoices';
import WhatsAppCampaignManager from '@/components/Admin/WhatsAppCampaignManager';

import Dashboard from '@/components/Admin/Dashboard';
import BannersManager from '@/components/Admin/BannersManager';
import StoresManager from '@/components/Admin/StoresManager';
import StoreConfigManager from '@/components/Admin/StoreConfigManager';
import BrandConfigManager from '@/components/Admin/BrandConfigManager';
import BrandsManager from '@/components/Admin/BrandsManager';
import CategoriesManager from '@/components/Admin/CategoriesManager';
import ProductsManager from '@/components/Admin/ProductsManager';
import VolumePricingManager from '@/components/Admin/VolumePricingManager';
import PromoCodesManager from '@/components/Admin/PromoCodesManager';
import DeliverySettingsManager from '@/components/Admin/DeliverySettingsManager';
import SmartCollectionsManager from '@/components/Admin/SmartCollectionsManager';
import RolesManager from '@/components/Admin/RolesManager';
import DeliveryRangesManager from '@/components/Admin/DeliveryRangesManager';
import Reports from '@/components/Admin/Reports';
import SubcategoriesManager from '@/components/Admin/SubcategoriesManager';
import CompressionSettings from '@/components/Admin/CompressionSettings';
import SectionsManager from '@/components/Admin/SectionsManager';
import CodSettlementManager from '@/components/Admin/CodSettlementManager';
import SynonymsManager from '@/components/Admin/SynonymsManager';
import RefundManager from '@/components/Admin/RefundManager';

interface AdminScreenProps {
  onBack: () => void;
}

type Tab =
  | 'dashboard'
  | 'homeSections'
  | 'banners'
  | 'stores'
  | 'storeContent'
  | 'brandContent'
  | 'brands'
  | 'categories'
  | 'subcategories'
  | 'products'
  | 'volumepricing'
  | 'promocodes'
  | 'deliverysettings'
  | 'smartcollections'
  | 'roles'
  | 'codSettlement'
  | 'invoices'
  | 'invoiceSettings'
  | 'deliveryRanges'
  | 'push'
  | 'whatsapp'
  | 'reports'
  | 'compression'
  | 'synonyms'
  | 'refunds';

export function AdminScreen({ onBack }: AdminScreenProps) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [criticalRefundsCount, setCriticalRefundsCount] = useState(0);

  useEffect(() => {
    const fetchRefundsCount = async () => {
      try {
        const { data: cancelledOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('status', 'cancelled');

        if (!cancelledOrders?.length) return;

        const orderIds = cancelledOrders.map(o => o.id);
        const { data: payments } = await supabase
          .from('payments')
          .select('order_id, provider, status')
          .in('order_id', orderIds);

        if (!payments) return;

        let count = 0;
        const processed = new Set();

        payments.forEach(p => {
          if (processed.has(p.order_id)) return;
          const status = (p.status || '').toLowerCase();
          const provider = (p.provider || '').toLowerCase();

          if (status === 'refund_failed' || (provider === 'razorpay' && (status === 'paid' || status === 'completed'))) {
            count++;
            processed.add(p.order_id);
          }
        });
        setCriticalRefundsCount(count);
      } catch (err) {
        console.error("Failed to fetch refund notifications", err);
      }
    };

    fetchRefundsCount();
    const interval = setInterval(fetchRefundsCount, 30000); 
    return () => clearInterval(interval);
  }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'homeSections', label: 'Home Sections', icon: LayoutGrid },
    { id: 'banners', label: 'Banners', icon: Tag },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'storeContent', label: 'Store Content', icon: PenTool },
    { id: 'brands', label: 'Brands', icon: Award },
    { id: 'brandContent', label: 'Brand Content', icon: PenTool },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'subcategories', label: 'Subcategories', icon: LayoutGrid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'volumepricing', label: 'Volume Pricing', icon: Percent },
    { id: 'promocodes', label: 'Promo Codes', icon: Gift },
    { id: 'deliverysettings', label: 'Delivery Settings', icon: Truck },
    { id: 'codSettlement', label: 'COD Settlement', icon: Banknote },
    { id: 'smartcollections', label: 'Smart Collections', icon: LayoutGrid },
    { id: 'roles', label: 'Roles', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'invoiceSettings', label: 'Invoice Settings', icon: Settings },
    { id: 'deliveryRanges', label: 'Delivery Ranges', icon: MapPin },
    { id: 'push', label: 'Push Notifications', icon: Bell },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    { id: 'compression', label: 'Compression', icon: Settings },
    { id: 'synonyms', label: 'Search Synonyms', icon: BookOpen },
    { id: 'refunds', label: 'Refunds', icon: CreditCard },
  ];

  return (
    <div className="safe-top flex flex-col md:flex-row gap-4 px-4 pb-6">
      {/* Sidebar */}
      <div className="md:w-52 shrink-0">
        <div className="flex items-center justify-between mb-4 md:mb-6">
           <div className="flex items-center gap-3">
             <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
               <ArrowLeft size={18} />
             </button>
             <h1 className="text-xl font-extrabold text-ink-900">Admin</h1>
           </div>
           
           <button 
             onClick={() => setTab('refunds')} 
             className="relative p-2 rounded-full hover:bg-ink-100 transition md:hidden"
           >
             <Bell size={20} className="text-ink-600" />
             {criticalRefundsCount > 0 && (
               <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
             )}
           </button>
        </div>

        <div className="hidden md:flex items-center justify-between bg-white border border-ink-200 rounded-xl px-4 py-2 mb-4 cursor-pointer hover:bg-ink-50 transition" onClick={() => setTab('refunds')}>
           <div className="flex items-center gap-2 text-sm font-bold text-ink-700">
             <Bell size={16} /> Alerts
           </div>
           {criticalRefundsCount > 0 && (
             <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
               {criticalRefundsCount}
             </span>
           )}
        </div>

        <div className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                tab === id
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              <Icon size={18} /> 
              {label}
              {id === 'refunds' && criticalRefundsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {criticalRefundsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-4">
        {tab === 'dashboard' && <Dashboard onNavigateToTab={(tabId: Tab) => setTab(tabId)} />}
        {tab === 'homeSections' && <SectionsManager />}
        {tab === 'banners' && <BannersManager />}
        {tab === 'stores' && <StoresManager />}
        {tab === 'storeContent' && <StoreConfigManager />}
        {tab === 'brands' && <BrandsManager />}
        {tab === 'brandContent' && <BrandConfigManager />}
        {tab === 'categories' && <CategoriesManager />}
        {tab === 'subcategories' && <SubcategoriesManager />}
        {tab === 'products' && <ProductsManager />}
        {tab === 'volumepricing' && <VolumePricingManager />}
        {tab === 'promocodes' && <PromoCodesManager />}
        {tab === 'deliverysettings' && <DeliverySettingsManager />}
        {tab === 'codSettlement' && <CodSettlementManager />}
        {tab === 'smartcollections' && <SmartCollectionsManager />}
        {tab === 'roles' && <RolesManager />}
        {tab === 'invoices' && <AdminInvoices />}
        {tab === 'invoiceSettings' && <InvoiceSettings />}
        {tab === 'deliveryRanges' && <DeliveryRangesManager />}
        {tab === 'push' && <PushNotificationSender />}
        {tab === 'whatsapp' && <WhatsAppCampaignManager />}       
        {tab === 'compression' && <CompressionSettings />}
        {tab === 'reports' && <Reports />}
        {tab === 'synonyms' && <SynonymsManager />}
        {tab === 'refunds' && <RefundManager />}
      </div>
    </div>
  );
}

