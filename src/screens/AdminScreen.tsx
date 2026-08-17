// screens/AdminScreen.tsx
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
  BarChart2  // <- added for Reports
} from 'lucide-react';
import { PushNotificationSender } from '@/components/Admin/PushNotificationSender';
import InvoiceSettings from '@/components/InvoiceSettings';
import AdminInvoices from '@/components/Admin/AdminInvoices';

// Import all extracted managers
import Dashboard from '@/components/Admin/Dashboard';
import BannersManager from '@/components/Admin/BannersManager';
import StoresManager from '@/components/Admin/StoresManager';
import BrandsManager from '@/components/Admin/BrandsManager';
import CategoriesManager from '@/components/Admin/CategoriesManager';
import ProductsManager from '@/components/Admin/ProductsManager';
import VolumePricingManager from '@/components/Admin/VolumePricingManager';
import PromoCodesManager from '@/components/Admin/PromoCodesManager';
import DeliverySettingsManager from '@/components/Admin/DeliverySettingsManager';
import SmartCollectionsManager from '@/components/Admin/SmartCollectionsManager';
import RolesManager from '@/components/Admin/RolesManager';
import DeliveryRangesManager from '@/components/Admin/DeliveryRangesManager';
import Reports from '@/components/Admin/Reports';  // <- new

interface AdminScreenProps {
  onBack: () => void;
}

type Tab =
  | 'dashboard'
  | 'banners'
  | 'stores'
  | 'brands'
  | 'categories'
  | 'products'
  | 'volumepricing'
  | 'promocodes'
  | 'deliverysettings'
  | 'smartcollections'
  | 'roles'
  | 'invoices'
  | 'invoiceSettings'
  | 'deliveryRanges'
  | 'push'
  | 'reports';  // <- added

export function AdminScreen({ onBack }: AdminScreenProps) {
  const [tab, setTab] = useState<Tab>('dashboard');

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'banners', label: 'Banners', icon: Tag },
    { id: 'stores', label: 'Stores', icon: Store },
    { id: 'brands', label: 'Brands', icon: Award },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'volumepricing', label: 'Volume Pricing', icon: Percent },
    { id: 'promocodes', label: 'Promo Codes', icon: Gift },
    { id: 'deliverysettings', label: 'Delivery Settings', icon: Truck },
    { id: 'smartcollections', label: 'Smart Collections', icon: LayoutGrid },
    { id: 'roles', label: 'Roles', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'invoiceSettings', label: 'Invoice Settings', icon: Settings },
    { id: 'deliveryRanges', label: 'Delivery Ranges', icon: MapPin },
    { id: 'push', label: 'Push Notifications', icon: Bell },
    { id: 'reports', label: 'Reports', icon: BarChart2 },  // <- added
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 px-4 pb-6">
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
        {tab === 'banners' && <BannersManager />}
        {tab === 'stores' && <StoresManager />}
        {tab === 'brands' && <BrandsManager />}
        {tab === 'categories' && <CategoriesManager />}
        {tab === 'products' && <ProductsManager />}
        {tab === 'volumepricing' && <VolumePricingManager />}
        {tab === 'promocodes' && <PromoCodesManager />}
        {tab === 'deliverysettings' && <DeliverySettingsManager />}
        {tab === 'smartcollections' && <SmartCollectionsManager />}
        {tab === 'roles' && <RolesManager />}
        {tab === 'invoices' && <AdminInvoices />}
        {tab === 'invoiceSettings' && <InvoiceSettings />}
        {tab === 'deliveryRanges' && <DeliveryRangesManager />}
        {tab === 'push' && <PushNotificationSender />}
        {tab === 'reports' && <Reports />}  {/* <- added */}
      </div>
    </div>
  );
}