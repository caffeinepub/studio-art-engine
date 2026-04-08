// Centralized persistence utility for single canonical snapshot with last-write-wins
// No temp keys, no backups, no history - just one overwrite per save

const STORAGE_KEY = "studioArtEngine_projects";
const LEGACY_TEMP_KEY = `${STORAGE_KEY}_temp`;
const LEGACY_BACKUP_PREFIX = `${STORAGE_KEY}_backup_`;

export interface SaveResult {
  success: boolean;
  error?: string;
}

/**
 * Single-write last-write-wins save: overwrite canonical key directly
 */
export function atomicSave(data: any): SaveResult {
  try {
    const serialized = JSON.stringify(data);

    // Single overwrite to canonical key
    localStorage.setItem(STORAGE_KEY, serialized);

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Load canonical snapshot
 */
export function loadCanonical(): any | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading canonical snapshot:", error);
    return null;
  }
}

/**
 * One-time cleanup of legacy temp/backup keys from prior persistence system
 * Best-effort: swallows errors to avoid crashing the app
 */
export function cleanupLegacyArtifacts(): { removed: number; errors: number } {
  let removed = 0;
  let errors = 0;

  try {
    // Remove legacy temp key
    try {
      if (localStorage.getItem(LEGACY_TEMP_KEY) !== null) {
        localStorage.removeItem(LEGACY_TEMP_KEY);
        removed++;
      }
    } catch (err) {
      errors++;
      console.warn("Failed to remove legacy temp key:", err);
    }

    // Remove all legacy backup keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_BACKUP_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
        removed++;
      } catch (err) {
        errors++;
        console.warn(`Failed to remove legacy backup key ${key}:`, err);
      }
    }
  } catch (error) {
    errors++;
    console.error("Error during legacy artifact cleanup:", error);
  }

  return { removed, errors };
}

/**
 * Get storage size estimate in bytes
 */
export function getStorageSize(data: any): number {
  try {
    const serialized = JSON.stringify(data);
    return new Blob([serialized]).size;
  } catch (_error) {
    return 0;
  }
}

/**
 * Check if storage is near quota (4.5MB threshold)
 */
export function isStorageNearQuota(data: any): boolean {
  const size = getStorageSize(data);
  return size > 4.5 * 1024 * 1024;
}
