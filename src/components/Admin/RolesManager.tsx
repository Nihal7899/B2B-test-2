// src/components/admin/RolesManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { Loader2, Search, X, Shield, User, Building2, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- Helpers ---
const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const getAvatarGradient = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const sat = 70 + (Math.abs(hash) % 20);
  const light = 55 + (Math.abs(hash) % 20);
  return `linear-gradient(135deg, hsl(${hue}, ${sat}%, ${light}%), hsl(${(hue + 60) % 360}, ${sat}%, ${light - 15}%))`;
};

const SkeletonCard = () => (
  <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card animate-pulse">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-ink-200" />
      <div className="flex-1 min-w-0">
        <div className="h-4 w-32 bg-ink-200 rounded mb-1" />
        <div className="h-3 w-20 bg-ink-100 rounded" />
      </div>
      <div className="h-9 w-28 bg-ink-200 rounded-lg" />
    </div>
  </div>
);

// --- Confirmation Dialog ---
const ConfirmDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-ink-900">{title}</h3>
        <p className="text-sm text-ink-600">{message}</p>
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-ink-200 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-4 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function RolesManager() {
  const [users, setUsers] = useState<
    { user_id: string; role: string; full_name: string; phone: string }[]
  >([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false); // for reset (search)
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  // Confirmation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string;
    newRole: string;
  } | null>(null);

  const LIMIT = 20;

  // Single fetch effect – runs when page or search changes
  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      const reset = page === 0; // reset when we are on first page
      const offset = page * LIMIT;

      // Set loading states
      if (reset) {
        setListLoading(true);
        if (initialLoading) setInitialLoading(false); // but we handle initial separately
      } else {
        setLoadingMore(true);
      }

      try {
        let profileIds: string[] = [];
        let total = 0;
        const search = debouncedSearch.trim();

        // 1. Get profile IDs if search term exists
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

        // No matches
        if (search && profileIds.length === 0) {
          if (reset) {
            setUsers([]);
            setTotalCount(0);
            setHasMore(false);
          } else {
            // If appending, but no more data? we should set hasMore false
            setHasMore(false);
          }
          return;
        }

        // 2. Fetch roles with pagination
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
          if (reset) {
            setUsers([]);
            setHasMore(false);
          } else {
            setHasMore(false);
          }
          return;
        }

        // 3. Fetch profiles for these users
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

        const loadedCount = reset ? merged.length : users.length + merged.length;
        setHasMore(loadedCount < total);
        setTotalCount(total);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        if (reset) {
          setListLoading(false);
          setInitialLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };

    // If initialLoading is true and page is 0 and search empty, this is first load.
    // We'll keep initialLoading true until data arrives.
    fetchUsers();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]); // Only these two trigger a fetch

  // Handle search input change: reset page to 0
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0); // will trigger fetch with reset=true
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  // Role change handler with confirmation
  const openConfirmDialog = (userId: string, newRole: string) => {
    setPendingRoleChange({ userId, newRole });
    setDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    const { userId, newRole } = pendingRoleChange;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
    );
    setDialogOpen(false);
    setPendingRoleChange(null);

    try {
      await supabase.rpc('set_user_role', { p_user_id: userId, p_role: newRole });
    } catch (err) {
      console.error('Role update failed:', err);
      // Revert by refetching current page (reset)
      setPage(0);
    }
  };

  const cancelDialog = () => {
    setDialogOpen(false);
    setPendingRoleChange(null);
  };

  // Role labels with icons
  const roleInfo: Record<string, { label: string; icon: typeof Shield }> = {
    customer: { label: 'Customer', icon: User },
    admin: { label: 'Admin', icon: Shield },
    warehouse_manager: { label: 'Warehouse', icon: Building2 },
    delivery_partner: { label: 'Delivery', icon: Truck },
  };

  // Show skeleton cards during initial loading (not full-page spinner)
  const showSkeletons = initialLoading || listLoading;

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
          onChange={handleSearchChange}
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
        {loadingMore && <Loader2 size={14} className="animate-spin text-brand-500" />}
      </div>

      {/* User list / Skeleton */}
      <div className="space-y-3">
        {showSkeletons
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : users.map((u) => {
              const info = roleInfo[u.role] || roleInfo.customer;
              const Icon = info.icon;
              const gradient = getAvatarGradient(u.user_id);
              const initials = (u.full_name || 'U').slice(0, 2).toUpperCase();

              return (
                <div
                  key={u.user_id}
                  className="bg-white border border-ink-100 rounded-2xl p-4 shadow-card hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: gradient }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-ink-800 truncate">
                        {u.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-ink-500">
                        {u.phone || u.user_id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-500 bg-ink-50 px-2 py-1 rounded-full">
                        <Icon size={12} />
                        {info.label}
                      </span>
                      <select
                        value={u.role}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== u.role) {
                            openConfirmDialog(u.user_id, newRole);
                          }
                        }}
                        className="h-9 rounded-lg border border-ink-200 px-2 text-xs font-bold outline-none focus:border-brand-500 bg-white"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        <option value="warehouse_manager">Warehouse</option>
                        <option value="delivery_partner">Delivery</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Load more */}
      {hasMore && !showSkeletons && (
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

      {!hasMore && users.length > 0 && !showSkeletons && (
        <p className="text-center text-xs text-ink-400 pt-2">No more users</p>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogOpen}
        onConfirm={confirmRoleChange}
        onCancel={cancelDialog}
        title="Change role"
        message={`Are you sure you want to change this user's role to "${roleInfo[pendingRoleChange?.newRole || 'customer']?.label}"?`}
      />
    </div>
  );
}