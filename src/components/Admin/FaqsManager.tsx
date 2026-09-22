import { useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  fetchAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  type Faq,
} from '@/services/catalog';

const CATEGORIES = [
  { value: 'order_action', label: 'Order Actions (shown only from order details)' },
  { value: 'orders', label: 'Orders & Returns' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'payments', label: 'Payments & Refunds' },
  { value: 'business', label: 'Business & GST' },
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account' },
];

interface FormState {
  id?: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormState = {
  question: '',
  answer: '',
  category: 'general',
  sort_order: 0,
  is_active: true,
};

export default function FaqsManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = async () => {
    try {
      const data = await fetchAllFaqs();
      setFaqs(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleNew = () => {
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  };

  const handleEdit = (faq: Faq) => {
    setForm({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (faq: Faq) => {
    if (!confirm(`Delete FAQ:\n\n"${faq.question}"?`)) return;
    try {
      await deleteFaq(faq.id);
      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    }
  };

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      setError('Question and answer are both required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await updateFaq(form.id, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
      } else {
        await createFaq({
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
      }
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = faqs.filter(
    (f) =>
      !search.trim() ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, Faq[]>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <HelpCircle size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Help Center FAQs</h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {faqs.length} FAQ{faqs.length === 1 ? '' : 's'} configured
            </p>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black flex items-center gap-1.5 shadow-soft"
        >
          <Plus size={14} /> Add FAQ
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full h-10 pl-10 pr-3 rounded-xl bg-white border border-ink-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white border border-ink-100">
          <HelpCircle size={28} className="mx-auto text-ink-300 mb-2" />
          <p className="text-sm font-bold text-ink-700">No FAQs yet</p>
          <p className="text-xs text-ink-400 mt-1">Click "Add FAQ" to create your first one.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-ink-500 px-1">
              {CATEGORIES.find((c) => c.value === category)?.label || category}
            </p>
            <div className="bg-white border border-ink-100 rounded-2xl divide-y divide-ink-100 shadow-card overflow-hidden">
              {items.map((faq) => (
                <div key={faq.id} className="p-3.5 flex items-start gap-3 hover:bg-ink-50/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink-900 leading-snug">
                        {faq.question}
                      </p>
                      {!faq.is_active && (
                        <span className="shrink-0 text-[9px] font-black uppercase tracking-wider bg-ink-100 text-ink-500 px-1.5 py-0.5 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500 mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="h-8 w-8 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 flex items-center justify-center"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(faq)}
                      className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-ink-900">
                {form.id ? 'Edit FAQ' : 'New FAQ'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setError('');
                }}
                className="h-9 w-9 rounded-xl bg-ink-100 hover:bg-ink-200 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink-700">Question</label>
                <input
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="E.g., How do I track my order?"
                  className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 px-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-700">Answer</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  rows={5}
                  placeholder="Provide a clear, helpful answer..."
                  className="mt-1.5 w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 px-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink-700">Sort order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: Number(e.target.value) || 0 })
                    }
                    className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 px-3 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-ink-700 mb-1.5">Visibility</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`h-11 rounded-xl text-xs font-black border ${
                      form.is_active
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-ink-50 border-ink-200 text-ink-500'
                    }`}
                  >
                    {form.is_active ? 'Visible to users' : 'Hidden'}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setError('');
                }}
                className="flex-1 h-11 rounded-xl bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> {form.id ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}