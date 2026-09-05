/**
 * Lead & Contact Email Utilities
 * Handles validation, placeholder detection, and consistent user-facing email formatting.
 */

/**
 * Returns true if an email is a genuine, verified address.
 * Returns false if it is missing, empty, or a synthesized placeholder (e.g. .internal, .test, or 'Email not available').
 */
export function isEmailAvailable(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed === '' || !trimmed.includes('@')) return false;
  if (
    trimmed.includes('not available') ||
    trimmed.includes('.internal') ||
    trimmed.includes('.test') ||
    trimmed.endsWith('@example.com')
  ) {
    return false;
  }
  return true;
}

/**
 * Formats a lead or contact email for UI presentation.
 * Displays "Email not available" whenever a real email was not provided or found.
 */
export function formatLeadEmail(email: string | null | undefined): string {
  return isEmailAvailable(email) ? (email as string).trim() : 'Email not available';
}
