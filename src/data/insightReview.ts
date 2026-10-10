const MAX_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

export interface ReviewState {
  expired: boolean;
  msUntilExpiry: number | null;
}

export function reviewState(
  nextReviewAt: string | undefined,
  nowMs: number
): ReviewState {
  if (!nextReviewAt) return { expired: false, msUntilExpiry: null };
  const expiryMs = Date.parse(nextReviewAt);
  if (isNaN(expiryMs)) return { expired: false, msUntilExpiry: null };
  const ms = expiryMs - nowMs;
  if (ms <= 0) return { expired: true, msUntilExpiry: 0 };
  return { expired: false, msUntilExpiry: ms };
}

/** Returns the next timer delay clamped to at most 24 h, never negative. */
export function nextCheckDelay(msUntilExpiry: number): number {
  return Math.max(0, Math.min(msUntilExpiry, MAX_DELAY_MS));
}

/** True only when a timer should be scheduled (valid deadline in the future). */
export function shouldSchedule(
  nextReviewAt: string | undefined,
  nowMs: number
): boolean {
  const { expired, msUntilExpiry } = reviewState(nextReviewAt, nowMs);
  return !expired && msUntilExpiry !== null && msUntilExpiry > 0;
}
