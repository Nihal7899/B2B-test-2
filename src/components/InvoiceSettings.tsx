import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Save, Upload, Eye, X } from 'lucide-react';
import { getInvoiceConfig, saveInvoiceConfig, getInvoiceDesign, saveInvoiceDesign, type InvoiceConfig, type InvoiceDesignSettings } from '@/services/invoice.service';
import { buildGstBillHtml } from '@/services/gstBill';
import { printHtml } from '@/utils/printHtml';
import toast from 'react-hot-toast';

export default function InvoiceSettings() {
  const [config, setConfig] = useState<InvoiceConfig>({
    id: '',
    company_name: '',
    company_address: '',
    company_gst: '',
    company_phone: '',
    company_email: '',
    company_logo: '',
    bank_name: '',
    bank_account: '',
    bank_ifsc: '',
    terms_conditions: '',
    primary_color: '#1d4ed8',
    color_opacity: 1,
    first_page_rows: null,
    next_page_rows: null,
  });
  const [design, setDesign] = useState<InvoiceDesignSettings>({
    gstFont: 'medium',
    headerText: 'TAX INVOICE',
    footerText: 'Thank you for your business!',
    showLogo: true,
    showBankDetails: true,
    invoiceLayout: 'professional',
    gstTemplate: 'template1',
    primaryColor: '#1d4ed8',
    colorOpacity: 1,
    firstPageRows: undefined,
    nextPageRows: undefined,
    showAuthorisedSignature: true,
    showReceiverSignature: true,
    gstPrintMode: 'sliced',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const configData = await getInvoiceConfig();
      if (configData) setConfig(configData);
      const designData = await getInvoiceDesign();
      setDesign(designData);
      setLoading(false);
    }
    load();
  }, []);

  const saveAll = async () => {
    setSaving(true);
    try {
      await saveInvoiceConfig(config);
      await saveInvoiceDesign(design);
      // Reload config to get the real ID if new
      const updatedConfig = await getInvoiceConfig();
      if (updatedConfig) setConfig(updatedConfig);
      toast.success('Settings saved');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setConfig(prev => ({ ...prev, company_logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const previewInvoice = async () => {
    try {
      // Use a dummy order ID – you can replace with a real order ID if needed
      // For preview, we'll create a dummy HTML with dummy data.
      // Or we can fetch a recent order. For simplicity, we'll generate a dummy preview.
      const dummyOrderId = 'dummy';
      // You can implement a dummy HTML builder or use a real order.
      // For now, we'll just show a placeholder.
      const html = await buildGstBillHtml(dummyOrderId); // will fail if dummy not found
      // Better: use a separate preview builder. We'll just show a message.
      alert('Preview will be available after connecting a real order.');
    } catch (e) {
      alert('Preview not available. Please save settings and use a real order.');
    }
  };

  if (loading) return <div className="flex items-center justify-center py-8"><div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-ink-900">Invoice Settings</h2>
        <button onClick={saveAll} disabled={saving} className="h-10 px-4 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center gap-2">
          <Save size={16} /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-ink-900">Company Information</h3>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Company Logo</label>
          <div className="flex items-center gap-4">
            {config.company_logo && <img src={config.company_logo} alt="Logo" className="h-16 w-16 object-contain rounded border border-ink-200" />}
            <label className="h-10 px-4 rounded-xl bg-brand-50 text-brand-600 text-xs font-bold flex items-center gap-2 cursor-pointer">
              <Upload size={14} /> Upload
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {config.company_logo && (
              <button onClick={() => setConfig(prev => ({ ...prev, company_logo: '' }))} className="text-red-500 text-xs">Remove</button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Company Name</label>
            <input value={config.company_name} onChange={e => setConfig({...config, company_name: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">GST Number</label>
            <input value={config.company_gst} onChange={e => setConfig({...config, company_gst: e.target.value.toUpperCase()})} maxLength={15} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Address</label>
          <textarea value={config.company_address} onChange={e => setConfig({...config, company_address: e.target.value})} rows={2} className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Phone</label>
            <input value={config.company_phone} onChange={e => setConfig({...config, company_phone: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Email</label>
            <input value={config.company_email} onChange={e => setConfig({...config, company_email: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-ink-900">Bank Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Bank Name</label>
            <input value={config.bank_name} onChange={e => setConfig({...config, bank_name: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Account Number</label>
            <input value={config.bank_account} onChange={e => setConfig({...config, bank_account: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">IFSC Code</label>
            <input value={config.bank_ifsc} onChange={e => setConfig({...config, bank_ifsc: e.target.value.toUpperCase()})} maxLength={11} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Terms & Conditions</label>
          <textarea value={config.terms_conditions} onChange={e => setConfig({...config, terms_conditions: e.target.value})} rows={3} className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-ink-900">Invoice Design</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Template</label>
            <select value={design.gstTemplate} onChange={e => setDesign({...design, gstTemplate: e.target.value as InvoiceDesignSettings['gstTemplate']})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500">
              <option value="template1">Template 1 – Classic</option>
              <option value="template2">Template 2 – Modern</option>
              <option value="template3">Template 3 – Minimal</option>
              <option value="template4">Template 4 – Professional</option>
              <option value="template5">Template 5 – Compact</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Print Mode</label>
            <select value={design.gstPrintMode} onChange={e => setDesign({...design, gstPrintMode: e.target.value as 'sliced' | 'continuous'})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500">
              <option value="sliced">Sliced (paginated)</option>
              <option value="continuous">Continuous (single page)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Primary Colour</label>
            <input type="color" value={design.primaryColor} onChange={e => setDesign({...design, primaryColor: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 p-1 cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Colour Opacity: {Math.round(design.colorOpacity * 100)}%</label>
            <input type="range" min="0" max="1" step="0.01" value={design.colorOpacity} onChange={e => setDesign({...design, colorOpacity: parseFloat(e.target.value)})} className="w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Font Size</label>
            <select value={design.gstFont} onChange={e => setDesign({...design, gstFont: e.target.value as 'small' | 'medium' | 'large'})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500">
              <option value="small">Small (10px)</option>
              <option value="medium">Medium (12px)</option>
              <option value="large">Large (14px)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-600 mb-1">Layout</label>
            <select value={design.invoiceLayout} onChange={e => setDesign({...design, invoiceLayout: e.target.value as 'standard' | 'compact' | 'professional'})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500">
              <option value="standard">Standard</option>
              <option value="compact">Compact</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>
        {design.gstPrintMode === 'sliced' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">First Page Rows</label>
                <input type="number" min="5" max="100" value={design.firstPageRows ?? ''} onChange={e => setDesign({...design, firstPageRows: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="Auto" className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-600 mb-1">Next Page Rows</label>
                <input type="number" min="5" max="100" value={design.nextPageRows ?? ''} onChange={e => setDesign({...design, nextPageRows: e.target.value ? parseInt(e.target.value) : undefined})} placeholder="Auto" className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
          </>
        )}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={design.showLogo} onChange={e => setDesign({...design, showLogo: e.target.checked})} className="accent-brand-600" />
            Show Logo
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={design.showBankDetails} onChange={e => setDesign({...design, showBankDetails: e.target.checked})} className="accent-brand-600" />
            Show Bank Details
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={design.showAuthorisedSignature} onChange={e => setDesign({...design, showAuthorisedSignature: e.target.checked})} className="accent-brand-600" />
            Authorised Signature
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={design.showReceiverSignature} onChange={e => setDesign({...design, showReceiverSignature: e.target.checked})} className="accent-brand-600" />
            Receiver's Signature
          </label>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Header Text</label>
          <input value={design.headerText} onChange={e => setDesign({...design, headerText: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Footer Text</label>
          <input value={design.footerText} onChange={e => setDesign({...design, footerText: e.target.value})} className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500" />
        </div>
        <button onClick={previewInvoice} className="h-10 px-4 rounded-xl bg-ink-100 text-ink-700 text-sm font-bold flex items-center gap-2">
          <Eye size={16} /> Preview Invoice
        </button>
      </div>
    </div>
  );
}