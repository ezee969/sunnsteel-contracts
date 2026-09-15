import type { IsoDateString } from './shared';

// In-app notification center (NOTIF-01) -------------------------------------

/**
 * What a stored notification announces. Each one is gathered from a record
 * that already exists: an achievement earned live (never one recognized from
 * history), a finished session that set records or changed loads, and a new
 * follower.
 */
export const NOTIFICATION_KINDS = [
  'ACHIEVEMENT',
  'SESSION_PROGRESS',
  'NEW_FOLLOWER',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Sources older than this many days are never gathered. */
export const NOTIFICATIONS_LOOKBACK_DAYS = 30;
/** Notifications are kept this many days, then removed. */
export const NOTIFICATIONS_RETENTION_DAYS = 90;
/** The list returns at most this many, newest first. */
export const NOTIFICATIONS_LIST_LIMIT = 50;

interface NotificationBase {
  id: string;
  /** When the announced thing happened, not when it was gathered. */
  createdAt: IsoDateString;
  readAt: IsoDateString | null;
}

export interface AchievementNotification extends NotificationBase {
  kind: 'ACHIEVEMENT';
  achievement: { id: string; title: string; description: string };
}

export interface SessionProgressNotification extends NotificationBase {
  kind: 'SESSION_PROGRESS';
  session: {
    id: string;
    routineName: string;
    dayName: string | null;
    /** Exercises with a new personal record in the session. */
    recordCount: number;
    /** Exercises whose next prescription the session changed. */
    progressionCount: number;
  };
}

export interface NewFollowerNotification extends NotificationBase {
  kind: 'NEW_FOLLOWER';
  actor: {
    id: string;
    username: string;
    name: string;
    lastName: string | null;
    avatarUrl: string | null;
    /** Whether the recipient follows them back now. */
    isFollowedByMe: boolean;
  };
}

/** Named to stay clear of the DOM's `Notification`. */
export type AppNotification =
  | AchievementNotification
  | SessionProgressNotification
  | NewFollowerNotification;

/** GET /notifications */
export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

/** POST /notifications/read. Without ids, every notification is marked read. */
export interface MarkNotificationsReadRequest {
  ids?: string[];
}

export interface MarkNotificationsReadResponse {
  unreadCount: number;
}
