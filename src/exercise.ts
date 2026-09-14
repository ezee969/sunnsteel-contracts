import type {
  IsoDateString,
  MuscleGroup,
} from './shared';

// Exercise contracts ------------------------------------------------------

/**
 * How an exercise moves (EXER-09). Compound patterns first, then the
 * single-joint actions the catalog uses. Alternatives start from this plus
 * primary muscles; `substitutionGroup` is the narrower, near-identical set.
 */
export const MOVEMENT_PATTERNS = [
  'HORIZONTAL_PUSH',
  'VERTICAL_PUSH',
  'HORIZONTAL_PULL',
  'VERTICAL_PULL',
  'SQUAT',
  'HINGE',
  'LUNGE',
  'CHEST_FLY',
  'SHOULDER_ABDUCTION',
  'SHOULDER_FLEXION',
  'SHOULDER_HORIZONTAL_ABDUCTION',
  'SHOULDER_EXTENSION',
  'SCAPULAR_ELEVATION',
  'ELBOW_FLEXION',
  'ELBOW_EXTENSION',
  'KNEE_EXTENSION',
  'KNEE_FLEXION',
  'HIP_EXTENSION',
  'PLANTAR_FLEXION',
  'CORE_FLEXION',
  'CORE_ROTATION',
  'CORE_STABILITY',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

export const EXERCISE_MECHANICS = ['COMPOUND', 'ISOLATION'] as const;
export type ExerciseMechanic = (typeof EXERCISE_MECHANICS)[number];

/**
 * Closed, lowercase vocabulary for what an exercise needs. Lowercase so it can
 * be compared with the free-text equipment users list on a training location
 * (PREF-01), which is normalized to lowercase.
 */
export const EXERCISE_EQUIPMENT = [
  'barbell',
  'ez-bar',
  'dumbbell',
  'cable',
  'machine',
  'smith-machine',
  'bench',
  'incline-bench',
  'preacher-bench',
  'rack',
  'pull-up-bar',
  'dip-station',
  'bodyweight',
] as const;
export type ExerciseEquipment = (typeof EXERCISE_EQUIPMENT)[number];

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  /** The primary implement, kept for existing displays. */
  equipment: string;
  /** Null only for entries without catalog metadata (e.g. future custom exercises). */
  movementPattern: MovementPattern | null;
  mechanic: ExerciseMechanic | null;
  /** Everything needed to perform the exercise, from `EXERCISE_EQUIPMENT`. */
  equipmentRequired: ExerciseEquipment[];
  /** Near-identical exercises share a group and can replace each other. */
  substitutionGroup: string | null;
  /** Ordered cues; empty until the content work in EXER-03 lands. */
  instructions: string[];
  /** Demonstration asset; null until EXER-04 supplies licensed media. */
  mediaUrl: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

// Starred exercises (EXER-07) ---------------------------------------------

/**
 * The most catalog exercises one account can star. Starring is a private
 * working preference that orders pickers; it is separate from the public
 * favorite exercises on the training identity.
 */
export const STARRED_EXERCISES_MAX = 100;

export interface StarredExercise {
  exerciseId: string;
  starredAt: IsoDateString;
}

/**
 * Response of GET /exercises/starred and of PUT/DELETE
 * /exercises/:id/star. Newest first.
 */
export interface StarredExercisesResponse {
  items: StarredExercise[];
}
