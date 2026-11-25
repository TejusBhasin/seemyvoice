/**
 * usageGuard — server-side throttling and dedupe for this app's public
 * endpoints.
 *
 * Visitors are anonymous here, so the server must not trust caller-supplied
 * magnitudes and must not allow unlimited call rates. Each caller gets a
 * stable, non-reversible key derived from the request IP; counters live in the
 * UsageGuard entity, which only the service role touches.
 */

const UNKNOWN_CALLER = "unknown";

async function hashValue(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Hashed caller identity, so no raw IP address is ever stored. */
export async function callerKey(req) {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    UNKNOWN_CALLER;
  return hashValue(ip);
}

async function findGuard(base44, guardKey) {
  const rows = await base44.asServiceRole.entities.UsageGuard.filter({
    guard_key: guardKey,
  });
  return rows[0] || null;
}

/**
 * Adds `amount` to the caller's counter for `guardKey`.
 * Returns true only when the whole amount fits inside the window's budget.
 */
export async function consumeQuota(
  base44,
  guardKey,
  amount,
  limit,
  windowSeconds
) {
  if (!(amount > 0)) return true;

  const now = Date.now();
  const row = await findGuard(base44, guardKey);

  if (!row) {
    await base44.asServiceRole.entities.UsageGuard.create({
      guard_key: guardKey,
      count: amount,
      window_start: now,
    });
    return amount <= limit;
  }

  const windowExpired = now - Number(row.window_start || 0) > windowSeconds * 1000;
  const current = windowExpired ? 0 : Number(row.count || 0);
  if (current + amount > limit) return false;

  await base44.asServiceRole.entities.UsageGuard.update(row.id, {
    count: current + amount,
    window_start: windowExpired ? now : row.window_start,
  });
  return true;
}

/**
 * Returns true only the first time this caller is seen inside the window,
 * which is how unique visitors are counted server-side.
 */
export async function claimOnce(base44, guardKey, windowSeconds) {
  const now = Date.now();
  const row = await findGuard(base44, guardKey);

  if (!row) {
    await base44.asServiceRole.entities.UsageGuard.create({
      guard_key: guardKey,
      count: 1,
      window_start: now,
    });
    return true;
  }

  if (now - Number(row.window_start || 0) > windowSeconds * 1000) {
    await base44.asServiceRole.entities.UsageGuard.update(row.id, {
      count: 1,
      window_start: now,
    });
    return true;
  }

  return false;
}