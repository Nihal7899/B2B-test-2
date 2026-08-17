// src/components/admin/RolesManager.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce'; // simple debounce hook, or write inline

// If you don't have a useDebounce hook, you can implement it like this:
const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export default function RolesManager() {
  const [users, setUsers] = useState<
    { user_id: string; role: string; full_name: string; phone: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const LIMIT = 20;

  // Load users (reset or append)
  const loadUsers = useCallback(
    async (reset: boolean = false) => {
      const currentPage = reset ? 0 : page;
      const offset = currentPage * LIMIT;

      if (reset) {
        setLoading(true);
        setUsers([]);
        setHasMore(true);
        setTotalCount(null);
      } else {
        setLoadingMore(true);
      }

      try {
        let profileIds: string[] = [];
        let total = 0;

        // Step 1: get matching profile IDs (or all if no search)
        if (debouncedSearch.trim()) {
          const search = `%${debouncedSearch.trim()}%`;
          const { data: profiles, count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: false })
            .or(`full_name.ilike.${search}, phone.ilike.${search}`);

          if (error) throw error;
          profileIds = profiles?.map((p) => p.id) || [];
          total = count || 0;
        } else {
          // No search: we'll get all user_roles with pagination, then fetch profiles
          // We don't know total count upfront, but we can get it from user_roles
          const { count, error: countErr } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true });
          if (countErr) throw countErr;
          total = count || 0;
        }

        // If no profiles match search, return empty
        if (debouncedSearch.trim() && profileIds.length === 0) {
          if (reset) setUsers([]);
          setHasMore(false);
          setTotalCount(0);
          return;
        }

        // Step 2: fetch user_roles with pagination
        let query = supabase
          .from('user_roles')
          .select('user_id, role')
          .order('created_at', { ascending: false });

        if (debouncedSearch.trim()) {
          query = query.in('user_id', profileIds);
        }

        // Apply pagination
        const { data: rolesData, error: rolesError } = await query
          .range(offset, offset + LIMIT - 1);

        if (rolesError) throw rolesError;

        if (!rolesData || rolesData.length === 0) {
          if (reset) setUsers([]);
          setHasMore(false);
          return;
        }

        // Step 3: fetch profiles for these users
        const userIds = rolesData.map((r) => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = Object.fromEntries(
          (profilesData || []).map((p) => [p.id, p])
        );

        const merged = rolesData.map((r) => ({
          user_id: r.user_id,
          role: r.role,
          full_name: profilesMap[r.user_id]?.full_name || 'Unknown',
          phone: profilesMap[r.user_id]?.phone || '',
        }));

        if (reset) {
          setUsers(merged);
        } else {
          setUsers((prev) => [...prev, ...merged]);
        }

        // Determine if more pages exist
        const currentTotal = total || 0;
        const newOffset = (currentPage + 1) * LIMIT;
        setHasMore(newOffset < currentTotal);
        setTotalCount(currentTotal);
        setPage(currentPage + (reset ? 1 : currentPage + 1)); // increment only if not reset? better track separately
        // We'll manage page increment outside
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        if (reset) setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, page, LIMIT]
  );

  // Reset on search change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    // We'll load in a separate effect to avoid double fetch
  }, [debouncedSearch]);

  useEffect(() => {
    // When page or search changes, load users (reset if page=0)
    const reset = page === 0;
    loadUsers(reset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  // Load more handler
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  // Role change handler (optimistic update)
  const handleRoleChange = async (userId: string, newRole: string) => {
    // Update local state optimistically
    setUsers((prev) =>
      prev.map((u) =>
        u.user_id === userId ? { ...u, role: newRole } : u
      )
    );

    try {
      await supabase.rpc('set_user_role', { p_user_id: userId, p_role: newRole });
    } catch (err) {
      console.error('Role update failed:', err);
      // Revert on error (optional: refetch current page)
      // For simplicity, we could reload the current page
      loadUsers(true);
    }
  };

  // Clear search
  const clearSearch = () => setSearchTerm('');

  if (loading && users.length === 0) {
    return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-ink-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full h-10 pl-9 pr-9 rounded-xl border border-ink-200 bg-white text-sm outline-none focus:border-brand-500"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X size={16} className="text-ink-400 hover:text-ink-600" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs text-ink-500">
          {totalCount !== null && `${totalCount} user${totalCount !== 1 ? 's' : ''}`}
          {users.length > 0 && ` · showing ${users.length}`}
        </p>

        {users.map((u) => (
          <div
            key={u.user_id}
            className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink-800 truncate">
                  {u.full_name || 'Unknown'}
                </p>
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

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="h-10 px-6 rounded-xl text-sm font-bold text-brand-600 border border-brand-200 hover:bg-brand-50 disabled:opacity-50 transition"
          >
            {loadingMore ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}

      {!hasMore && users.length > 0 && (
        <p className="text-center text-xs text-ink-400 pt-2">No more users to load</p>
      )}
    </div>
  );
}