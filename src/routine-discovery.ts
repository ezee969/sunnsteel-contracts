import type { ExerciseEquipment } from './exercise';
import type { RoutineScheduleMode } from './routine';
import type { SharedRoutineOwner } from './routine-sharing';
import type { IsoDateString, MuscleGroup } from './shared';
import type { TrainingExperienceLevel, TrainingGoal } from './user';

// Routine discovery (ROUT-07) -------------------------------------------------
//
// Browsing programmes other members have shared. **Discovery is not a new
// visibility tier**: it lists exactly what `canViewRoutine` already allows —
// public routines in public accounts to everyone, followers-only ones to
// followers — so nothing becomes findable that was not already readable, and
// `PROF-10` removes both parties of a block from each other's results.
//
// Of the six facets, four are derived from the routine itself and two are
// declared by its owner. The split is deliberate: a routine's days, muscles,
// equipment and duration are facts about what it programs, while its goal and
// experience level are claims only its author can make. Deriving those two
// from the author's `PROF-05` training identity would attribute a person's
// goals to a programme, which is inventing data.

/** Owner-declared, both optional. Undeclared is not a default, it is unknown. */
export interface RoutineClassification {
  goal?: TrainingGoal | null;
  experienceLevel?: TrainingExperienceLevel | null;
}

/**
 * Derived from the routine's own exercises and the `EXER-09` catalog, never
 * stored: a stored facet drifts from the routine the moment an edit misses
 * its recompute.
 */
export interface RoutineFacets {
  dayCount: number;
  exerciseCount: number;
  /** Muscles any day trains, primary or secondary, deduplicated. */
  muscles: MuscleGroup[];
  /** Everything the routine needs, from the catalog's closed vocabulary. */
  equipment: ExerciseEquipment[];
  /**
   * The longest day's estimate in minutes, by `ROUT-10`'s rule. It is an
   * estimate from set counts, reps and rest, and every surface that shows it
   * says so rather than presenting it as a measured time.
   */
  longestDayMinutes: number;
}

/** One routine in a discovery result. It carries no training, as `ROUT-04`. */
export interface DiscoverableRoutine
  extends RoutineClassification,
    RoutineFacets {
  routineId: string;
  name: string;
  description: string | null;
  scheduleMode: RoutineScheduleMode;
  author: SharedRoutineOwner;
  updatedAt: IsoDateString;
}

/** Duration buckets, so a filter is a choice rather than a number entry. */
export const ROUTINE_DURATION_BANDS = ['SHORT', 'MEDIUM', 'LONG'] as const;
export type RoutineDurationBand = (typeof ROUTINE_DURATION_BANDS)[number];

/** Upper bound of each band in minutes; `LONG` is anything above `MEDIUM`. */
export const ROUTINE_DURATION_BAND_MAX_MINUTES: Record<
  Exclude<RoutineDurationBand, 'LONG'>,
  number
> = { SHORT: 45, MEDIUM: 75 };

/** GET /routines/discover */
export interface RoutineDiscoveryQuery {
  /** Matches the routine name or description, case-insensitively. */
  q?: string;
  goal?: TrainingGoal;
  experienceLevel?: TrainingExperienceLevel;
  /** Exact number of training days a week. */
  days?: number;
  /** The routine must train this muscle, primary or secondary. */
  muscle?: MuscleGroup;
  /** The routine must need nothing outside what the viewer selects. */
  equipment?: ExerciseEquipment[];
  duration?: RoutineDurationBand;
  limit?: number;
  /** Opaque; from the previous page's `nextCursor`. */
  cursor?: string;
}

export const ROUTINE_DISCOVERY_DEFAULT_LIMIT = 20;
export const ROUTINE_DISCOVERY_MAX_LIMIT = 50;

/**
 * How many readable routines one request will consider before filtering.
 * The scan is bounded on purpose, and the response says when it ran out
 * rather than quietly returning a partial answer as a complete one.
 */
export const ROUTINE_DISCOVERY_SCAN_LIMIT = 500;

export interface RoutineDiscoveryResponse {
  routines: DiscoverableRoutine[];
  nextCursor?: string;
  /**
   * True when the scan limit was reached, so results may be incomplete. The
   * UI says so; it never presents a truncated page as everything there is.
   */
  scanTruncated: boolean;
}
