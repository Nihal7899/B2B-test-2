import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import toast from 'react-hot-toast';
import { X, Plus, ChevronDown, ChevronRight, Upload, Trash2 } from 'lucide-react';

interface ActionButton {
  id: string;
  text: string;
}

// ── Image Processing Helper ─────────────────────────────────────────────
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

        // Center crop to match aspect ratio
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

export function PushNotificationSender() {
  const { user } = useAuth();
  // Shared fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dataJson, setDataJson] = useState('{}');
  const [audience, setAudience] = useState<'all' | 'admin' | 'warehouse' | 'delivery'>('all');
  const [image, setImage] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [buttons, setButtons] = useState<ActionButton[]>([{ id: 'button1', text: 'Open' }]);
  const [sound, setSound] = useState('');
  const [badgeCount, setBadgeCount] = useState<number | ''>('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Android‑specific
  const [smallIcon, setSmallIcon] = useState('');
  const [largeIcon, setLargeIcon] = useState('');

  // iOS‑specific
  const [iosCategory, setIosCategory] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSmall, setUploadingSmall] = useState(false);
  const [uploadingLarge, setUploadingLarge] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const smallInputRef = useRef<HTMLInputElement>(null);
  const largeInputRef = useRef<HTMLInputElement>(null);

  // ── Generic upload handler ─────────────────────────────────────
  const handleFileUpload = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (loading: boolean) => void,
    cropConfig: { aspect: number; width: number; height: number }
  ) => {
    setUploading(true);
    try {
      const processed = await processImage(file, cropConfig.aspect, cropConfig.width, cropConfig.height, 0.8);
      const ext = processed.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `push-${Date.now()}.${ext}`;
      const bucket = 'push-notifications';

      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, processed, { cacheControl: '3600', upsert: false });
      if (uploadErr) {
        toast.error('Upload failed: ' + uploadErr.message);
        return;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setUrl(urlData.publicUrl);
      toast.success('Image uploaded and processed');
    } catch (err: any) {
      toast.error(err.message || 'Upload error');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (smallInputRef.current) smallInputRef.current.value = '';
      if (largeInputRef.current) largeInputRef.current.value = '';
    }
  };

  // ── Specific upload handlers ──────────────────────────────────
  const handleRichImageUpload = (file: File) =>
    handleFileUpload(file, setImage, setUploadingImage, { aspect: 2, width: 1024, height: 512 });

  const handleSmallIconUpload = (file: File) =>
    handleFileUpload(file, setSmallIcon, setUploadingSmall, { aspect: 1, width: 256, height: 256 });

  const handleLargeIconUpload = (file: File) =>
    handleFileUpload(file, setLargeIcon, setUploadingLarge, { aspect: 1, width: 256, height: 256 });

  const removeImage = () => setImage('');
  const removeSmallIcon = () => setSmallIcon('');
  const removeLargeIcon = () => setLargeIcon('');

  // ── Button management ──────────────────────────────────────────
  const addButton = () => {
    const nextId = `button${buttons.length + 1}`;
    setButtons([...buttons, { id: nextId, text: 'Action' }]);
  };
  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };
  const updateButton = (index: number, field: keyof ActionButton, value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
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
    if (buttons.length > 0) payload.buttons = buttons;
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
      setButtons([{ id: 'button1', text: 'Open' }]);
      setSound('');
      setBadgeCount('');
      setScheduledAt('');
      setSmallIcon('');
      setLargeIcon('');
      setIosCategory('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Rich Media Image */}
      <div>
        <label className="block text-sm font-medium text-ink-700">Rich Media Image (Landscape 2:1)</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
            placeholder="https://example.com/image.png or upload below"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleRichImageUpload(file);
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
            <img src={image} alt="Rich media preview" className="h-32 w-auto rounded-xl object-cover border border-ink-100" />
          </div>
        )}
        <p className="text-xs text-ink-400 mt-1">
          Cropped &amp; resized to 1024×512 (2:1) automatically.
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
          <div key={idx} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={btn.id}
              onChange={(e) => updateButton(idx, 'id', e.target.value)}
              className="flex-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
              placeholder="Button ID (e.g. open_product)"
            />
            <input
              type="text"
              value={btn.text}
              onChange={(e) => updateButton(idx, 'text', e.target.value)}
              className="flex-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
              placeholder="Button label"
            />
            <button
              type="button"
              onClick={() => removeButton(idx)}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addButton}
          className="mt-2 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          <Plus size={16} /> Add Button
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
          <div className="mt-3 space-y-4 bg-ink-50/30 p-3 rounded-xl border border-ink-100">
            {/* Small Icon */}
            <div>
              <label className="block text-sm font-medium text-ink-700">Small Icon (Square 1:1)</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={smallIcon}
                  onChange={(e) => setSmallIcon(e.target.value)}
                  className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                  placeholder="ic_small_icon or upload"
                />
                <input
                  ref={smallInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSmallIconUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => smallInputRef.current?.click()}
                  disabled={uploadingSmall}
                  className="h-10 px-3 rounded-xl bg-brand-50 text-brand-600 text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingSmall ? '...' : <Upload size={16} />} Upload
                </button>
                {smallIcon && (
                  <button
                    type="button"
                    onClick={removeSmallIcon}
                    className="h-10 px-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold flex items-center gap-1.5"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {smallIcon && (
                <div className="mt-2">
                  <img src={smallIcon} alt="Small icon preview" className="h-12 w-12 rounded-lg object-cover border border-ink-100" />
                </div>
              )}
              <p className="text-xs text-ink-400 mt-1">Cropped to 256×256 (square) automatically.</p>
            </div>

            {/* Large Icon */}
            <div>
              <label className="block text-sm font-medium text-ink-700">Large Icon (Square 1:1)</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={largeIcon}
                  onChange={(e) => setLargeIcon(e.target.value)}
                  className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                  placeholder="ic_large_icon or upload"
                />
                <input
                  ref={largeInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLargeIconUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => largeInputRef.current?.click()}
                  disabled={uploadingLarge}
                  className="h-10 px-3 rounded-xl bg-brand-50 text-brand-600 text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingLarge ? '...' : <Upload size={16} />} Upload
                </button>
                {largeIcon && (
                  <button
                    type="button"
                    onClick={removeLargeIcon}
                    className="h-10 px-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold flex items-center gap-1.5"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              {largeIcon && (
                <div className="mt-2">
                  <img src={largeIcon} alt="Large icon preview" className="h-16 w-16 rounded-lg object-cover border border-ink-100" />
                </div>
              )}
              <p className="text-xs text-ink-400 mt-1">Cropped to 256×256 (square) automatically.</p>
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
              <input
                type="text"
                value={iosCategory}
                onChange={(e) => setIosCategory(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                placeholder="DEFAULT_CATEGORY"
              />
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
          placeholder='{"key": "value"}'
        />
      </div>

      <button
        onClick={sendNotification}
        disabled={loading || uploadingImage || uploadingSmall || uploadingLarge}
        className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Notification'}
      </button>
    </div>
  );
}