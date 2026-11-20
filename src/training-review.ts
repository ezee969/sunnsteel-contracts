import type { AppLocale } from "./locale";
import type { IsoDateString } from "./shared";

/**
 * INTEL-04: a Pro member picks a few of their own finished workouts and one
 * fixed question, and the server answers in words and numbered facts.
 * **The model never writes a number**: every value on screen is a fact the
 * server computed from the stored workouts, rendered by the client in the
 * member's unit and language, and each fact cites the workout it came from.
 * Nothing is stored.
 */

/** The questions a review answers; there is no free text. */
export const TRAINING_REVIEW_QUESTIONS = ["CHANGES", "PROGRESS", "EFFORT"] as const;
export type TrainingReviewQuestion = (typeof TRAINING_REVIEW_QUESTIONS)[number];

/** How many of the member's finished workouts one review reads. */
export const TRAINING_REVIEW_WORKOUTS_MIN = 2;
/** Twelve since 2026-11-20 (it was six), for a wider view, at the owner's request. */
export const TRAINING_REVIEW_WORKOUTS_MAX = 12;
/** The picker offers the member's latest finished workouts, newest first. */
export const TRAINING_REVIEW_CANDIDATES = 20;
/** At most this many findings in a review. */
export const TRAINING_REVIEW_FINDINGS_MAX = 5;
/** The words of one finding, its facts not counted. */
export const TRAINING_REVIEW_FINDING_TEXT_MAX = 400;

/** `POST /training-reviews`. */
export interface CreateTrainingReviewRequest {
  question: TrainingReviewQuestion;
  /** The member's own finished workouts, in any order. */
  sessionIds: string[];
  /** The language the review's words are written in. */
  locale: AppLocale;
}

/**
 * What a fact states. Weights are canonical kilograms; the client converts.
 * A fact with an `exerciseId` is about that exercise in that workout,
 * otherwise about the whole workout.
 */
export const TRAINING_REVIEW_FACT_KINDS = [
  /** An exercise, by name: `exerciseName`, no value. */
  "EXERCISE",
  /** A workout, rendered as its date: no value. */
  "WORKOUT",
  /** How long the workout lasted: `value` in seconds. */
  "DURATION",
  /** Load times reps, in kilograms. */
  "VOLUME",
  /** Completed sets, warm-ups excluded. */
  "SETS",
  /** The heaviest completed set: `value` kilograms for `reps`. */
  "BEST_SET",
  /** The best estimated one-rep max, in kilograms. */
  "ESTIMATED_1RM",
  /** The average RPE of the sets that were rated. */
  "AVERAGE_RPE",
  /** Sets that had a rep target. */
  "TARGETED_SETS",
  /** Sets that came short of their rep target. */
  "SETS_BELOW_TARGET",
  /** A new personal best set in that workout: `value` kilograms for `reps`. */
  "RECORD",
] as const;
export type TrainingReviewFactKind = (typeof TRAINING_REVIEW_FACT_KINDS)[number];

export interface TrainingReviewFact {
  /** `F1`, `F2`...: what a finding's segments point at. */
  id: string;
  kind: TrainingReviewFactKind;
  /** The workout it comes from, which the client cites; null for an exercise's name. */
  sessionId: string | null;
  exerciseId: string | null;
  /** As stored; a catalog name is translated by the client. */
  exerciseName: string | null;
  value: number | null;
  /** `BEST_SET`'s and `RECORD`'s reps. */
  reps: number | null;
}

/** A finding is words and facts in reading order. */
export type TrainingReviewSegment = { text: string } | { fact: string };

export interface TrainingReviewFinding {
  segments: TrainingReviewSegment[];
}

/** A workout the review read. */
export interface TrainingReviewWorkout {
  sessionId: string;
  routineName: string;
  dayName: string | null;
  endedAt: IsoDateString;
}

export interface TrainingReview {
  question: TrainingReviewQuestion;
  /** Oldest first. */
  workouts: TrainingReviewWorkout[];
  findings: TrainingReviewFinding[];
  /** Only the facts the findings use. */
  facts: TrainingReviewFact[];
}

/**
 * Whether a review can be asked for now, as for routine drafts: QUOTA_REACHED
 * is this member's month, PAUSED the month's cost ceiling across all members,
 * UNAVAILABLE no model configured.
 */
export const TRAINING_REVIEW_STATES = [
  "READY",
  "QUOTA_REACHED",
  "PAUSED",
  "UNAVAILABLE",
] as const;
export type TrainingReviewState = (typeof TRAINING_REVIEW_STATES)[number];

/**
 * `GET /training-reviews/usage`. Every request the model answered counts,
 * whether or not it became a review; a provider failure that answered
 * nothing does not.
 */
export interface TrainingReviewUsage {
  state: TrainingReviewState;
  used: number;
  /** The plan's monthly reviews. */
  limit: number;
  /** When the month ends: the first of the next month, UTC. */
  resetsAt: string;
}

export interface TrainingReviewResult {
  review: TrainingReview;
  usage: TrainingReviewUsage;
}

/** Whether a set of picked workouts is a size a review accepts. */
export function trainingReviewSelectionFits(count: number): boolean {
  return count >= TRAINING_REVIEW_WORKOUTS_MIN && count <= TRAINING_REVIEW_WORKOUTS_MAX;
}
