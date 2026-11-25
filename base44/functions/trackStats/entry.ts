/**
 * trackStats — returns the global site statistics and counts unique visitors.
 *
 * The app is public and has no sign-in, so this endpoint accepts no magnitude
 * from the caller at all: a visitor increment happens only when the usage guard
 * sees a caller for the first time in the window. Translated words are counted
 * by translateText, from the text the server itself processed.
 *
 * Input:  {} (no fields are read)
 * Output: { totalWords: number, totalVisitors: number }
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { callerKey, claimOnce } from "../../shared/usageGuard.ts";
import { incrementStats } from "../../shared/siteStats.ts";

const VISITOR_WINDOW_SECONDS = 365 * 24 * 60 * 60;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Server-side unique visitor counting: one increment per caller per year.
    const caller = await callerKey(req);
    const countsAsNewVisitor = await claimOnce(
      base44,
      `visitor:${caller}`,
      VISITOR_WINDOW_SECONDS
    );

    const totals = await incrementStats(base44, {
      visitors: countsAsNewVisitor ? 1 : 0,
    });

    return Response.json(totals);
  } catch (error) {
    return Response.json(
      { error: error.message, totalWords: 0, totalVisitors: 0 },
      { status: 500 }
    );
  }
}