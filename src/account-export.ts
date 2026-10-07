import type { IsoDateString } from "./shared";
import type { UserProfile } from "./user";
import type { Routine, RoutineVersionSetup } from "./routine";
import type { WorkoutSession } from "./workout";
import type { SessionCorrection } from "./session-corrections";
import type { BodyMeasurementValues } from "./body-measurements";

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

/** Weight in kilograms, lengths in centimetres. */
export interface AccountExportBodyMeasurement extends BodyMeasurementValues {
  date: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
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
      partnerSession: boolean;
      partnerAchievement: boolean;
      quietHours: { startMinute: number; endMinute: number } | null;
      reminderMinuteOfDay: number | null;
    };
    timeZone: string | null;
    /** PREF-04: 1 Monday, 0 Sunday. */
    weekStartsOn?: number;
    /** PREF-04: how lengths are shown; every length in the file is cm. */
    lengthUnit?: 'CM' | 'IN';
    /** ONBOARD-01: the onboarding version completed and steps done since. */
    onboarding?: { completedVersion: number; stepsDone: string[] };
    plateauMinSessions: number;
    activitySharingDefaults: Array<{ type: string; audience: string }>;
    activityEntryAudiences: Array<{ entryKey: string; audience: string }>;
  };
  routines: AccountExportRoutine[];
  workouts: WorkoutSession[];
  /** LIVE-17: every saved correction of a workout, with its before and after values. */
  workoutCorrections: Array<SessionCorrection & { sessionId: string }>;
  personalRecords: AccountExportPersonalRecord[];
  trainingEvents: AccountExportTrainingEvent[];
  goals: AccountExportGoal[];
  /** PROG-12: every dated body weight and measurement entry. */
  bodyMeasurements?: AccountExportBodyMeasurement[];
  trainingLocations: AccountExportTrainingLocation[];
  scheduleOverrides: AccountExportScheduleOverride[];
  /**
   * NAV-03: the results the member last opened from search, newest first.
   * `target` names another member by username and anything else by its id.
   */
  /** ACH-06: suggestions the member set aside with "Not now". */
  goalSuggestionDismissals?: Array<{
    key: string;
    targetValue: number;
    dismissedAt: IsoDateString;
  }>;
  recentSearches?: Array<{
    kind: 'MEMBER' | 'EXERCISE' | 'ROUTINE' | 'WORKOUT';
    target: string;
    openedAt: IsoDateString;
  }>;
  exercises: {
    starred: Array<{ exerciseId: string; name: string; starredAt: IsoDateString }>;
    /** EXER-06: the member's own exercises, archived ones included. */
    custom?: Array<{
      id: string;
      name: string;
      primaryMuscles: string[];
      secondaryMuscles: string[];
      equipmentRequired: string[];
      movementPattern: string | null;
      mechanic: string | null;
      note: string | null;
      archivedAt: IsoDateString | null;
      createdAt: IsoDateString;
    }>;
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
    /**
     * MSG-01: the messages the member wrote and has not deleted, each with
     * the member it was sent to (null once that account was deleted). Messages
     * written to them belong to their authors and are not included.
     */
    messagesSent?: Array<{
      to: AccountExportMember | null;
      conversationId: string;
      /** Empty when a routine was sent without a note (MSG-07). */
      body: string;
      /** MSG-07: the member's own routine the message shared, by id. */
      routineId?: string;
      /** MSG-10: the member's own workout the message shared, by id. */
      sessionId?: string;
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
