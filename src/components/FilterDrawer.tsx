// components/FilterDrawer.tsx
import { X } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (cat: string) => void;
  priceRange: { min: number; max: number };
  onPriceChange: (min: number, max: number) => void;
  inStock: boolean;
  onInStockToggle: () => void;
  theme: {
    primary: string;
    secondary: string;
    textColor: string;
    borderColor: string;
    buttonStyle: string;
  };
}

export function FilterDrawer({
  isOpen,
  onClose,
  categories,
  selectedCategories,
  onCategoryToggle,
  priceRange,
  onPriceChange,
  inStock,
  onInStockToggle,
  theme,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  const { primary, secondary, textColor, borderColor, buttonStyle } = theme;

  return (
    <div className="fixed inset-0 z-30 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center" style={{ borderColor }}>
          <h2 className="font-bold text-lg" style={{ color: textColor }}>Filters</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-ink-50">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm text-ink-600 mb-2">Category</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => onCategoryToggle(cat)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: selectedCategories.includes(cat) ? primary : 'transparent',
                    color: selectedCategories.includes(cat) ? '#fff' : textColor,
                    borderColor: borderColor,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-sm text-ink-600 mb-2">Price Range</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRange.min}
                onChange={(e) => onPriceChange(Number(e.target.value), priceRange.max)}
                placeholder="Min"
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm"
              />
              <span className="text-ink-400">–</span>
              <input
                type="number"
                value={priceRange.max === 100000 ? '' : priceRange.max}
                onChange={(e) => onPriceChange(priceRange.min, Number(e.target.value))}
                placeholder="Max"
                className="w-full h-10 rounded-xl border border-ink-200 px-3 text-sm"
              />
            </div>
          </div>
          {/* In Stock */}
          <div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={inStock}
                onChange={onInStockToggle}
                style={{ accentColor: primary }}
              />
              In Stock only
            </label>
          </div>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-xl text-white font-bold text-sm"
            style={{ backgroundColor: primary }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}