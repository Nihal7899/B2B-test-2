// src/components/admin/RolesManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RolesManager() {
  const [users, setUsers] = useState<{ user_id: string; role: string; full_name: string; phone: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // 1. Fetch all user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .order('created_at', { ascending: false });
  
    if (rolesData && rolesData.length > 0) {
      const userIds = rolesData.map((r) => r.user_id);
  
      // 2. Fetch profiles for those user IDs
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', userIds);
  
      // Build a lookup map for quick access
      const profilesMap = Object.fromEntries(
        (profilesData || []).map((p) => [p.id, p])
      );
  
      // 3. Merge the data
      setUsers(
        rolesData.map((r) => ({
          user_id: r.user_id,
          role: r.role,
          full_name: profilesMap[r.user_id]?.full_name || 'Unknown',
          phone: profilesMap[r.user_id]?.phone || '',
        }))
      );
    } else {
      setUsers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = async (userId: string, role: string) => {
    await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role });
    void load();
  };

  if (loading) return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">Change a user's role to grant admin, warehouse, or delivery access.</p>
      {users.map((u) => (
        <div key={u.user_id} className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink-800 truncate">{u.full_name || 'Unknown'}</p>
              <p className="text-xs text-ink-500">{u.phone || u.user_id.slice(0, 8)}</p>
            </div>
            <select
              value={u.role}
              onChange={(e) => void handleRoleChange(u.user_id, e.target.value)}
              className="h-9 rounded-lg border border-ink-200 px-2 text-xs font-bold outline-none focus:border-brand-500"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="warehouse_manager">Warehouse</option>
              <option value="delivery_partner">Delivery</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}