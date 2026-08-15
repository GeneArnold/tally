const attempts = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of attempts) {
    const filtered = timestamps.filter(t => now - t < 24 * 60 * 60 * 1000);
    if (filtered.length === 0) attempts.delete(key);
    else attempts.set(key, filtered);
  }
}, 60 * 1000);

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const timestamps = (attempts.get(key) || []).filter(t => now - t < windowMs);

  if (timestamps.length >= maxAttempts) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}

export function clearRateLimit(key: string): void {
  attempts.delete(key);
}
