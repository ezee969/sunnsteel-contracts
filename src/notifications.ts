import type { IsoDateString } from './shared';
import type { TrainingPartnerEncouragementKind } from './training-partners';

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
  // SOC-06. The first kind another member causes on purpose. The three above
  // are the account's own training, or a follow; a comment is somebody
  // addressing you, which is why it is worth a notification at all.
  'ACTIVITY_COMMENT',
  // SOC-09: one of four fixed, permissioned prompts from an active partner.
  'TRAINING_PARTNER_ENCOURAGEMENT',
  // NOTIF-07: selected activity from a partner who currently shares it.
  'TRAINING_PARTNER_SESSION',
  'TRAINING_PARTNER_ACHIEVEMENT',
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

/**
 * SOC-06: somebody commented on one of the recipient's activity entries.
 *
 * It carries no comment body. The notification centre is gathered on read and
 * its rows outlive what they describe, so quoting text that can be deleted by
 * its author, by the recipient, or by a moderator would leave a copy nobody
 * can take back. The row names the commenter and the entry, and the comment
 * itself is read where it lives.
 */
export interface ActivityCommentNotification extends NotificationBase {
  kind: 'ACTIVITY_COMMENT';
  actor: {
    id: string;
    username: string;
    name: string;
    lastName: string | null;
    avatarUrl: string | null;
  };
  /** The activity entry commented on, for the link back to it. */
  entryId: string;
}

export interface TrainingPartnerEncouragementNotification
  extends NotificationBase {
  kind: 'TRAINING_PARTNER_ENCOURAGEMENT';
  actor: {
    id: string;
    username: string;
    name: string;
    lastName: string | null;
    avatarUrl: string | null;
  };
  encouragement: { kind: TrainingPartnerEncouragementKind };
}

interface TrainingPartnerActivityNotificationBase extends NotificationBase {
  actor: {
    id: string;
    username: string;
    name: string;
    lastName: string | null;
    avatarUrl: string | null;
  };
  /** Stable SOC-03 activity key whose current visibility authorizes the row. */
  entryId: string;
}

/** NOTIF-07: one summary for a completed workout, never one per set or record. */
export interface TrainingPartnerSessionNotification
  extends TrainingPartnerActivityNotificationBase {
  kind: 'TRAINING_PARTNER_SESSION';
  session: {
    id: string;
    routineName: string;
    dayName: string | null;
  };
}

/** NOTIF-07: only an achievement earned live, never a historical backfill. */
export interface TrainingPartnerAchievementNotification
  extends TrainingPartnerActivityNotificationBase {
  kind: 'TRAINING_PARTNER_ACHIEVEMENT';
  achievement: { id: string; title: string };
}

/** Named to stay clear of the DOM's `Notification`. */
export type AppNotification =
  | AchievementNotification
  | SessionProgressNotification
  | NewFollowerNotification
  | ActivityCommentNotification
  | TrainingPartnerEncouragementNotification
  | TrainingPartnerSessionNotification
  | TrainingPartnerAchievementNotification;

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
