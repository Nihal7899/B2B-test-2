// src/utils/version.ts

/**
 * Returns true if currentVersion is strictly less than targetVersion.
 * e.g., isVersionOutdated('1.0.0', '1.0.1') -> true
 *       isVersionOutdated('1.1.0', '1.0.9') -> false
 */
export function isVersionOutdated(currentVersion: string, targetVersion: string): boolean {
  const currentParts = currentVersion.split('.').map((p) => parseInt(p, 10) || 0);
  const targetParts = targetVersion.split('.').map((p) => parseInt(p, 10) || 0);

  const length = Math.max(currentParts.length, targetParts.length);

  for (let i = 0; i < length; i++) {
    const c = currentParts[i] ?? 0;
    const t = targetParts[i] ?? 0;

    if (c < t) return true;
    if (c > t) return false;
  }

  return false;
}
