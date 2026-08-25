import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Eye, 
  ExternalLink, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TemplateField {
  label: string;
  key: string;
  default: string;
}

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  buttonLabel: string;
  defaultButtonParam: string;
  buttonParamHelp: string;
  fields: TemplateField[];
  preview: (params: Record<string, string>) => string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'hello_world',
    name: 'Meta Pre-Approved Test (hello_world)',
    description: 'Instant test template approved by Meta by default. Requires no variable configuration.',
    buttonLabel: 'None',
    defaultButtonParam: '',
    buttonParamHelp: 'No button parameters needed for the hello_world template',
    fields: [],
    preview: () =>
      `Hello World!\n\nWelcome and congratulations! This message confirms that your WhatsApp Business Cloud API integration is live and working.`,
  },
  {
    id: 'flash_sale_promo',
    name: 'Flash Sale / Discount',
    description: 'Promote percentage discounts and special seasonal coupon codes.',
    buttonLabel: 'Claim Offer',
    defaultButtonParam: 'cart?promo=SAVE20',
    buttonParamHelp: 'Appended to domain (e.g. cart?promo=SAVE20)',
    fields: [
      { label: 'Business / Store Name', key: 'brand', default: 'Wholesale Hub' },
      { label: 'Discount Percentage (%)', key: 'discount', default: '20' },
      { label: 'Promo Code', key: 'promo_code', default: 'SAVE20' },
    ],
    preview: (params) =>
      `Hello [Customer Name], exclusive wholesale offer from ${params.brand || 'Wholesale Hub'}! 🚀\n\nGet ${params.discount || '20'}% OFF on your entire order using promo code ${params.promo_code || 'SAVE20'} at checkout.\n\nHurry, this offer is valid for a limited time only!`,
  },
  {
    id: 'new_arrivals_promo',
    name: 'New Arrivals / Spotlight',
    description: 'Notify customers about newly added categories or fresh wholesale inventory.',
    buttonLabel: 'View Collection',
    defaultButtonParam: 'categories/beverages',
    buttonParamHelp: 'Appended to domain (e.g. categories/beverages)',
    fields: [
      { label: 'Business / Store Name', key: 'brand', default: 'Wholesale Hub' },
      { label: 'Category / Collection Name', key: 'category', default: 'Beverages & Snacks' },
    ],
    preview: (params) =>
      `Hello [Customer Name], fresh inventory is now available at ${params.brand || 'Wholesale Hub'}! 📦\n\nExplore our newly added collection of ${params.category || 'Beverages & Snacks'} at wholesale prices.\n\nStock up today before items sell out!`,
  },
  {
    id: 'customer_reactivation_promo',
    name: 'Customer Reactivation',
    description: 'Re-engage inactive buyers with flat rupee credit vouchers.',
    buttonLabel: 'Order Now',
    defaultButtonParam: 'cart?coupon=RESTOCK500',
    buttonParamHelp: 'Appended to domain (e.g. cart?coupon=RESTOCK500)',
    fields: [
      { label: 'Business / Store Name', key: 'brand', default: 'Wholesale Hub' },
      { label: 'Flat Discount Amount (₹)', key: 'amount', default: '500' },
      { label: 'Coupon Code', key: 'coupon', default: 'RESTOCK500' },
    ],
    preview: (params) =>
      `Hi [Customer Name], we noticed you haven't restocked recently at ${params.brand || 'Wholesale Hub'}! 🛍️\n\nEnjoy flat ₹${params.amount || '500'} OFF on your next order with coupon code ${params.coupon || 'RESTOCK500'}.\n\nTap below to claim your discount!`,
  },
];

export default function WhatsAppCampaignManager() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [audience, setAudience] = useState<'all' | 'registered'>('all');
  const [paramValues, setParamValues] = useState<Record<string, string>>({
    brand: 'Wholesale Hub',
    discount: '20',
    promo_code: 'SAVE20',
    category: 'Beverages & Snacks',
    amount: '500',
    coupon: 'RESTOCK500',
  });
  const [buttonParam, setButtonParam] = useState<string>(TEMPLATES[0].defaultButtonParam);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setButtonParam(tmpl.defaultButtonParam);
    }
  };

  const fetchRecipientCount = async () => {
    setIsLoadingCount(true);
    setErrorMsg(null);
    try {
      let query = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .neq('phone', '');

      if (audience === 'registered') {
        query = query.eq('registration_status', 'registered');
      }

      const { count, error } = await query;
      if (error) throw error;
      setRecipientCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching recipient count:', err);
      setErrorMsg(err.message || 'Failed to calculate target audience size.');
    } finally {
      setIsLoadingCount(false);
    }
  };

  useEffect(() => {
    fetchRecipientCount();
  }, [audience]);

  const handleSendCampaign = async () => {
    if (!recipientCount || recipientCount === 0) {
      alert('No valid recipients found for this audience filter.');
      return;
    }

    const confirmSend = window.confirm(
      `Send "${selectedTemplate.name}" to ${recipientCount} recipients via WhatsApp Cloud API?`
    );
    if (!confirmSend) return;

    setIsSending(true);
    setResult(null);
    setErrorMsg(null);

    const orderedBodyParams = [
      'Customer Name',
      ...selectedTemplate.fields.map((f) => paramValues[f.key] || f.default),
    ];

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('send-whatsapp-campaign', {
        body: {
          templateName: selectedTemplate.id,
          parameters: orderedBodyParams,
          buttonParam: buttonParam.trim(),
          audienceType: audience,
          sentBy: user?.id,
        },
      });

      if (error) throw error;

      if (data && data.success) {
        setResult({
          total: data.total,
          sent: data.sent,
          failed: data.failed,
        });
      } else {
        throw new Error(data?.error || 'Failed to process WhatsApp campaign.');
      }
    } catch (err: any) {
      console.error('Campaign submission failed:', err);
      setErrorMsg(err.message || 'Failed to dispatch WhatsApp broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-ink-200">
        <div>
          <h2 className="text-xl font-black text-ink-900 flex items-center gap-2">
            <Sparkles className="text-brand-600" size={22} /> WhatsApp Broadcast Manager
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Deliver pre-approved Meta WhatsApp templates directly to registered profile contacts.
          </p>
        </div>
        <button
          onClick={fetchRecipientCount}
          disabled={isLoadingCount}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink-600 bg-ink-50 hover:bg-ink-100 rounded-xl border border-ink-200 transition-colors w-fit"
        >
          <RefreshCw size={14} className={isLoadingCount ? 'animate-spin' : ''} />
          Refresh Audience
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 space-y-6 bg-white p-6 rounded-2xl border border-ink-200 shadow-sm">
          {/* 1. Template Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2.5">
              1. Select Template
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`p-3.5 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 text-ink-900 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-ink-200 hover:bg-ink-50/60 text-ink-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-ink-900">{tmpl.name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-ink-100 text-ink-600">
                        {tmpl.id}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">{tmpl.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Target Audience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2.5">
              2. Target Audience
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  audience === 'all'
                    ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600'
                    : 'border-ink-200 hover:bg-ink-50'
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  value="all"
                  checked={audience === 'all'}
                  onChange={() => setAudience('all')}
                  className="mt-0.5 accent-brand-600"
                />
                <div>
                  <div className="text-sm font-bold text-ink-900">All Customers</div>
                  <div className="text-xs text-ink-500">Every user with a saved phone number</div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  audience === 'registered'
                    ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600'
                    : 'border-ink-200 hover:bg-ink-50'
                }`}
              >
                <input
                  type="radio"
                  name="audience"
                  value="registered"
                  checked={audience === 'registered'}
                  onChange={() => setAudience('registered')}
                  className="mt-0.5 accent-brand-600"
                />
                <div>
                  <div className="text-sm font-bold text-ink-900">Registered Only</div>
                  <div className="text-xs text-ink-500">Verified business profiles</div>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Dynamic Variables (Hidden for hello_world) */}
          {selectedTemplate.fields.length > 0 && (
            <div className="space-y-3.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500">
                3. Message Variables
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="text-xs font-semibold text-ink-700 block">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={paramValues[field.key] || ''}
                      placeholder={field.default}
                      onChange={(e) =>
                        setParamValues({ ...paramValues, [field.key]: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-sm font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Dynamic URL Button Parameter (Hidden for hello_world) */}
          {selectedTemplate.id !== 'hello_world' && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500">
                4. Dynamic Button Path / Query
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={buttonParam}
                  onChange={(e) => setButtonParam(e.target.value)}
                  placeholder="e.g. cart?promo=SAVE20"
                  className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-sm font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
              <p className="text-[11px] text-ink-500">
                {selectedTemplate.buttonParamHelp}. Leading slashes are trimmed automatically.
              </p>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={handleSendCampaign}
            disabled={isSending || isLoadingCount || recipientCount === 0}
            className="w-full mt-2 flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3.5 px-5 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send size={18} />
            {isSending
              ? 'Broadcasting Messages...'
              : `Send Campaign (${recipientCount ?? 0} Recipients)`}
          </button>
        </div>

        {/* Right Column: 5 Columns (Preview & Execution Logs) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Phone Mock */}
          <div className="bg-ink-950 p-5 rounded-2xl text-white shadow-md">
            <div className="flex items-center justify-between text-emerald-400 mb-3.5 pb-2 border-b border-ink-800">
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Live WhatsApp Preview</span>
              </div>
              <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                {selectedTemplate.id}
              </span>
            </div>

            {/* Bubble Canvas */}
            <div className="bg-[#EFEAE2] p-4 rounded-xl shadow-inner min-h-[240px] flex flex-col justify-between">
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-none shadow-sm border border-emerald-950/5 max-w-full">
                <p className="text-xs sm:text-sm text-ink-900 leading-relaxed whitespace-pre-line font-normal">
                  {selectedTemplate.preview(paramValues)}
                </p>
                <div className="mt-2 pt-2 border-t border-ink-100 text-[11px] text-ink-400 flex items-center justify-between">
                  <span>{selectedTemplate.id !== 'hello_world' ? 'Reply STOP to unsubscribe' : ''}</span>
                  <span className="text-[10px]">12:00 PM</span>
                </div>
              </div>

              {selectedTemplate.buttonLabel !== 'None' && (
                <div className="mt-3 bg-white hover:bg-ink-50 transition-colors border border-ink-200 rounded-xl py-2.5 px-3 flex items-center justify-center gap-2 text-brand-600 font-bold text-xs sm:text-sm shadow-sm cursor-default">
                  <ExternalLink size={14} />
                  <span>{selectedTemplate.buttonLabel}</span>
                </div>
              )}
            </div>

            {selectedTemplate.buttonLabel !== 'None' && (
              <div className="mt-3 px-1 text-[11px] text-ink-400 truncate">
                <span className="text-ink-500">Destination:</span>{' '}
                <span className="font-mono text-emerald-300">
                  https://your-domain.com/{buttonParam.replace(/^\/+/, '')}
                </span>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-800 animate-in fade-in duration-200">
              <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={18} />
              <div className="text-xs">
                <p className="font-bold">Broadcast Error</p>
                <p className="mt-0.5 text-rose-700">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success Statistics */}
          {result && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-emerald-900 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700">
                <CheckCircle size={18} /> Campaign Successfully Dispatched
              </div>
              <div className="text-xs grid grid-cols-3 gap-2 pt-1 border-t border-emerald-200/60 text-center">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <div className="text-ink-500 text-[10px] uppercase font-bold">Total</div>
                  <div className="text-sm font-black text-ink-900">{result.total}</div>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <div className="text-emerald-600 text-[10px] uppercase font-bold">Sent</div>
                  <div className="text-sm font-black text-emerald-700">{result.sent}</div>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                  <div className="text-rose-600 text-[10px] uppercase font-bold">Failed</div>
                  <div className="text-sm font-black text-rose-700">{result.failed}</div>
                </div>
              </div>
            </div>
          )}

          {/* Total Profile Stats */}
          <div className="bg-white p-4 rounded-2xl border border-ink-200 text-xs text-ink-600 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Users size={15} className="text-ink-400" /> Target Profile Count:
            </span>
            <span className="font-bold text-ink-900 bg-ink-100 px-2 py-0.5 rounded-md">
              {recipientCount === null ? 'Calculating...' : `${recipientCount} phone numbers`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
