import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import toast from 'react-hot-toast';
import { X, Plus, ChevronDown, ChevronRight, Upload, Trash2, Pencil, Save, Volume2 } from 'lucide-react';

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
  { value: 'square', label: 'Square (1:1)', aspect: 1, width: 256, height: 256 },
];

interface ActionButton {
  id: string;
  text: string;
  preset?: string;
}

interface NotificationChannel {
  id: string;
  channel_id: string;
  name: string;
  description?: string;
  small_icon?: string;
  sound?: string;
}

export function PushNotificationSender() {
  const { user } = useAuth();

  // ── Notification fields ──
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dataJson, setDataJson] = useState('{}');
  const [audience, setAudience] = useState<'all' | 'admin' | 'warehouse' | 'delivery'>('all');
  const [image, setImage] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [buttons, setButtons] = useState<ActionButton[]>([{ id: 'view_order', text: 'View Order', preset: 'view_order' }]);
  const [badgeCount, setBadgeCount] = useState<number | ''>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [largeIcon, setLargeIcon] = useState('');
  const [iosCategory, setIosCategory] = useState('');
  const [iosCategoryPreset, setIosCategoryPreset] = useState('custom');

  // ── Android accent colour (with # for display) ──
  const [accentColor, setAccentColor] = useState('#007AFF');

  // ── Small icon state ──
  const [smallIcon, setSmallIcon] = useState('');
  const [availableSmallIcons, setAvailableSmallIcons] = useState<string[]>([]);

  // ── Sound state ──
  const [sound, setSound] = useState('');

  // ── Channel state ──
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState('');

  // ── Add channel form ──
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelSmallIcon, setNewChannelSmallIcon] = useState('');
  const [newChannelSound, setNewChannelSound] = useState('');
  const [addingChannel, setAddingChannel] = useState(false);

  // ── Edit channel ──
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSmallIcon, setEditSmallIcon] = useState('');
  const [editSound, setEditSound] = useState('');
  const [updatingChannel, setUpdatingChannel] = useState(false);

  // ── Crop selections ──
  const [selectedImageCrop, setSelectedImageCrop] = useState('landscape');
  const [selectedLargeIconCrop, setSelectedLargeIconCrop] = useState('square');

  // ── Loading & UI state ──
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLargeIcon, setUploadingLargeIcon] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const largeIconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChannelsAndIcons();
  }, []);

  const fetchChannelsAndIcons = async () => {
    setLoadingChannels(true);
    try {
      const { data: channelsData, error: channelsError } = await supabase
        .from('notification_channels')
        .select('*')
        .order('name');
      if (channelsError) throw channelsError;
      setChannels(channelsData || []);

      const { data: iconData, error: iconError } = await supabase
        .from('notification_channels')
        .select('small_icon')
        .not('small_icon', 'is', null);
      if (iconError) throw iconError;
      const icons = iconData
        .map(row => row.small_icon)
        .filter((icon): icon is string => typeof icon === 'string' && icon.trim() !== '');
      const uniqueIcons = Array.from(new Set(icons));
      setAvailableSmallIcons(uniqueIcons);

      if (channelsData && channelsData.length > 0 && !selectedChannelId) {
        const first = channelsData[0];
        setSelectedChannelId(first.channel_id);
        if (first.small_icon && uniqueIcons.includes(first.small_icon)) {
          setSmallIcon(first.small_icon);
        } else {
          setSmallIcon('');
        }
        setSound(first.sound || '');
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      toast.error('Could not load notification channels');
    } finally {
      setLoadingChannels(false);
    }
  };

  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    const channel = channels.find(ch => ch.channel_id === channelId);
    if (channel?.small_icon) {
      setSmallIcon(channel.small_icon);
      if (!availableSmallIcons.includes(channel.small_icon)) {
        setAvailableSmallIcons(prev => [...prev, channel.small_icon!]);
      }
    } else {
      setSmallIcon('');
    }
    setSound(channel?.sound || '');
  };

  const handleSmallIconChange = (value: string) => {
    setSmallIcon(value);
  };

  const uploadFile = async (
    file: File,
    setUrl: (url: string) => void,
    setUploading: (loading: boolean) => void,
    cropValue: string,
    folder: string = 'push-notifications'
  ) => {
    setUploading(true);
    try {
      const crop = CROP_OPTIONS.find(c => c.value === cropValue) || CROP_OPTIONS[0];
      const processed = await processImage(file, crop.aspect, crop.width, crop.height, 0.8);
      const ext = processed.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${folder}-${Date.now()}.${ext}`;
      const bucket = 'push-notifications';
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(fileName, processed, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setUrl(urlData.publicUrl);
      toast.success(`Uploaded (${crop.label})`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (largeIconInputRef.current) largeIconInputRef.current.value = '';
    }
  };

  const handleImageUpload = (file: File) =>
    uploadFile(file, setImage, setUploadingImage, selectedImageCrop, 'push-rich');

  const handleLargeIconUpload = (file: File) =>
    uploadFile(file, setLargeIcon, setUploadingLargeIcon, selectedLargeIconCrop, 'push-icon');

  const removeImage = () => setImage('');
  const removeLargeIcon = () => setLargeIcon('');

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

  const handleIosCategoryPreset = (presetId: string) => {
    setIosCategoryPreset(presetId);
    if (presetId === 'custom') {
      setIosCategory('');
    } else {
      setIosCategory(presetId);
    }
  };

  // ── Add channel with sound support ──
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = newChannelId.trim();
    const trimmedName = newChannelName.trim();
    if (!trimmedId || !trimmedName) {
      toast.error('Channel ID and Name are required');
      return;
    }
    setAddingChannel(true);
    try {
      const { error } = await supabase
        .from('notification_channels')
        .insert({
          channel_id: trimmedId,
          name: trimmedName,
          description: newChannelDescription.trim() || null,
          small_icon: newChannelSmallIcon.trim() || null,
          sound: newChannelSound.trim() || null,
        });
      if (error) throw error;
      toast.success('Channel added successfully');
      setNewChannelId('');
      setNewChannelName('');
      setNewChannelDescription('');
      setNewChannelSmallIcon('');
      setNewChannelSound('');
      setShowAddChannel(false);
      await fetchChannelsAndIcons();
      setSelectedChannelId(trimmedId);
      if (newChannelSmallIcon.trim()) setSmallIcon(newChannelSmallIcon.trim());
      if (newChannelSound.trim()) setSound(newChannelSound.trim());
    } catch (err: any) {
      toast.error(err.message || 'Failed to add channel');
    } finally {
      setAddingChannel(false);
    }
  };

  // ── Edit channel with sound support ──
  const startEdit = (channel: NotificationChannel) => {
    setEditingChannelId(channel.id);
    setEditName(channel.name);
    setEditDescription(channel.description || '');
    setEditSmallIcon(channel.small_icon || '');
    setEditSound(channel.sound || '');
  };

  const cancelEdit = () => {
    setEditingChannelId(null);
    setEditName('');
    setEditDescription('');
    setEditSmallIcon('');
    setEditSound('');
  };

  const saveEdit = async (channelId: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error('Name is required');
      return;
    }
    setUpdatingChannel(true);
    try {
      const { error } = await supabase
        .from('notification_channels')
        .update({
          name: trimmedName,
          description: editDescription.trim() || null,
          small_icon: editSmallIcon.trim() || null,
          sound: editSound.trim() || null,
        })
        .eq('id', channelId);
      if (error) throw error;
      toast.success('Channel updated');
      cancelEdit();
      await fetchChannelsAndIcons();
      const updated = channels.find(ch => ch.id === channelId);
      if (updated && updated.channel_id === selectedChannelId) {
        setSmallIcon(updated.small_icon || '');
        setSound(editSound.trim() || '');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update channel');
    } finally {
      setUpdatingChannel(false);
    }
  };

  const deleteChannel = async (channel: NotificationChannel) => {
    if (!confirm(`Are you sure you want to delete the channel "${channel.name}"?`)) return;
    try {
      const { error } = await supabase
        .from('notification_channels')
        .delete()
        .eq('id', channel.id);
      if (error) throw error;
      toast.success('Channel deleted');
      if (channel.channel_id === selectedChannelId) {
        setSelectedChannelId('');
        setSmallIcon('');
        setSound('');
      }
      await fetchChannelsAndIcons();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete channel');
    }
  };

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

    let cleanAccent = accentColor.trim();
    if (cleanAccent.startsWith('#')) {
      cleanAccent = cleanAccent.slice(1);
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
    if (badgeCount !== '') payload.badgeCount = Number(badgeCount);
    if (scheduledAt) payload.scheduledAt = new Date(scheduledAt).toISOString();
    if (smallIcon.trim()) payload.smallIcon = smallIcon.trim();
    if (largeIcon.trim()) payload.largeIcon = largeIcon.trim();
    if (iosCategory.trim()) payload.iosCategory = iosCategory.trim();
    if (selectedChannelId) payload.channelId = selectedChannelId;
    if (sound.trim()) payload.sound = sound.trim();
    if (cleanAccent) payload.accentColor = cleanAccent;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', { body: payload });
      if (error) throw error;
      toast.success('Notification sent successfully');
      setTitle('');
      setBody('');
      setDataJson('{}');
      setImage('');
      setDeepLink('');
      setButtons([{ id: 'view_order', text: 'View Order', preset: 'view_order' }]);
      setBadgeCount('');
      setScheduledAt('');
      setLargeIcon('');
      setIosCategory('');
      setIosCategoryPreset('custom');
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
        <label className="block text-sm font-medium text-ink-700">Rich Media Image</label>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <select
            value={selectedImageCrop}
            onChange={(e) => setSelectedImageCrop(e.target.value)}
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
      </div>

      {/* Deep Link */}
      <div>
        <label className="block text-sm font-medium text-ink-700">Deep Link (URL)</label>
        <input
          type="url"
          value={deepLink}
          onChange={(e) => setDeepLink(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
          placeholder="https://yourapp.com/deeplink or /order?id=123"
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
                  placeholder="Button ID (e.g. view_order)"
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
      </div>

      {/* Badge, Schedule, Channel ID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        <div>
          <label className="block text-sm font-medium text-ink-700">Channel</label>
          <select
            value={selectedChannelId}
            onChange={(e) => handleChannelChange(e.target.value)}
            className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 bg-white"
            disabled={loadingChannels}
          >
            {loadingChannels ? (
              <option>Loading...</option>
            ) : channels.length === 0 ? (
              <option value="">No channels available</option>
            ) : (
              channels.map((ch) => (
                <option key={ch.id} value={ch.channel_id}>
                  {ch.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-sm font-medium text-ink-700">
          Accent Color (Android)
        </label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-12 h-10 p-1 border border-ink-200 rounded-xl cursor-pointer"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
            placeholder="#007AFF"
          />
        </div>
      </div>

      {/* Android‑specific settings */}
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
            <div>
              <label className="block text-sm font-medium text-ink-700">Small Icon (drawable resource name)</label>
              <select
                value={smallIcon}
                onChange={(e) => handleSmallIconChange(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
              >
                <option value="">None</option>
                {availableSmallIcons.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700">Large Icon (URL or resource name)</label>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <select
                  value={selectedLargeIconCrop}
                  onChange={(e) => setSelectedLargeIconCrop(e.target.value)}
                  className="px-3 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 text-sm bg-white"
                >
                  {CROP_OPTIONS.filter(c => c.value === 'square').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <input
                  type="url"
                  value={largeIcon}
                  onChange={(e) => setLargeIcon(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                  placeholder="https://example.com/icon.png or resource name"
                />

                <input
                  ref={largeIconInputRef}
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
                  onClick={() => largeIconInputRef.current?.click()}
                  disabled={uploadingLargeIcon}
                  className="h-10 px-3 rounded-xl bg-brand-50 text-brand-600 text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingLargeIcon ? '...' : <Upload size={16} />} Upload
                </button>
                {largeIcon && (
                  <button
                    type="button"
                    onClick={removeLargeIcon}
                    className="h-10 px-3 rounded-xl bg-red-50 text-red-500 text-sm font-bold flex items-center gap-1.5"
                  >
                    <Trash2 size={16} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* iOS‑specific settings */}
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
              <label className="block text-sm font-medium text-ink-700">Custom Sound File (e.g. delivery_alert.caf)</label>
              <input
                type="text"
                value={sound}
                onChange={(e) => setSound(e.target.value)}
                className="w-full mt-1 px-4 py-2 border border-ink-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="default or order_confirmed.caf"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700">Category (for action buttons)</label>
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
                    placeholder="Custom category (e.g. ORDER_STATUS)"
                  />
                )}
              </div>
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
          placeholder='{"order_id": "12345"}'
        />
      </div>

      <button
        onClick={sendNotification}
        disabled={loading || uploadingImage || uploadingLargeIcon || loadingChannels || channels.length === 0}
        className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Notification'}
      </button>

      {/* ── Channel Management (with Sound support) ── */}
      <div className="border-t border-ink-100 pt-4 mt-2">
        <button
          type="button"
          onClick={() => setShowAddChannel(!showAddChannel)}
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {showAddChannel ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {showAddChannel ? 'Hide Add Channel' : 'Add New Channel'}
        </button>

        {showAddChannel && (
          <form onSubmit={handleAddChannel} className="mt-3 p-3 bg-ink-50/50 rounded-xl border border-ink-100 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-700">Channel ID (OneSignal UUID) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="e.g. 3fb65df7-8459-41b5-8f17-fb47dc25cd92"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700">Display Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="e.g. confirmed"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-700">Small Icon (drawable resource, optional)</label>
                <input
                  type="text"
                  value={newChannelSmallIcon}
                  onChange={(e) => setNewChannelSmallIcon(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="e.g. ic_notification_confirmed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700">Sound File (iOS custom sound, optional)</label>
                <input
                  type="text"
                  value={newChannelSound}
                  onChange={(e) => setNewChannelSound(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="e.g. delivery_alert.caf"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700">Description (optional)</label>
              <input
                type="text"
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                placeholder="Describe this channel"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddChannel(false)}
                className="px-4 py-1.5 text-sm border border-ink-200 rounded-lg hover:bg-ink-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingChannel}
                className="px-4 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {addingChannel ? 'Adding...' : 'Add Channel'}
              </button>
            </div>
          </form>
        )}

        {/* ── List of channels with Edit & Sound Support ── */}
        {channels.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold text-ink-700">Existing Channels</h4>
            {channels.map((channel) => (
              <div key={channel.id} className="border border-ink-200 rounded-lg p-2 bg-ink-50/30">
                {editingChannelId === channel.id ? (
                  // Edit mode
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-ink-700">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-700">Description</label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-ink-700">Small Icon</label>
                        <input
                          type="text"
                          value={editSmallIcon}
                          onChange={(e) => setEditSmallIcon(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                          placeholder="ic_notification_logo"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-700">Sound File (iOS)</label>
                        <input
                          type="text"
                          value={editSound}
                          onChange={(e) => setEditSound(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 border border-ink-200 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
                          placeholder="delivery_alert.caf"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 text-sm border border-ink-200 rounded-lg hover:bg-ink-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(channel.id)}
                        disabled={updatingChannel}
                        className="px-3 py-1 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Save size={14} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-ink-800">{channel.name}</span>
                      <span className="text-xs text-ink-400 ml-2">({channel.channel_id})</span>
                      {channel.small_icon && (
                        <span className="text-xs text-ink-400 ml-2">icon: {channel.small_icon}</span>
                      )}
                      {channel.sound && (
                        <span className="text-xs text-emerald-600 font-mono ml-2 inline-flex items-center gap-0.5">
                          <Volume2 size={11} /> {channel.sound}
                        </span>
                      )}
                      {channel.description && (
                        <span className="text-xs text-ink-400 ml-2">— {channel.description}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(channel)}
                        className="p-1.5 text-ink-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteChannel(channel)}
                        className="p-1.5 text-ink-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Image processing helper (unchanged) ─────────────────────────────
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
