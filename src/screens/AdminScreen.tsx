import { useState } from 'react';
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
  | 'compression';

export function AdminScreen({ onBack }: AdminScreenProps) {
  const [tab, setTab] = useState<Tab>('dashboard');

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
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
  ];

  return (
    <div className="safe-top flex flex-col md:flex-row gap-4 px-4 pb-6">
      {/* Sidebar */}
      <div className="md:w-52 shrink-0">
        <div className="flex items-center gap-3 mb-4 md:hidden">
          <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-extrabold text-ink-900">Admin</h1>
        </div>
        <div className="hidden md:flex items-center gap-3 mb-6">
          <button onClick={onBack} className="h-9 w-9 rounded-xl bg-white border border-ink-200 flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-extrabold text-ink-900">Admin</h1>
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
              <Icon size={18} /> {label}
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
      </div>
    </div>
  );
}
