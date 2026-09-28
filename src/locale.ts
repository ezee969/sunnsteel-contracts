/**
 * I18N-02: the languages the product speaks. The frontend keeps the same list
 * in its own `i18n/config.ts` for routing; this one is what the account
 * stores and what the server writes push notifications in (I18N-06).
 */
export const SUPPORTED_LOCALES = ["en", "es"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** What the server falls back to when an account has chosen nothing. */
export const DEFAULT_LOCALE: AppLocale = "en";

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/**
 * PUT /users/preferences/locale. `null` means "follow this device": the
 * account stores no language and every device uses its own.
 */
export interface UpdateLocaleRequest {
  locale: AppLocale | null;
}
