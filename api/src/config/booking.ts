// Booking rules from the PRD (section 8). Owners' manual bookings skip both.
export const bookingRules = {
  /** customers can only book starts at least this far from now */
  minNoticeMinutes: 60,
  /** customers can book up to this many calendar days ahead, in the business's timezone */
  windowDays: 30,
} as const;
