import { Router } from "express";
import { listLeaderboard, lastFetchedAt } from "../db/queries.js";

export const releasesRouter = Router();

releasesRouter.get("/releases", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 20), 50);
  const items = listLeaderboard(limit).map((row, i) => ({
    rank: i + 1,
    model_name: row.model_name,
    summary: row.summary,
    velocity: row.velocity,
    mention_count: row.mention_count,
    confidence: row.confidence,
    top_url: row.top_url,
    top_source: row.top_source,
    first_seen: row.first_seen,
    last_seen: row.last_seen,
  }));

  res.json({
    generated_at: new Date().toISOString(),
    last_fetched_at: lastFetchedAt(),
    items,
  });
});
