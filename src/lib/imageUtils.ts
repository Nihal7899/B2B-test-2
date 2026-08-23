// src/lib/imageUtils.ts
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';

export interface CompressionThreshold {
  minSizeMB: number;
  maxSizeMB: number | null;
  quality: number; // 1 to 100
}

export interface CompressionConfig {
  thresholds: CompressionThreshold[];
}

const DEFAULT_CONFIG: CompressionConfig = {
  thresholds: [
    { minSizeMB: 0, maxSizeMB: 2, quality: 70 },
    { minSizeMB: 2, maxSizeMB: 5, quality: 60 },
    { minSizeMB: 5, maxSizeMB: null, quality: 50 },
  ],
};

let cachedConfig: CompressionConfig | null = null;

export function clearCompressionCache(): void {
  cachedConfig = null;
}

export async function getCompressionConfig(): Promise<CompressionConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'compression_config')
      .single();

    if (error || !data?.value?.thresholds) {
      cachedConfig = DEFAULT_CONFIG;
      return DEFAULT_CONFIG;
    }

    cachedConfig = data.value as CompressionConfig;
    return cachedConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function compressImage(file: File): Promise<File> {
  // If not an image or SVG/GIF (which lose animation/vector data), return original
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const config = await getCompressionConfig();
  const fileSizeMB = file.size / (1024 * 1024);

  // Find matching threshold based on original file size
  const matchedThreshold = config.thresholds.find((t) => {
    const min = t.minSizeMB ?? 0;
    const max = t.maxSizeMB ?? Infinity;
    return fileSizeMB >= min && fileSizeMB < max;
  }) ?? config.thresholds[0] ?? { quality: 70, minSizeMB: 0, maxSizeMB: null };

  // 1. Convert quality integer (1-100) to library ratio (0.01 - 1.0)
  const normalizedQuality = Math.min(Math.max((matchedThreshold.quality || 70) / 100, 0.05), 1.0);

  // 2. Configure browser-image-compression
  const options = {
    maxSizeMB: matchedThreshold.maxSizeMB ?? 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: normalizedQuality,
    fileType: 'image/webp', // Converts PNG/JPEG to WebP so the quality rate takes effect
  };

  try {
    const compressedBlob = await imageCompression(file, options);

    // Swap original extension to .webp
    const originalName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const outputFilename = `${originalName}.webp`;

    return new File([compressedBlob], outputFilename, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed, proceeding with original file:', error);
    return file;
  }
}
