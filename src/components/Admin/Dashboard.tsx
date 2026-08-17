// src/components/admin/Dashboard.tsx
export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card">
        <p className="text-xs text-ink-400 font-bold uppercase">Total Banners</p>
        <p className="text-2xl font-extrabold text-ink-900 mt-1">—</p>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card">
        <p className="text-xs text-ink-400 font-bold uppercase">Stores</p>
        <p className="text-2xl font-extrabold text-ink-900 mt-1">—</p>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-ink-100 shadow-card">
        <p className="text-xs text-ink-400 font-bold uppercase">Brands</p>
        <p className="text-2xl font-extrabold text-ink-900 mt-1">—</p>
      </div>
    </div>
  );
}