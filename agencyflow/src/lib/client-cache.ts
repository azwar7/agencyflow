'use client';

/**
 * Lightweight, zero-dependency in-memory client-side cache and SWR utility.
 * Eliminates blank skeleton delays when navigating between CRM sections.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const clientMemoryCache = new Map<string, CacheEntry<any>>();

/**
 * Retrieves cached data for a given key if available.
 */
export function getCachedData<T>(key: string, maxAgeMs: number = 60_000): T | null {
  const entry = clientMemoryCache.get(key);
  if (!entry) return null;
  return entry.data;
}

/**
 * Stores data in the client cache with a timestamp.
 */
export function setCachedData<T>(key: string, data: T): void {
  clientMemoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidates specific cache keys or clears all cached CRM data.
 */
export function invalidateClientCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    clientMemoryCache.clear();
    return;
  }
  for (const key of clientMemoryCache.keys()) {
    if (key.includes(keyPrefix)) {
      clientMemoryCache.delete(key);
    }
  }
}

// Listen to global agencyflow-refresh event to automatically invalidate client cache
if (typeof window !== 'undefined') {
  window.addEventListener('agencyflow-refresh', () => {
    invalidateClientCache();
  });
}

/**
 * High-probability prefetcher to fetch CRM data in idle time.
 */
export function prefetchUrl(url: string): void {
  if (typeof window === 'undefined') return;
  // If already cached recently (within 45s), skip prefetch
  const existing = clientMemoryCache.get(url);
  if (existing && Date.now() - existing.timestamp < 45_000) return;

  const doFetch = () => {
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data !== undefined) {
          setCachedData(url, json.data);
        }
      })
      .catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(doFetch, { timeout: 2000 });
  } else {
    setTimeout(doFetch, 500);
  }
}
