import type { IsoDateString } from './shared';

// Web Push delivery (NOTIF-08) and its first payload, the NOTIF-03 rest alert.
//
// The in-app notification centre (NOTIF-01) is gathered on read and reaches
// nobody while the app is closed. These contracts are the other half: a stored
// per-device subscription the server can push to, and one scheduled payload.

/**
 * The two keys a browser's `PushSubscription` carries. They are the encryption
 * material for that endpoint, not an identifier, and are never returned to a
 * client — only accepted.
 */
export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

/** One account keeps at most this many devices subscribed. */
export const PUSH_SUBSCRIPTIONS_MAX = 10;

/** POST /notifications/push/subscriptions — idempotent on `endpoint`. */
export interface RegisterPushSubscriptionRequest {
  endpoint: string;
  /** The browser's own expiry, almost always null. */
  expirationTime: number | null;
  keys: PushSubscriptionKeys;
  /**
   * A short device label the owner can recognise in their own list. It is
   * derived by the client from the user agent, never the raw string.
   */
  deviceLabel?: string;
}

/**
 * What the owner sees about one of their own subscribed devices. The endpoint
 * is a bearer capability for sending that device notifications, so it is
 * deliberately absent.
 */
export interface PushSubscriptionSummary {
  id: string;
  deviceLabel: string | null;
  createdAt: IsoDateString;
  /** Refreshed whenever the same endpoint registers again. */
  lastSeenAt: IsoDateString;
  /** True for the subscription the requesting device just sent. */
  isCurrentDevice: boolean;
}

/** GET /notifications/push/subscriptions */
export interface PushSubscriptionsResponse {
  subscriptions: PushSubscriptionSummary[];
  /**
   * Null when the server holds no VAPID key pair. The client must treat that
   * as "push is unavailable" and never prompt for permission.
   */
  vapidPublicKey: string | null;
}

/** DELETE /notifications/push/subscriptions */
export interface DeletePushSubscriptionRequest {
  endpoint: string;
}

// Rest alert (NOTIF-03) ------------------------------------------------------

/**
 * What a delivered push asks the service worker to show. `kind` exists so the
 * worker can branch without guessing from the copy.
 */
export const PUSH_PAYLOAD_KINDS = ['REST_ALERT'] as const;
export type PushPayloadKind = (typeof PUSH_PAYLOAD_KINDS)[number];

export interface RestAlertPushPayload {
  kind: 'REST_ALERT';
  title: string;
  /**
   * A static line. The Web Notifications API has no chronometer field, so this
   * never contains a number that ticks down — see the NOTIF-03 scope limit.
   */
  body: string;
  sessionId: string;
  /** Where clicking the notification goes. */
  url: string;
  /** Collapses an older alert for the same session instead of stacking. */
  tag: string;
}

export type PushPayload = RestAlertPushPayload;

/** A rest alert is refused beyond this far ahead. */
export const REST_ALERT_MAX_LEAD_SECONDS = 3600;
/**
 * Scheduling closer than this cannot beat the sweep interval, so the request
 * is accepted and reported as not scheduled rather than silently dropped.
 */
export const REST_ALERT_MIN_LEAD_SECONDS = 5;

/**
 * PUT /workouts/sessions/:id/rest-alert
 *
 * One pending alert per session: a new rest period replaces the last one, so a
 * session holds at most one scheduled push however many sets it logs.
 */
export interface ScheduleRestAlertRequest {
  /** When the rest period ends, at second-level precision. */
  endsAt: IsoDateString;
  /** Named in the notification so the athlete knows which lift resumes. */
  exerciseName: string;
}

export interface ScheduleRestAlertResponse {
  /** Null when nothing was scheduled; `reason` then says why. */
  scheduledFor: IsoDateString | null;
  reason: RestAlertRefusal | null;
}

export const REST_ALERT_REFUSALS = [
  /** The account has no subscribed device. */
  'NO_SUBSCRIPTION',
  /** The server holds no VAPID key pair. */
  'PUSH_UNAVAILABLE',
  /** Rest ends too soon for a push to beat it. */
  'TOO_SOON',
] as const;
export type RestAlertRefusal = (typeof REST_ALERT_REFUSALS)[number];
