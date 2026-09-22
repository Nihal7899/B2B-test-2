// src/components/admin/ProductsManager.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Save, ImageIcon, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchSubcategories, fetchDistinctBrands, deleteProductImage } from '@/services/catalog';
import type { DbCategory, DbProduct, Subcategory } from '@/types';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { UploadProgress } from '@/components/ui/UploadProgress';
import { compressImage } from '@/lib/imageUtils';
import { uploadProductImage } from '@/services/catalog';

export default function ProductsManager() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    productId?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const load = useCallback(async () => {
    const [{ data: prodData }, { data: catData }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((prodData as DbProduct[]) ?? []);
    setCategories((catData as DbCategory[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      productId: id,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? All images will be removed.',
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.productId) return;
    const { data: prod } = await supabase
      .from('products')
      .select('image_urls')
      .eq('id', confirmDialog.productId)
      .single();
    if (prod?.image_urls?.length) {
      await Promise.all(prod.image_urls.map(url => deleteProductImage(url).catch(console.error)));
    }
    await supabase.from('products').delete().eq('id', confirmDialog.productId);
    addToast('Product deleted', 'success');
    await load();
    setConfirmDialog({ isOpen: false, productId: undefined, title: '', message: '' });
  };

  const handleEdit = (prod: DbProduct) => {
    setEditingProduct(prod);
    setViewMode('form');
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setViewMode('form');
  };

  const handleFormClose = () => {
    setViewMode('list');
    setEditingProduct(null);
  };

  const handleFormSaved = () => {
    void load();
    setViewMode('list');
    addToast('Product saved successfully', 'success');
  };

  const filteredProducts = products.filter(prod =>
    (prod.brand + ' ' + prod.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  if (viewMode === 'form') {
    return (
      <ProductForm
        initial={editingProduct}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" size={16} />
        <input
          type="text"
          placeholder="Search products by brand or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 rounded-xl border border-ink-200 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
        />
      </div>

      <button
        onClick={handleAddNew}
        className="w-full h-12 rounded-xl bg-brand-600 text-white text-sm font-bold flex items-center justify-center gap-2"
      >
        <Plus size={16} /> Add product
      </button>

      {filteredProducts.map((prod) => (
        <div key={prod.id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card flex items-center gap-3">
          {prod.image_urls?.[0] && <img src={prod.image_urls[0]} alt="" className="h-12 w-12 rounded-xl object-cover" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-800 truncate">{prod.brand} {prod.name}</p>
            <p className="text-xs text-ink-500">{prod.pack_size} · ₹{prod.wholesale_price} · Stock: {prod.stock_quantity}</p>
            {prod.gst_percentage != null && prod.gst_percentage > 0 && (
              <span className="text-[10px] text-brand-600">GST: {prod.gst_percentage}%</span>
            )}
            {prod.image_urls?.length > 1 && (
              <span className="text-[10px] text-ink-400 ml-2">+{prod.image_urls.length - 1} more images</span>
            )}
          </div>
          <button
            onClick={() => handleEdit(prod)}
            className="h-8 w-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
          >
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDeleteClick(prod.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, productId: undefined, title: '', message: '' })}
      />
    </div>
  );
}

// ---- ProductForm ----
function ProductForm({
  initial,
  categories,
  onClose,
  onSaved,
  addToast,
}: {
  initial: DbProduct | null;
  categories: DbCategory[];
  onClose: () => void;
  onSaved: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState(initial?.brand ?? '');
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);

  const buildInitialImages = (): string[] => {
    const urls: string[] = [];
    if (initial?.image_url && initial.image_url.trim()) {
      urls.push(initial.image_url);
    }
    if (initial?.image_urls && initial.image_urls.length) {
      for (const url of initial.image_urls) {
        if (url && !urls.includes(url)) {
          urls.push(url);
        }
      }
    }
    return urls;
  };

  const initialImageUrls = buildInitialImages();
  const originalImageUrlsRef = useRef<string[]>(initialImageUrls);

  const [form, setForm] = useState({
    category_id: initial?.category_id ?? categories[0]?.id ?? '',
    subcategory_id: initial?.subcategory_id ?? '',
    brand: initial?.brand ?? '',
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    pack_size: initial?.pack_size ?? '',
    mrp: initial?.mrp ?? 0,
    wholesale_price: initial?.wholesale_price ?? 0,
    moq: initial?.moq ?? 1,
    stock_quantity: initial?.stock_quantity ?? 0,
    stock_threshold: initial?.stock_threshold ?? 0,  // <-- NEW
    description: initial?.description ?? '',
    rating: initial?.rating ?? 0,
    is_active: initial?.is_active ?? true,
    hsn_code: initial?.hsn_code ?? '',
    gst_percentage: initial?.gst_percentage ?? 0,
  });

  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(initialImageUrls);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    if (!form.category_id) {
      setSubcategories([]);
      return;
    }
    fetchSubcategories(form.category_id).then(setSubcategories);
  }, [form.category_id]);

  useEffect(() => {
    fetchDistinctBrands().then(setBrandSuggestions);
  }, []);

  useEffect(() => {
    if (brandInput.trim() === '') {
      setFilteredBrands(brandSuggestions.slice(0, 10));
    } else {
      const lower = brandInput.toLowerCase();
      setFilteredBrands(
        brandSuggestions.filter(b => b.toLowerCase().includes(lower)).slice(0, 10)
      );
    }
  }, [brandInput, brandSuggestions]);

  useEffect(() => {
    if (!form.slug && form.name) {
      setForm(prev => ({
        ...prev,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      }));
    }
  }, [form.name]);

  const handleBrandSelect = (brand: string) => {
    setBrandInput(brand);
    setForm({ ...form, brand });
    setShowBrandSuggestions(false);
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const total = imageUrls.length + pendingFiles.length + fileArray.length;
    if (total > 5) {
      addToast('Maximum 5 images allowed', 'warning');
      return;
    }
    setPendingFiles([...pendingFiles, ...fileArray]);
    const newPreviews = fileArray.map(f => URL.createObjectURL(f));
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    if (index < 0 || index >= previewUrls.length) return;
    const isPending = index >= imageUrls.length;
    if (isPending) {
      const fileIndex = index - imageUrls.length;
      setPendingFiles(pendingFiles.filter((_, i) => i !== fileIndex));
      setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    } else {
      const newUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newUrls);
      setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.brand || !form.category_id) {
      addToast('Name, slug, brand, and category are required', 'warning');
      return;
    }

    setSaving(true);
    let finalImageUrls = [...imageUrls];
    const originalUrls = originalImageUrlsRef.current;

    try {
      if (pendingFiles.length > 0) {
        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('Compressing images...');

        const uploadedUrls: string[] = [];
        for (let i = 0; i < pendingFiles.length; i++) {
          const file = pendingFiles[i];
          setUploadStatus(`Processing image ${i+1}/${pendingFiles.length}...`);
          for (let j = 0; j <= 6; j++) {
            const progress = Math.min(30, (j / 6) * 30);
            setUploadProgress(progress);
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          const compressed = await compressImage(file);
          setUploadStatus(`Uploading image ${i+1}/${pendingFiles.length}...`);
          setUploadProgress(30 + (i / pendingFiles.length) * 60);
          const url = await uploadProductImage(compressed, (p) => {
            const overall = 30 + (i / pendingFiles.length) * 60 + (p * 0.6 / pendingFiles.length);
            setUploadProgress(Math.min(100, overall));
            setUploadStatus(`Uploading ${i+1}/${pendingFiles.length}... ${Math.round(overall)}%`);
          });
          uploadedUrls.push(url);
        }
        setUploadProgress(100);
        setUploadStatus('Upload complete!');
        finalImageUrls = [...finalImageUrls, ...uploadedUrls];
        setPendingFiles([]);
        setUploading(false);
      }

      const removedUrls = originalUrls.filter(url => !finalImageUrls.includes(url));
      for (const url of removedUrls) {
        await deleteProductImage(url);
      }

      const mainImage = finalImageUrls.length ? finalImageUrls[0] : '';
      const payload = {
        ...form,
        image_url: mainImage,
        image_urls: finalImageUrls,
        stock_threshold: form.stock_threshold, // <-- ensure included
      };

      if (initial) {
        await supabase.from('products').update(payload).eq('id', initial.id);
      } else {
        await supabase.from('products').insert(payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
      addToast('Failed to save product', 'error');
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
        <h3 className="text-sm font-bold text-ink-900">{initial ? 'Edit' : 'New'} product</h3>
        <button onClick={onClose}><X size={16} className="text-ink-400" /></button>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Category *</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Subcategory */}
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Subcategory</label>
        <select
          value={form.subcategory_id}
          onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
          className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        >
          <option value="">None</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Brand + Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <label className="block text-xs font-bold text-ink-600 mb-1">Brand *</label>
          <input
            value={brandInput}
            onChange={(e) => {
              setBrandInput(e.target.value);
              setForm({ ...form, brand: e.target.value });
              setShowBrandSuggestions(true);
            }}
            onFocus={() => setShowBrandSuggestions(true)}
            onBlur={() => setTimeout(() => setShowBrandSuggestions(false), 200)}
            placeholder="e.g. Fortune"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          {showBrandSuggestions && filteredBrands.length > 0 && (
            <div className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-ink-200 rounded-xl shadow-lg">
              {filteredBrands.map(b => (
                <div
                  key={b}
                  onMouseDown={() => handleBrandSelect(b)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-brand-50"
                >
                  {b}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Sunflower Oil"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Slug + Pack Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            placeholder="e.g. sunflower-oil"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Pack size *</label>
          <input
            value={form.pack_size}
            onChange={(e) => setForm({ ...form, pack_size: e.target.value })}
            placeholder="e.g. 1 L"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">MRP</label>
          <input
            type="number"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Wholesale</label>
          <input
            type="number"
            value={form.wholesale_price}
            onChange={(e) => setForm({ ...form, wholesale_price: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">MOQ</label>
          <input
            type="number"
            value={form.moq}
            onChange={(e) => setForm({ ...form, moq: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Stock + Threshold + Rating */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Stock quantity</label>
          <input
            type="number"
            value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Stock threshold</label>
          <input
            type="number"
            min="0"
            value={form.stock_threshold}
            onChange={(e) => setForm({ ...form, stock_threshold: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <p className="text-[10px] text-ink-400 mt-1">Alert when stock falls below this</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">Rating</label>
          <input
            type="number"
            step="0.1"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* HSN + GST */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">HSN Code</label>
          <input
            value={form.hsn_code}
            onChange={(e) => setForm({ ...form, hsn_code: e.target.value })}
            placeholder="e.g. 1512"
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink-600 mb-1">GST %</label>
          <select
            value={form.gst_percentage}
            onChange={(e) => setForm({ ...form, gst_percentage: Number(e.target.value) })}
            className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Images (max 5)</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {previewUrls.map((url, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-xl border border-ink-200 overflow-hidden group">
              <img src={url} alt={`Product ${idx+1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100 text-xs"
              >
                <X size={12} />
              </button>
              {idx < imageUrls.length && idx === 0 && (
                <span className="absolute bottom-1 left-1 bg-brand-600 text-white text-[8px] px-1 rounded">Main</span>
              )}
            </div>
          ))}
          {previewUrls.length < 5 && (
            <label className="w-16 h-16 rounded-xl border-2 border-dashed border-ink-200 flex items-center justify-center cursor-pointer hover:border-brand-500 transition-colors">
              <ImageIcon size={20} className="text-ink-400" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files)}
              />
            </label>
          )}
        </div>
        <p className="text-[10px] text-ink-400 mt-1">Upload up to 5 images. The first image is the main product image.</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-ink-600 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Product description"
          rows={2}
          className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 resize-none"
        />
      </div>

      {/* Active */}
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          className="accent-brand-600"
        /> Active
      </label>

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