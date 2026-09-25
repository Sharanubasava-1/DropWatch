import { config } from "../config.js";
import { logger } from "../utils/logger.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchSub(sub) {
  const params = new URLSearchParams({
    q: config.redditQuery,
    restrict_sr: "1",
    sort: "new",
    t: "week",
    limit: "25",
  });
  const url = `https://www.reddit.com/r/${sub}/search.json?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": config.redditUserAgent },
  });
  if (!res.ok) {
    throw new Error(`Reddit ${res.status} for r/${sub}`);
  }
  const data = await res.json();
  return data?.data?.children || [];
}

export async function fetchReddit() {
  const seen = new Map();
  for (const sub of config.redditSubs) {
    try {
      const children = await searchSub(sub);
      for (const child of children) {
        const post = child.data || {};
        const id = String(post.id || "");
        if (!id || seen.has(id)) continue;
        seen.set(id, {
          source: "reddit",
          source_id: id,
          title: post.title || "(untitled)",
          url: post.url || `https://www.reddit.com${post.permalink}`,
          permalink: post.permalink
            ? `https://www.reddit.com${post.permalink}`
            : post.url,
          score: Number(post.score || 0),
          comments: Number(post.num_comments || 0),
          created_at: Number(post.created_utc || 0),
        });
      }
    } catch (err) {
      logger.warn("reddit_sub_failed", { sub, error: err.message });
    }
    await sleep(1100);
  }
  return [...seen.values()];
}
