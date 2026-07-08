import type {
  IsoDateString,
  ProgramStyle,
} from './shared';

// RtF contracts -----------------------------------------------------------

export type RtfVariant = ProgramStyle;

export interface RtfExerciseGoal {
  routineExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  variant: RtfVariant;
  week: number;
  isDeload: boolean;
  intensity: number;
  fixedReps: number;
  setsPlanned: number;
  amrapTarget: number | null;
  amrapSetNumber: number | null;
  workingWeightKg?: number;
  trainingMaxKg?: number;
}

export interface RtfWeekGoals {
  routineId: string;
  week: number;
  withDeloads: boolean;
  goals: RtfExerciseGoal[];
  version: number;
  _cache?: 'HIT' | 'MISS';
}

export interface RtfTimelineEntry {
  week: number;
  isDeload: boolean;
  startDate: IsoDateString;
  endDate: IsoDateString;
}

export interface RtfTimeline {
  routineId: string;
  totalWeeks: number;
  withDeloads: boolean;
  timeline: RtfTimelineEntry[];
  version: number;
  _cache?: 'HIT' | 'MISS';
}

export interface RtfForecastData {
  intensity: number;
  fixedReps: number;
  amrapTarget: number;
  sets: number;
  amrapSet: number;
  isDeload?: boolean;
}

export interface RtfForecastWeek {
  week: number;
  isDeload: boolean;
  standard?: RtfForecastData;
  hypertrophy?: RtfForecastData;
}

export interface RtfForecast {
  routineId: string;
  weeks: number;
  version: number;
  withDeloads: boolean;
  forecast: RtfForecastWeek[];
  _cache?: 'HIT' | 'MISS';
}
