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

/** Stable successful response of GET /achievements. */
export interface AchievementsResponse {
  analyticsReady: boolean;
  earnedCount: number;
  availableCount: number;
  achievements: EarnedAchievement[];
}
