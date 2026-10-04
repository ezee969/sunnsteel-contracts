// Regional preferences (PREF-04) --------------------------------------------
//
// The week a member's calendar and weekly numbers follow, and the unit lengths
// are shown in. Language is I18N-02 and the time zone is the account's
// existing analytics zone (`UserProfile.timeZone`).

/**
 * The weekday a week starts on, as `Date.getDay()` numbers it: 1 Monday, 0
 * Sunday. Monday is everyone's default, so nothing changes until a member
 * chooses. **The rank never follows it**: its active weeks are Monday weeks
 * for every member, because a rank is public and must mean the same on every
 * profile.
 */
export const WEEK_STARTS = [1, 0] as const;
export type WeekStartsOn = (typeof WEEK_STARTS)[number];
export const DEFAULT_WEEK_STARTS_ON: WeekStartsOn = 1;

export function isWeekStartsOn(value: unknown): value is WeekStartsOn {
  return (WEEK_STARTS as readonly unknown[]).includes(value);
}

/**
 * The first day of the week a `YYYY-MM-DD` calendar date belongs to, as a
 * `YYYY-MM-DD` date, for a week starting on `weekStartsOn`. Calendar
 * arithmetic only: no time zone, so a daylight-saving change cannot move it.
 */
export function weekStartOf(
  dateKey: string,
  weekStartsOn: WeekStartsOn = DEFAULT_WEEK_STARTS_ON,
): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() - weekStartsOn + 7) % 7));
  return date.toISOString().slice(0, 10);
}

/** PUT /users/preferences/week-start */
export interface UpdateWeekStartRequest {
  weekStartsOn: WeekStartsOn;
}

/**
 * How lengths are shown and typed: centimetres, or inches (a height in feet
 * and inches). Every length is **stored in centimetres**, as weights are
 * stored in kilograms; the unit is only the display and entry boundary.
 */
export const LENGTH_UNITS = ['CM', 'IN'] as const;
export type LengthUnit = (typeof LENGTH_UNITS)[number];

export const CM_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;

/** Centimetres as inches, to two decimals. */
export function cmToInches(cm: number): number {
  return Math.round((cm / CM_PER_INCH) * 100) / 100;
}

/** Inches as centimetres, to two decimals. */
export function inchesToCm(inches: number): number {
  return Math.round(inches * CM_PER_INCH * 100) / 100;
}

/**
 * A height in centimetres as whole feet and inches to one decimal. The total
 * is rounded before it is split, so 71.98 in reads as 6 ft 0 in, never as
 * 5 ft 12 in.
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const total = Math.round((cm / CM_PER_INCH) * 10) / 10;
  const feet = Math.floor(total / INCHES_PER_FOOT);
  const inches = Math.round((total - feet * INCHES_PER_FOOT) * 10) / 10;
  return { feet, inches };
}

/** Feet and inches as centimetres, to two decimals. */
export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * INCHES_PER_FOOT + inches);
}
