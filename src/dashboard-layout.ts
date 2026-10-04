/**
 * DASH-05 / PREF-03: the member's dashboard layout. Today's Workouts is not in
 * it -- it holds the dashboard's one primary action and is always first.
 *
 * **These ids are permanent.** A stored layout names sections by them, and
 * per-device state (UX-02's collapsed or open) is keyed by them too, so an id
 * is never renamed or reused. A new section gets a new id, added here in its
 * default position.
 */
export const DASHBOARD_SECTION_IDS = [
  "this-week",
  // DASH-04: the member's goals and the ACH-06 suggestions.
  "goals",
  "stats",
  "recent-activity",
  "personal-records",
  "training-insights",
  "upcoming-milestones",
  "following",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export interface DashboardLayoutEntry {
  id: DashboardSectionId;
  hidden: boolean;
}

/** Every section, in the order shown. Hidden sections are not rendered. */
export type DashboardLayout = DashboardLayoutEntry[];

/** PUT /users/preferences/dashboard. The server normalizes what it stores. */
export interface UpdateDashboardLayoutRequest {
  sections: DashboardLayoutEntry[];
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout =
  DASHBOARD_SECTION_IDS.map((id) => ({ id, hidden: false }));

export function isDashboardSectionId(value: unknown): value is DashboardSectionId {
  return (
    typeof value === "string" &&
    (DASHBOARD_SECTION_IDS as readonly string[]).includes(value)
  );
}

/**
 * The one reading of a stored or submitted layout. Unknown ids and repeats are
 * dropped, and a section missing from it -- one added after the layout was
 * saved -- is placed at its default position, after the nearest section that
 * precedes it by default, and shown, so a new section is never silently
 * invisible. Anything that is not a list is the default layout.
 */
export function normalizeDashboardLayout(input: unknown): DashboardLayout {
  if (!Array.isArray(input)) return DEFAULT_DASHBOARD_LAYOUT.map((entry) => ({ ...entry }));
  const seen = new Set<DashboardSectionId>();
  const layout: DashboardLayout = [];
  for (const entry of input) {
    const id = (entry as { id?: unknown } | null)?.id;
    if (!isDashboardSectionId(id) || seen.has(id)) continue;
    seen.add(id);
    layout.push({ id, hidden: (entry as { hidden?: unknown }).hidden === true });
  }
  DASHBOARD_SECTION_IDS.forEach((id, defaultIndex) => {
    if (seen.has(id)) return;
    let insertAt = 0;
    for (let before = defaultIndex - 1; before >= 0; before -= 1) {
      const at = layout.findIndex((entry) => entry.id === DASHBOARD_SECTION_IDS[before]);
      if (at >= 0) {
        insertAt = at + 1;
        break;
      }
    }
    layout.splice(insertAt, 0, { id, hidden: false });
    seen.add(id);
  });
  return layout;
}

export function isDefaultDashboardLayout(layout: DashboardLayout): boolean {
  return (
    layout.length === DEFAULT_DASHBOARD_LAYOUT.length &&
    layout.every(
      (entry, index) =>
        entry.id === DEFAULT_DASHBOARD_LAYOUT[index].id && !entry.hidden,
    )
  );
}
