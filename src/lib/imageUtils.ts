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
      cachedConfig = DEFAULT_CONFIG;
      return cachedConfig;
    }

    cachedConfig = data.value as CompressionConfig;
    return cachedConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function clearCompressionCache() {
  cachedConfig = null;
}

async function getQualityForSize(fileSizeMB: number): Promise<number> {
  const config = await getCompressionConfig();
  const sorted = [...config.thresholds].sort((a, b) => a.minSizeMB - b.minSizeMB);
  for (const t of sorted) {
    if (fileSizeMB >= t.minSizeMB && (t.maxSizeMB === null || fileSizeMB <= t.maxSizeMB)) {
      return t.quality / 100;
    }
  }
  return 0.8;
}

export async function compressImage(file: File): Promise<File> {
  const fileSizeMB = file.size / (1024 * 1024);
  const quality = await getQualityForSize(fileSizeMB);
  const targetMaxMB = Math.max(0.5, fileSizeMB * 0.8);

  const options = {
    maxSizeMB: targetMaxMB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    quality,
  };

  try {
    return await imageCompression(file, options);
  } catch {
    return file; // fallback to original
  }
}