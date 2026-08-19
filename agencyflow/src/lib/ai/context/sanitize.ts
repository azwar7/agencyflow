/**
 * Context Sanitization Utilities & Safeguards for AI Data Preparation
 */

export const CONTEXT_LIMITS = {
  MAX_ACTIVITIES: 15,
  MAX_TASKS: 10,
  MAX_DEALS: 5,
  MAX_SUMMARY_LENGTH: 600,
  MAX_NOTE_LENGTH: 500,
  MAX_GENERAL_STRING_LENGTH: 300,
} as const;

/**
 * Sanitizes and bounds arbitrary text strings.
 * Trims whitespace, removes control characters, and truncates if exceeding maximum length.
 */
export function sanitizeString(
  val: unknown,
  maxLength: number = CONTEXT_LIMITS.MAX_GENERAL_STRING_LENGTH,
  fallback: string = ''
): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  if (str.length === 0) return fallback;
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '...';
}

/**
 * Normalizes dates to a stable ISO-8601 string representation.
 */
export function sanitizeDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Safely bounds numeric fields within an allowed integer range.
 */
export function sanitizeNumber(
  val: unknown,
  fallback: number = 0,
  min?: number,
  max?: number
): number {
  if (typeof val === 'number' && !isNaN(val)) {
    let num = val;
    if (min !== undefined) num = Math.max(min, num);
    if (max !== undefined) num = Math.min(max, num);
    return num;
  }
  return fallback;
}

/**
 * Safely sanitizes an array of records with maximum slice limits.
 */
export function sanitizeList<T, R>(
  items: T[] | null | undefined,
  maxCount: number,
  mapper: (item: T) => R
): R[] {
  if (!items || !Array.isArray(items)) return [];
  return items.slice(0, maxCount).map(mapper);
}
