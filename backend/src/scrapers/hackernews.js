import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const HN_URL = "https://hn.algolia.com/api/v1/search_by_date";

function sinceUnix() {
  return Math.floor(Date.now() / 1000) - config.lookbackHours * 3600;
}

async function search(query) {
  const params = new URLSearchParams({
    query,
    tags: "story",
    hitsPerPage: "30",
    numericFilters: `created_at_i>${sinceUnix()}`,
  });
  const res = await fetch(`${HN_URL}?${params}`);
  if (!res.ok) {
    throw new Error(`HN ${res.status} for query "${query}"`);
  }
  const data = await res.json();
  return data.hits || [];
}

export async function fetchHackerNews() {
  const seen = new Map();
  for (const query of config.hnQueries) {
    try {
      const hits = await search(query);
      for (const hit of hits) {
        const id = String(hit.objectID);
        if (seen.has(id)) continue;
        seen.set(id, {
          source: "hn",
          source_id: id,
          title: hit.title || "(untitled)",
          url: hit.url || `https://news.ycombinator.com/item?id=${id}`,
          permalink: `https://news.ycombinator.com/item?id=${id}`,
          score: Number(hit.points || 0),
          comments: Number(hit.num_comments || 0),
          created_at: Number(hit.created_at_i || 0),
        });
      }
    } catch (err) {
      logger.warn("hn_query_failed", { query, error: err.message });
    }
  }
  return [...seen.values()];
}
