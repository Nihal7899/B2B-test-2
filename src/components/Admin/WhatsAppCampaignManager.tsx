import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Eye, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  Image as ImageIcon,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TemplateVarConfig {
  label: string;
  default: string;
}

interface DBTemplate {
  id: string;
  template_name: string;
  display_name: string;
  description: string;
  language: string;
  has_header: boolean;
  header_type: 'NONE' | 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'TEXT';
  body_text: string;
  variables_config: TemplateVarConfig[];
  has_dynamic_button: boolean;
  button_label: string;
  button_default_param: string;
}

export default function WhatsAppCampaignManager() {
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DBTemplate | null>(null);
  const [audience, setAudience] = useState<'all' | 'registered'>('all');
  
  // Dynamic form state
  const [paramValues, setParamValues] = useState<Record<number, string>>({});
  const [headerMediaUrl, setHeaderMediaUrl] = useState<string>('');
  const [buttonParam, setButtonParam] = useState<string>('');
  
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State for adding new template
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    display_name: '',
    description: '',
    language: 'en',
    header_type: 'NONE' as 'NONE' | 'IMAGE' | 'DOCUMENT',
    body_text: '',
    varLabels: '', // comma separated labels
    has_dynamic_button: false,
    button_label: 'Visit Website',
    button_default_param: '',
  });

  // 1. Fetch dynamic templates from DB
  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      setTemplates(data);
      selectTemplate(data[0]);
    }
    setIsLoadingTemplates(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const selectTemplate = (tmpl: DBTemplate) => {
    setSelectedTemplate(tmpl);
    setButtonParam(tmpl.button_default_param || '');
    setHeaderMediaUrl('');
    
    // Initialize default variable values
    const initialParams: Record<number, string> = {};
    (tmpl.variables_config || []).forEach((v, idx) => {
      initialParams[idx] = v.default || '';
    });
    setParamValues(initialParams);
  };

  // 2. Fetch Audience Count
  const loadRecipientCount = async () => {
    let query = supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('phone', '');
    if (audience === 'registered') {
      query = query.eq('registration_status', 'registered');
    }
    const { count } = await query;
    setRecipientCount(count || 0);
  };

  useEffect(() => {
    loadRecipientCount();
  }, [audience]);

  // 3. Construct Live Preview Text
  const renderLivePreview = () => {
    if (!selectedTemplate) return '';
    let preview = selectedTemplate.body_text;
    preview = preview.replace('{{1}}', '[Customer Name]');
    (selectedTemplate.variables_config || []).forEach((v, idx) => {
      const val = paramValues[idx] || `[${v.label}]`;
      preview = preview.replace(`{{${idx + 2}}}`, val);
    });
    return preview;
  };

  // 4. Submit Campaign
  const handleSendCampaign = async () => {
    if (!selectedTemplate) return;
    if (!confirm(`Send "${selectedTemplate.display_name}" to ${recipientCount} recipients?`)) return;

    setIsSending(true);
    setResult(null);
    setErrorMsg(null);

    const orderedParams = [
      'Customer Name',
      ...(selectedTemplate.variables_config || []).map((_, idx) => paramValues[idx] || ''),
    ];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('send-whatsapp-campaign', {
        body: {
          templateName: selectedTemplate.template_name,
          languageCode: selectedTemplate.language || 'en',
          headerType: selectedTemplate.header_type,
          headerMediaUrl: headerMediaUrl.trim() || undefined,
          parameters: selectedTemplate.template_name === 'hello_world' ? [] : orderedParams,
          buttonParam: selectedTemplate.has_dynamic_button ? buttonParam.trim() : undefined,
          audienceType: audience,
          sentBy: user?.id,
        },
      });

      if (error) throw error;
      if (data?.success) {
        setResult({ total: data.total, sent: data.sent, failed: data.failed });
      } else {
        throw new Error(data?.error || 'Broadcast failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Save New Template to DB
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVariables: TemplateVarConfig[] = newTemplate.varLabels
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((label) => ({ label, default: '' }));

    const { error } = await supabase.from('whatsapp_templates').insert({
      template_name: newTemplate.template_name.trim().toLowerCase(),
      display_name: newTemplate.display_name.trim(),
      description: newTemplate.description.trim(),
      language: newTemplate.language,
      has_header: newTemplate.header_type !== 'NONE',
      header_type: newTemplate.header_type,
      body_text: newTemplate.body_text.trim(),
      variables_config: parsedVariables,
      has_dynamic_button: newTemplate.has_dynamic_button,
      button_label: newTemplate.button_label,
      button_default_param: newTemplate.button_default_param,
    });

    if (error) {
      alert(`Error creating template: ${error.message}`);
      return;
    }

    setIsModalOpen(false);
    loadTemplates();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-ink-200">
        <div>
          <h2 className="text-xl font-black text-ink-900 flex items-center gap-2">
            <Sparkles className="text-brand-600" size={22} /> WhatsApp Broadcast Manager
          </h2>
          <p className="text-sm text-ink-500">Dynamically dispatch Meta-approved templates with images and custom links.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus size={15} /> Add Template
          </button>
          <button
            onClick={loadRecipientCount}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-ink-600 bg-ink-50 hover:bg-ink-100 rounded-xl border border-ink-200 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 space-y-5 bg-white p-6 rounded-2xl border border-ink-200">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">1. Select Template</label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => selectTemplate(tmpl)}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    selectedTemplate?.id === tmpl.id
                      ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-ink-900">{tmpl.display_name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink-100 text-ink-600">{tmpl.template_name} ({tmpl.language})</span>
                  </div>
                  {tmpl.description && <p className="text-xs text-ink-500 mt-0.5">{tmpl.description}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* Audience Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">2. Target Audience</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-ink-800 cursor-pointer">
                <input type="radio" name="audience" checked={audience === 'all'} onChange={() => setAudience('all')} className="accent-brand-600" />
                All Users ({recipientCount ?? '...'})
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-ink-800 cursor-pointer">
                <input type="radio" name="audience" checked={audience === 'registered'} onChange={() => setAudience('registered')} className="accent-brand-600" />
                Registered Profiles Only
              </label>
            </div>
          </div>

          {/* Dynamic Image Header Input */}
          {selectedTemplate?.header_type === 'IMAGE' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">Header Image URL</label>
              <input
                type="url"
                placeholder="https://yourstore.com/banner.jpg"
                value={headerMediaUrl}
                onChange={(e) => setHeaderMediaUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Dynamic Body Variables */}
          {selectedTemplate && (selectedTemplate.variables_config || []).length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500">3. Body Parameters</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTemplate.variables_config.map((field, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-semibold text-ink-700 block">{field.label}</label>
                    <input
                      type="text"
                      value={paramValues[idx] || ''}
                      placeholder={field.default || field.label}
                      onChange={(e) => setParamValues({ ...paramValues, [idx]: e.target.value })}
                      className="w-full px-3 py-2 border border-ink-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Button Suffix */}
          {selectedTemplate?.has_dynamic_button && (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500">4. Button Link Suffix / Query</label>
              <input
                type="text"
                value={buttonParam}
                onChange={(e) => setButtonParam(e.target.value)}
                placeholder="e.g. cart?promo=SAVE20"
                className="w-full px-3.5 py-2.5 font-mono text-sm border border-ink-200 rounded-xl focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <button
            onClick={handleSendCampaign}
            disabled={isSending || recipientCount === 0 || !selectedTemplate}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50"
          >
            <Send size={18} />
            {isSending ? 'Sending Campaign...' : `Send to ${recipientCount ?? 0} Recipients`}
          </button>
        </div>

        {/* Right Preview: 5 Columns */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-ink-950 p-5 rounded-2xl text-white shadow-md">
            <div className="flex items-center justify-between text-emerald-400 mb-3 pb-2 border-b border-ink-800 text-xs font-bold uppercase">
              <div className="flex items-center gap-1.5"><Eye size={15} /> WhatsApp Preview</div>
              <span className="font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                {selectedTemplate?.template_name}
              </span>
            </div>

            <div className="bg-[#EFEAE2] p-4 rounded-xl shadow-inner min-h-[220px] flex flex-col justify-between text-ink-900">
              <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm space-y-2 border border-emerald-950/5">
                {selectedTemplate?.header_type === 'IMAGE' && headerMediaUrl && (
                  <img src={headerMediaUrl} alt="Header Preview" className="w-full h-32 object-cover rounded-lg mb-2" />
                )}
                <p className="text-xs leading-relaxed whitespace-pre-line">{renderLivePreview()}</p>
                <div className="text-[10px] text-ink-400 text-right">12:00 PM</div>
              </div>

              {selectedTemplate?.has_dynamic_button && (
                <div className="mt-3 bg-white border border-ink-200 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-brand-600 font-bold text-xs shadow-sm">
                  <ExternalLink size={13} /> {selectedTemplate.button_label}
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertTriangle className="shrink-0 text-rose-600" size={16} />
              <div><b>Error:</b> {errorMsg}</div>
            </div>
          )}

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-700 text-sm">
                <CheckCircle size={16} /> Dispatched Successfully
              </div>
              <div className="flex justify-between border-t border-emerald-200/60 pt-1">
                <span>Total: <b>{result.total}</b></span>
                <span>Sent: <b className="text-emerald-600">{result.sent}</b></span>
                <span>Failed: <b className="text-rose-600">{result.failed}</b></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl border border-ink-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-ink-100">
              <h3 className="font-bold text-lg text-ink-900">Add Approved Meta Template</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-ink-700 block mb-1">Meta Template Name (Exact)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. new_arrivals_promo"
                  value={newTemplate.template_name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Display Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New Arrivals"
                    value={newTemplate.display_name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Language Code</label>
                  <input
                    type="text"
                    required
                    placeholder="en or en_US"
                    value={newTemplate.language}
                    onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Header Type</label>
                <select
                  value={newTemplate.header_type}
                  onChange={(e: any) => setNewTemplate({ ...newTemplate, header_type: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                >
                  <option value="NONE">None</option>
                  <option value="IMAGE">Image</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Body Text Template</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Hello {{1}}, check out {{2}} at our store!"
                  value={newTemplate.body_text}
                  onChange={(e) => setNewTemplate({ ...newTemplate, body_text: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Body Variables Labels (Comma-separated for `&#123;&#123;2&#125;&#125;`, `&#123;&#123;3&#125;&#125;`...)</label>
                <input
                  type="text"
                  placeholder="e.g. Category Name, Discount %"
                  value={newTemplate.varLabels}
                  onChange={(e) => setNewTemplate({ ...newTemplate, varLabels: e.target.value })}
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                />
                <p className="text-[10px] text-ink-400 mt-0.5">`&#123;&#123;1&#125;&#125;` is automatically reserved for Customer Name.</p>
              </div>

              <div className="pt-2 border-t border-ink-100 space-y-2">
                <label className="flex items-center gap-2 font-bold text-ink-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTemplate.has_dynamic_button}
                    onChange={(e) => setNewTemplate({ ...newTemplate, has_dynamic_button: e.target.checked })}
                    className="accent-brand-600"
                  />
                  Template has Dynamic URL Button
                </label>
                {newTemplate.has_dynamic_button && (
                  <div className="grid grid-cols-2 gap-3 pl-5">
                    <input
                      type="text"
                      placeholder="Button Label (e.g. Shop Now)"
                      value={newTemplate.button_label}
                      onChange={(e) => setNewTemplate({ ...newTemplate, button_label: e.target.value })}
                      className="px-2.5 py-1.5 border border-ink-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Default Path (e.g. cart?p=1)"
                      value={newTemplate.button_default_param}
                      onChange={(e) => setNewTemplate({ ...newTemplate, button_default_param: e.target.value })}
                      className="px-2.5 py-1.5 border border-ink-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-ink-200 rounded-xl font-bold text-ink-600 hover:bg-ink-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
