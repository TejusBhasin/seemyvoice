import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * useSiteStats — reads the global site statistics.
 *
 * The server counts unique visitors and translated words itself, so nothing
 * here sends a count. `trackTranslation` simply refreshes the totals.
 */
export function useSiteStats() {
  const [stats, setStats] = useState({ totalWords: 0, totalVisitors: 0 });

  const refreshStats = useCallback(() => {
    base44.functions
      .invoke("trackStats", {})
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return { stats, trackTranslation: refreshStats };
}