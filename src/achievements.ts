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
  /** Counted sessions: completed, with at least one completed work set. */
  minimumSessions: number;
  /** Monday-to-Sunday weeks holding at least one counted session. */
  minimumActiveWeeks: number;
  /**
   * Completed work sets across every finished workout (a warm-up never
   * counts, a bodyweight set does). Zero below Maestro; from there it keeps a
   * rank from being reached with token sessions, and it never reads a load.
   */
  minimumCompletedSets: number;
}

export type RenaissanceRankId = RenaissanceRankDefinition['id'];

/**
 * Stable rank ladder. Every requirement is about showing up and doing the
 * work, never about the load: counted sessions reward participation, distinct
 * active weeks reward consistency without encouraging consecutive-day
 * training, and from Maestro a total of completed work sets asks that those
 * sessions held real training. A reached rank is kept for good
 * (`RANK_REACHED`), so a rank once shown is never taken back.
 */
export const RENAISSANCE_RANK_DEFINITIONS = [
  {
    id: 'INITIATE',
    title: 'Initiate',
    description: 'Your place in the training ledger begins here.',
    minimumSessions: 0,
    minimumActiveWeeks: 0,
    minimumCompletedSets: 0,
  },
  {
    id: 'APPRENTICE',
    title: 'Apprentice',
    description: 'Learning the craft through regular practice.',
    minimumSessions: 5,
    minimumActiveWeeks: 3,
    minimumCompletedSets: 0,
  },
  {
    id: 'ARTISAN',
    title: 'Artisan',
    description: 'Building a dependable training practice.',
    minimumSessions: 15,
    minimumActiveWeeks: 8,
    minimumCompletedSets: 0,
  },
  {
    id: 'MAESTRO',
    title: 'Maestro',
    description: 'Sustaining purposeful work across many weeks.',
    minimumSessions: 30,
    minimumActiveWeeks: 16,
    minimumCompletedSets: 100,
  },
  {
    id: 'VIRTUOSO',
    title: 'Virtuoso',
    description: 'Showing enduring discipline through repeated seasons.',
    minimumSessions: 60,
    minimumActiveWeeks: 32,
    minimumCompletedSets: 250,
  },
  {
    id: 'LAUREATE',
    title: 'Laureate',
    description: 'A lasting training practice recorded in the ledger.',
    minimumSessions: 100,
    minimumActiveWeeks: 52,
    minimumCompletedSets: 500,
  },
] as const satisfies readonly RenaissanceRankDefinition[];

export interface RenaissanceRankProgress {
  /** The highest rank met now or reached before, whichever is higher. */
  currentRank: RenaissanceRankDefinition;
  nextRank: RenaissanceRankDefinition | null;
  /** Counted sessions: completed, with at least one completed work set. */
  completedSessions: number;
  activeWeeks: number;
  /** Completed work sets, warm-ups excluded. */
  completedSets: number;
  sessionsRemaining: number;
  activeWeeksRemaining: number;
  /** Zero when the next rank asks for no sets or they are already done. */
  setsRemaining: number;
}

/** What a rank is measured from, as the analytics projection keeps it. */
export interface RenaissanceRankInputs {
  completedSessions: number;
  activeWeeks: number;
  completedSets: number;
}

/** Whether these totals meet every requirement of a rank. */
export function meetsRenaissanceRank(
  rank: RenaissanceRankDefinition,
  inputs: RenaissanceRankInputs,
): boolean {
  return (
    inputs.completedSessions >= rank.minimumSessions &&
    inputs.activeWeeks >= rank.minimumActiveWeeks &&
    inputs.completedSets >= rank.minimumCompletedSets
  );
}

function rankIndex(id: RenaissanceRankId | null | undefined): number {
  if (!id) return 0;
  return Math.max(
    0,
    RENAISSANCE_RANK_DEFINITIONS.findIndex(rank => rank.id === id),
  );
}

/** Whichever of two ranks is higher on the ladder; null when both are. */
export function higherRenaissanceRank(
  a: RenaissanceRankId | null | undefined,
  b: RenaissanceRankId | null | undefined,
): RenaissanceRankId | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return rankIndex(a) >= rankIndex(b) ? a : b;
}

/**
 * The rank the totals reach, never lower than `reached`, the highest rank
 * already recorded for the account: a rank that was reached is kept, whatever
 * a later replay of the history (a removed past workout, another time zone)
 * counts. The ladder is climbed in order, so a later rank whose requirement
 * happens to be met never skips an earlier one that is not.
 */
export function renaissanceRankProgress(
  inputs: RenaissanceRankInputs,
  reached?: RenaissanceRankId | null,
): RenaissanceRankProgress {
  let metIndex = 0;
  for (let index = 1; index < RENAISSANCE_RANK_DEFINITIONS.length; index += 1) {
    if (!meetsRenaissanceRank(RENAISSANCE_RANK_DEFINITIONS[index], inputs)) {
      break;
    }
    metIndex = index;
  }
  const currentIndex = Math.max(metIndex, rankIndex(reached));
  const currentRank: RenaissanceRankDefinition =
    RENAISSANCE_RANK_DEFINITIONS[currentIndex];
  const nextRank: RenaissanceRankDefinition | null =
    RENAISSANCE_RANK_DEFINITIONS[currentIndex + 1] ?? null;
  const remaining = (target: number | undefined, value: number) =>
    nextRank && target ? Math.max(0, target - value) : 0;

  return {
    currentRank,
    nextRank,
    completedSessions: inputs.completedSessions,
    activeWeeks: inputs.activeWeeks,
    completedSets: inputs.completedSets,
    sessionsRemaining: remaining(
      nextRank?.minimumSessions,
      inputs.completedSessions,
    ),
    activeWeeksRemaining: remaining(
      nextRank?.minimumActiveWeeks,
      inputs.activeWeeks,
    ),
    setsRemaining: remaining(nextRank?.minimumCompletedSets, inputs.completedSets),
  };
}

/** Every rank from Initiate through `id`, in ladder order. */
export function renaissanceRanksThrough(
  id: RenaissanceRankId,
): RenaissanceRankDefinition[] {
  return RENAISSANCE_RANK_DEFINITIONS.slice(0, rankIndex(id) + 1);
}

/**
 * The `RANK_REACHED` training event: one per account and rank, written the
 * first time the rank's requirements are met and removed only with the
 * account. It carries no session, so nothing that undoes a session's facts
 * reaches it.
 */
export interface RankReachedEventPayload {
  schemaVersion: 1;
  rankId: RenaissanceRankId;
  /** True when it was recognized from history rather than reached live. */
  backfilled: boolean;
}

export function rankReachedEventKey(
  userId: string,
  rankId: RenaissanceRankId,
): string {
  return `rank:${userId}:${rankId}:v1`;
}

export function isRenaissanceRankId(value: unknown): value is RenaissanceRankId {
  return (
    typeof value === 'string' &&
    RENAISSANCE_RANK_DEFINITIONS.some(rank => rank.id === value)
  );
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
