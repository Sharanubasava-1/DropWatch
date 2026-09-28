import { fetchHackerNews } from "./hackernews.js";
import { logger } from "../utils/logger.js";

export async function scrapeAll() {
  const hn = await fetchHackerNews().catch((err) => {
    logger.error("hn_scrape_failed", { error: err.message });
    return [];
  });
  logger.info("scrape_complete", { hn: hn.length });
  return hn;
}
