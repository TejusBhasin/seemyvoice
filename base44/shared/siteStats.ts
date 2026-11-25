/**
 * siteStats — shared counter updates for the single global SiteStats record.
 *
 * Only the server decides how much to add: the word count comes from text the
 * server itself translated, and visitor counts come from the usage guard, so no
 * caller ever supplies a magnitude.
 */

const STAT_KEY = "global";

async function ensureRecord(base44) {
  const existing = await base44.asServiceRole.entities.SiteStats.filter({
    stat_key: STAT_KEY,
  });
  if (!existing[0]) {
    await base44.asServiceRole.entities.SiteStats.create({
      stat_key: STAT_KEY,
      total_words: 0,
      total_visitors: 0,
    });
  }
}

/** Word count of text the server actually handled. */
export function countWords(text) {
  if (typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Adds server-computed amounts to the global counters and returns the totals.
 */
export async function incrementStats(base44, { words = 0, visitors = 0 } = {}) {
  await ensureRecord(base44);

  const inc = {};
  if (words > 0) inc.total_words = Math.floor(words);
  if (visitors > 0) inc.total_visitors = Math.floor(visitors);

  if (Object.keys(inc).length > 0) {
    await base44.asServiceRole.entities.SiteStats.updateMany(
      { stat_key: STAT_KEY },
      { $inc: inc }
    );
  }

  const updated = await base44.asServiceRole.entities.SiteStats.filter({
    stat_key: STAT_KEY,
  });
  const record = updated[0];

  return {
    totalWords: record?.total_words ?? 0,
    totalVisitors: record?.total_visitors ?? 0,
  };
}