/**
 * trackStats — increments global site statistics (words translated, visitors)
 * and returns the current totals.
 *
 * The app is public and has no sign-in, so nothing the caller sends is trusted
 * for magnitude: the word increment is clamped per call and budgeted per caller
 * per day, and visitors are deduplicated server-side from the request IP rather
 * than from a client-supplied flag.
 *
 * Input:  { wordsAdded?: number }
 * Output: { totalWords: number, totalVisitors: number }
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { callerKey, consumeQuota, claimOnce } from "../../shared/usageGuard.ts";

const MAX_WORDS_PER_CALL = 2000;
const WORDS_PER_CALLER_PER_DAY = 50000;
const VISITOR_WINDOW_SECONDS = 365 * 24 * 60 * 60;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Clamp the caller-supplied word count to a sane, integer range.
    const requestedWords = Number(body?.wordsAdded);
    const wordsAdded = Number.isFinite(requestedWords)
      ? Math.max(0, Math.min(Math.floor(requestedWords), MAX_WORDS_PER_CALL))
      : 0;

    const caller = await callerKey(req);

    // Server-side unique visitor counting: one increment per caller per year.
    const countsAsNewVisitor = await claimOnce(
      base44,
      `visitor:${caller}`,
      VISITOR_WINDOW_SECONDS
    );

    // A single caller cannot add an unbounded number of words per day.
    const wordsAllowed =
      wordsAdded > 0
        ? await consumeQuota(
            base44,
            `words:${caller}`,
            wordsAdded,
            WORDS_PER_CALLER_PER_DAY,
            24 * 60 * 60
          )
        : false;

    // Ensure the global stats record exists
    const existing = await base44.asServiceRole.entities.SiteStats.filter({
      stat_key: "global",
    });
    if (!existing[0]) {
      await base44.asServiceRole.entities.SiteStats.create({
        stat_key: "global",
        total_words: 0,
        total_visitors: 0,
      });
    }

    // Atomically increment counters
    const inc = {};
    if (wordsAllowed) inc.total_words = wordsAdded;
    if (countsAsNewVisitor) inc.total_visitors = 1;
    if (Object.keys(inc).length > 0) {
      await base44.asServiceRole.entities.SiteStats.updateMany(
        { stat_key: "global" },
        { $inc: inc }
      );
    }

    // Read back current values
    const updated = await base44.asServiceRole.entities.SiteStats.filter({
      stat_key: "global",
    });
    const record = updated[0];

    return Response.json({
      totalWords: record?.total_words ?? 0,
      totalVisitors: record?.total_visitors ?? 0,
    });
  } catch (error) {
    return Response.json(
      { error: error.message, totalWords: 0, totalVisitors: 0 },
      { status: 500 }
    );
  }
}