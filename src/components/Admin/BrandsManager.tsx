// components/admin/BrandsManager.tsx (simplified preview version)
import React, { useState } from 'react';
import { BrandCard } from '@/components/BrandCard';

export default function BrandsManager() {
  const [brandName, setBrandName] = useState('Amul');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#1E40AF');
  const [logoUrl, setLogoUrl] = useState('https://via.placeholder.com/100/FFFFFF/000000?text=Logo');
  const [productImages, setProductImages] = useState([
    'https://via.placeholder.com/80/FF0000/FFFFFF?text=Prod1',
    'https://via.placeholder.com/80/00FF00/FFFFFF?text=Prod2',
    'https://via.placeholder.com/80/0000FF/FFFFFF?text=Prod3',
  ]);

  const updateImage = (index: number, value: string) => {
    const newImages = [...productImages];
    newImages[index] = value;
    setProductImages(newImages);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold">Brand Editor (Live Preview)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Brand Name</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Primary Color</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="mt-1 block w-full h-10 p-1 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Secondary Color</label>
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="mt-1 block w-full h-10 p-1 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Product Image 1</label>
            <input
              type="text"
              value={productImages[0] || ''}
              onChange={(e) => updateImage(0, e.target.value)}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Product Image 2</label>
            <input
              type="text"
              value={productImages[1] || ''}
              onChange={(e) => updateImage(1, e.target.value)}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Product Image 3</label>
            <input
              type="text"
              value={productImages[2] || ''}
              onChange={(e) => updateImage(2, e.target.value)}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4">
          <BrandCard
            brandName={brandName}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoUrl={logoUrl}
            productImages={productImages}
          />
        </div>
      </div>
    </div>
  );
}