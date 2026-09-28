import { config } from "../config.js";
import { logger } from "../utils/logger.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let accessToken = "";
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (
    !config.redditClientId ||
    !config.redditClientSecret
  ) {
    return null;
  }

  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const credentials = Buffer.from(
    `${config.redditClientId}:${config.redditClientSecret}`
  ).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": config.redditUserAgent,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Reddit OAuth ${res.status}`);
  const data = await res.json();
  accessToken = data.access_token || "";
  tokenExpiresAt = Date.now() + Math.max(60, data.expires_in - 60) * 1000;
  return accessToken;
}

async function searchSub(sub) {
  const params = new URLSearchParams({
    q: config.redditQuery,
    restrict_sr: "1",
    sort: "new",
    t: "week",
    limit: "25",
  });
  const token = await getAccessToken();
  const baseUrl = token ? "https://oauth.reddit.com" : "https://www.reddit.com";
  const url = `${baseUrl}/r/${sub}/search.json?${params}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": config.redditUserAgent,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
