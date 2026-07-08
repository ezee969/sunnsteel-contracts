import type {
  IsoDateString,
  ProgramStyle,
} from './shared';

// TM adjustment contracts -------------------------------------------------

export interface CreateTmEventRequest {
  exerciseId: string;
  weekNumber: number;
  deltaKg: number;
  preTmKg: number;
  postTmKg: number;
  reason?: string;
}

export interface TmEventResponse {
  id: string;
  routineId: string;
  exerciseId: string;
  exerciseName: string;
  weekNumber: number;
  deltaKg: number;
  preTmKg: number;
  postTmKg: number;
  reason?: string;
  style: ProgramStyle | null;
  createdAt: IsoDateString;
}

export interface TmEventSummary {
  exerciseId: string;
  exerciseName: string;
  totalDeltaKg: number;
  averageDeltaKg: number;
  adjustmentCount: number;
  lastAdjustmentDate: IsoDateString | null;
}

export interface GetTmAdjustmentsParams {
  exerciseId?: string;
  minWeek?: number;
  maxWeek?: number;
}

export const TM_ADJUSTMENT_CONSTANTS = {
  MAX_DELTA_KG: 15,
  MIN_DELTA_KG: -15,
  MIN_WEEK: 1,
  MAX_WEEK: 21,
  MAX_REASON_LENGTH: 160,
} as const;
