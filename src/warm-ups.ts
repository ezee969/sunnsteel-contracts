// LIVE-13 generates an exercise's warm-up sets from its working load; LIVE-20
// lets them follow that load. One rule, shared so the routine builder's
// preview and the server's recalculation after progression cannot disagree.

import { calculatePlateLoading, type PlateLoadingItem } from './plate-loading';
import { countsForProgression, type SetKind } from './set-kinds';
import type { WeightUnit } from './shared';
import type { PlatePairInventory } from './user';

/** An exercise holds at most this many sets, warm-ups included. */
export const MAX_SETS_PER_EXERCISE = 10;

export interface WarmUpStep {
  /** Share of the working load; 0 is the empty bar. */
  share: number;
  reps: number;
}

/** Plate-loaded work: the empty bar, then 40, 60 and 80 %. */
export const BAR_WARM_UP_STEPS: readonly WarmUpStep[] = [
  { share: 0, reps: 10 },
  { share: 0.4, reps: 5 },
  { share: 0.6, reps: 3 },
  { share: 0.8, reps: 2 },
];

/** Dumbbells, machines and cables: 50 and 75 %. */
export const OTHER_WARM_UP_STEPS: readonly WarmUpStep[] = [
  { share: 0.5, reps: 8 },
  { share: 0.75, reps: 3 },
];

const BAR_LOADED = new Set(['barbell', 'ez-bar', 'smith-machine']);

/** Whether an exercise is loaded with a bar and plates. */
export const isBarLoaded = (equipmentRequired: readonly string[] | undefined) =>
  (equipmentRequired ?? []).some((item) => BAR_LOADED.has(item));

const POUNDS_PER_KILOGRAM = 2.2046226218;
const lb = (pounds: number) => pounds / POUNDS_PER_KILOGRAM;

/** Bars offered when no gym is saved, in the account's unit. */
export const BAR_CHOICES_KG: Record<WeightUnit, number[]> = {
  KG: [20, 15, 10],
  LB: [lb(45), lb(35), lb(15)],
};

export type PlateSetChoice = 'STANDARD' | 'LIGHT';

const pairs = (weights: number[], heaviestPairs: number) =>
  weights.map((weightKg, index) => ({
    weightKg,
    pairCount: index === 0 ? heaviestPairs : 2,
  }));

/** The two plate sets offered when none are saved, in the account's unit. */
export const PLATE_SETS: Record<
  WeightUnit,
  Record<PlateSetChoice, PlatePairInventory[]>
> = {
  KG: {
    STANDARD: pairs([25, 20, 15, 10, 5, 2.5, 1.25], 4),
    LIGHT: pairs([20, 15, 10, 5, 2.5, 1.25], 2),
  },
  LB: {
    STANDARD: pairs([45, 35, 25, 10, 5, 2.5].map(lb), 4),
    LIGHT: pairs([25, 10, 5, 2.5].map(lb), 2),
  },
};

/**
 * A set is "the closest you can load" when the plates fall this far short of
 * its target: the step a standard set of plates (1.25 kg pairs) always makes.
 */
export const LIMITED_SHORTFALL_KG = 2.5;

/** What a warm-up load is made from. */
export interface WarmUpEquipment {
  barLoaded: boolean;
  barWeightKg: number;
  platePairs: readonly PlatePairInventory[];
  /** The exercise's own weight step, for anything not bar-loaded. */
  incrementKg: number;
}

/**
 * The equipment assumed when a member has no gym saved: a standard bar and
 * plate set in their unit. The builder asks instead; the server, which
 * cannot ask, uses this.
 */
export const defaultWarmUpEquipment = (unit: WeightUnit) => ({
  barWeightKg: BAR_CHOICES_KG[unit][0],
  platePairs: PLATE_SETS[unit].STANDARD,
});

const round = (value: number) => Math.round(value * 10000) / 10000;

export interface WarmUpLoad {
  weightKg: number;
  /** Bar-loaded only: what goes on each side. */
  platesPerSide?: PlateLoadingItem[];
  /** The plates fell short of the target by a standard small step or more. */
  limited: boolean;
}

/** One step's load: rounded down to what the bar and plates, or the step, make. */
export function warmUpLoad(
  share: number,
  workingWeightKg: number,
  equipment: WarmUpEquipment,
): WarmUpLoad {
  const target = share * workingWeightKg;
  if (equipment.barLoaded) {
    const loading = calculatePlateLoading(
      Math.max(target, equipment.barWeightKg),
      equipment.barWeightKg,
      [...equipment.platePairs],
    );
    return {
      weightKg: round(loading.loadedWeightKg),
      platesPerSide: loading.platesPerSide,
      limited:
        share > 0 &&
        loading.status === 'short' &&
        loading.differenceKg >= LIMITED_SHORTFALL_KG - 1e-9,
    };
  }
  const increment = equipment.incrementKg > 0 ? equipment.incrementKg : 2.5;
  return {
    weightKg: round(Math.floor(target / increment + 1e-9) * increment),
    limited: false,
  };
}

export interface WarmUpSet extends WarmUpLoad {
  reps: number;
  /** The step's share of the working load, kept so the set can follow it. */
  share: number;
}

export interface WarmUpRamp {
  sets: WarmUpSet[];
  /** Steps left out because the exercise had no room for them. */
  leftOut: number;
}

/**
 * The warm-up sets for a working load: each step rounded down to a load that
 * can be made, a step no heavier than the one before or reaching the working
 * load dropped, and the heaviest kept when there is no room for all of them.
 */
export function buildWarmUpRamp(
  input: WarmUpEquipment & { workingWeightKg: number; room: number },
): WarmUpRamp {
  const work = input.workingWeightKg;
  if (!(work > 0)) return { sets: [], leftOut: 0 };
  const steps = input.barLoaded ? BAR_WARM_UP_STEPS : OTHER_WARM_UP_STEPS;

  const sets: WarmUpSet[] = [];
  for (const step of steps) {
    const load = warmUpLoad(step.share, work, input);
    const previous = sets[sets.length - 1];
    if (load.weightKg <= 0 || load.weightKg >= work - 1e-9) continue;
    if (previous && load.weightKg <= previous.weightKg + 1e-9) continue;
    sets.push({ ...load, reps: step.reps, share: step.share });
  }
  const room = Math.max(0, input.room);
  const kept = sets.slice(Math.max(0, sets.length - room));
  return { sets: kept, leftOut: sets.length - kept.length };
}

type FollowingSet = {
  weight?: number | null;
  kind?: SetKind | null;
  warmUpShare?: number | null;
};

/** The load a following warm-up is a share of: the first working or optional set. */
export function leadWorkingWeight(sets: readonly FollowingSet[]): number | null {
  const lead = sets.find((set) => countsForProgression(set.kind));
  return typeof lead?.weight === 'number' && lead.weight > 0 ? lead.weight : null;
}

/**
 * LIVE-20: the sets with every warm-up that carries a share recalculated from
 * the exercise's first working set. Nothing else changes, a warm-up without a
 * share keeps its load, and without a working load the sets come back as they
 * were.
 */
export function followWorkingLoad<T extends FollowingSet>(
  sets: readonly T[],
  equipment: WarmUpEquipment,
): T[] {
  const work = leadWorkingWeight(sets);
  if (work === null) return [...sets];
  return sets.map((set) =>
    set.kind === 'WARMUP' && typeof set.warmUpShare === 'number'
      ? { ...set, weight: warmUpLoad(set.warmUpShare, work, equipment).weightKg }
      : set,
  );
}
