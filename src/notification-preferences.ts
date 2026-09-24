import type { CalendarDate } from './schedule';

// Notification controls (NOTIF-05) and training reminders (NOTIF-04) ---------

/**
 * What a notification can be about. Every delivered payload names one, and an
 * owner can switch each off independently.
 *
 * There is deliberately no "channel" axis beside this. Web Push is the only
 * delivery channel that exists, so a channel switch would be the same switch
 * twice. The two NOTIF-07 partner categories are explicit opt-ins and also
 * govern their corresponding in-app rows; every earlier NOTIF-01 source stays
 * gathered independently of these delivery controls.
 */
export const NOTIFICATION_CATEGORIES = [
  'REST_ALERT',
  'TRAINING_REMINDER',
  'STREAK_AT_RISK',
  'TRAINING_PARTNER_SESSION',
  'TRAINING_PARTNER_ACHIEVEMENT',
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/**
 * A local-clock window in which nothing is delivered, as minutes from
 * midnight. It may wrap past midnight (22:00 to 07:00 is `1320` to `420`),
 * which is the normal case, so a plain `start <= x < end` test is wrong.
 */
export interface QuietHours {
  startMinute: number;
  endMinute: number;
}

export const MINUTES_IN_DAY = 1440;

/** True when a local minute-of-day falls inside the window, wrap included. */
export function isWithinQuietHours(
  minuteOfDay: number,
  quietHours: QuietHours | null,
): boolean {
  if (!quietHours) return false;
  const { startMinute, endMinute } = quietHours;
  // An empty window silences nothing; a window that wraps covers two spans.
  if (startMinute === endMinute) return false;
  return startMinute < endMinute
    ? minuteOfDay >= startMinute && minuteOfDay < endMinute
    : minuteOfDay >= startMinute || minuteOfDay < endMinute;
}

/**
 * NOTIF-04's reminder time, as minutes from local midnight.
 *
 * It is a time of day, not a lead time before a session, because the product
 * does not know what hour anyone trains: a routine day carries a weekday and
 * nothing stores an intended start. Counting back from a session would mean
 * inventing the session's hour.
 */
export interface TrainingReminderPreference {
  /** Null switches reminders off without discarding the chosen time. */
  minuteOfDay: number | null;
}

/**
 * NOTIF-06. A streak survives a gap of `STREAK_MAX_GAP_DAYS` and dies on the
 * next day, so "at risk" is not a judgement: it is the last local date that
 * can still save the run. The rule lives here because both halves of the
 * product state it.
 */
export const STREAK_MAX_GAP_DAYS = 3;

export interface NotificationPreferences {
  /** Every category, so a client never has to assume a default. */
  categories: Record<NotificationCategory, boolean>;
  quietHours: QuietHours | null;
  reminder: TrainingReminderPreference;
  /**
   * The zone every local rule above is evaluated in. Read-only here; it is
   * owned by `PUT /users/time-zone` and registered by the device.
   */
  timeZone: string | null;
}

/** PUT /notifications/preferences. Every field is optional and partial. */
export interface UpdateNotificationPreferencesRequest {
  categories?: Partial<Record<NotificationCategory, boolean>>;
  /** Null clears the window; omitting it leaves the stored one alone. */
  quietHours?: QuietHours | null;
  reminder?: TrainingReminderPreference;
}

/**
 * GET /notifications/preferences
 *
 * Carries the delivery state beside the preferences so one read answers both
 * "what did I choose" and "can any of it actually reach me" — a category left
 * on while no device is subscribed would otherwise read as working.
 */
export interface NotificationPreferencesResponse {
  preferences: NotificationPreferences;
  /** False when the account has no subscribed device. */
  hasSubscribedDevice: boolean;
  /** False when the server holds no VAPID key pair. */
  pushAvailable: boolean;
}

/**
 * A reminder is planned for a whole local date, not a session: the schedule
 * knows which days an account trains, never at what hour.
 */
export interface PlannedReminder {
  date: CalendarDate;
  /** The routines planned that day, named in the notification. */
  routineNames: string[];
}
