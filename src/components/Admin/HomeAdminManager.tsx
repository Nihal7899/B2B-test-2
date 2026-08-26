import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Upload,
  X,
  Eye,
  Sliders,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import type {
  PromoBanner,
  HomeBanner,
  HomeSection,
  BannerSize,
  BannerPosition,
  BannerBgType,
  HomeSectionType,
} from '@/types';
import { PromoBannerCard } from '@/components/PromoBanner';
import {
  fetchHomeSections,
  createHomeSection,
  updateHomeSection,
  deleteHomeSection,
  fetchAllHomeBanners,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
  uploadBannerImage,
} from '@/services/catalog';

export default function HomeAdminManager() {
  const [activeTab, setActiveTab] = useState<'sections' | 'banners'>('sections');
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [newSection, setNewSection] = useState<Partial<HomeSection>>({
    title: 'Featured Promotion',
    subtitle: 'Exclusive discounts',
    sectionType: 'banner_slot',
    bannerPosition: 'middle_1',
    bannerSize: 'medium',
    isActive: true,
  });

  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [isNewBanner, setIsNewBanner] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [secRes, banRes] = await Promise.all([
        fetchHomeSections(),
        fetchAllHomeBanners(),
      ]);
      setSections(secRes);
      setBanners(banRes);
    } catch (err) {
      console.error('Error loading admin catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSection = async (sec: HomeSection) => {
    try {
      await updateHomeSection(sec.id, { isActive: !sec.isActive });
      setSections((prev) =>
        prev.map((s) => (s.id === sec.id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch (e) {
      alert('Failed to update section status');
    }
  };

  const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
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
    } catch (e) {
      console.error('Failed to sync sort order');
    }
  };

  const handleCreateSection = async () => {
    if (!newSection.title) return alert('Section title is required');
    setSaving(true);
    try {
      await createHomeSection({
        ...newSection,
        sortOrder: (sections.length + 1) * 10,
      });
      setShowSectionModal(false);
      await loadData();
    } catch (e) {
      alert('Error creating section');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section from Home?')) return;
    try {
      await deleteHomeSection(id);
      await loadData();
    } catch (e) {
      alert('Failed to delete section');
    }
  };

  const handleStartCreateBanner = () => {
    setEditingBanner({
      id: '',
      headline: 'Special Wholesale Deals',
      subtext: 'Get instant discounts on volume orders',
      badge: 'TOP DEAL',
      cta: 'Shop Now',
      image: '',
      position: 'middle_1',
      size: 'medium',
      bgType: 'gradient',
      bgColor: '#10b981',
      gradientFrom: '#065f46',
      gradientTo: '#10b981',
      gradientDirection: 'to right',
      overlayEnabled: false,
      overlayColor: '#000000',
      overlayOpacity: 40,
      showCta: true,
      displayOrder: banners.length + 1,
      isActive: true,
      actionType: 'OPEN_SCREEN',
      actionConfig: {},
    });
    setPreviewImageUrl('');
    setSelectedFile(null);
    setIsNewBanner(true);
  };

  const handleStartEditBanner = (b: HomeBanner) => {
    setEditingBanner({
      id: b.id,
      headline: b.title,
      subtext: b.description,
      cta: b.button_text,
      image: b.image_url || '',
      badge: b.badge || undefined,
      position: b.position || 'middle_1',
      size: b.size || 'medium',
      bgType: b.bg_type || 'gradient',
      bgColor: b.bg_color || '#16a34a',
      bgGradient: b.bg_gradient || '',
      gradientFrom: b.gradient_from || '#065f46',
      gradientTo: b.gradient_to || '#10b981',
      gradientDirection: b.gradient_direction || 'to right',
      overlayEnabled: b.overlay_enabled,
      overlayColor: b.overlay_color || '#000000',
      overlayOpacity: b.overlay_opacity || 40,
      showCta: b.show_cta !== false,
      displayOrder: b.display_order,
      isActive: b.is_active,
      actionType: b.action_type,
      actionConfig: b.action_config,
    });
    setPreviewImageUrl(b.image_url || '');
    setSelectedFile(null);
    setIsNewBanner(false);
  };

  const handleSaveBanner = async () => {
    if (!editingBanner || !editingBanner.headline) return alert('Headline is required');
    setSaving(true);
    try {
      let finalImg = previewImageUrl;
      if (selectedFile) {
        finalImg = await uploadBannerImage(selectedFile);
      }

      const payload = {
        ...editingBanner,
        image_url: finalImg || null,
        title: editingBanner.headline,
        description: editingBanner.subtext,
        button_text: editingBanner.cta,
      };

      if (isNewBanner) {
        await createHomeBanner(payload);
      } else {
        await updateHomeBanner(editingBanner.id, payload);
      }

      setEditingBanner(null);
      await loadData();
    } catch (e) {
      alert('Error saving banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteHomeBanner(id);
      await loadData();
    } catch (e) {
      alert('Failed to delete banner');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Home Layout & Banner Studio</h1>
          <p className="text-xs text-slate-500">Configure dynamic home sections, banner sizing, hex gradients, and positions</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border self-start">
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'sections' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-600'
            }`}
          >
            Dynamic Sections ({sections.length})
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
              activeTab === 'banners' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-600'
            }`}
          >
            Banner Studio ({banners.length})
          </button>
        </div>
      </div>

      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
            <div>
              <h2 className="text-sm font-black text-emerald-900">Dynamic Section Layout Sequence</h2>
              <p className="text-xs text-emerald-700">The mobile and web home screen renders items in this exact vertical order</p>
            </div>
            <button
              onClick={() => setShowSectionModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
            >
              <Plus size={15} /> Add Section
            </button>
          </div>

          <div className="space-y-2.5">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border bg-white shadow-sm transition-all ${
                  !section.isActive ? 'opacity-60 bg-slate-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">{section.title}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border">
                        {section.sectionType}
                      </span>
                      {section.sectionType === 'banner_slot' && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {section.bannerPosition} ({section.bannerSize})
                        </span>
                      )}
                    </div>
                    {section.subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{section.subtitle}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSection(section)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                      section.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {section.isActive ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="p-2 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-slate-800">Banner Studio</h2>
              <p className="text-xs text-slate-500">Add banners with size options, custom hex gradients, and optional images</p>
            </div>
            <button
              onClick={handleStartCreateBanner}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
            >
              <Plus size={15} /> Create Banner
            </button>
          </div>

          {editingBanner && (
            <div className="bg-white border rounded-2xl p-5 shadow-lg space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <Sliders size={16} className="text-emerald-600" />
                  {isNewBanner ? 'Create Promo Banner' : 'Edit Promo Banner'}
                </h3>
                <button onClick={() => setEditingBanner(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Headline *</label>
                    <input
                      type="text"
                      value={editingBanner.headline}
                      onChange={(e) => setEditingBanner({ ...editingBanner, headline: e.target.value })}
                      className="w-full border rounded-xl p-2.5 text-xs font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Subtext / Description</label>
                    <textarea
                      rows={2}
                      value={editingBanner.subtext || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, subtext: e.target.value })}
                      className="w-full border rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Size Option</label>
                      <select
                        value={editingBanner.size}
                        onChange={(e) => setEditingBanner({ ...editingBanner, size: e.target.value as BannerSize })}
                        className="w-full border rounded-xl p-2 text-xs bg-white font-bold"
                      >
                        <option value="small">Small (96px)</option>
                        <option value="medium">Medium (145px)</option>
                        <option value="large">Large Hero (210px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Slot Position</label>
                      <select
                        value={editingBanner.position}
                        onChange={(e) => setEditingBanner({ ...editingBanner, position: e.target.value as BannerPosition })}
                        className="w-full border rounded-xl p-2 text-xs bg-white font-bold"
                      >
                        <option value="top">Top Rectangular</option>
                        <option value="carousel">Top Carousel</option>
                        <option value="middle_1">Middle 1</option>
                        <option value="middle_2">Middle 2</option>
                        <option value="middle_3">Middle 3</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Background Style</label>
                      <select
                        value={editingBanner.bgType}
                        onChange={(e) => setEditingBanner({ ...editingBanner, bgType: e.target.value as BannerBgType })}
                        className="w-full border rounded-xl p-2 text-xs bg-white font-bold"
                      >
                        <option value="gradient">Custom Gradient</option>
                        <option value="color">Solid Colour</option>
                        <option value="image">Full Image</option>
                      </select>
                    </div>
                  </div>

                  {editingBanner.bgType === 'gradient' && (
                    <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-500">Custom Gradient Hex Stops</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.gradientFrom || '#065f46'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, gradientFrom: e.target.value })}
                            className="h-7 w-7 rounded border p-0.5"
                          />
                          <input
                            type="text"
                            value={editingBanner.gradientFrom || '#065f46'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, gradientFrom: e.target.value })}
                            className="flex-1 border rounded-lg p-1 text-xs uppercase font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.gradientTo || '#10b981'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, gradientTo: e.target.value })}
                            className="h-7 w-7 rounded border p-0.5"
                          />
                          <input
                            type="text"
                            value={editingBanner.gradientTo || '#10b981'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, gradientTo: e.target.value })}
                            className="flex-1 border rounded-lg p-1 text-xs uppercase font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-slate-500">
                        Side Image (Leave Empty for 100% Text Banner)
                      </label>
                      {previewImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewImageUrl('');
                            setEditingBanner({ ...editingBanner, image: '' });
                          }}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700"
                        >
                          Remove Image (Full Text)
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Image URL or upload..."
                        value={previewImageUrl}
                        onChange={(e) => setPreviewImageUrl(e.target.value)}
                        className="flex-1 border rounded-lg p-1.5 text-xs"
                      />
                      <label className="cursor-pointer px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Upload size={13} /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                              setPreviewImageUrl(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={editingBanner.showCta}
                        onChange={(e) => setEditingBanner({ ...editingBanner, showCta: e.target.checked })}
                      />
                      Show CTA Button
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={editingBanner.isActive}
                        onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex flex-col justify-between bg-slate-100 p-4 rounded-2xl">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-500 mb-2 flex items-center gap-1">
                      <Eye size={14} /> Live Preview ({editingBanner.size?.toUpperCase()})
                    </p>
                    <PromoBannerCard
                      banner={{
                        ...editingBanner,
                        image: previewImageUrl,
                      }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <button
                      onClick={() => setEditingBanner(null)}
                      className="px-3.5 py-1.5 border rounded-xl text-xs font-bold text-slate-600 bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBanner}
                      disabled={saving}
                      className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Banner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="bg-white border rounded-2xl p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase">
                  <span className="text-slate-500">
                    Pos: {b.position} • Size: {b.size || 'medium'}
                  </span>
                  <span className={b.is_active ? 'text-emerald-600' : 'text-red-500'}>
                    {b.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <PromoBannerCard
                  banner={{
                    id: b.id,
                    headline: b.title,
                    subtext: b.description,
                    cta: b.button_text,
                    image: b.image_url || '',
                    badge: b.badge || undefined,
                    position: b.position,
                    size: b.size,
                    bgType: b.bg_type,
                    bgColor: b.bg_color,
                    bgGradient: b.bg_gradient,
                    gradientFrom: b.gradient_from,
                    gradientTo: b.gradient_to,
                    gradientDirection: b.gradient_direction,
                    overlayEnabled: b.overlay_enabled,
                    overlayColor: b.overlay_color,
                    overlayOpacity: b.overlay_opacity,
                    showCta: b.show_cta,
                  }}
                />
                <div className="flex justify-end gap-2 pt-1 border-t">
                  <button
                    onClick={() => handleStartEditBanner(b)}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-black text-sm text-slate-800">Add New Home Section</h3>
              <button onClick={() => setShowSectionModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Section Title</label>
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="w-full border rounded-xl p-2 text-xs font-bold mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Section Type</label>
                <select
                  value={newSection.sectionType}
                  onChange={(e) => setNewSection({ ...newSection, sectionType: e.target.value as HomeSectionType })}
                  className="w-full border rounded-xl p-2 text-xs font-bold mt-1 bg-white"
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

              {newSection.sectionType === 'banner_slot' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Slot Position</label>
                    <select
                      value={newSection.bannerPosition}
                      onChange={(e) => setNewSection({ ...newSection, bannerPosition: e.target.value as BannerPosition })}
                      className="w-full border rounded-xl p-2 text-xs font-bold mt-1 bg-white"
                    >
                      <option value="middle_1">Middle 1</option>
                      <option value="middle_2">Middle 2</option>
                      <option value="middle_3">Middle 3</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Banner Size</label>
                    <select
                      value={newSection.bannerSize}
                      onChange={(e) => setNewSection({ ...newSection, bannerSize: e.target.value as BannerSize })}
                      className="w-full border rounded-xl p-2 text-xs font-bold mt-1 bg-white"
                    >
                      <option value="small">Small (96px)</option>
                      <option value="medium">Medium (145px)</option>
                      <option value="large">Large (210px)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setShowSectionModal(false)}
                className="px-3.5 py-1.5 border rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSection}
                disabled={saving}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black"
              >
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
