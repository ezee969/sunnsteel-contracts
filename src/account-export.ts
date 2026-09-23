import type { IsoDateString } from "./shared";
import type { UserProfile } from "./user";
import type { Routine, RoutineVersionSetup } from "./routine";
import type { WorkoutSession } from "./workout";

/**
 * EXPORT-01. Everything a member put into Sunnsteel, in one JSON document they
 * can keep, read or take elsewhere.
 *
 * Stability is the point. `format` and `formatVersion` identify the document;
 * a field is only ever added within a version, and anything that changes the
 * meaning of an existing field is a new version. Sections reuse the shapes the
 * app itself serves (`UserProfile`, `Routine`, `WorkoutSession`), so the file
 * says what the member saw.
 *
 * **Every weight is kilograms**, whatever unit the account displays -- that is
 * how Sunnsteel stores them. `account.weightUnit` is the display preference.
 *
 * Left out on purpose, and stated in `omitted`: other members' data (people
 * appear by username only, never email), credentials (share-link tokens,
 * push-device endpoints), and anything derived from what is exported
 * (analytics rollups, the notification feed).
 */
export const ACCOUNT_EXPORT_FORMAT = "sunnsteel-account-export" as const;
export const ACCOUNT_EXPORT_VERSION = 1 as const;

/** Another member, as the export names them: never by email. */
export interface AccountExportMember {
  username: string;
  name: string;
}

export interface AccountExportRoutine {
  routine: Routine;
  versions: Array<{
    number: number;
    name: string | null;
    kind: string;
    createdAt: IsoDateString;
    setup: RoutineVersionSetup;
  }>;
}

export interface AccountExportPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  estimated1rmKg: number;
  achievedAt: IsoDateString;
  sessionId: string;
}

/**
 * The member's training history as recorded events: completed sessions,
 * records, load changes, achievements and streaks. `payload` is versioned by
 * `schemaVersion`.
 */
export interface AccountExportTrainingEvent {
  type: string;
  occurredAt: IsoDateString;
  sessionId: string | null;
  schemaVersion: number;
  payload: unknown;
}

export interface AccountExportGoal {
  type: string;
  direction: string;
  targetValue: number;
  exerciseId: string | null;
  createdAt: IsoDateString;
}

export interface AccountExportTrainingLocation {
  name: string;
  isDefault: boolean;
  barWeightKg: number;
  availablePlatePairs: unknown;
  equipment: string[];
}

export interface AccountExportScheduleOverride {
  routineId: string;
  date: string;
  kind: string;
  toDate: string | null;
}

export interface AccountExportV1 {
  format: typeof ACCOUNT_EXPORT_FORMAT;
  formatVersion: typeof ACCOUNT_EXPORT_VERSION;
  exportedAt: IsoDateString;
  weightsAreKilograms: true;
  account: UserProfile;
  preferences: {
    notifications: {
      restAlert: boolean;
      trainingReminder: boolean;
      streakAtRisk: boolean;
      quietHours: { startMinute: number; endMinute: number } | null;
      reminderMinuteOfDay: number | null;
    };
    timeZone: string | null;
    plateauMinSessions: number;
    activitySharingDefaults: Array<{ type: string; audience: string }>;
    activityEntryAudiences: Array<{ entryKey: string; audience: string }>;
  };
  routines: AccountExportRoutine[];
  workouts: WorkoutSession[];
  personalRecords: AccountExportPersonalRecord[];
  trainingEvents: AccountExportTrainingEvent[];
  goals: AccountExportGoal[];
  trainingLocations: AccountExportTrainingLocation[];
  scheduleOverrides: AccountExportScheduleOverride[];
  exercises: {
    starred: Array<{ exerciseId: string; name: string; starredAt: IsoDateString }>;
  };
  social: {
    following: Array<AccountExportMember & { since: IsoDateString }>;
    followers: Array<AccountExportMember & { since: IsoDateString }>;
    blocked: Array<AccountExportMember & { since: IsoDateString }>;
    trainingPartners: Array<{
      member: AccountExportMember;
      status: string;
      requestedByMe: boolean;
      since: IsoDateString;
    }>;
    commentsWritten: Array<{
      onActivityOf: AccountExportMember;
      entryKey: string;
      body: string;
      createdAt: IsoDateString;
    }>;
    reactionsGiven: Array<{
      onActivityOf: AccountExportMember;
      entryKey: string;
      reaction: string;
      createdAt: IsoDateString;
    }>;
    reportsFiled: Array<{
      subjectKind: string;
      reason: string;
      details: string | null;
      status: string;
      createdAt: IsoDateString;
    }>;
  };
  /** What the file deliberately does not contain, and why. */
  omitted: string[];
}

/** The file name a download of the export is saved under. */
export function accountExportFileName(username: string, exportedAt: string) {
  return `sunnsteel-${username}-${exportedAt.slice(0, 10)}.json`;
}
