import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchBrandById, fetchProducts } from '@/services/catalog';
import type { TrustedBrand, Product } from '@/types';
import { ProductCarousel } from '@/components/ProductCard';
import { useCart } from '@/store';

function BottomIcon({ type }: { type: 'shield' | 'crown' | 'leaf' }) {
  if (type === 'crown') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m3 7 4 4 5-7 5 7 4-4-2 11H5L3 7Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 21h14" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'leaf') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 4C11 4 5 7 5 13c0 3 2 5 5 5 6 0 9-6 10-14Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 21c3-6 7-9 13-12" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6l8-3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 59, g: 130, b: 246 };
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
};

const getLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const values = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
};

export function BrandScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useCart();

  const brandId = new URLSearchParams(location.search).get('id');
  const [brand, setBrand] = useState<TrustedBrand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!brandId) {
      navigate('/');
      return;
    }
    (async () => {
      const b = await fetchBrandById(brandId);
      if (!b) {
        navigate('/');
        return;
      }
      setBrand(b);
      // Fetch products with this brand name (case-insensitive)
      const { products: allProducts } = await fetchProducts();
      const filtered = allProducts.filter(p => p.brand.toLowerCase() === b.name.toLowerCase());
      setProducts(filtered);
      setLoading(false);
    })();
  }, [brandId, navigate]);

  if (loading || !brand) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  const {
    primary_color = '#3B82F6',
    secondary_color = '#1E40AF',
    logo_url,
    name,
    tagline,
    categories = [],
    bottom_label,
    bottom_icon = 'shield',
    description,
  } = brand;

  const primaryRgb = hexToRgb(primary_color);
  const isLightBackground = getLuminance(primary_color) > 0.68;
  const textColor = isLightBackground ? '#111827' : '#ffffff';

  return (
    <div className="min-h-screen bg-ink-50 pb-24">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden pt-12 pb-8 px-4"
        style={{
          background: `
            radial-gradient(
              circle at 50% 15%,
              rgba(255,255,255,0.18),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              ${primary_color} 0%,
              ${primary_color} 45%,
              ${secondary_color} 100%
            )
          `,
        }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-md"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Decorative circles */}
        <div
          className="absolute -left-12 -top-8 h-32 w-32 rounded-full blur-2xl"
          style={{ background: `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.35)` }}
        />
        <div className="absolute -right-10 top-20 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center" style={{ color: textColor }}>
          {/* Logo */}
          <div className="h-24 w-24 rounded-2xl border-2 border-white/40 bg-white p-2 shadow-lg mb-4 flex items-center justify-center">
            <img src={logo_url} alt={name} className="max-h-full max-w-full object-contain" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">{name}</h1>
          {tagline && <p className="mt-1 text-sm opacity-90">{tagline}</p>}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="mt-4 max-w-md text-sm leading-relaxed opacity-95">{description}</p>
          )}

          {/* Bottom badge */}
          {(bottom_label || bottom_icon) && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/30 px-4 py-1.5 text-white backdrop-blur-md border border-white/20">
              <BottomIcon type={bottom_icon} />
              <span className="text-xs font-semibold">{bottom_label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product carousel */}
      {products.length > 0 && (
        <div className="mt-6">
          <ProductCarousel
            title={`Products from ${name}`}
            products={products}
            getQuantity={cart.getQuantity}
            onAdd={cart.addToCart}
            onIncrement={cart.addToCart}
            onDecrement={(p) => cart.updateQuantity(p.id, cart.getQuantity(p.id) - 1)}
            onProductClick={(p) => navigate(`/product?id=${p.id}`)}
            onViewAll={() => navigate('/')}
          />
        </div>
      )}
    </div>
  );
}