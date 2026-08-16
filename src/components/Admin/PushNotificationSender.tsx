import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';
import toast from 'react-hot-toast';

export function PushNotificationSender() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dataJson, setDataJson] = useState('{}');
  const [audience, setAudience] = useState<'all' | 'admin' | 'warehouse' | 'delivery'>('all');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: { title, body, data, audience },
      });
      if (error) throw error;
      toast.success('Notification sent successfully');
      setTitle('');
      setBody('');
      setDataJson('{}');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-card">
      <h2 className="text-xl font-bold text-ink-900 mb-4">Send Push Notification</h2>
      <div className="space-y-4">
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
        <button
          onClick={sendNotification}
          disabled={loading}
          className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </div>
    </div>
  );
}