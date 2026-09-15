import type { IsoDateString } from './shared';

export const ACHIEVEMENT_CATEGORIES = [
  'SESSIONS',
  'SETS',
  'VOLUME_KG',
  'RECORDS',
  'STREAK_DAYS',
] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  threshold: number;
  title: string;
  description: string;
}

const formatCount = (value: number) => value.toLocaleString('en-US');

function titleFor(category: AchievementCategory, threshold: number): string {
  const count = formatCount(threshold);
  switch (category) {
    case 'SESSIONS':
      return threshold === 1 ? 'First Session' : `${count} Sessions`;
    case 'SETS':
      return `${count} Sets Completed`;
    case 'VOLUME_KG':
      return `${count} kg Moved`;
    case 'RECORDS':
      return threshold === 1 ? 'First Record' : `${count} Records`;
    case 'STREAK_DAYS':
      return `${count}-Day Streak`;
  }
}

function descriptionFor(
  category: AchievementCategory,
  threshold: number,
): string {
  const count = formatCount(threshold);
  switch (category) {
    case 'SESSIONS':
      return `Complete ${count} ${threshold === 1 ? 'training session' : 'training sessions'}.`;
    case 'SETS':
      return `Complete ${count} logged sets.`;
    case 'VOLUME_KG':
      return `Accumulate ${count} kg of external-load volume.`;
    case 'RECORDS':
      return `Establish records for ${count} ${threshold === 1 ? 'exercise' : 'exercises'}.`;
    case 'STREAK_DAYS':
      return `Build a ${count}-day training streak.`;
  }
}

const THRESHOLDS: Readonly<Record<AchievementCategory, readonly number[]>> = {
  SESSIONS: [1, 10, 25, 50, 100],
  SETS: [10, 100, 250, 500, 1000],
  VOLUME_KG: [1000, 10000, 50000, 100000, 250000],
  RECORDS: [1, 5, 10, 25, 50],
  STREAK_DAYS: [2, 3, 5, 10, 20],
};

/** Stable milestone catalog shared by the writer and every presentation. */
export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] =
  ACHIEVEMENT_CATEGORIES.flatMap(category =>
    THRESHOLDS[category].map(threshold => ({
      id: `${category.toLowerCase()}:${threshold}`,
      category,
      threshold,
      title: titleFor(category, threshold),
      description: descriptionFor(category, threshold),
    })),
  );

export interface AchievementUnlockedEventPayload extends AchievementDefinition {
  schemaVersion: 1;
  backfilled: boolean;
}

export interface StreakMilestoneEventPayload {
  schemaVersion: 1;
  achievementId: string;
  streakDays: number;
  backfilled: boolean;
}

export interface EarnedAchievement extends AchievementDefinition {
  eventId: string;
  unlockedAt: IsoDateString;
  sourceSessionId: string | null;
  /** True when existing verified history was recognized after ACH-01 shipped. */
  backfilled: boolean;
}

export interface RenaissanceRankDefinition {
  id:
    | 'INITIATE'
    | 'APPRENTICE'
    | 'ARTISAN'
    | 'MAESTRO'
    | 'VIRTUOSO'
    | 'LAUREATE';
  title: string;
  description: string;
  minimumSessions: number;
  minimumActiveWeeks: number;
}

/**
 * Stable rank ladder. Both requirements are intentionally based on attendance:
 * completed sessions reward participation, while distinct active weeks reward
 * consistency without encouraging consecutive-day training.
 */
export const RENAISSANCE_RANK_DEFINITIONS = [
  {
    id: 'INITIATE',
    title: 'Initiate',
    description: 'Your place in the training ledger begins here.',
    minimumSessions: 0,
    minimumActiveWeeks: 0,
  },
  {
    id: 'APPRENTICE',
    title: 'Apprentice',
    description: 'Learning the craft through regular practice.',
    minimumSessions: 5,
    minimumActiveWeeks: 3,
  },
  {
    id: 'ARTISAN',
    title: 'Artisan',
    description: 'Building a dependable training practice.',
    minimumSessions: 15,
    minimumActiveWeeks: 8,
  },
  {
    id: 'MAESTRO',
    title: 'Maestro',
    description: 'Sustaining purposeful work across many weeks.',
    minimumSessions: 30,
    minimumActiveWeeks: 16,
  },
  {
    id: 'VIRTUOSO',
    title: 'Virtuoso',
    description: 'Showing enduring discipline through repeated seasons.',
    minimumSessions: 60,
    minimumActiveWeeks: 32,
  },
  {
    id: 'LAUREATE',
    title: 'Laureate',
    description: 'A lasting training practice recorded in the ledger.',
    minimumSessions: 100,
    minimumActiveWeeks: 52,
  },
] as const satisfies readonly RenaissanceRankDefinition[];

export interface RenaissanceRankProgress {
  currentRank: RenaissanceRankDefinition;
  nextRank: RenaissanceRankDefinition | null;
  completedSessions: number;
  activeWeeks: number;
  sessionsRemaining: number;
  activeWeeksRemaining: number;
}

/**
 * Current verified total and the next fixed catalog milestone for one category.
 * A null next milestone means the category's finite catalog is complete.
 */
export interface AchievementCategoryProgress {
  category: AchievementCategory;
  currentValue: number;
  nextMilestone: AchievementDefinition | null;
  remaining: number;
}

/**
 * ACH-05 recognises a return only after the athlete has rebuilt a small,
 * recovery-compatible pattern. The break is counted as full local calendar
 * days without a completed session; repeated sessions on one date count once.
 */
export const COMEBACK_MIN_INACTIVE_DAYS = 14;
export const COMEBACK_REQUIRED_ACTIVE_DAYS = 3;
export const COMEBACK_WINDOW_DAYS = 14;
export const COMEBACK_SESSION_LOOKBACK = 500;
export const COMEBACK_RECOGNITION_LIMIT = 20;

export interface ComebackRecognition {
  id: string;
  inactiveDays: number;
  returnedAt: IsoDateString;
  recognizedAt: IsoDateString;
  sourceSessionId: string;
  activeDays: number;
  /** Inclusive local-calendar span from the return through recognition. */
  windowDays: number;
}

export interface ComebackRecognitionSummary {
  minimumInactiveDays: number;
  requiredActiveDays: number;
  windowDays: number;
  /** Most recent first, capped by COMEBACK_RECOGNITION_LIMIT. */
  recognitions: ComebackRecognition[];
  /** True when older completed-session events fell outside the bounded scan. */
  historyTruncated: boolean;
}

/** Stable successful response of GET /achievements. */
export interface AchievementsResponse {
  analyticsReady: boolean;
  earnedCount: number;
  availableCount: number;
  achievements: EarnedAchievement[];
  rank: RenaissanceRankProgress | null;
  milestoneProgress: AchievementCategoryProgress[];
  comeback: ComebackRecognitionSummary | null;
}
