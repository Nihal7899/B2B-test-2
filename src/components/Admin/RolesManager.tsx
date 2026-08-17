// src/components/admin/RolesManager.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const SkeletonCard = () => (
  <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card animate-pulse">
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="h-4 w-32 bg-ink-200 rounded mb-1" />
        <div className="h-3 w-20 bg-ink-100 rounded" />
      </div>
      <div className="h-9 w-28 bg-ink-200 rounded-lg" />
    </div>
  </div>
);

export default function RolesManager() {
  const [users, setUsers] = useState<
    { user_id: string; role: string; full_name: string; phone: string }[]
  >([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const LIMIT = 20;

  // Ref to track if this is the initial load (to avoid double fetch)
  const isInitialMount = useRef(true);

  const fetchUsers = useCallback(
    async (reset: boolean = false) => {
      const offset = reset ? 0 : page * LIMIT;

      if (reset) {
        setListLoading(true);
        setUsers([]);
        setHasMore(true);
        setTotalCount(null);
        // Reset page to 0 for new search, but we'll set it after fetch
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      try {
        let profileIds: string[] = [];
        let total = 0;
        const search = debouncedSearch.trim();

        // Step 1: get matching profile IDs if search exists
        if (search) {
          const { data: profiles, count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: false })
            .or(`full_name.ilike.%${search}%, phone.ilike.%${search}%`);

          if (error) throw error;
          profileIds = profiles?.map((p) => p.id) || [];
          total = count || 0;
        } else {
          const { count, error } = await supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true });
          if (error) throw error;
          total = count || 0;
        }

        // If search returns no profiles, show empty
        if (search && profileIds.length === 0) {
          if (reset) setUsers([]);
          setHasMore(false);
          setTotalCount(0);
          return;
        }

        // Step 2: fetch roles with pagination
        let query = supabase
          .from('user_roles')
          .select('user_id, role')
          .order('created_at', { ascending: false });

        if (search) {
          query = query.in('user_id', profileIds);
        }

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

        // Update state
        if (reset) {
          setUsers(merged);
          // Next page will be 1
          setPage(1);
        } else {
          setUsers((prev) => [...prev, ...merged]);
          setPage((prev) => prev + 1);
        }

        // Determine if more pages exist
        const currentTotal = total || 0;
        const loadedCount = reset ? merged.length : users.length + merged.length;
        setHasMore(loadedCount < currentTotal);
        setTotalCount(currentTotal);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        if (reset) setListLoading(false);
        else setLoadingMore(false);
        setInitialLoading(false);
      }
    },
    [debouncedSearch, page, LIMIT, users.length]
  );

  // Fetch on mount and whenever debouncedSearch changes
  useEffect(() => {
    // Reset page to 0 when search changes (but we also reset inside fetchUsers)
    // We'll call fetchUsers(true) which resets internally.
    // However, we need to avoid double fetch on mount.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Initial load: fetch with reset
      fetchUsers(true);
    } else {
      // Search changed: fetch with reset
      fetchUsers(true);
    }
  }, [debouncedSearch, fetchUsers]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
    );
    try {
      await supabase.rpc('set_user_role', { p_user_id: userId, p_role: newRole });
    } catch (err) {
      console.error('Role update failed:', err);
      // Revert by reloading current page
      fetchUsers(true);
    }
  };

  const clearSearch = () => setSearchTerm('');

  // Show initial full‑page loader only for the very first load
  if (initialLoading) {
    return <Loader2 className="animate-spin mx-auto text-brand-600" size={24} />;
  }

  // Decide how many skeleton cards to show while list is loading (for search)
  const skeletonCount = 3;

  return (
    <div className="space-y-4">
      {/* Search Bar - Always visible */}
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

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>
          {totalCount !== null && `${totalCount} user${totalCount !== 1 ? 's' : ''}`}
          {users.length > 0 && ` · showing ${users.length}`}
        </span>
        {listLoading && <Loader2 size={14} className="animate-spin text-brand-500" />}
      </div>

      {/* User list / Skeleton */}
      <div className="space-y-3">
        {listLoading
          ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
          : users.map((u) => (
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

      {/* Load more button */}
      {hasMore && !listLoading && (
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

      {!hasMore && users.length > 0 && !listLoading && (
        <p className="text-center text-xs text-ink-400 pt-2">No more users to load</p>
      )}
    </div>
  );
}