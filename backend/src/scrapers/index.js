import { fetchHackerNews } from "./hackernews.js";
import { fetchReddit } from "./reddit.js";
import { logger } from "../utils/logger.js";

export async function scrapeAll() {
  const [hn, reddit] = await Promise.all([
    fetchHackerNews().catch((err) => {
      logger.error("hn_scrape_failed", { error: err.message });
      return [];
    }),
    fetchReddit().catch((err) => {
      logger.error("reddit_scrape_failed", { error: err.message });
      return [];
    }),
  ]);
  const posts = [...hn, ...reddit];
  logger.info("scrape_complete", { hn: hn.length, reddit: reddit.length });
  return posts;
}
