import { setKindOf, type SetKind } from './set-kinds';
import type { IsoDateString } from './shared';

// Linear periodization (ROUT-17 to ROUT-19) --------------------------------
//
// An exercise on the `LINEAR_PERIODIZATION` scheme trains an 8-step block:
// each step prescribes three working sets at one load, a percentage of a
// fixed reference max rounded to the exercise's increment, and a target RIR
// per set. There is no rep target: the member does the reps the load allows
// until the RIR is reached, and logs only the reps. A step advances when a
// completed workout ticked all three working sets of that slot; reps never
// move the load. These rules are shared so the builder, the live session and
// the server cannot disagree about a load.

/** Steps in one block. */
export const LP_BLOCK_STEPS = 8;
/** Working sets per step, all at the step's load. */
export const LP_WORKING_SETS = 3;
/** The rest a new LP exercise is offered with. */
export const LP_REST_SECONDS = 180;

/** Upper bound for a reference max, in kg. */
export const LP_REFERENCE_MAX_KG = 1000;

export interface LpSetTarget {
  /** Target RIR range; equal ends mean one value (the AMRAP's 0). */
  rirMin: number;
  rirMax: number;
  /** A technical AMRAP: as many good reps as possible, to RIR 0. */
  amrap: boolean;
}

export interface LpStep {
  step: number;
  /** The share of the reference max, 0.63 for 63 %. */
  percentage: number;
  sets: [LpSetTarget, LpSetTarget, LpSetTarget];
}

const EASY: LpSetTarget = { rirMin: 2, rirMax: 3, amrap: false };
const AMRAP: LpSetTarget = { rirMin: 0, rirMax: 0, amrap: true };
const HARD: LpSetTarget = { rirMin: 1, rirMax: 2, amrap: false };

/** The fixed table: steps 1-4 end in a technical AMRAP, 5-8 do not. */
export const LP_STEPS: readonly LpStep[] = [
  { step: 1, percentage: 0.63, sets: [EASY, EASY, AMRAP] },
  { step: 2, percentage: 0.66, sets: [EASY, EASY, AMRAP] },
  { step: 3, percentage: 0.69, sets: [EASY, EASY, AMRAP] },
  { step: 4, percentage: 0.72, sets: [EASY, EASY, AMRAP] },
  { step: 5, percentage: 0.75, sets: [HARD, HARD, HARD] },
  { step: 6, percentage: 0.78, sets: [HARD, HARD, HARD] },
  { step: 7, percentage: 0.81, sets: [HARD, HARD, HARD] },
  { step: 8, percentage: 0.85, sets: [HARD, HARD, HARD] },
];

/** The step's prescription; out-of-range steps are clamped to 1-8. */
export function lpStep(step: number): LpStep {
  const index = Math.min(Math.max(Math.trunc(step) || 1, 1), LP_BLOCK_STEPS);
  return LP_STEPS[index - 1];
}

/** The optional recovery step after a block (ROUT-19): fixed reps, light. */
export const LP_RECOVERY = { percentage: 0.7, sets: 2, reps: 5 } as const;

const tidy = (value: number) => Math.round(value * 1e6) / 1e6;

/**
 * The nearest multiple of the increment, a tie rounding down. Rounding in kg
 * equals rounding in pounds when the increment was entered in pounds, since
 * the conversion is linear.
 */
export function roundToIncrement(value: number, increment: number): number {
  if (!(increment > 0)) return tidy(value);
  const steps = value / increment;
  const floor = Math.floor(steps + 1e-9);
  const fraction = steps - floor;
  return tidy((fraction > 0.5 + 1e-9 ? floor + 1 : floor) * increment);
}

/** The largest multiple of the increment not above the value. */
export function roundDownToIncrement(value: number, increment: number): number {
  if (!(increment > 0)) return tidy(value);
  return tidy(Math.floor(value / increment + 1e-9) * increment);
}

/** The load of a share of the reference max, on the exercise's increment. */
export function lpLoadKg(
  referenceMaxKg: number,
  percentage: number,
  incrementKg: number,
): number {
  return roundToIncrement(referenceMaxKg * percentage, incrementKg);
}

// State ----------------------------------------------------------------------

/**
 * BLOCK trains `step`; FINISHED waits for the member's choice of what follows
 * (ROUT-19); RECOVERY trains the optional recovery step, then the next block.
 */
export const LP_PHASES = ['BLOCK', 'RECOVERY', 'FINISHED'] as const;
export type LpPhase = (typeof LP_PHASES)[number];

/** One working set of steps 7-8, kept for the end-of-block estimate. */
export interface LpSample {
  sessionId: string;
  step: number;
  /** 1-3: the set's place among the step's working sets. */
  set: number;
  loadKg: number;
  reps: number;
}

/**
 * Where a slot is in its block. It travels with the routine's setup like the
 * set loads do, so an edit, a version or a block keeps it; a shared or cloned
 * routine drops it, since the reference max is the owner's.
 */
export interface LinearPeriodizationState {
  /** The block's reference max (an estimated 1RM), canonical kg. */
  referenceMaxKg: number;
  phase: LpPhase;
  /** 1-8: the step the next workout of this slot trains. */
  step: number;
  /** 1 for the first block, one more for each block started after it. */
  cycle: number;
  /** Steps 7-8 of this block, for the estimate (ROUT-18). */
  samples: LpSample[];
  /** FINISHED and RECOVERY: when the block finished. */
  finishedAt?: IsoDateString | null;
  /** FINISHED and RECOVERY: the finished block's estimate, if one was possible. */
  estimatedMaxKg?: number | null;
  /** RECOVERY: the reference the next block starts from. */
  nextReferenceMaxKg?: number | null;
}

/** A new block from step 1. */
export function startLinearPeriodization(
  referenceMaxKg: number,
  cycle = 1,
): LinearPeriodizationState {
  return {
    referenceMaxKg,
    phase: 'BLOCK',
    step: 1,
    cycle,
    samples: [],
    finishedAt: null,
    estimatedMaxKg: null,
    nextReferenceMaxKg: null,
  };
}

/** Why a state cannot be stored, or null. */
export function linearPeriodizationProblem(
  state: LinearPeriodizationState,
): string | null {
  if (
    !Number.isFinite(state.referenceMaxKg) ||
    state.referenceMaxKg <= 0 ||
    state.referenceMaxKg > LP_REFERENCE_MAX_KG
  ) {
    return 'The reference max must be above 0';
  }
  if (!(LP_PHASES as readonly string[]).includes(state.phase)) {
    return 'Unknown block phase';
  }
  if (
    !Number.isInteger(state.step) ||
    state.step < 1 ||
    state.step > LP_BLOCK_STEPS
  ) {
    return 'The block step must be between 1 and 8';
  }
  if (!Number.isInteger(state.cycle) || state.cycle < 1) {
    return 'The block number must be 1 or more';
  }
  if (
    state.phase === 'RECOVERY' &&
    !((state.nextReferenceMaxKg ?? 0) > 0)
  ) {
    return 'A recovery step needs the next block\'s reference max';
  }
  return null;
}

// The prescription -----------------------------------------------------------

/** What one set of an LP exercise prescribes this workout. */
export interface LpSetPrescription {
  loadKg: number;
  /** Null on the recovery step, which prescribes reps instead. */
  target: LpSetTarget | null;
  /** The recovery step's fixed reps. */
  reps: number | null;
}

/**
 * The slot's working sets for its next workout: three at the step's load in
 * BLOCK, the recovery step's two in RECOVERY, none while FINISHED waits for a
 * choice.
 */
export function lpPrescription(
  state: LinearPeriodizationState,
  incrementKg: number,
): LpSetPrescription[] {
  if (state.phase === 'FINISHED') return [];
  if (state.phase === 'RECOVERY') {
    const loadKg = lpLoadKg(
      state.referenceMaxKg,
      LP_RECOVERY.percentage,
      incrementKg,
    );
    return Array.from({ length: LP_RECOVERY.sets }, () => ({
      loadKg,
      target: null,
      reps: LP_RECOVERY.reps,
    }));
  }
  const step = lpStep(state.step);
  const loadKg = lpLoadKg(state.referenceMaxKg, step.percentage, incrementKg);
  return step.sets.map((target) => ({ loadKg, target, reps: null }));
}

/**
 * The working sets of a list in order, the LP way: every set that is not a
 * warm-up. Warm-ups stay outside the block.
 */
export function lpWorkingSets<T extends { kind?: SetKind | null }>(
  sets: T[],
): T[] {
  return sets.filter((set) => setKindOf(set) !== 'WARMUP');
}

// The estimate (ROUT-18) -----------------------------------------------------

/** Only these steps feed the estimate: the heaviest, closest to a max. */
export const LP_ESTIMATE_STEPS: readonly number[] = [7, 8];
/** Sets whose reps plus RIR exceed this are left out (Epley drifts above it). */
export const LP_ESTIMATE_MAX_REPS_TO_FAILURE = 10;
/** Fewer qualifying sets than this, and there is no estimate. */
export const LP_ESTIMATE_MIN_SETS = 3;

/** The middle of a target RIR range: 2-3 counts 2.5, 1-2 counts 1.5. */
export function lpRirMidpoint(target: LpSetTarget): number {
  return (target.rirMin + target.rirMax) / 2;
}

/** The RIR a sample is counted with: its prescribed target's midpoint. */
export function lpSampleRir(sample: Pick<LpSample, 'step' | 'set'>): number {
  const target = lpStep(sample.step).sets[sample.set - 1] ?? HARD;
  return lpRirMidpoint(target);
}

/** Epley on reps to failure: `load × (1 + (reps + RIR) / 30)`. */
export function lpSetEstimateKg(loadKg: number, reps: number, rir: number) {
  return loadKg * (1 + (reps + rir) / 30);
}

export interface LpEstimate {
  /** Rounded down to the increment; null with too few qualifying sets. */
  estimatedMaxKg: number | null;
  /** The sets it was computed from, in step and set order. */
  sets: Array<LpSample & { rir: number; estimateKg: number }>;
}

/**
 * The end-of-block estimate: each set of steps 7-8 with at least one rep and
 * reps + RIR of 10 or fewer, estimated with Epley on reps to failure; their
 * median, rounded down to the increment, once there are three.
 */
export function lpEstimate(
  samples: LpSample[],
  incrementKg: number,
): LpEstimate {
  const sets = samples
    .filter((sample) => LP_ESTIMATE_STEPS.includes(sample.step))
    .map((sample) => ({ ...sample, rir: lpSampleRir(sample) }))
    .filter(
      (sample) =>
        sample.reps >= 1 &&
        sample.loadKg > 0 &&
        sample.reps + sample.rir <= LP_ESTIMATE_MAX_REPS_TO_FAILURE,
    )
    .map((sample) => ({
      ...sample,
      estimateKg: tidy(lpSetEstimateKg(sample.loadKg, sample.reps, sample.rir)),
    }))
    .sort((a, b) => a.step - b.step || a.set - b.set);
  if (sets.length < LP_ESTIMATE_MIN_SETS) {
    return { estimatedMaxKg: null, sets };
  }
  const values = sets.map((set) => set.estimateKg).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  const median =
    values.length % 2
      ? values[middle]
      : (values[middle - 1] + values[middle]) / 2;
  return { estimatedMaxKg: roundDownToIncrement(median, incrementKg), sets };
}

// What follows (ROUT-19) -----------------------------------------------------

/** An estimate this far above the reference pre-selects a heavier block. */
export const LP_PROGRESS_THRESHOLD = 0.025;
/** A heavier block's reference is at most this far above the last one. */
export const LP_PROGRESS_CAP = 0.05;

/**
 * PROGRESS: a new, heavier block. REPEAT: the same reference again. RESET: a
 * new block at the lower estimate.
 */
export const LP_NEXT_BLOCK_KINDS = ['PROGRESS', 'REPEAT', 'RESET'] as const;
export type LpNextBlockKind = (typeof LP_NEXT_BLOCK_KINDS)[number];

export interface LpRecommendation {
  kind: LpNextBlockKind;
  /** The reference the pre-selected next block starts from, kg. */
  nextReferenceMaxKg: number;
  /** estimate / reference - 1, or null without an estimate. */
  change: number | null;
}

/**
 * The next block pre-selected from the evidence -- never applied without the
 * member's choice: at least 2.5 % above, a block at the estimate capped at
 * 5 % over the reference; more than 2.5 % below, a block at the estimate;
 * otherwise, or without an estimate, the same reference again.
 */
export function lpRecommendation(
  referenceMaxKg: number,
  estimatedMaxKg: number | null | undefined,
  incrementKg: number,
): LpRecommendation {
  if (!(estimatedMaxKg && estimatedMaxKg > 0) || !(referenceMaxKg > 0)) {
    return { kind: 'REPEAT', nextReferenceMaxKg: referenceMaxKg, change: null };
  }
  const change = estimatedMaxKg / referenceMaxKg - 1;
  if (change >= LP_PROGRESS_THRESHOLD - 1e-9) {
    const capped = Math.min(
      estimatedMaxKg,
      referenceMaxKg * (1 + LP_PROGRESS_CAP),
    );
    const next = roundDownToIncrement(capped, incrementKg);
    return {
      kind: 'PROGRESS',
      nextReferenceMaxKg: next > referenceMaxKg ? next : referenceMaxKg,
      change,
    };
  }
  if (change < -LP_PROGRESS_THRESHOLD - 1e-9) {
    return {
      kind: 'RESET',
      nextReferenceMaxKg: roundDownToIncrement(estimatedMaxKg, incrementKg),
      change,
    };
  }
  return { kind: 'REPEAT', nextReferenceMaxKg: referenceMaxKg, change };
}

/**
 * Body of `PUT /routines/:id/exercises/:routineExerciseId/linear-block`: what
 * a FINISHED slot does next. `recovery` takes the optional recovery step
 * first; the reference is the member's choice, pre-filled from
 * `lpRecommendation`.
 */
export interface ContinueLinearBlockRequest {
  referenceMaxKg: number;
  recovery: boolean;
}

// Transitions -------------------------------------------------------------

/** One working set of the slot as a completed workout left it. */
export interface LpLoggedSet {
  /** 1-based place among the step's working sets. */
  set: number;
  reps: number;
  loadKg: number;
  completed: boolean;
}

/** Whether two states stand at the same place of the same block. */
export function sameLpPosition(
  a: LinearPeriodizationState | null | undefined,
  b: LinearPeriodizationState | null | undefined,
): boolean {
  if (!a || !b) return !a && !b;
  return (
    a.phase === b.phase &&
    a.step === b.step &&
    a.cycle === b.cycle &&
    Math.abs(a.referenceMaxKg - b.referenceMaxKg) < 1e-6
  );
}

/**
 * Where a completed workout leaves the slot, or null when it does not move:
 * a FINISHED slot waits for a choice, and a step or the recovery step counts
 * only when every one of its working sets was ticked. Step 8 finishes the
 * block with its estimate; the recovery step begins the next block. Reps
 * never change a load.
 */
export function advanceLinearPeriodization(
  state: LinearPeriodizationState,
  logged: LpLoggedSet[],
  context: { sessionId: string; finishedAt: IsoDateString; incrementKg: number },
): LinearPeriodizationState | null {
  if (state.phase === 'FINISHED') return null;
  const prescribed = lpPrescription(state, context.incrementKg).length;
  for (let set = 1; set <= prescribed; set += 1) {
    if (!logged.some((entry) => entry.set === set && entry.completed)) {
      return null;
    }
  }
  if (state.phase === 'RECOVERY') {
    return startLinearPeriodization(
      state.nextReferenceMaxKg ?? state.referenceMaxKg,
      state.cycle + 1,
    );
  }
  const samples = LP_ESTIMATE_STEPS.includes(state.step)
    ? [
        ...state.samples.filter((sample) => sample.step !== state.step),
        ...logged
          .filter((entry) => entry.completed && entry.set <= prescribed)
          .map((entry) => ({
            sessionId: context.sessionId,
            step: state.step,
            set: entry.set,
            loadKg: entry.loadKg,
            reps: entry.reps,
          })),
      ]
    : state.samples;
  if (state.step < LP_BLOCK_STEPS) {
    return { ...state, step: state.step + 1, samples };
  }
  return {
    ...state,
    phase: 'FINISHED',
    samples,
    finishedAt: context.finishedAt,
    estimatedMaxKg: lpEstimate(samples, context.incrementKg).estimatedMaxKg,
    nextReferenceMaxKg: null,
  };
}

/**
 * What a FINISHED slot does next (ROUT-19): the optional recovery step on the
 * finished block's reference, then the chosen reference; or the next block at
 * once. Null when the slot has not finished.
 */
export function continueLinearPeriodization(
  state: LinearPeriodizationState,
  choice: ContinueLinearBlockRequest,
): LinearPeriodizationState | null {
  if (state.phase !== 'FINISHED') return null;
  if (choice.recovery) {
    return {
      ...state,
      phase: 'RECOVERY',
      nextReferenceMaxKg: choice.referenceMaxKg,
    };
  }
  return startLinearPeriodization(choice.referenceMaxKg, state.cycle + 1);
}

/** A working set as the routine stores it for an LP slot. */
export interface LpStoredSet {
  repType: 'FIXED';
  /** No rep target in a block; the recovery step's fixed reps. */
  reps: number | null;
  weight: number | null;
  /** The target's lower end; the full range is read from `lpStep`. */
  rir: number | null;
  kind: 'WORKING';
}

/**
 * The working sets a routine stores for an LP slot, after its warm-ups: the
 * step's three in BLOCK, the final step's three while FINISHED waits for a
 * choice (they repeat it and move nothing), the recovery step's two in
 * RECOVERY, and three without loads while no reference max is set.
 */
export function lpStoredSets(
  state: LinearPeriodizationState | null | undefined,
  incrementKg: number,
): LpStoredSet[] {
  if (!state) {
    return Array.from({ length: LP_WORKING_SETS }, () => ({
      repType: 'FIXED' as const,
      reps: null,
      weight: null,
      rir: null,
      kind: 'WORKING' as const,
    }));
  }
  const prescription =
    state.phase === 'FINISHED'
      ? lpPrescription({ ...state, phase: 'BLOCK', step: LP_BLOCK_STEPS }, incrementKg)
      : lpPrescription(state, incrementKg);
  return prescription.map((set) => ({
    repType: 'FIXED' as const,
    reps: set.reps,
    weight: set.loadKg,
    rir: set.target ? set.target.rirMin : null,
    kind: 'WORKING' as const,
  }));
}
