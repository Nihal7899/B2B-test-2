// src/components/admin/SubcategoriesManager.tsx
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchCategories } from '@/services/catalog';
import { uploadSubcategoryImage, deleteSubcategoryImage } from '@/services/catalog';
import type { Subcategory, Category } from '@/types';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { UploadProgress } from '@/components/ui/UploadProgress';
import { compressImage } from '@/lib/imageUtils';

export default function SubcategoriesManager() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    subcategoryId?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const load = async () => {
    const { categories } = await fetchCategories();
    setCategories(categories);
    const { data } = await supabase.from('subcategories').select('*').order('sort_order');
    setSubcategories((data as Subcategory[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      subcategoryId: id,
      title: 'Delete Subcategory',
      message: 'Are you sure you want to delete this subcategory?',
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.subcategoryId) return;
    const { data: sub } = await supabase
      .from('subcategories')
      .select('image_url')
      .eq('id', confirmDialog.subcategoryId)
      .single();
    if (sub?.image_url) {
      await deleteSubcategoryImage(sub.image_url);
    }
    await supabase.from('subcategories').delete().eq('id', confirmDialog.subcategoryId);
    addToast('Subcategory deleted', 'success');
    await load();
    setConfirmDialog({ isOpen: false, subcategoryId: undefined, title: '', message: '' });
  };

  const handleEdit = (s: Subcategory) => {
    setEditingSubcategory(s);
    setViewMode('form');
  };

  const handleAddNew = () => {
    setEditingSubcategory(null);
    setViewMode('form');
  };

  const handleFormClose = () => {
    setViewMode('list');
    setEditingSubcategory(null);
  };

  const handleFormSaved = () => {
    void load();
    setViewMode('list');
    addToast('Subcategory saved successfully', 'success');
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  if (viewMode === 'form') {
    return (
      <SubcategoryForm
        initial={editingSubcategory}
        categories={categories}
        onClose={handleFormClose}
        onSaved={handleFormSaved}
        addToast={addToast}
      />
    );
  }

  return (
    <div className="space-y-3">
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))} />
        ))}
      </ToastContainer>

      <button
        onClick={handleAddNew}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add subcategory
      </button>

      {subcategories.map((s) => (
        <div key={s.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
          {s.image_url && <img src={s.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{s.name}</p>
            <p className="text-xs text-ink-500">/{s.slug} · {categories.find(c => c.id === s.category_id)?.name || 'Unknown'}</p>
          </div>
          <button
            onClick={() => handleEdit(s)}
            className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
          >
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDeleteClick(s.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, subcategoryId: undefined, title: '', message: '' })}
      />
    </div>
  );
}

function SubcategoryForm({
  initial,
  categories,
  onClose,
  onSaved,
  addToast,
}: {
  initial: Subcategory | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const [form, setForm] = useState({
    category_id: initial?.category_id || categories[0]?.id || '',
    name: initial?.name || '',
    slug: initial?.slug || '',
    image_url: initial?.image_url || '',
    description: initial?.description || '',
    sort_order: initial?.sort_order || 0,
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initial?.image_url ?? '');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(initial?.image_url ?? null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.category_id) {
      addToast('Name, slug, and category are required', 'warning');
      return;
    }

    setSaving(true);
    let newImageUrl = form.image_url;

    try {
      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('Compressing image...');
        const steps = 6;
        for (let i = 0; i <= steps; i++) {
          const progress = Math.min(30, (i / steps) * 30);
          setUploadProgress(progress);
          setUploadStatus(`Compressing... ${Math.round(progress)}%`);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        const compressed = await compressImage(selectedFile);
        setUploadStatus('Uploading...');
        setUploadProgress(30);
        const url = await uploadSubcategoryImage(compressed, (p) => {
          const overall = 30 + (p * 0.7);
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading... ${Math.round(overall)}%`);
        });
        newImageUrl = url;
        setUploadProgress(100);
        setUploadStatus('Done');
        if (originalImageUrl && originalImageUrl !== url) {
          await deleteSubcategoryImage(originalImageUrl);
        }
        setSelectedFile(null);
        setUploading(false);
      }

      const payload = { ...form, image_url: newImageUrl };
      if (initial) {
        await supabase.from('subcategories').update(payload).eq('id', initial.id);
      } else {
        await supabase.from('subcategories').insert(payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      addToast('Failed to save subcategory', 'error');
    } finally {
      setSaving(false);
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  if (uploading) {
    return <UploadProgress progress={uploadProgress} statusText={uploadStatus} isComplete={uploadProgress >= 100} />;
  }

  return (
    <div className="bg-white border border-brand-200 rounded-2xl p-4 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} subcategory</h3>
        <button onClick={onClose}><X size={16} className="text-ink-400" /></button>
      </div>

      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Category *</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Fresh Vegetables"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g. fresh-vegetables"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Image URL</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={form.image_url}
            onChange={(e) => {
              setForm({ ...form, image_url: e.target.value });
              setPreviewUrl(e.target.value);
            }}
            placeholder="Image URL or upload"
            className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <label className="h-10 px-3 rounded-xl bg-brand-50 text-brand-600 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
            <ImageIcon size={14} /> Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
          </label>
        </div>
        {previewUrl && (
          <div className="relative mt-2">
            <img src={previewUrl} alt="Preview" className="h-20 w-full rounded-xl object-cover" />
            {selectedFile && (
              <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Description</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Sort order</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div className="flex items-end h-10">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="accent-brand-600"
            /> Active
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save</>}
      </button>
    </div>
  );
}