// Shared domain contracts for Sunnsteel
// Runtime-free, browser-safe, type-first exports

export const PROGRAM_STYLES = ['STANDARD', 'HYPERTROPHY'] as const;
export type ProgramStyle = (typeof PROGRAM_STYLES)[number];

export const WORKOUT_SESSION_STATUSES = [
  'IN_PROGRESS',
  'COMPLETED',
  'ABORTED',
] as const;
export type WorkoutSessionStatus = (typeof WORKOUT_SESSION_STATUSES)[number];

export const WEIGHT_UNITS = ['KG', 'LB'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const SEXES = ['MALE', 'FEMALE'] as const;
export type Sex = (typeof SEXES)[number];

export const REP_TYPES = ['FIXED', 'RANGE'] as const;
export type RepType = (typeof REP_TYPES)[number];

export const PROGRESSION_SCHEMES = [
  'NONE',
  'DOUBLE_PROGRESSION',
  'DYNAMIC_DOUBLE_PROGRESSION',
] as const;
export type ProgressionScheme = (typeof PROGRESSION_SCHEMES)[number];

export const MUSCLE_GROUPS = [
  'PECTORAL',
  'LATISSIMUS_DORSI',
  'TRAPEZIUS',
  'REAR_DELTOIDS',
  'ERECTOR_SPINAE',
  'TERES_MAJOR_MINOR',
  'ANTERIOR_DELTOIDS',
  'MEDIAL_DELTOIDS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'QUADRICEPS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'CORE',
  'ADDUCTOR',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type IsoDateString = string;

export type Brand<T, B> = T & { readonly __brand: B };
export type UserId = Brand<string, 'UserId'>;
export type RoutineId = Brand<string, 'RoutineId'>;
export type RoutineDayId = Brand<string, 'RoutineDayId'>;
export type WorkoutSessionId = Brand<string, 'WorkoutSessionId'>;
export type ExerciseId = Brand<string, 'ExerciseId'>;

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}
