import { migrate } from "../db/client.js";
import {
  upsertRawPost,
  recentRawPosts,
  listLeaderboard,
} from "../db/queries.js";
import { scrapeAll } from "../scrapers/index.js";
import { classifyPosts } from "../pipeline/classify.js";
import { dedupeClassified } from "../pipeline/dedupe.js";
import { rankAndStore } from "../pipeline/rank.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

export async function refresh() {
  migrate();
  const now = Math.floor(Date.now() / 1000);
  const posts = await scrapeAll();

  for (const post of posts) {
    upsertRawPost({
      ...post,
      fetched_at: now,
    });
  }

  const since = now - config.lookbackHours * 3600;
  const recent = recentRawPosts(since);
  const classified = await classifyPosts(recent);
  const groups = dedupeClassified(classified);
  const ranked = rankAndStore(groups);

  const result = {
    scraped: posts.length,
    recent: recent.length,
    classified: classified.length,
    releases: ranked.length,
  };
  logger.info("refresh_complete", result);
  return result;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("refresh.js") ||
    process.argv[1].includes("jobs\\refresh") ||
    process.argv[1].includes("jobs/refresh"));

if (isDirect) {
  refresh()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((err) => {
      logger.error("refresh_failed", { error: err.message });
      process.exit(1);
    });
}
