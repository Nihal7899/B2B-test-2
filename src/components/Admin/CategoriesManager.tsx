// src/components/admin/CategoriesManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save, ChevronDown, ChevronRight, ImageIcon, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { DbCategory, Subcategory } from '@/types';
import { uploadCategoryImage, deleteCategoryImage } from '@/services/catalog';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { UploadProgress } from '@/components/ui/UploadProgress';
import { compressImage } from '@/lib/imageUtils';

export default function CategoriesManager() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, Subcategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingCategory, setEditingCategory] = useState<DbCategory | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    categoryId?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const load = useCallback(async () => {
    const [{ data: catData }, { data: subData }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
    ]);
    setCategories((catData as DbCategory[]) ?? []);
    const subMap: Record<string, Subcategory[]> = {};
    (subData as Subcategory[] || []).forEach(s => {
      if (!subMap[s.category_id]) subMap[s.category_id] = [];
      subMap[s.category_id].push(s);
    });
    setSubcategories(subMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      categoryId: id,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.categoryId) return;
    const { data: cat } = await supabase
      .from('categories')
      .select('image_url')
      .eq('id', confirmDialog.categoryId)
      .single();
    if (cat?.image_url) {
      await deleteCategoryImage(cat.image_url);
    }
    await supabase.from('categories').delete().eq('id', confirmDialog.categoryId);
    addToast('Category deleted', 'success');
    await load();
    setConfirmDialog({ isOpen: false, categoryId: undefined, title: '', message: '' });
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEdit = (cat: DbCategory) => {
    setEditingCategory(cat);
    setViewMode('form');
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setViewMode('form');
  };

  const handleFormClose = () => {
    setViewMode('list');
    setEditingCategory(null);
  };

  const handleFormSaved = () => {
    void load();
    setViewMode('list');
    addToast('Category saved successfully', 'success');
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  if (viewMode === 'form') {
    return (
      <CategoryForm
        initial={editingCategory}
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 rounded-xl border border-ink-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <button
        onClick={handleAddNew}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add category
      </button>

      {filteredCategories.map((cat) => (
        <div key={cat.id} className="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-card">
          <div className="flex flex-wrap items-center gap-3 p-4">
            {cat.image_url && <img src={cat.image_url} alt="" className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-ink-800 truncate">{cat.name}</p>
              <p className="text-xs text-ink-500">/{cat.slug} · Order {cat.sort_order}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-ink-500">Background:</span>
                <div
                  className="h-5 w-12 rounded border border-ink-200 flex-shrink-0"
                  style={{ background: cat.gradient || '#10b981' }}
                />
                <span className="text-[10px] text-ink-400 truncate max-w-[120px]">{cat.gradient?.slice(0, 40)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-auto flex-shrink-0">
              <button
                onClick={() => toggleExpand(cat.id)}
                className="h-8 w-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center"
              >
                {expanded[cat.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                onClick={() => handleEdit(cat)}
                className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
              >
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDeleteClick(cat.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {expanded[cat.id] && (
            <div className="border-t border-ink-100 p-4 bg-ink-50">
              <h4 className="text-xs font-bold text-ink-600 mb-2">Subcategories</h4>
              {subcategories[cat.id]?.length ? (
                <div className="space-y-1">
                  {subcategories[cat.id].map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-ink-700">{s.name}</span>
                      <span className="text-ink-400">/ {s.slug}</span>
                      <span className={`ml-auto ${s.is_active ? 'text-green-500' : 'text-red-400'}`}>
                        {s.is_active ? 'active' : 'inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-400">No subcategories yet.</p>
              )}
              <button
                onClick={() => {
                  alert('Open subcategory manager (you can add a link to the Subcategories tab)');
                }}
                className="mt-2 text-xs font-semibold text-brand-600"
              >
                + Manage subcategories
              </button>
            </div>
          )}
        </div>
      ))}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, categoryId: undefined, title: '', message: '' })}
      />
    </div>
  );
}

// ---- CategoryForm with pending upload ----
function CategoryForm({
  initial,
  onClose,
  onSaved,
  addToast,
}: {
  initial: DbCategory | null;
  onClose: () => void;
  onSaved: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const parseGradient = (g: string | undefined) => {
    if (!g) return { type: 'solid', solid: '#10b981', from: '#10b981', to: '#059669' };
    if (g.startsWith('linear-gradient')) {
      const matches = g.match(/#[0-9a-f]{6}/gi);
      if (matches && matches.length >= 2) {
        return { type: 'gradient', solid: '#10b981', from: matches[0], to: matches[1] };
      }
      return { type: 'solid', solid: '#10b981', from: '#10b981', to: '#059669' };
    }
    return { type: 'solid', solid: g, from: g, to: '#059669' };
  };

  const parsed = parseGradient(initial?.gradient);

  const [bgType, setBgType] = useState<'solid' | 'gradient'>(parsed.type);
  const [solidColor, setSolidColor] = useState(parsed.solid);
  const [gradientFrom, setGradientFrom] = useState(parsed.from);
  const [gradientTo, setGradientTo] = useState(parsed.to);

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    image_url: initial?.image_url ?? '',
    description: initial?.description ?? '',
    sort_order: initial?.sort_order ?? 0,
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

  const previewStyle = bgType === 'solid'
    ? { backgroundColor: solidColor }
    : { background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      addToast('Name and slug are required', 'warning');
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
        const url = await uploadCategoryImage(compressed, (p) => {
          const overall = 30 + (p * 0.7);
          setUploadProgress(Math.min(100, overall));
          setUploadStatus(`Uploading... ${Math.round(overall)}%`);
        });
        newImageUrl = url;
        setUploadProgress(100);
        setUploadStatus('Done');
        if (originalImageUrl && originalImageUrl !== url) {
          await deleteCategoryImage(originalImageUrl);
        }
        setSelectedFile(null);
        setUploading(false);
      }

      const gradientValue = bgType === 'solid' ? solidColor : `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`;
      const payload = { ...form, gradient: gradientValue, image_url: newImageUrl };

      if (initial) {
        await supabase.from('categories').update(payload).eq('id', initial.id);
      } else {
        await supabase.from('categories').insert(payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      addToast('Failed to save category', 'error');
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
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} category</h3>
        <button onClick={onClose}><X size={16} className="text-ink-400" /></button>
      </div>

      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Category name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Vegetables & Fruits"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Slug *</label>
        <input
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          placeholder="e.g. vegetables-fruits"
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
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

      {/* Background color section */}
      <div className="space-y-3 bg-ink-50 p-3 rounded-xl border border-ink-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-600">Background</span>
          <div className="flex gap-3">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={bgType === 'solid'}
                onChange={() => setBgType('solid')}
                className="accent-brand-600"
              /> Solid
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                checked={bgType === 'gradient'}
                onChange={() => setBgType('gradient')}
                className="accent-brand-600"
              /> Gradient
            </label>
          </div>
        </div>

        <div
          className="rounded-xl h-16 w-full flex items-center justify-center border border-ink-200 transition-all duration-200"
          style={previewStyle}
        >
          <span className="text-white text-sm font-bold drop-shadow-md">
            {bgType === 'solid' ? solidColor : `${gradientFrom} → ${gradientTo}`}
          </span>
        </div>

        {bgType === 'solid' ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <label className="text-xs font-bold text-ink-600 min-w-[70px]">Color</label>
            <div className="flex items-center gap-2 w-full">
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                className="h-10 w-12 rounded border border-ink-200 p-1 cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
                placeholder="#10b981"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-xs font-bold text-ink-600 min-w-[70px]">From</label>
              <div className="flex items-center gap-2 w-full">
                <input
                  type="color"
                  value={gradientFrom}
                  onChange={(e) => setGradientFrom(e.target.value)}
                  className="h-10 w-12 rounded border border-ink-200 p-1 cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={gradientFrom}
                  onChange={(e) => setGradientFrom(e.target.value)}
                  className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
                  placeholder="#10b981"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label className="text-xs font-bold text-ink-600 min-w-[70px]">To</label>
              <div className="flex items-center gap-2 w-full">
                <input
                  type="color"
                  value={gradientTo}
                  onChange={(e) => setGradientTo(e.target.value)}
                  className="h-10 w-12 rounded border border-ink-200 p-1 cursor-pointer flex-shrink-0"
                />
                <input
                  type="text"
                  value={gradientTo}
                  onChange={(e) => setGradientTo(e.target.value)}
                  className="flex-1 h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
                  placeholder="#059669"
                />
              </div>
            </div>
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