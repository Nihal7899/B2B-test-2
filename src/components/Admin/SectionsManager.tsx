import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X, Loader2, Save, Layers } from 'lucide-react';
import type { HomeSection, HomeSectionType, BannerPosition, BannerSize } from '@/types';
import {
  fetchHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
} from '@/services/catalog';
import { Toast, ToastContainer } from '@/components/ui/Toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

export default function SectionsManager() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    sectionId?: string;
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
    setLoading(true);
    try {
      const data = await fetchHomeSections();
      setSections(data);
    } catch {
      addToast('Failed to load sections', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (section: HomeSection) => {
    try {
      await updateHomeSection(section.id, { isActive: !section.isActive });
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, isActive: !s.isActive } : s))
      );
      addToast(`Section ${!section.isActive ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      addToast('Failed to toggle status', 'error');
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;

    const list = [...sections];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;

    const updated = list.map((s, i) => ({ ...s, sortOrder: (i + 1) * 10 }));
    setSections(updated);

    try {
      await Promise.all(updated.map((s) => updateHomeSection(s.id, { sortOrder: s.sortOrder })));
    } catch {
      addToast('Failed to save order', 'error');
    }
  };

  const handleStartCreate = () => {
    setEditingSection({
      id: '',
      title: 'New Section',
      subtitle: 'Section description',
      sectionType: 'banner_slot',
      bannerPosition: 'middle_1',
      bannerSize: 'medium',
      sortOrder: (sections.length + 1) * 10,
      isActive: true,
    });
    setIsNew(true);
  };

  const handleStartEdit = (section: HomeSection) => {
    setEditingSection({ ...section });
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editingSection?.title.trim()) {
      addToast('Title is required', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createHomeSection(editingSection);
        addToast('Section created', 'success');
      } else {
        await updateHomeSection(editingSection.id, editingSection);
        addToast('Section updated', 'success');
      }
      setEditingSection(null);
      await load();
    } catch {
      addToast('Failed to save section', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.sectionId) return;
    try {
      await deleteHomeSection(confirmDialog.sectionId);
      addToast('Section deleted', 'success');
      await load();
    } catch {
      addToast('Failed to delete section', 'error');
    } finally {
      setConfirmDialog({ isOpen: false, sectionId: undefined, title: '', message: '' });
    }
  };

  if (loading) {
    return <Loader2 className="animate-spin mx-auto text-brand-600 my-10" size={28} />;
  }

  return (
    <div className="space-y-4">
      <ToastContainer>
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))} />
        ))}
      </ToastContainer>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-ink-900">Home Screen Layout</h2>
          <p className="text-xs text-ink-500">Add, edit, reorder, or toggle sections dynamically</p>
        </div>
        <button
          onClick={handleStartCreate}
          className="h-10 px-4 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} /> Add section
        </button>
      </div>

      <div className="space-y-2.5">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className={`flex items-center justify-between p-3.5 rounded-2xl border bg-white shadow-card transition-all ${
              !section.isActive ? 'opacity-55 bg-ink-50/50' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex flex-col gap-0.5">
                <button
                  disabled={idx === 0}
                  onClick={() => handleReorder(idx, 'up')}
                  className="p-1 text-ink-400 hover:text-ink-700 disabled:opacity-20"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => handleReorder(idx, 'down')}
                  className="p-1 text-ink-400 hover:text-ink-700 disabled:opacity-20"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-ink-800 truncate">{section.title}</span>
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-ink-50 text-ink-600 border border-ink-100">
                    {section.sectionType}
                  </span>
                  {section.sectionType === 'banner_slot' && (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                      {section.bannerPosition} ({section.bannerSize})
                    </span>
                  )}
                </div>
                {section.subtitle && <p className="text-[11px] text-ink-400 truncate mt-0.5">{section.subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleToggle(section)}
                className={`h-8 px-2.5 rounded-xl text-[10px] font-bold border ${
                  section.isActive
                    ? 'bg-brand-50 text-brand-700 border-brand-200'
                    : 'bg-ink-50 text-ink-500 border-ink-200'
                }`}
              >
                {section.isActive ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => handleStartEdit(section)}
                className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setConfirmDialog({
                  isOpen: true,
                  sectionId: section.id,
                  title: 'Delete Section',
                  message: `Are you sure you want to delete "${section.title}" from the Home Screen?`,
                })}
                className="h-8 w-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile-Friendly Edit / Create Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 space-y-4 shadow-card">
            <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
              <h3 className="text-sm font-black text-ink-900 flex items-center gap-1.5">
                <Layers size={16} className="text-brand-600" />
                {isNew ? 'Add Home Section' : 'Edit Section'}
              </h3>
              <button onClick={() => setEditingSection(null)} className="h-8 w-8 flex items-center justify-center text-ink-400">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">Section Title *</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full h-10 rounded-xl border border-ink-200 px-3 text-xs font-bold outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                  className="w-full h-10 rounded-xl border border-ink-200 px-3 text-xs outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">Section Type</label>
                <select
                  value={editingSection.sectionType}
                  onChange={(e) => setEditingSection({ ...editingSection, sectionType: e.target.value as HomeSectionType })}
                  className="w-full h-10 rounded-xl border border-ink-200 px-3 text-xs font-bold bg-white outline-none focus:border-brand-500"
                >
                  <option value="categories">Categories Grid</option>
                  <option value="popular_products">Popular Products (Order Ranked)</option>
                  <option value="deals">Wholesale Deals (% Discount)</option>
                  <option value="essentials">Everyday Essentials (Staples)</option>
                  <option value="banner_slot">Banner Slot</option>
                  <option value="stores">Curated Stores</option>
                  <option value="brands">Trusted Brands</option>
                  <option value="perks">Perks & Value Badges</option>
                </select>
              </div>

              {editingSection.sectionType === 'banner_slot' && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-ink-700 mb-1">Slot Position</label>
                    <select
                      value={editingSection.bannerPosition || 'middle_1'}
                      onChange={(e) => setEditingSection({ ...editingSection, bannerPosition: e.target.value as BannerPosition })}
                      className="w-full h-10 rounded-xl border border-ink-200 px-2.5 text-xs font-bold bg-white outline-none focus:border-brand-500"
                    >
                      <option value="middle_1">Middle 1</option>
                      <option value="middle_2">Middle 2</option>
                      <option value="middle_3">Middle 3</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-700 mb-1">Banner Size</label>
                    <select
                      value={editingSection.bannerSize || 'medium'}
                      onChange={(e) => setEditingSection({ ...editingSection, bannerSize: e.target.value as BannerSize })}
                      className="w-full h-10 rounded-xl border border-ink-200 px-2.5 text-xs font-bold bg-white outline-none focus:border-brand-500"
                    >
                      <option value="small">Small (110px)</option>
                      <option value="medium">Medium (165px)</option>
                      <option value="large">Large (210px)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
              <button
                onClick={() => setEditingSection(null)}
                className="px-3.5 py-2 rounded-xl border border-ink-200 text-xs font-bold text-ink-600 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Section
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, sectionId: undefined, title: '', message: '' })}
      />
    </div>
  );
}
