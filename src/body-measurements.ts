import type { IsoDateString } from "./shared";

/**
 * PROG-12: dated body weight and measurements. One entry per member per local
 * date; every value is optional but an entry holds at least one. Weight is
 * kilograms whatever unit the account displays, lengths are centimetres.
 */
export const BODY_MEASUREMENT_FIELDS = [
  { key: "weightKg", label: "Weight", unit: "kg", min: 20, max: 1000 },
  { key: "waistCm", label: "Waist", unit: "cm", min: 10, max: 300 },
  { key: "hipsCm", label: "Hips", unit: "cm", min: 10, max: 300 },
  { key: "chestCm", label: "Chest", unit: "cm", min: 10, max: 300 },
  { key: "armCm", label: "Arm", unit: "cm", min: 10, max: 300 },
  { key: "thighCm", label: "Thigh", unit: "cm", min: 10, max: 300 },
  { key: "bodyFatPercent", label: "Body fat", unit: "%", min: 2, max: 75 },
] as const;

export type BodyMeasurementField =
  (typeof BODY_MEASUREMENT_FIELDS)[number]["key"];

export const BODY_MEASUREMENT_FIELD_KEYS: readonly BodyMeasurementField[] =
  BODY_MEASUREMENT_FIELDS.map((field) => field.key);

export type BodyMeasurementValues = {
  [K in BodyMeasurementField]: number | null;
};

export interface BodyMeasurement extends BodyMeasurementValues {
  /** The member's local date, YYYY-MM-DD. */
  date: string;
  updatedAt: IsoDateString;
}

/** PUT /body-measurements/:date. A missing or null value clears that field. */
export type UpsertBodyMeasurementRequest = Partial<BodyMeasurementValues>;

export const BODY_PROGRESS_RANGES = ["30D", "90D", "1Y", "ALL"] as const;
export type BodyProgressRange = (typeof BODY_PROGRESS_RANGES)[number];

export interface BodyFieldSummary {
  field: BodyMeasurementField;
  /** The most recent value ever recorded, and its date. */
  latest: number | null;
  latestDate: string | null;
  /**
   * Latest minus the first value recorded inside the range, when both exist
   * on different dates inside it; otherwise null.
   */
  change: number | null;
  changeSince: string | null;
}

/**
 * GET /body-measurements (the owner) and
 * GET /users/:identifier/body-measurements (another member, when their
 * `bodyProgress` visibility allows it). Entries are the range's, oldest first.
 */
export interface BodyProgressResponse {
  range: BodyProgressRange;
  rangeStart: string | null;
  entries: BodyMeasurement[];
  summary: BodyFieldSummary[];
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isBodyMeasurementDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

/** The first date a range covers, counting today; null for ALL. */
export function bodyProgressRangeStart(
  range: BodyProgressRange,
  today: string,
): string | null {
  switch (range) {
    case "30D":
      return shiftDate(today, -29);
    case "90D":
      return shiftDate(today, -89);
    case "1Y":
      return shiftDate(today, -364);
    case "ALL":
      return null;
  }
}

/** The field a value is out of bounds for, with the reason in words. */
export interface BodyMeasurementProblem {
  field: BodyMeasurementField | null;
  message: string;
}

export function bodyMeasurementProblems(
  input: UpsertBodyMeasurementRequest,
): BodyMeasurementProblem[] {
  const problems: BodyMeasurementProblem[] = [];
  let values = 0;
  for (const field of BODY_MEASUREMENT_FIELDS) {
    const value = input[field.key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      problems.push({ field: field.key, message: `${field.label} must be a number` });
      continue;
    }
    values += 1;
    if (value < field.min || value > field.max) {
      problems.push({
        field: field.key,
        message: `${field.label} must be between ${field.min} and ${field.max} ${field.unit}`,
      });
    }
  }
  if (values === 0 && problems.length === 0) {
    problems.push({ field: null, message: "Add at least one measurement" });
  }
  return problems;
}

/**
 * Per field: the latest value ever recorded and its change over the range.
 * `entries` is every entry the member has, in any order.
 */
export function summarizeBodyProgress(
  entries: ReadonlyArray<Pick<BodyMeasurement, "date"> & BodyMeasurementValues>,
  rangeStart: string | null,
): BodyFieldSummary[] {
  const ordered = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return BODY_MEASUREMENT_FIELD_KEYS.map((field) => {
    const recorded = ordered.filter((entry) => entry[field] !== null);
    const latestEntry = recorded[recorded.length - 1] ?? null;
    const firstInRange =
      recorded.find((entry) => rangeStart === null || entry.date >= rangeStart) ?? null;
    const hasChange =
      latestEntry !== null &&
      firstInRange !== null &&
      firstInRange.date !== latestEntry.date;
    return {
      field,
      latest: latestEntry?.[field] ?? null,
      latestDate: latestEntry?.date ?? null,
      change: hasChange
        ? Math.round((latestEntry![field]! - firstInRange![field]!) * 100) / 100
        : null,
      changeSince: hasChange ? firstInRange!.date : null,
    };
  });
}

/** The date `User.weight` follows: the latest entry that records a weight. */
export function latestBodyWeight(
  entries: ReadonlyArray<Pick<BodyMeasurement, "date" | "weightKg">>,
): number | null {
  let latest: { date: string; weightKg: number } | null = null;
  for (const entry of entries) {
    if (entry.weightKg === null) continue;
    if (latest === null || entry.date > latest.date) {
      latest = { date: entry.date, weightKg: entry.weightKg };
    }
  }
  return latest?.weightKg ?? null;
}
