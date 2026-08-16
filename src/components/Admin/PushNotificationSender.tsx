import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import toast from 'react-hot-toast';
import { X, Plus, ChevronDown, ChevronRight, Upload, Trash2 } from 'lucide-react';

// ── Button presets ──
const BUTTON_PRESETS = [
  { id: 'view_order', label: 'View Order' },
  { id: 'view_product', label: 'View Product' },
  { id: 'view_cart', label: 'View Cart' },
  { id: 'track_delivery', label: 'Track Delivery' },
  { id: 'contact_support', label: 'Contact Support' },
  { id: 'accept', label: 'Accept' },
  { id: 'decline', label: 'Decline' },
  { id: 'custom', label: 'Custom...' },
];

// ── iOS Category presets ──
const IOS_CATEGORY_PRESETS = [
  { id: 'DEFAULT_CATEGORY', label: 'Default' },
  { id: 'ORDER_STATUS', label: 'Order Status' },
  { id: 'CHAT', label: 'Chat' },
  { id: 'PROMO', label: 'Promotional' },
  { id: 'DELIVERY', label: 'Delivery' },
  { id: 'custom', label: 'Custom...' },
];

// ── Crop options ──
const CROP_OPTIONS = [
  { value: 'landscape', label: 'Rich Media (2:1 landscape)', aspect: 2, width: 1024, height: 512 },
  { value: 'square', label: 'Square Icon (1:1)', aspect: 1, width: 256, height: 256 },
];

interface ActionButton {
  id: string;
  text: string;
  preset?: string;
}

export function PushNotificationSender() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dataJson, setDataJson] = useState('{}');
  const [audience, setAudience] = useState<'all' | 'admin' | 'warehouse' | 'delivery'>('all');
  const [image, setImage] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [buttons, setButtons] = useState<ActionButton[]>([{ id: 'view_order', text: 'View Order', preset: 'view_order' }]);
  const [sound, setSound] = useState('');
  const [badgeCount, setBadgeCount] = useState<number | ''>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [smallIcon, setSmallIcon] = useState('');
  const [largeIcon, setLargeIcon] = useState('');
  const [iosCategory, setIosCategory] = useState('');
  const [iosCategoryPreset, setIosCategoryPreset] = useState('custom');

  // Crop selection for upload
  const [selectedCrop, setSelectedCrop] = useState('landscape');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image upload with custom crop ────────────────────────────
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const crop = CROP_OPTIONS.find(c => c.value === selectedCrop) || CROP_OPTIONS[0];
      const processed = await processImage(file, crop.aspect, crop.width, crop.height, 0.8);
      const ext = processed.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `push-${Date.now()}.${ext}`;
      const bucket = 'push-notifications';
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, processed, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setImage(urlData.publicUrl);
      toast.success(`Image uploaded (${crop.label})`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => setImage('');

  // ── Button management ──────────────────────────────────────────
  const addButton = () => {
    setButtons([...buttons, { id: '', text: '', preset: 'custom' }]);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handlePresetChange = (index: number, presetId: string) => {
    const updated = [...buttons];
    const preset = BUTTON_PRESETS.find(p => p.id === presetId);
    if (preset && presetId !== 'custom') {
      updated[index] = { id: preset.id, text: preset.label, preset: preset.id };
    } else {
      updated[index] = { id: '', text: '', preset: 'custom' };
    }
    setButtons(updated);
  };

  const updateCustomField = (index: number, field: 'id' | 'text', value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  // ── iOS Category handlers ──
  const handleIosCategoryPreset = (presetId: string) => {
    setIosCategoryPreset(presetId);
    if (presetId === 'custom') {
      setIosCategory('');
    } else {
      setIosCategory(presetId);
    }
  };

  // ── Send notification ───────────────────────────────────────────
  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required');
      return;
    }

    let data;
    try {
      data = JSON.parse(dataJson);
    } catch {
      toast.error('Invalid JSON data');
      return;
    }

    const payload: any = {
      title,
      body,
      data,
      audience,
    };
    if (image.trim()) payload.image = image.trim();
    if (deepLink.trim()) payload.deepLink = deepLink.trim();
    if (buttons.length > 0) {
      const validButtons = buttons.filter(b => b.id.trim() && b.text.trim());
      if (validButtons.length) payload.buttons = validButtons.map(({ id, text }) => ({ id, text }));
    }
    if (sound.trim()) payload.sound = sound.trim();
    if (badgeCount !== '') payload.badgeCount = Number(badgeCount);
    if (scheduledAt) payload.scheduledAt = new Date(scheduledAt).toISOString();
    if (smallIcon.trim()) payload.smallIcon = smallIcon.trim();
    if (largeIcon.trim()) payload.largeIcon = largeIcon.trim();
    if (iosCategory.trim()) payload.iosCategory = iosCategory.trim();

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', { body: payload });
      if (error) throw error;
      toast.success('Notification sent successfully');
      // Reset form
      setTitle('');
      setBody('');
      setDataJson('{}');
      setImage('');
      setDeepLink('');
      setButtons([{ id: 'view_order', text: 'View Order', preset: 'view_order' }]);
      setSound('');
      setBadgeCount('');
      setScheduledAt('');
      setSmallIcon('');
      setLargeIcon('');
      setIosCategory('');
      setIosCategoryPreset('custom');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  // ── UI ──────────────────────────────────────────────────────────
  return (
    <div className="p-4 bg-white rounded-2xl shadow-card space-y-4">
      <h2 className="text-xl font-bold text-ink-900">Send Push Notification</h2>

      {/* Title & Body */}
      <div>
        <label className="block text-sm font-medium text-ink-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          placeholder="Notification title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          placeholder="Notification message"
        />
      </div>

      {/* Rich Media Image with Crop Option */}
      <div>
        <label className="block text-sm font-medium text-ink-700">Rich Media Image</label>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-3 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
          >
            {CROP_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
            placeholder="https://example.com/image.png or upload"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="h-10 px-3 rounded-xl bg-brand-50 text-brand-600 text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            {uploadingImage ? '...' : <Upload size={16} />} Upload
          </button>
          {image && (
            <button
              type="button"
              onClick={removeImage}
              className="h-10 px-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold flex items-center gap-1.5"
            >
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
        {image && (
          <div className="mt-2">
            <img src={image} alt="Preview" className="h-32 w-auto rounded-xl object-cover border border-ink-100" />
          </div>
        )}
        <p className="text-xs text-ink-400 mt-1">
          Choose crop: <strong>Rich Media (2:1)</strong> for big picture, <strong>Square (1:1)</strong> if using as an icon in custom data.
        </p>
      </div>

      {/* Deep Link */}
      <div>
        <label className="block text-sm font-medium text-ink-700">Deep Link (URL)</label>
        <input
          type="url"
          value={deepLink}
          onChange={(e) => setDeepLink(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          placeholder="https://yourapp.com/deeplink or myapp://page"
        />
      </div>

      {/* Action Buttons */}
      <div>
        <label className="block text-sm font-medium text-ink-700">Action Buttons</label>
        {buttons.map((btn, idx) => (
          <div key={idx} className="flex flex-wrap items-center gap-2 mt-2">
            <select
              value={btn.preset || 'custom'}
              onChange={(e) => handlePresetChange(idx, e.target.value)}
              className="px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
            >
              {BUTTON_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {btn.preset === 'custom' && (
              <>
                <input
                  type="text"
                  value={btn.id}
                  onChange={(e) => updateCustomField(idx, 'id', e.target.value)}
                  className="flex-1 min-w-[100px] px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="Button ID (e.g. open_product)"
                />
                <input
                  type="text"
                  value={btn.text}
                  onChange={(e) => updateCustomField(idx, 'text', e.target.value)}
                  className="flex-1 min-w-[100px] px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="Button label"
                />
              </>
            )}

            {btn.preset !== 'custom' && (
              <span className="text-xs text-ink-400">
                ID: <span className="font-mono">{btn.id}</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => removeButton(idx)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
              disabled={buttons.length === 1}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addButton}
          className="mt-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          disabled={buttons.length >= 3}
        >
          <Plus size={16} /> Add Button (max 3)
        </button>
        <p className="text-xs text-ink-400 mt-1">Buttons work on both platforms. For iOS, set a Category below.</p>
      </div>

      {/* Sound, Badge, Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink-700">Sound</label>
          <input
            type="text"
            value={sound}
            onChange={(e) => setSound(e.target.value)}
            className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
            placeholder="default"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700">Badge Count</label>
          <input
            type="number"
            value={badgeCount}
            onChange={(e) => setBadgeCount(e.target.value ? Number(e.target.value) : '')}
            className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700">Scheduled At</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Android‑specific */}
      <div className="border-t border-ink-100 pt-3">
        <button
          type="button"
          onClick={() => setShowAndroid(!showAndroid)}
          className="flex items-center gap-2 text-sm font-bold text-ink-700 hover:text-brand-600"
        >
          {showAndroid ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          Android‑specific settings
        </button>
        {showAndroid && (
          <div className="mt-3 space-y-3 bg-ink-50/30 p-3 rounded-xl border border-ink-100">
            <div>
              <label className="block text-sm font-medium text-ink-700">
                Small Icon (drawable resource name)
                <span className="text-xs text-ink-400 ml-1">(e.g. ic_notification)</span>
              </label>
              <input
                type="text"
                value={smallIcon}
                onChange={(e) => setSmallIcon(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                placeholder="ic_small_icon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700">
                Large Icon (drawable resource name)
                <span className="text-xs text-ink-400 ml-1">(e.g. ic_large)</span>
              </label>
              <input
                type="text"
                value={largeIcon}
                onChange={(e) => setLargeIcon(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                placeholder="ic_large_icon"
              />
            </div>
          </div>
        )}
      </div>

      {/* iOS‑specific */}
      <div className="border-t border-ink-100 pt-3">
        <button
          type="button"
          onClick={() => setShowIos(!showIos)}
          className="flex items-center gap-2 text-sm font-bold text-ink-700 hover:text-brand-600"
        >
          {showIos ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          iOS‑specific settings
        </button>
        {showIos && (
          <div className="mt-3 space-y-3 bg-ink-50/30 p-3 rounded-xl border border-ink-100">
            <div>
              <label className="block text-sm font-medium text-ink-700">
                Category (for action buttons)
                <span className="text-xs text-ink-400 ml-1">(required for buttons on iOS)</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={iosCategoryPreset}
                  onChange={(e) => handleIosCategoryPreset(e.target.value)}
                  className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
                >
                  {IOS_CATEGORY_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {iosCategoryPreset === 'custom' && (
                  <input
                    type="text"
                    value={iosCategory}
                    onChange={(e) => setIosCategory(e.target.value)}
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 text-sm"
                    placeholder="Custom category (e.g. MY_CATEGORY)"
                  />
                )}
              </div>
              {iosCategoryPreset !== 'custom' && (
                <p className="text-xs text-ink-400 mt-1">
                  Using category: <span className="font-mono">{iosCategory || 'None'}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Audience & Extra Data */}
      <div>
        <label className="block text-sm font-medium text-ink-700">Audience</label>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as any)}
          className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="all">All Users</option>
          <option value="admin">Admins</option>
          <option value="warehouse">Warehouse Managers</option>
          <option value="delivery">Delivery Partners</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-ink-700">Extra Data (JSON)</label>
        <input
          type="text"
          value={dataJson}
          onChange={(e) => setDataJson(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          placeholder='{"order_id": "12345", "product_id": "abc"}'
        />
      </div>

      <button
        onClick={sendNotification}
        disabled={loading || uploadingImage}
        className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Notification'}
      </button>
    </div>
  );
}

// ── Image processing helper ─────────────────────────────────────────────
async function processImage(
  file: File,
  aspectRatio: number,
  targetWidth: number,
  targetHeight: number,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context not available');

        let sourceX = 0,
          sourceY = 0,
          sourceWidth = img.width,
          sourceHeight = img.height;
        const imgAspect = img.width / img.height;
        if (imgAspect > aspectRatio) {
          sourceWidth = img.height * aspectRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          sourceHeight = img.width / aspectRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject('Blob creation failed');
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
            const processedFile = new File([blob], newName, { type: blob.type || 'image/jpeg' });
            resolve(processedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}