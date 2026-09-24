import type { DeloadLoadReduction, DeloadSetMode } from "./deloads";
import type { IsoDateString } from "./shared";

/**
 * INTEL-02: a lighter period proposed from the signals `PROG-10` states. The
 * suggestion acts on evidence only -- it names what was marked and when, never
 * a cause -- and nothing changes until the member saves the deload it opens.
 *
 * The signals are evaluated twice, today and as they stood
 * `DELOAD_SUGGESTION_EARLIER_DAYS` ago. A suggestion needs one load signal
 * (effort, rep targets or declining lifts) marked in both, or at least
 * `DELOAD_SUGGESTION_MIN_MARKED_TODAY` of them marked today. The workouts
 * signal never triggers one: training less is not a reason to train lighter.
 */
export const DELOAD_SUGGESTION_EARLIER_DAYS = 7;
export const DELOAD_SUGGESTION_MIN_MARKED_TODAY = 2;
/** No suggestion while a deload ended less than this many days ago. */
export const DELOAD_SUGGESTION_COOLDOWN_DAYS = 21;
/** The suggested routine is the active one trained most in these days. */
export const DELOAD_SUGGESTION_ROUTINE_DAYS = 14;

export const DELOAD_SUGGESTION_SIGNALS = [
  "EFFORT",
  "REP_TARGETS",
  "DECLINES",
] as const;
export type DeloadSuggestionSignal = (typeof DELOAD_SUGGESTION_SIGNALS)[number];

/** Why nothing is suggested; the page shows nothing in every case. */
export type DeloadSuggestionUnavailableReason =
  /** No load signal is sustained. */
  | "NOT_SUSTAINED"
  /** A deload is in force or planned on any routine. */
  | "DELOAD_SCHEDULED"
  /** A deload ended within the cooldown. */
  | "RECENT_DELOAD"
  /** No active routine was trained in the routine window. */
  | "NO_ROUTINE"
  /** The routine plans nothing on the suggested dates. */
  | "NOTHING_PLANNED";

export interface DeloadSuggestionEvidence {
  signal: DeloadSuggestionSignal;
  markedNow: boolean;
  markedEarlier: boolean;
}

export interface DeloadSuggestion {
  routineId: string;
  routineName: string;
  /** Owner-local calendar dates, inclusive, as a deload stores them. */
  startDate: string;
  endDate: string;
  lengthDays: number;
  /** The ROUT-16 defaults; the dialog lets the member change both. */
  loadReductionPercent: DeloadLoadReduction;
  setMode: DeloadSetMode;
  /** The training block the dates fall in, when one is in force. */
  trainingBlockName: string | null;
}

/** Stable successful response of GET /workouts/progress/deload-suggestion. */
export interface DeloadSuggestionResponse {
  asOf: IsoDateString;
  thresholds: {
    earlierDays: number;
    minMarkedToday: number;
    cooldownDays: number;
    routineDays: number;
    lengthDays: number;
  };
  /** One entry per load signal, in `DELOAD_SUGGESTION_SIGNALS` order. */
  evidence: DeloadSuggestionEvidence[];
  suggestion: DeloadSuggestion | null;
  unavailable: DeloadSuggestionUnavailableReason | null;
}
