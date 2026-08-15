import { supabase } from '@/lib/supabase';

export interface InvoiceConfig {
  id: string;
  company_name: string;
  company_address: string;
  company_gst: string;
  company_phone: string;
  company_email: string;
  company_logo: string;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
  terms_conditions: string;
  primary_color: string;
  color_opacity: number;
  first_page_rows: number | null;
  next_page_rows: number | null;
}

export interface InvoiceDesignSettings {
  gstFont: 'small' | 'medium' | 'large';
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showBankDetails: boolean;
  invoiceLayout: 'standard' | 'compact' | 'professional';
  gstTemplate: 'template1' | 'template2' | 'template3' | 'template4' | 'template5';
  primaryColor: string;
  colorOpacity: number;
  firstPageRows?: number;
  nextPageRows?: number;
  showAuthorisedSignature: boolean;
  showReceiverSignature: boolean;
  gstPrintMode: 'sliced' | 'continuous';
}

const DEFAULT_DESIGN: InvoiceDesignSettings = {
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
};

let cachedConfig: InvoiceConfig | null = null;
let cachedDesign: InvoiceDesignSettings | null = null;

export async function getInvoiceConfig(): Promise<InvoiceConfig | null> {
  if (cachedConfig) return cachedConfig;
  const { data, error } = await supabase
    .from('invoice_config')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    cachedConfig = null;
    return null;
  }
  cachedConfig = data as InvoiceConfig;
  return cachedConfig;
}

export async function saveInvoiceConfig(config: Partial<InvoiceConfig>): Promise<void> {
  const existing = await getInvoiceConfig();
  if (existing) {
    await supabase.from('invoice_config').update(config).eq('id', existing.id);
  } else {
    // Insert without id – let Supabase generate UUID
    const { id, ...rest } = config;
    await supabase.from('invoice_config').insert(rest);
  }
  cachedConfig = null;
}

export async function getInvoiceDesign(): Promise<InvoiceDesignSettings> {
  if (cachedDesign) return cachedDesign;
  const stored = localStorage.getItem('invoice_design');
  if (stored) {
    try {
      cachedDesign = JSON.parse(stored);
      return cachedDesign;
    } catch {}
  }
  const { data, error } = await supabase
    .from('invoice_design')
    .select('settings')
    .limit(1)
    .maybeSingle();
  if (error || !data) {
    cachedDesign = { ...DEFAULT_DESIGN };
  } else {
    cachedDesign = { ...DEFAULT_DESIGN, ...(data.settings as InvoiceDesignSettings) };
  }
  localStorage.setItem('invoice_design', JSON.stringify(cachedDesign));
  return cachedDesign;
}

export async function saveInvoiceDesign(settings: InvoiceDesignSettings): Promise<void> {
  const { data: existing } = await supabase
    .from('invoice_design')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase.from('invoice_design').update({ settings }).eq('id', existing.id);
  } else {
    await supabase.from('invoice_design').insert({ settings });
  }
  cachedDesign = settings;
  localStorage.setItem('invoice_design', JSON.stringify(settings));
}