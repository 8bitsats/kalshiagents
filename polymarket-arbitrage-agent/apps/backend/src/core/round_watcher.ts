export function current15mStartEpochSec(nowMs = Date.now()): number {
  const nowSec = Math.floor(nowMs / 1000);
  return Math.floor(nowSec / 900) * 900;
}

export function btcUpDown15mSlug(nowMs = Date.now()): string {
  return `btc-updown-15m-${current15mStartEpochSec(nowMs)}`;
}

export function secondsRemainingIn15m(nowMs = Date.now()): number {
  const start = current15mStartEpochSec(nowMs);
  const nowSec = Math.floor(nowMs / 1000);
  const elapsed = nowSec - start;
  return Math.max(0, 900 - elapsed);
}

