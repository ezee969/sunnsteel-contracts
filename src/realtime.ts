// Realtime delivery (MSG-06) ---------------------------------------------------
//
// One authenticated Server-Sent Events stream per open tab. It carries change
// signals, never data: a signal names a topic whose reads are out of date, and
// the client re-reads them through the ordinary API, so every privacy rule
// stays on the one path that already enforces it. A stream that opens (or
// reopens) starts with `ready`, after which the client re-reads every topic it
// shows once; that is the whole catch-up, so there is no event log to replay.

/** GET, with the usual bearer token. */
export const REALTIME_STREAM_PATH = "/realtime/stream";

/**
 * What a signal can say is out of date. `conversations` (MSG-01): the
 * member's conversation list and the messages of each.
 */
export const REALTIME_TOPICS = ["notifications", "conversations"] as const;
export type RealtimeTopic = (typeof REALTIME_TOPICS)[number];

export type RealtimeEvent =
  /** Sent first on every stream: re-read these topics once. */
  | { type: "ready"; topics: RealtimeTopic[] }
  /** Reads under this topic are out of date. */
  | { type: "changed"; topic: RealtimeTopic };

/** A comment line the server writes so the proxies never see an idle stream. */
export const REALTIME_HEARTBEAT_MS = 25_000;
/**
 * The server ends a stream after this long, or when its access token expires,
 * whichever comes first, and the client reconnects at once with a fresh
 * token. Railway closes a plain HTTP request after 15 minutes.
 */
export const REALTIME_MAX_STREAM_MS = 14 * 60_000;
/** Open streams per member; opening another closes the oldest. */
export const REALTIME_MAX_STREAMS_PER_MEMBER = 5;
/**
 * When the stream is switched off on the server it answers 503 with this
 * `Retry-After`, in seconds, and the client polls in the meantime.
 */
export const REALTIME_UNAVAILABLE_RETRY_SECONDS = 300;

export function isRealtimeTopic(value: unknown): value is RealtimeTopic {
  return (REALTIME_TOPICS as readonly unknown[]).includes(value);
}

/** The event in one `data:` payload, or null for anything else. */
export function parseRealtimeEvent(data: string): RealtimeEvent | null {
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const event = value as Record<string, unknown>;
  if (event.type === "changed" && isRealtimeTopic(event.topic)) {
    return { type: "changed", topic: event.topic };
  }
  if (event.type === "ready" && Array.isArray(event.topics)) {
    return { type: "ready", topics: event.topics.filter(isRealtimeTopic) };
  }
  return null;
}
