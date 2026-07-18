/**
 * Calendar-date fields (due dates, bill dates, lease start/end, rent periods) are stored as
 * UTC midnight and represent a pure calendar day with no meaningful time-of-day. Formatting
 * them with the runtime's local timezone can roll them back a day (or month, at a month
 * boundary) whenever the server/browser is behind UTC. Always format these with `timeZone: "UTC"`.
 *
 * Real timestamps (payment.paidDate, reminderLog.createdAt) are NOT calendar dates — format
 * those with plain toLocaleDateString/toLocaleString so they show in the viewer's local time.
 */
export function formatCalendarDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("en-US", { timeZone: "UTC", ...options });
}
