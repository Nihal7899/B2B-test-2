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
  Edit2, 
  Trash2, 
  X,
  ListFilter,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Radio
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

interface MessageLog {
  id: string;
  campaign_id: string;
  user_id: string | null;
  recipient_phone: string;
  status: string;
  whatsapp_message_id: string | null;
  error_message: string | null;
  created_at: string;
}

export default function WhatsAppCampaignManager() {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'logs'>('broadcast');

  // --- Broadcast State ---
  const [templates, setTemplates] = useState<DBTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DBTemplate | null>(null);
  const [audience, setAudience] = useState<'all' | 'registered'>('all');
  const [paramValues, setParamValues] = useState<Record<number, string>>({});
  const [headerMediaUrl, setHeaderMediaUrl] = useState<string>('');
  const [buttonParam, setButtonParam] = useState<string>('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // --- Modal State (Create / Edit Template) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formTemplate, setFormTemplate] = useState({
    template_name: '',
    display_name: '',
    description: '',
    language: 'en',
    header_type: 'NONE' as 'NONE' | 'IMAGE' | 'DOCUMENT',
    body_text: '',
    varLabels: '',
    has_dynamic_button: false,
    button_label: 'Visit Website',
    button_default_param: '',
  });

  // --- Logs & Audit State ---
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'errors_only' | 'sent_only'>('all');
  const [logTimeFilter, setLogTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [logSearchPhone, setLogSearchPhone] = useState('');
  const [pruneKeepCount, setPruneKeepCount] = useState<number>(100);
  const [isPruning, setIsPruning] = useState(false);

  // 1. Fetch templates
  const loadTemplates = async (selectIdAfterLoad?: string) => {
    setIsLoadingTemplates(true);
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setTemplates(data);
      if (selectIdAfterLoad) {
        const found = data.find((t) => t.id === selectIdAfterLoad);
        if (found) selectTemplate(found);
      } else if (data.length > 0 && !selectedTemplate) {
        selectTemplate(data[0]);
      } else if (data.length === 0) {
        setSelectedTemplate(null);
      }
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

  // 3. Fetch Logs with dynamic filters
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      let query = supabase
        .from('whatsapp_message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

      // Status Filter
      if (logStatusFilter === 'errors_only') {
        query = query.eq('status', 'failed');
      } else if (logStatusFilter === 'sent_only') {
        query = query.eq('status', 'sent');
      }

      // Time Filter
      if (logTimeFilter !== 'all') {
        const now = new Date();
        if (logTimeFilter === '24h') now.setHours(now.getHours() - 24);
        if (logTimeFilter === '7d') now.setDate(now.getDate() - 7);
        if (logTimeFilter === '30d') now.setDate(now.getDate() - 30);
        query = query.gte('created_at', now.toISOString());
      }

      // Phone Search
      if (logSearchPhone.trim()) {
        query = query.ilike('recipient_phone', `%${logSearchPhone.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching logs:', err.message);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logStatusFilter, logTimeFilter]);

  // 4. Prune Old Logs Action
  const handlePruneLogs = async () => {
    const confirmMessage = pruneKeepCount === 0
      ? 'Are you sure you want to delete ALL message delivery logs?'
      : `Are you sure you want to delete older logs and keep only the latest ${pruneKeepCount}?`;

    if (!confirm(confirmMessage)) return;

    setIsPruning(true);
    try {
      const { data, error } = await supabase.rpc('prune_whatsapp_logs', {
        keep_count: pruneKeepCount,
      });

      if (error) throw error;
      alert(`Cleanup completed. ${data ?? 0} log records removed.`);
      fetchLogs();
    } catch (err: any) {
      alert(`Pruning failed: ${err.message}`);
    } finally {
      setIsPruning(false);
    }
  };

  // 5. Delete individual log row
  const handleDeleteSingleLog = async (id: string) => {
    const { error } = await supabase.from('whatsapp_message_logs').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // 6. Live Text Preview Helper
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

  // 7. Campaign Send Handler
  const handleSendCampaign = async () => {
    if (!selectedTemplate) return;
    if (!confirm(`Send "${selectedTemplate.display_name}" to ${recipientCount} recipients?`)) return;

    setIsSending(true);
    setResult(null);
    setBroadcastError(null);

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
        throw new Error(data?.error || 'Broadcast dispatch failed.');
      }
    } catch (err: any) {
      setBroadcastError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 8. Template Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingTemplateId(null);
    setFormTemplate({
      template_name: '',
      display_name: '',
      description: '',
      language: 'en',
      header_type: 'NONE',
      body_text: '',
      varLabels: '',
      has_dynamic_button: false,
      button_label: 'Visit Website',
      button_default_param: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tmpl: DBTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplateId(tmpl.id);
    setFormTemplate({
      template_name: tmpl.template_name,
      display_name: tmpl.display_name,
      description: tmpl.description || '',
      language: tmpl.language || 'en',
      header_type: tmpl.header_type || 'NONE',
      body_text: tmpl.body_text || '',
      varLabels: (tmpl.variables_config || []).map((v) => v.label).join(', '),
      has_dynamic_button: tmpl.has_dynamic_button || false,
      button_label: tmpl.button_label || 'Visit Website',
      button_default_param: tmpl.button_default_param || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteTemplate = async (tmpl: DBTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete template "${tmpl.display_name}"?`)) return;

    const { error } = await supabase.from('whatsapp_templates').delete().eq('id', tmpl.id);
    if (!error) {
      if (selectedTemplate?.id === tmpl.id) setSelectedTemplate(null);
      loadTemplates();
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVariables: TemplateVarConfig[] = formTemplate.varLabels
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0)
      .map((label) => ({ label, default: '' }));

    const payload = {
      template_name: formTemplate.template_name.trim().toLowerCase(),
      display_name: formTemplate.display_name.trim(),
      description: formTemplate.description.trim(),
      language: formTemplate.language.trim(),
      has_header: formTemplate.header_type !== 'NONE',
      header_type: formTemplate.header_type,
      body_text: formTemplate.body_text.trim(),
      variables_config: parsedVariables,
      has_dynamic_button: formTemplate.has_dynamic_button,
      button_label: formTemplate.button_label,
      button_default_param: formTemplate.button_default_param,
    };

    if (editingTemplateId) {
      await supabase.from('whatsapp_templates').update(payload).eq('id', editingTemplateId);
      setIsModalOpen(false);
      loadTemplates(editingTemplateId);
    } else {
      const { data } = await supabase.from('whatsapp_templates').insert(payload).select().single();
      setIsModalOpen(false);
      loadTemplates(data?.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-ink-200">
        <div>
          <h2 className="text-xl font-black text-ink-900 flex items-center gap-2">
            <Sparkles className="text-brand-600" size={22} /> WhatsApp Broadcast Manager
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Configure dynamic promotional campaigns and audit live delivery failure receipts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-ink-100 rounded-xl">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'broadcast'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <Radio size={14} /> Send Broadcast
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'logs'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            <ListFilter size={14} /> Delivery Logs & Cleanup
          </button>
        </div>
      </div>

      {/* TAB 1: SEND BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 Columns */}
          <div className="lg:col-span-7 space-y-5 bg-white p-6 rounded-2xl border border-ink-200 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500">
                1. Select Template
              </label>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                <Plus size={14} /> Add Template
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => selectTemplate(tmpl)}
                    className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-ink-200 hover:bg-ink-50/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink-900 truncate">
                          {tmpl.display_name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink-100 text-ink-600 shrink-0">
                          {tmpl.template_name} ({tmpl.language})
                        </span>
                      </div>
                      {tmpl.description && (
                        <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{tmpl.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditModal(tmpl, e)}
                        className="p-1 text-ink-400 hover:text-brand-600 rounded"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTemplate(tmpl, e)}
                        className="p-1 text-ink-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                2. Target Audience
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    audience === 'all'
                      ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600'
                      : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    checked={audience === 'all'}
                    onChange={() => setAudience('all')}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-ink-900">All Customers</div>
                    <div className="text-xs text-ink-500">Profiles with phone ({recipientCount ?? '...'})</div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    audience === 'registered'
                      ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-600'
                      : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    checked={audience === 'registered'}
                    onChange={() => setAudience('registered')}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-ink-900">Registered Accounts</div>
                    <div className="text-xs text-ink-500">Verified business profiles</div>
                  </div>
                </label>
              </div>
            </div>

            {selectedTemplate?.header_type === 'IMAGE' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-500 mb-1">
                  Header Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://yourstore.com/banner.jpg"
                  value={headerMediaUrl}
                  onChange={(e) => setHeaderMediaUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-ink-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            {selectedTemplate && (selectedTemplate.variables_config || []).length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-500">
                  3. Body Parameters
                </label>
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

            {selectedTemplate?.has_dynamic_button && (
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-500">
                  4. Dynamic Button Suffix / Query
                </label>
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
              {isSending ? 'Broadcasting Messages...' : `Send to ${recipientCount ?? 0} Recipients`}
            </button>
          </div>

          {/* Right Live Preview: 5 Columns */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-ink-950 p-5 rounded-2xl text-white shadow-md">
              <div className="flex items-center justify-between text-emerald-400 mb-3 pb-2 border-b border-ink-800 text-xs font-bold uppercase">
                <div className="flex items-center gap-1.5"><Eye size={15} /> WhatsApp Preview</div>
                <span className="font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                  {selectedTemplate?.template_name || 'None selected'}
                </span>
              </div>

              <div className="bg-[#EFEAE2] p-4 rounded-xl shadow-inner min-h-[220px] flex flex-col justify-between text-ink-900">
                <div className="bg-white p-3.5 rounded-xl rounded-tl-none shadow-sm space-y-2 border border-emerald-950/5">
                  {selectedTemplate?.header_type === 'IMAGE' && headerMediaUrl && (
                    <img
                      src={headerMediaUrl}
                      alt="Header Preview"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-xs leading-relaxed whitespace-pre-line">
                    {selectedTemplate ? renderLivePreview() : 'Select a template from the left to preview.'}
                  </p>
                  <div className="text-[10px] text-ink-400 text-right">12:00 PM</div>
                </div>

                {selectedTemplate?.has_dynamic_button && (
                  <div className="mt-3 bg-white border border-ink-200 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-brand-600 font-bold text-xs shadow-sm">
                    <ExternalLink size={13} /> {selectedTemplate.button_label}
                  </div>
                )}
              </div>
            </div>

            {broadcastError && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={16} />
                <div><b>Broadcast Error:</b> {broadcastError}</div>
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
      )}

      {/* TAB 2: DELIVERY LOGS & CLEANUP */}
      {activeTab === 'logs' && (
        <div className="space-y-5 bg-white p-6 rounded-2xl border border-ink-200 shadow-sm">
          {/* Controls Bar: Filters & Prune Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-ink-100">
            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <select
                value={logStatusFilter}
                onChange={(e: any) => setLogStatusFilter(e.target.value)}
                className="px-3 py-2 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 bg-white"
              >
                <option value="all">All Logs (Sent & Failed)</option>
                <option value="errors_only">Errors / Failures Only</option>
                <option value="sent_only">Successful / Sent Only</option>
              </select>

              {/* Time Filter */}
              <select
                value={logTimeFilter}
                onChange={(e: any) => setLogTimeFilter(e.target.value)}
                className="px-3 py-2 border border-ink-200 rounded-xl text-xs font-semibold text-ink-700 bg-white"
              >
                <option value="all">All Time</option>
                <option value="24h">Past 24 Hours</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
              </select>

              {/* Search Phone */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search phone number..."
                  value={logSearchPhone}
                  onChange={(e) => setLogSearchPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                  className="pl-8 pr-3 py-2 border border-ink-200 rounded-xl text-xs text-ink-800 w-44 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <button
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="px-3 py-2 bg-ink-50 hover:bg-ink-100 border border-ink-200 text-ink-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={isLoadingLogs ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            {/* Prune / Storage Cleanup Tool */}
            <div className="flex items-center gap-2 bg-rose-50/70 border border-rose-200 p-1.5 rounded-xl self-start lg:self-auto">
              <span className="text-[11px] font-bold text-rose-900 pl-2">Prune Logs:</span>
              <select
                value={pruneKeepCount}
                onChange={(e) => setPruneKeepCount(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-900"
              >
                <option value={10}>Keep Last 10</option>
                <option value={100}>Keep Last 100</option>
                <option value={1000}>Keep Last 1000</option>
                <option value={0}>Delete All</option>
              </select>
              <button
                onClick={handlePruneLogs}
                disabled={isPruning}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isPruning ? 'Cleaning...' : 'Execute'}
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-200 text-ink-500 uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Recipient Phone</th>
                  <th className="py-2.5 px-3">WhatsApp ID / Error Message</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 font-medium text-ink-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-ink-400">
                      {isLoadingLogs ? 'Loading message logs...' : 'No logs match your filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isFailed = log.status === 'failed';
                    return (
                      <tr key={log.id} className="hover:bg-ink-50/60 transition-colors">
                        <td className="py-3 px-3">
                          {isFailed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <XCircle size={12} /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 size={12} /> Sent
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-ink-900">
                          {log.recipient_phone}
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate">
                          {isFailed ? (
                            <span className="text-rose-600 font-semibold" title={log.error_message || ''}>
                              {log.error_message || 'Unknown API Error'}
                            </span>
                          ) : (
                            <span className="text-ink-400 font-mono text-[11px]" title={log.whatsapp_message_id || ''}>
                              {log.whatsapp_message_id || 'Delivered'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-ink-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteSingleLog(log.id)}
                            className="p-1 text-ink-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl border border-ink-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-ink-100">
              <h3 className="font-bold text-lg text-ink-900">
                {editingTemplateId ? 'Edit WhatsApp Template' : 'Add Approved Meta Template'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-ink-700 block mb-1">
                  Meta Template Name (Exact identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. flash_sale_promo"
                  value={formTemplate.template_name}
                  onChange={(e) =>
                    setFormTemplate({ ...formTemplate, template_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Display Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flash Sale"
                    value={formTemplate.display_name}
                    onChange={(e) =>
                      setFormTemplate({ ...formTemplate, display_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Language Code</label>
                  <input
                    type="text"
                    required
                    placeholder="en or en_US"
                    value={formTemplate.language}
                    onChange={(e) =>
                      setFormTemplate({ ...formTemplate, language: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief summary of when to use this template"
                  value={formTemplate.description}
                  onChange={(e) =>
                    setFormTemplate({ ...formTemplate, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Header Media Type</label>
                <select
                  value={formTemplate.header_type}
                  onChange={(e: any) =>
                    setFormTemplate({ ...formTemplate, header_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                >
                  <option value="NONE">None</option>
                  <option value="IMAGE">Image</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">Body Text Copy</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Hello {{1}}, check out our offer from {{2}}! Save {{3}}% off."
                  value={formTemplate.body_text}
                  onChange={(e) =>
                    setFormTemplate({ ...formTemplate, body_text: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-ink-700 block mb-1">
                  Variable Labels (Comma-separated for `&#123;&#123;2&#125;&#125;`, `&#123;&#123;3&#125;&#125;`...)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Store Name, Discount %, Promo Code"
                  value={formTemplate.varLabels}
                  onChange={(e) =>
                    setFormTemplate({ ...formTemplate, varLabels: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-ink-200 rounded-xl text-xs"
                />
                <p className="text-[10px] text-ink-400 mt-0.5">
                  Note: `&#123;&#123;1&#125;&#125;` is always reserved for Customer Name.
                </p>
              </div>

              <div className="pt-2 border-t border-ink-100 space-y-2">
                <label className="flex items-center gap-2 font-bold text-ink-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formTemplate.has_dynamic_button}
                    onChange={(e) =>
                      setFormTemplate({ ...formTemplate, has_dynamic_button: e.target.checked })
                    }
                    className="accent-brand-600"
                  />
                  Template has Dynamic URL Button
                </label>
                {formTemplate.has_dynamic_button && (
                  <div className="grid grid-cols-2 gap-3 pl-5">
                    <input
                      type="text"
                      placeholder="Button Text (e.g. Shop Now)"
                      value={formTemplate.button_label}
                      onChange={(e) =>
                        setFormTemplate({ ...formTemplate, button_label: e.target.value })
                      }
                      className="px-2.5 py-1.5 border border-ink-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Default Suffix (e.g. cart?p=1)"
                      value={formTemplate.button_default_param}
                      onChange={(e) =>
                        setFormTemplate({
                          ...formTemplate,
                          button_default_param: e.target.value,
                        })
                      }
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
                  {editingTemplateId ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
