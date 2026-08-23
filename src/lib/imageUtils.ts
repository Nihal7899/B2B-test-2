// src/lib/imageUtils.ts
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';

export interface CompressionThreshold {
  minSizeMB: number;
  maxSizeMB: number | null;
  quality: number;
}

export interface CompressionConfig {
  thresholds: CompressionThreshold[];
}

const DEFAULT_CONFIG: CompressionConfig = {
  thresholds: [
    { minSizeMB: 0, maxSizeMB: 2, quality: 90 },
    { minSizeMB: 2, maxSizeMB: 4, quality: 80 },
    { minSizeMB: 4, maxSizeMB: 6, quality: 70 },
    { minSizeMB: 6, maxSizeMB: null, quality: 60 },
  ],
};

// Fetch config from Supabase (cached)
let cachedConfig: CompressionConfig | null = null;

export async function getCompressionConfig(): Promise<CompressionConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'compression_config')
      .single();

    if (error || !data) {
      console.warn('Using default compression config');
      cachedConfig = DEFAULT_CONFIG;
      return cachedConfig;
    }

    const config = data.value as CompressionConfig;
    cachedConfig = config;
    return config;
  } catch (_) {
    return DEFAULT_CONFIG;
  }
}

async function getQualityForSize(fileSizeMB: number): Promise<number> {
  const config = await getCompressionConfig();
  const sorted = [...config.thresholds].sort((a, b) => a.minSizeMB - b.minSizeMB);
  for (const t of sorted) {
    if (fileSizeMB >= t.minSizeMB && (t.maxSizeMB === null || fileSizeMB <= t.maxSizeMB)) {
      return t.quality / 100;
    }
  }
  return 0.8; // fallback
}

export async function compressImage(file: File): Promise<File> {
  const fileSizeMB = file.size / (1024 * 1024);
  const quality = await getQualityForSize(fileSizeMB);

  const options = {
    maxSizeMB: fileSizeMB, // keep same size, but compress quality
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    quality,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed:', error);
    return file; // fallback to original
  }
}