/**
 * Date utility functions for consistent formatting across the app
 * Prevents hydration mismatches by using deterministic formatting
 */

/**
 * Format a date consistently across server and client
 * @param date - Date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "Jan 2, 2025")
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Format a date with time
 * @param date - Date to format
 * @returns Formatted date and time string (e.g., "Jan 2, 2025 at 3:45 PM")
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  const dateStr = formatDate(d);
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr} at ${timeStr}`;
}

/**
 * Format a date relative to today
 * @param date - Date to format
 * @returns Relative date string (e.g., "Today", "Yesterday", "2 days ago", or formatted date)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const diffTime = today.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return formatDate(d);
  }
}

/**
 * Check if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are on the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * Get a deterministic date for server-side rendering
 * Use this instead of new Date() when you need consistent server/client rendering
 */
export function getServerSafeDate(): Date {
  // For SSR consistency, you might want to use a fixed date or get it from props
  // This is a placeholder - in practice, you'd get this from your app's context
  return new Date();
}
