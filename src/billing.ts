/**
 * BILL-01: plans and entitlements. The server decides every entitlement; a
 * client reads the answer (`GET /billing/me`, `UserProfile.plan`) and never
 * works access out for itself. Nothing is gated by these yet: `BILL-02`
 * applies the Pro split, and no payment exists until `BILL-03`.
 */

/** Every plan, lowest first. An account with no active grant is on FREE. */
export const PLAN_IDS = ["FREE", "PRO"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const DEFAULT_PLAN: PlanId = "FREE";

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

/**
 * Where a grant came from. A subscription's grant follows the provider
 * (`BILL-04`); a promotion is a grant given to a group of members (the
 * founding-member grant of `BILL-02`); an admin grant is one given by hand.
 */
export const ENTITLEMENT_SOURCES = ["SUBSCRIPTION", "PROMO", "ADMIN"] as const;
export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

export function isEntitlementSource(value: unknown): value is EntitlementSource {
  return (
    typeof value === "string" &&
    (ENTITLEMENT_SOURCES as readonly string[]).includes(value)
  );
}

/**
 * The capabilities a plan may unlock, one per row of the Pro split. Keys are
 * permanent: a stored grant never names them, but clients and guards do, so
 * a key is never renamed or reused.
 */
export const FEATURE_KEYS = [
  /** PROG-01: strength-trend ranges beyond 90 days. */
  "STRENGTH_TRENDS_LONG_RANGES",
  /** PROG-11, PROG-06: block and session comparison. */
  "TRAINING_COMPARISON",
  /** PROG-10, INTEL-02: training signals and the deload suggestion. */
  "TRAINING_SIGNALS",
  /** PROG-03, PROG-04: the muscle heatmap and volume trends past 4 weeks. */
  "MUSCLE_HISTORY_LONG",
  /** ROUT-09, ROUT-15: dated training blocks. */
  "TRAINING_BLOCKS",
  /** ROUT-16: planned deloads. */
  "PLANNED_DELOADS",
  /** ROUT-17 to ROUT-20: 8-week blocks. */
  "EIGHT_WEEK_BLOCKS",
  /** ACH-06: goal suggestions. */
  "GOAL_SUGGESTIONS",
  /** PROG-12: every body measurement beyond weight. */
  "BODY_MEASUREMENTS",
  /** DASH-05: dashboard customization. */
  "DASHBOARD_CUSTOMIZATION",
  /** INTEL-03: natural-language routine drafts. */
  "ROUTINE_DRAFTS",
  /** INTEL-04: the training review assistant. */
  "TRAINING_REVIEW",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === "string" && (FEATURE_KEYS as readonly string[]).includes(value);
}

/** The counted capabilities of the Pro split. */
export const PLAN_LIMIT_KEYS = [
  /** ROUT-08: saved versions per routine. */
  "ROUTINE_VERSIONS",
  /** PROG-08: measurable goals. */
  "GOALS",
  /** PREF-01: training locations. */
  "TRAINING_LOCATIONS",
  /** PROG-03, PROG-04: weeks of muscle history. */
  "MUSCLE_HISTORY_WEEKS",
] as const;
export type PlanLimitKey = (typeof PLAN_LIMIT_KEYS)[number];

/** A limit's number, or null where the plan adds none of its own. */
export type PlanLimits = Record<PlanLimitKey, number | null>;

export interface PlanDefinition {
  id: PlanId;
  features: readonly FeatureKey[];
  limits: PlanLimits;
}

/**
 * Each plan's capabilities, as the owner decided on 2026-10-14. A null limit
 * leaves the capability's own maximum in force (for example
 * `ROUTINE_VERSIONS_MAX`); a plan never raises a limit past it.
 */
export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: "FREE",
    features: [],
    limits: {
      ROUTINE_VERSIONS: 3,
      GOALS: 3,
      TRAINING_LOCATIONS: 1,
      MUSCLE_HISTORY_WEEKS: 4,
    },
  },
  PRO: {
    id: "PRO",
    features: FEATURE_KEYS,
    limits: {
      ROUTINE_VERSIONS: 20,
      GOALS: 8,
      TRAINING_LOCATIONS: null,
      MUSCLE_HISTORY_WEEKS: 12,
    },
  },
};

/** Whether a plan unlocks a capability. */
export function planIncludes(plan: PlanId, feature: FeatureKey): boolean {
  return PLANS[plan].features.includes(feature);
}

/** The higher of two plans, by their order in `PLAN_IDS`. */
export function higherPlan(a: PlanId, b: PlanId): PlanId {
  return PLAN_IDS.indexOf(a) >= PLAN_IDS.indexOf(b) ? a : b;
}

/** What decides whether a grant is in force. */
export interface GrantWindow {
  planId: PlanId;
  startsAt: string | Date;
  /** Null for a grant that never expires. */
  expiresAt: string | Date | null;
  revokedAt: string | Date | null;
}

function time(value: string | Date): number {
  return value instanceof Date ? value.getTime() : Date.parse(value);
}

/**
 * A grant is in force from its start until its expiry, unless it was
 * revoked. The expiry is exclusive, so a grant ending at noon no longer
 * counts at noon.
 */
export function isGrantActive(grant: GrantWindow, now: Date = new Date()): boolean {
  const at = now.getTime();
  if (grant.revokedAt !== null) return false;
  if (time(grant.startsAt) > at) return false;
  return grant.expiresAt === null || time(grant.expiresAt) > at;
}

/**
 * The plan an account is on: the highest plan among its grants in force, and
 * FREE without one. It is computed on every read, never stored, so a grant
 * that expires, is revoked or begins changes access at that moment.
 */
export function planFromGrants(
  grants: readonly GrantWindow[],
  now: Date = new Date(),
): PlanId {
  return grants
    .filter((grant) => isGrantActive(grant, now))
    .reduce<PlanId>((plan, grant) => higherPlan(plan, grant.planId), DEFAULT_PLAN);
}

/** One grant as `GET /billing/me` states it. */
export interface EntitlementGrantSummary {
  id: string;
  planId: PlanId;
  source: EntitlementSource;
  startsAt: string;
  expiresAt: string | null;
  /** A free-text reason given with the grant ("Founding member"). */
  note: string | null;
}

/** `GET /billing/me`: the caller's plan and what it unlocks, decided now. */
export interface BillingStatus {
  plan: PlanId;
  features: FeatureKey[];
  limits: PlanLimits;
  /** The grants in force now, the one that lasts longest first. */
  grants: EntitlementGrantSummary[];
}

/**
 * BILL-02: the longest strength-trend range Free reads, in days. Progress
 * offers 30 and 90 days on Free; a range wider than this -- or one with no
 * start, "all time" -- needs `STRENGTH_TRENDS_LONG_RANGES`. The current best
 * of every lift is answered whatever the range, so a downgrade hides no fact.
 */
export const FREE_STRENGTH_RANGE_DAYS = 90;

/** Slack for clocks and calendar months, so a 90-day range never reads as 91. */
const STRENGTH_RANGE_SLACK_DAYS = 2;

export function strengthRangeNeedsPro(range: {
  from?: string | Date | null;
  to?: string | Date | null;
}): boolean {
  if (!range.from) return true;
  const to = range.to ? time(range.to) : Date.now();
  const days = (to - time(range.from)) / (24 * 60 * 60 * 1000);
  return days > FREE_STRENGTH_RANGE_DAYS + STRENGTH_RANGE_SLACK_DAYS;
}

/**
 * BILL-02: what a plan's limit allows for a replace-the-whole-list write
 * (goals, training locations). Within the limit anything goes; past it, the
 * write may keep, edit or drop what is stored but add nothing new -- so a
 * downgrade never deletes what was made under Pro and a member can still
 * tidy it, while only new use stops.
 */
export function listWithinLimit(
  limit: number | null,
  requestedIds: readonly (string | null | undefined)[],
  storedIds: readonly string[],
): boolean {
  if (limit === null || requestedIds.length <= limit) return true;
  const stored = new Set(storedIds);
  return requestedIds.every((id) => typeof id === "string" && stored.has(id));
}
